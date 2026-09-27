// Classic script (not type=module) so it also runs when index.html is opened from disk.
(async () => {
const THREE = await import('https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js');

/* =====================================================================
   EDIT HERE — content
   The first entry is the cover (a single portrait image).
   Every other entry is an open two-page spread (a landscape image, ~3:2).
   Add, remove or reorder spreads freely; the book adapts.
   ===================================================================== */
const COVER_TEXT = ['IDRIS KAYE', 'PORTFOLIO 2026']; // tiny white words on the cover

const SPREADS = [
  { image: 'pages/cover.webp',     title: 'Cover',         sub: 'Selected work 2021—2026' },
  { image: 'pages/polaroids.webp', title: '01  Polaroids', sub: 'Casting archive · web' },
  { image: 'pages/editorial.webp', title: '02  Editorial', sub: 'Art direction · print' },
  { image: 'pages/collage.webp',   title: '03  Collage',   sub: 'Campaign toolkit · motion' },
  { image: 'pages/campaign.webp',  title: '04  Campaign',  sub: 'Launch site · WebGL' },
  { image: 'pages/ensemble.webp',  title: '05  Ensemble',  sub: 'Lookbook · e-commerce' },
];

/* =====================================================================
   EDIT HERE — timing (seconds)
   ===================================================================== */
const TIMING = {
  closedHold: 2.2,   // how long the closed cover rests
  turnEvery: 0.75,   // gap between page turns
  turnLength: 0.85,  // how long one page takes to turn
  openHold: 2,       // how long the last spread rests
  riffleGap: 0.13,   // stagger between pages when the book riffles shut
};

/* =====================================================================
   Book shape — you shouldn't need to touch anything below this line
   ===================================================================== */
const W = 1, H = 1.5;      // page size (2:3)
const SEG = 48;            // how finely a page bends
const GAP = 0.0035;        // paper thickness between stacked pages
const LIFT = 0.1;          // pages rise off the spine like a real binding
const N = SPREADS.length;  // one sheet per spread (the last sheet's back is blank)
const TEX_W = 1024, TEX_H = Math.round(TEX_W * H / W);

/* ---------- renderer ---------- */
const canvas = document.getElementById('book');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setClearColor(0x000000, 1);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 50);
const book = new THREE.Group();
scene.add(book);

let needsRender = true;

function resize() {
  renderer.setSize(innerWidth, innerHeight, false);
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  // open spread fills ~46% of the width and ~52% of the height (wider on phones)
  const fit = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
  const widthShare = camera.aspect < 1 ? 0.92 : 0.46;
  camera.position.z = Math.max(H / (0.52 * fit), (2 * W) / (widthShare * fit * camera.aspect));
  needsRender = true;
}
addEventListener('resize', resize);
resize();

/* ---------- page textures ---------- */
// side: 'full' = whole image on one page, 'L' / 'R' = left / right half of a spread.
// spine: which edge of this page touches the binding (gets a soft gutter shadow).
function pageTexture(img, side, spine, drawExtra) {
  const c = document.createElement('canvas');
  c.width = TEX_W; c.height = TEX_H;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#f4f2ee';
  ctx.fillRect(0, 0, TEX_W, TEX_H);

  if (img) {
    // crop the image to fill (like object-fit: cover), then take the needed half
    const targetRatio = (side === 'full' ? TEX_W : TEX_W * 2) / TEX_H;
    let sw = img.width, sh = img.height, sx = 0, sy = 0;
    if (sw / sh > targetRatio) { sw = sh * targetRatio; sx = (img.width - sw) / 2; }
    else { sh = sw / targetRatio; sy = (img.height - sh) / 2; }
    if (side !== 'full') { sw /= 2; if (side === 'R') sx += sw; }
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, TEX_W, TEX_H);
  }
  drawExtra?.(ctx);

  const g = spine === 'left' ? ctx.createLinearGradient(0, 0, TEX_W, 0) : ctx.createLinearGradient(TEX_W, 0, 0, 0);
  g.addColorStop(0, 'rgba(0,0,0,.28)');
  g.addColorStop(0.06, 'rgba(0,0,0,.1)');
  g.addColorStop(0.18, 'rgba(0,0,0,0)');
  g.addColorStop(0.92, 'rgba(0,0,0,0)');
  g.addColorStop(1, 'rgba(0,0,0,.08)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, TEX_W, TEX_H);

  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  return t;
}

function drawCoverText(ctx) {
  ctx.fillStyle = 'rgba(255,255,255,.92)';
  ctx.font = '600 17px "Inter Tight", sans-serif';
  ctx.textBaseline = 'middle';
  ctx.fillText(COVER_TEXT[0], 46, TEX_H * 0.46);
  ctx.textAlign = 'right';
  ctx.fillText(COVER_TEXT[1], TEX_W - 46, TEX_H * 0.46);
}

/* ---------- sheets (one bendable piece of paper each) ---------- */
const sheets = [];

function makeSheet(i, frontTex, backTex) {
  const front = new THREE.PlaneGeometry(W, H, SEG, 1);
  front.translate(W / 2, 0, 0);         // hinge at the spine (x = 0)
  front.deleteAttribute('normal');      // unlit material, normals not needed
  const pos = front.attributes.position;
  const col = new THREE.BufferAttribute(new Float32Array(pos.count * 3).fill(1), 3);
  front.setAttribute('color', col);

  // the back face shares the same points but reads its texture mirrored,
  // so the left page of the next spread shows the right way round
  const back = new THREE.BufferGeometry();
  back.setIndex(front.index);
  back.setAttribute('position', pos);
  back.setAttribute('color', col);
  const uv = front.attributes.uv.clone();
  for (let k = 0; k < uv.count; k++) uv.setX(k, 1 - uv.getX(k));
  back.setAttribute('uv', uv);

  const group = new THREE.Group();
  group.add(
    new THREE.Mesh(front, new THREE.MeshBasicMaterial({ map: frontTex, vertexColors: true, side: THREE.FrontSide })),
    new THREE.Mesh(back, new THREE.MeshBasicMaterial({ map: backTex, vertexColors: true, side: THREE.BackSide })),
  );
  book.add(group);

  const sheet = { i, pos, col, theta: 0, dir: 1, tween: null };
  sheets.push(sheet);
  bend(sheet);
}

// Bend a sheet. theta is the hinge angle: 0 = lying on the right, PI = lying on the left.
// While turning, the free edge trails behind (curl) — the soft paper look of the reference.
const colX = new Float32Array(SEG + 1), colZ = new Float32Array(SEG + 1), colShade = new Float32Array(SEG + 1);

function bend(s) {
  const th = s.theta, sin = Math.sin(th), cos = Math.cos(th);
  const curl = s.dir * (s.dir > 0 ? 0.55 : 1.3) * sin * sin;
  // stacking: unturned sheets lie under each other on the right, turned ones on the left
  const z0 = THREE.MathUtils.lerp(-s.i * GAP, -(N - 1 - s.i) * GAP, th / Math.PI);
  const step = W / SEG;
  const angleAt = f => th - curl * f * f + LIFT * cos * (1 - f) ** 3;

  let x = 0, z = 0;
  colX[0] = 0; colZ[0] = 0;
  colShade[0] = shade(angleAt(0));
  for (let k = 1; k <= SEG; k++) {
    const a = angleAt((k - 0.5) / SEG);
    x += Math.cos(a) * step;
    z += Math.sin(a) * step;
    colX[k] = x; colZ[k] = z;
    colShade[k] = shade(angleAt(k / SEG));
  }

  const p = s.pos.array, c = s.col.array;
  for (let v = 0; v < s.pos.count; v++) {
    const k = v % (SEG + 1);
    p[v * 3] = colX[k];
    p[v * 3 + 2] = colZ[k] + z0;
    c[v * 3] = c[v * 3 + 1] = c[v * 3 + 2] = colShade[k];
  }
  s.pos.needsUpdate = true;
  s.col.needsUpdate = true;
}

// paper darkens as it turns away from the viewer (|cos| = how much it faces the camera)
function shade(angle) {
  return 0.42 + 0.58 * Math.pow(Math.abs(Math.cos(angle)), 1.6);
}

/* ---------- turning pages ---------- */
const ease = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
let spread = 0;

function goTo(n, { length = TIMING.turnLength, stagger = 0.09 } = {}) {
  n = Math.max(0, Math.min(N - 1, n));
  if (n === spread) return;
  const forward = n > spread;
  const moving = sheets.filter(s => (forward ? s.i >= spread && s.i < n : s.i >= n && s.i < spread));
  if (!forward) moving.reverse(); // riffle back from the top of the left pile
  const now = performance.now() / 1000;
  moving.forEach((s, j) => {
    s.dir = forward ? 1 : -1;
    s.tween = { from: s.theta, to: forward ? Math.PI : 0, start: now + j * stagger, length };
  });
  spread = n;
  updateUI();
}

/* ---------- autoplay (the loop from the reference video) ---------- */
let playing = true, timer = 0;

function autoStep() {
  if (!playing) return;
  let wait;
  if (spread === 0) {
    goTo(1, { length: 0.95 });                               // cover opens
    wait = TIMING.turnEvery + 0.05;
  } else if (spread < N - 1) {
    goTo(spread + 1);                                        // next page
    wait = spread === N - 1 ? TIMING.turnLength + TIMING.openHold : TIMING.turnEvery;
  } else {
    goTo(0, { length: 0.95, stagger: TIMING.riffleGap });    // riffle shut
    wait = 0.95 + TIMING.riffleGap * (N - 2) + TIMING.closedHold;
  }
  timer = setTimeout(autoStep, wait * 1000);
}

function setPlaying(on) {
  playing = on;
  clearTimeout(timer);
  playBtn.textContent = on ? 'Pause' : 'Play';
  playBtn.setAttribute('aria-pressed', on);
  if (on) timer = setTimeout(autoStep, 900);
}

// don't keep flipping in a background tab
document.addEventListener('visibilitychange', () => {
  clearTimeout(timer);
  if (!document.hidden && playing) timer = setTimeout(autoStep, 600);
});

/* ---------- interface ---------- */
const cap = document.getElementById('cap');
const sub = document.getElementById('sub');
const bars = document.getElementById('bars');
const playBtn = document.getElementById('play');
const panels = [...document.querySelectorAll('.panel')];

bars.innerHTML = SPREADS.map(s => `<button aria-label="${s.title.trim()}"></button>`).join('');

let capTimer = 0;
function updateUI() {
  [...bars.children].forEach((b, i) => b.classList.toggle('on', i === spread));
  // roll the title: old text slides up, new text slides in from below
  clearTimeout(capTimer);
  cap.style.transform = 'translateY(-100%)';
  capTimer = setTimeout(() => {
    cap.style.transition = 'none';
    cap.style.transform = 'translateY(100%)';
    cap.textContent = SPREADS[spread].title;
    sub.textContent = SPREADS[spread].sub;
    requestAnimationFrame(() => { cap.style.transition = ''; cap.style.transform = 'none'; });
  }, 300);
}

function closePanels() {
  panels.forEach(p => p.classList.remove('open'));
  document.querySelectorAll('[data-panel]').forEach(a => a.classList.remove('on'));
}

function manualGo(n) { setPlaying(false); goTo(n); }

bars.addEventListener('click', e => {
  const i = [...bars.children].indexOf(e.target);
  if (i >= 0) manualGo(i);
});
playBtn.addEventListener('click', () => setPlaying(!playing));

document.querySelectorAll('[data-panel]').forEach(a => a.addEventListener('click', e => {
  e.preventDefault();
  const panel = document.getElementById(a.dataset.panel);
  const opening = !panel.classList.contains('open');
  closePanels();
  if (opening) { panel.classList.add('open'); a.classList.add('on'); }
}));
panels.forEach(p => p.addEventListener('click', closePanels));

document.querySelectorAll('[data-go]').forEach(a => a.addEventListener('click', e => {
  e.preventDefault();
  closePanels();
  manualGo(+a.dataset.go);
}));

// tap the right half to go forward, the left half to go back — or swipe
let downX = null;
canvas.addEventListener('pointerdown', e => { downX = e.clientX; });
canvas.addEventListener('pointerup', e => {
  if (downX === null) return;
  const dx = e.clientX - downX;
  downX = null;
  if (Math.abs(dx) > 40) manualGo(spread + (dx < 0 ? 1 : -1));
  else manualGo(spread + (e.clientX > innerWidth / 2 ? 1 : -1));
});
canvas.addEventListener('pointermove', e => {
  const right = e.clientX > innerWidth / 2;
  canvas.style.cursor = right ? (spread < N - 1 ? 'e-resize' : 'default') : (spread > 0 ? 'w-resize' : 'default');
});

addEventListener('keydown', e => {
  if (e.key === 'Escape') closePanels();
  if (e.key === 'ArrowRight') manualGo(spread + 1);
  if (e.key === 'ArrowLeft') manualGo(spread - 1);
  if (e.key === ' ') { e.preventDefault(); setPlaying(!playing); }
});

/* ---------- start ---------- */
function loadImage(src) {
  const img = new Image();
  img.src = window.PAGE_DATA?.[src] || src; // embedded copy from pages.js avoids file:// WebGL errors
  return img.decode().then(() => img);
}

const images = await Promise.all(SPREADS.map(s => loadImage(s.image)));
await document.fonts.ready;

// sheet i: front = right page of spread i, back = left page of spread i + 1
for (let i = 0; i < N; i++) {
  const front = i === 0 ? pageTexture(images[0], 'full', 'left', drawCoverText) : pageTexture(images[i], 'R', 'left');
  const back = i < N - 1 ? pageTexture(images[i + 1], 'L', 'right') : pageTexture(null, 'full', 'right');
  makeSheet(i, front, back);
}
// upload all textures to the GPU now, so the first turn doesn't stutter
renderer.compile(scene, camera);
scene.traverse(o => o.material?.map && renderer.initTexture(o.material.map));
updateUI();

const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

function frame(nowMs) {
  const now = nowMs / 1000;
  for (const s of sheets) {
    if (!s.tween) continue;
    // wall-clock timing: a slow frame never slows the choreography down
    const t = reducedMotion ? 1 : Math.min(Math.max((now - s.tween.start) / s.tween.length, 0), 1);
    s.theta = s.tween.from + (s.tween.to - s.tween.from) * ease(t);
    if (t >= 1) s.tween = null;
    bend(s);
    needsRender = true;
  }
  if (needsRender) {
    // keep what's visible centred: a closed book only shows the right page
    const coverOpen = sheets[0].theta / Math.PI, backOpen = sheets[N - 1].theta / Math.PI;
    book.position.x = -W / 2 * (1 - ease(coverOpen)) + W / 2 * backOpen;
    renderer.render(scene, camera);
    needsRender = false;
  }
  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
canvas.classList.add('ready');
setPlaying(true);
})();
