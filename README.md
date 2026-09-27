# Idris Kaye — Portfolio Zine

A one-screen portfolio site built as a **3D fashion zine** on a pure black background.
The book sits closed, opens its cover, turns through five spreads of work, rests on the last
spread, then riffles shut and starts again — the same loop as the reference video.
Visitors can take over at any time: click or swipe to turn pages, jump to a spread, or open
the About / Contact overlays.

- No build step, no framework, no package install. Three plain files plus images.
- One dependency: **Three.js 0.160.0**, loaded from a CDN.
- Total download: ~1.6 MB of images + Three.js (~670 KB minified, ~160 KB gzipped from the CDN) + fonts.

---

## Contents

1. [Quick start](#1-quick-start)
2. [File structure](#2-file-structure)
3. [How to edit (the common changes)](#3-how-to-edit-the-common-changes)
4. [The reference and what was matched](#4-the-reference-and-what-was-matched)
5. [Design system](#5-design-system)
6. [Page layout & UI](#6-page-layout--ui)
7. [How the 3D book works](#7-how-the-3d-book-works)
8. [Autoplay loop & timing](#8-autoplay-loop--timing)
9. [Interaction reference](#9-interaction-reference)
10. [Performance](#10-performance)
11. [Images](#11-images)
12. [Accessibility](#12-accessibility)
13. [Browser support](#13-browser-support)
14. [Deploying](#14-deploying)
15. [Troubleshooting](#15-troubleshooting)
16. [Placeholders to replace before launch](#16-placeholders-to-replace-before-launch)
17. [Known limitations & ideas](#17-known-limitations--ideas)
18. [Project history](#18-project-history)

---

## 1. Quick start

The site loads its JavaScript as an ES module and draws images into WebGL, so it **must be
served over http** — double-clicking `index.html` (a `file://` URL) will show a black screen.

From the folder that contains this project:

```bash
npx http-server "idris kaye" -p 8132 -c-1
```

Then open <http://localhost:8132>.

Any static server works (`python -m http.server`, VS Code "Live Server", etc.).
`-c-1` turns caching off so edits show up on refresh.

In this workspace there is also a preset in `.claude/launch.json` named **`idris-kaye`** that runs the
same command.

---

## 2. File structure

```
idris kaye/
├── index.html      Page structure: corner UI, About/Contact text, links, script tags
├── style.css       All styling (colours, font, layout, hover effects, overlays)
├── script.js       The 3D book, page-turn animation, autoplay, clicks/keys/swipes
├── favicon.svg     Tab icon — a small open book, white on black
├── README.md       This file
└── pages/          The zine artwork (WebP)
    ├── cover.webp       1024 × 1536  portrait, the closed cover        (~90 KB)
    ├── polaroids.webp   2048 × 1365  spread 01                        (~184 KB)
    ├── editorial.webp   2048 × 1365  spread 02                        (~292 KB)
    ├── collage.webp     2048 × 1365  spread 03                        (~448 KB)
    ├── campaign.webp    2048 × 1365  spread 04                        (~277 KB)
    └── ensemble.webp    2048 × 1365  spread 05                        (~295 KB)
```

| File | Lines | What lives there |
|---|---|---|
| `index.html` | ~70 | Markup only. Every block has a comment (`<!-- top left -->`, `<!-- about overlay -->`…). |
| `style.css` | ~130 | Settings block at the top (`:root` variables), then sections: base, book, corner UI, overlays, small screens. |
| `script.js` | ~355 | Two **EDIT HERE** blocks at the top (content, timing). Everything below is engine code. |

---

## 3. How to edit (the common changes)

### Change the name, bio, email, social links
All in `index.html`, as plain text:

| What | Where in `index.html` |
|---|---|
| Name + title (top left) | `<!-- top left -->` block |
| Menu labels (top right) | `<!-- top right -->` block |
| About text + location/availability | `<!-- about overlay -->` |
| Email + social links | `<!-- contact overlay -->` — replace the `href="#"` values |
| Browser tab title + search description | `<title>` and `<meta name="description">` in `<head>` |

The name also appears **on the cover image itself** — change `COVER_TEXT` at the top of
`script.js`:

```js
const COVER_TEXT = ['IDRIS KAYE', 'PORTFOLIO 2026']; // left word, right word
```

### Change, add, remove or reorder spreads
Edit the `SPREADS` list at the top of `script.js`:

```js
const SPREADS = [
  { image: 'pages/cover.webp',     title: 'Cover',         sub: 'Selected work 2021—2026' },
  { image: 'pages/polaroids.webp', title: '01  Polaroids', sub: 'Casting archive · web' },
  ...
];
```

- **The first entry is always the cover** — a single portrait image (2:3).
- **Every other entry is an open two-page spread** — one landscape image (≈3:2). The left half
  becomes the left page, the right half the right page.
- `title` shows bottom-left (it rolls in when the page changes) and is also the accessible label
  of that spread's progress bar. `sub` is the grey line under it.
- Add or remove entries freely. The number of paper sheets, the progress bars and the
  autoplay loop all adapt to `SPREADS.length`. Keep at least 2 entries (cover + one spread).

Image tips:
- Spread images are cropped to **2 : 1.5** (≈1.33) to fit two 2:3 pages, so a 3:2 image loses a
  thin strip on each side. Keep important content away from the far left/right edges.
- The fold runs down the exact centre of a spread image — avoid faces on the centre line.
- Recommended sizes: spreads **2048 px wide**, cover **1024 px wide**. Larger is wasted (textures
  are 1024 px per page); smaller will look soft.
- Any format the browser can decode works (`.webp`, `.jpg`, `.png`, `.avif`).

### Change the speed / rhythm
`TIMING` at the top of `script.js` (all values in seconds):

| Key | Default | Meaning |
|---|---|---|
| `closedHold` | `2.2` | How long the closed cover rests before opening |
| `turnEvery` | `0.75` | Gap between the start of one page turn and the next |
| `turnLength` | `0.85` | Duration of a single page turn (longer than `turnEvery`, so turns overlap slightly) |
| `openHold` | `2` | How long the last spread rests before riffling shut |
| `riffleGap` | `0.13` | Stagger between pages when the book riffles shut (smaller = faster fan) |

### Change colours or font
Top of `style.css`:

```css
:root {
  --bg: #000;                           /* page background */
  --fg: #fff;                           /* main text */
  --dim: rgba(255, 255, 255, .42);      /* secondary text, inactive links */
  --font: "Inter Tight", system-ui, sans-serif;
  --ease: cubic-bezier(.2, .7, .1, 1);  /* easing for all UI transitions */
}
```

If you change `--bg`, also change the WebGL clear colour in `script.js`
(`renderer.setClearColor(0x000000, 1)`) and `<meta name="theme-color">` in `index.html`,
otherwise the area behind the book stays black.

To change the font: swap the Google Fonts `<link>` in `index.html`, update `--font`, and update
the font name in `drawCoverText()` in `script.js` (the cover words are drawn onto the image).

### Change the favicon
Replace `favicon.svg` (any SVG works). It is a 32×32 viewBox: a black rounded square, a solid
white left page and a 55%-opacity right page curving up as if mid-turn.

---

## 4. The reference and what was matched

The design recreates a ~10 s looping video of a 3D fashion lookbook (spreads titled
Polaroids, Editorial, Campaign, plus a collage and a group shot) on pure black. It was studied
frame by frame (1 fps overview, then 4 fps with timestamps). Details matched:

| Reference detail | How it's reproduced |
|---|---|
| Pure black background, no UI in the video | `#000` everywhere; UI kept to four tiny corner labels |
| Open spread fills ~46% of the width, ~52% of the height | Camera distance is computed from these two ratios on every resize |
| Pages are 2:3 portrait | `W = 1, H = 1.5` |
| Closed book shows only the cover, **centred** | Book group slides left by half a page when closed |
| Cover tilts toward the viewer in perspective before opening | Natural result of the eased hinge rotation seen through a 30° perspective camera |
| Pages turn one after another, ~0.75 s apart, overlapping | `turnEvery 0.75`, `turnLength 0.85` |
| Mid-turn the page stands up toward the camera and looks **taller** than the book | Real 3D + perspective; forward curl kept small so the page stays near-vertical |
| Turning pages bend softly, like paper | Each sheet is a 48-segment strip bent every frame (see §7) |
| Last spread rests ~2 s | `openHold 2` |
| Book riffles shut fast: pages fan out, strongly curved, staggered | Reverse turn with stronger curl (1.3 vs 0.55) and 0.13 s stagger |
| Soft gutter shadow, pages darker as they tilt away | Gradient baked into each page texture + per-column shading |
| Loop repeats forever | Autoplay state machine (§8) |

---

## 5. Design system

**Direction:** minimal, modern, gallery-like. The book is the only bright thing on screen;
everything else is small, quiet, and pinned to the corners.

| Token | Value |
|---|---|
| Background | `#000000` |
| Text | `#ffffff` |
| Secondary text | `rgba(255,255,255,.42)` |
| Inactive progress bar | `rgba(255,255,255,.18)` |
| Hovered progress bar | `rgba(255,255,255,.6)` |
| Overlay backdrop | `rgba(0,0,0,.86)` |
| Page paper (behind images / blank back page) | `#f4f2ee` |
| Font | Inter Tight 400 / 500 / 600 (Google Fonts) |
| UI text | 12 px, weight 500, line-height 1.35, letter-spacing .01em |
| Overlay text | `clamp(20px, 2.4vw, 28px)`, weight 400 |
| Cover words | 600 weight, 17 px on a 1024 px texture, 92% white, at 46% of page height |
| Easing (UI) | `cubic-bezier(.2,.7,.1,1)` |
| Easing (pages) | cubic ease-in-out |
| Corner padding | 22 px × 26 px desktop, 16 px × 18 px under 640 px |

---

## 6. Page layout & UI

The page never scrolls (`overflow: hidden`, one `100dvh` canvas). Four fixed corner groups sit
above the canvas (`z-index: 2`); overlays sit between (`z-index: 1`).

```
┌──────────────────────────────────────────────────────────┐
│ Idris Kaye                          Work  About  Contact │
│ Designer & Developer                                     │
│                                                          │
│                    ┌──────┬──────┐                       │
│                    │      │      │                       │
│                    │ book │      │                       │
│                    │      │      │                       │
│                    └──────┴──────┘                       │
│                                                          │
│ 02  Editorial                          ▬ ▬ ━ ▬ ▬ ▬ Pause │
│ Art direction · print                                    │
└──────────────────────────────────────────────────────────┘
```

- **Top left:** name (click → closes the book / goes to the cover) and title.
- **Top right:** `Work` (opens to spread 01), `About`, `Contact`. Links are dimmed; on hover or
  when their overlay is open they turn white and a 1 px underline wipes in from the left
  (and out to the right).
- **Bottom left:** the current spread's `title` and `sub`. On every page change the title
  slides up and out, then the new one slides up from below (0.3 s swap, 0.6 s transition).
- **Bottom right:** one 18 px bar per spread (active = white) + `Pause` / `Play`.
- **Overlays (About / Contact):** full-screen 86% black, text centred, fades in over 0.5 s while
  the text rises 12 px. Click anywhere or press `Esc` to close. Opening one closes the other.
- **Book fade-in:** the canvas starts at opacity 0 and fades in over 1.2 s once all images are
  ready, so nothing half-loaded is ever shown.
- **Cursor:** over the right half of the screen `e-resize` (→), left half `w-resize` (←), or the
  normal arrow when there is no page to turn that way.

**Small screens (< 640 px / portrait):** the open spread widens to 92% of the screen width
(instead of 46%), and corner padding tightens. Everything else is identical.

---

## 7. How the 3D book works

All in `script.js`. Rendering uses Three.js `WebGLRenderer` with antialiasing, pixel ratio
capped at 2, and a `PerspectiveCamera` with a **30° vertical field of view**.

### Camera fit
On every resize:

```
fit        = 2 · tan(15°)                     ≈ 0.536
widthShare = 0.46  (landscape)  or 0.92 (portrait)
camera.z   = max( H / (0.52 · fit),  2W / (widthShare · fit · aspect) )
```

So the open spread takes 52% of the height or `widthShare` of the width, whichever is tighter.

### Sheets
A book with `N` spreads has `N` **sheets** (pieces of paper). Sheet `i`:

- **front** = right page of spread `i` (sheet 0's front is the cover)
- **back** = left page of spread `i + 1` (the last sheet's back is blank paper)

Each sheet is a `PlaneGeometry(1, 1.5, 48, 1)`, shifted so its left edge (the spine) is at
x = 0. It is drawn with **two meshes that share the same vertex positions**:
- the front mesh (`FrontSide`) uses the normal UVs;
- the back mesh (`BackSide`) uses UVs mirrored left-to-right, so the next spread's left page
  reads correctly after the sheet has flipped over.

Both use `MeshBasicMaterial` with vertex colours — no lights, so image colours stay exactly
as authored, and shading is done by hand (below). Normals are deleted because nothing uses them.

### Bending a page
Each sheet has a hinge angle **θ**: `0` = lying flat on the right, `π` = lying flat on the left.
The paper is treated as a strip of 48 short segments. The direction of each segment is

```
angle(f) = θ − curl · f²  +  LIFT · cos θ · (1 − f)³        f = 0 at the spine … 1 at the edge
curl     = dir · k · sin²θ                                     k = 0.55 forward, 1.3 backward
```

and the positions are found by walking along the strip (x += cos·step, z += sin·step).

- **`curl`** makes the free edge trail behind the hinge while turning — the soft "C" of real
  paper. It is zero at rest (sin²θ = 0) and strongest mid-turn. Forward turns use a gentle
  curl (so the page stands nearly upright, as in the reference); the riffle uses a strong one
  (the fanned look).
- **`LIFT = 0.1`** makes resting pages rise slightly off the spine then flatten, like a bound
  book. `cos θ` flips its direction for left-hand pages.

### Shading
Every column of vertices gets a grey value based on how directly it faces the camera:

```
shade = 0.42 + 0.58 · |cos(angle)|^1.6
```

Flat pages are at full brightness (1.0); a page seen edge-on drops to 0.42. On top of that, each
page texture has a baked **gutter shadow**: 28% black at the spine fading to 0 by 18% of the page
width, plus an 8% darkening at the outer edge.

### Stacking
Sheets are offset in depth by `GAP = 0.0035` so they never flicker through each other.
Unturned sheets stack downward on the right (`−i · GAP`), turned sheets on the left
(`−(N−1−i) · GAP`), and a turning sheet blends between the two as θ goes 0 → π.

### Keeping the book centred
A closed book only shows the right-hand page, so the whole book slides:

```
book.x = −W/2 · (1 − ease(θ₀/π))  +  W/2 · (θ_last/π)
```

Closed → shifted left by half a page (cover centred). Open → centred on the spine.

### Page textures
For each page, `pageTexture()` draws onto a **1024 × 1536** canvas:
1. fill with paper colour `#f4f2ee`;
2. draw the image cropped like `object-fit: cover` (spreads: the left or right half of the crop);
3. draw extras (cover words on the cover);
4. draw the gutter/edge gradient;
5. upload as a `CanvasTexture` (sRGB, anisotropy up to 8).

12 textures are made in total (front + back × 6 sheets).

---

## 8. Autoplay loop & timing

`autoStep()` runs on a `setTimeout` chain and decides the next move from the current spread:

| Current spread | Action | Next step after |
|---|---|---|
| Cover (0) | Open cover, 0.95 s turn | `turnEvery + 0.05` = 0.8 s |
| 1 … N−2 | Turn one page, `turnLength` | `turnEvery` = 0.75 s |
| → lands on last | (same) | `turnLength + openHold` = 2.85 s |
| Last (N−1) | Riffle shut: all sheets back, 0.95 s each, `riffleGap` apart, top sheet first | riffle time + `closedHold` ≈ 3.7 s |

With the default six spreads one full loop is about **10 seconds**, matching the reference.

Page movement uses **wall-clock time** (`performance.now()`), not frame counting — if the device
drops frames, pages still arrive on schedule instead of slowing down.

**Autoplay stops** as soon as the visitor turns a page, clicks a bar, uses a nav link or the arrow
keys. `Play` (or the space bar) resumes it. It also pauses automatically while the browser tab is
hidden and resumes 0.6 s after the tab comes back.

`goTo(n)` is the single function that moves the book: it works out which sheets must turn
(forward = ascending order, backward = descending, i.e. a riffle), gives each a tween with a
stagger (0.09 s for manual jumps), and updates the UI.

---

## 9. Interaction reference

| Input | Result |
|---|---|
| Click / tap right half | Next spread |
| Click / tap left half | Previous spread |
| Swipe left / right (> 40 px) | Next / previous spread |
| `→` / `←` | Next / previous spread |
| `Space` | Play / pause autoplay |
| `Esc` | Close About / Contact |
| Click a progress bar | Jump straight to that spread (pages riffle through) |
| **Idris Kaye** (top left) | Close the book (go to cover) |
| **Work** | Open to spread 01 |
| **About** / **Contact** | Toggle the overlay |
| Click an overlay | Close it |

The canvas has `touch-action: pan-y`, so horizontal swipes go to the book and never scroll the page.

---

## 10. Performance

What was done to keep it smooth:

- **Render on demand.** The frame loop only re-bends a sheet while it is moving and only calls
  `renderer.render()` when something changed. A resting book costs almost nothing.
- **Cheap bending.** Shading is derived directly from each column's angle, so there is no
  per-frame `computeVertexNormals()`. The bend loop touches 6 sheets × 49 columns.
- **No first-turn stutter.** After the textures are built, shaders are compiled
  (`renderer.compile`) and every texture is uploaded to the GPU (`renderer.initTexture`) before
  the book fades in.
- **Wall-clock animation** (see §8) so slow frames never slow the choreography.
- **Background tabs** stop the autoplay timer; `requestAnimationFrame` pauses by itself.
- **Early downloads.** `<link rel="modulepreload">` for Three.js and `<link rel="preload">` for the
  cover start fetching while the HTML is still parsing. Images decode off the main thread via
  `img.decode()`.
- **Smaller library.** Uses `three.module.min.js`.
- **Right-sized images.** Spreads at exactly 2 × 1024 px wide (one texture per page), cover at
  1024 px. WebP instead of JPEG: 3.1 MB → 1.6 MB.
- **Pixel ratio capped at 2** and anisotropy capped at 8, so 4K/Retina screens don't render 9×
  the pixels.

Measured in Chromium at 1220 × 812: one ~140 ms task at start-up (building and uploading the 12
textures, hidden behind the fade-in) and **no long tasks during the loop**.

---

## 11. Images

### Source
All artwork was generated with **Higgsfield** using the **GPT Image 2.5** model, `quality: high`,
`resolution: 2k` (2.75 credits each, 16.5 credits total). They are AI-generated placeholders in the
style of the reference — swap in real project work before launch.

| File | Aspect | Prompt summary |
|---|---|---|
| `cover` | 2:3 | Full-length woman, curly dark hair, beige cap, cropped black tee, white shorts with draped fabric, oversized camel shearling jacket, against crumpled lavender-white draped fabric; soft even light, muted pastels, 35 mm film look. No text. |
| `polaroids` | 3:2 | Off-white page with ~24 scattered taped polaroids of street-style outfits; big red hand-painted "POLAROIDS", hand-drawn black arrow, red scribble circle. |
| `editorial` | 3:2 | Left: warm still life of studded black, neon-lime and pink rhinestone western belts on a brown leather jacket, thin white hand-drawn "EDITORIAL", tiny caption. Right: clean off-white page with one small photo of a buckle. |
| `collage` | 3:2 | Cut-out paper collage on white: eight fully clothed models in faux fur, oversized denim, patchwork knits, tall denim boots, one holding colourful plush toys; Y2K zine aesthetic. |
| `campaign` | 3:2 | Left: woman in denim headscarf, cream sunglasses, silver shell earrings, finger on lips, white brush lettering "CAMPAIGN". Right: full-length side view of a model in all denim with very long black hair, denim bag, blue platform boots. |
| `ensemble` | 3:2 | Nine diverse models on white seamless in maximalist streetwear: tie-dye co-ords, plaid, yellow cowboy hat, knit balaclava, pink bucket hat, turquoise jersey, bleached denim. |

(The first editorial and collage prompts were rejected by the safety filter and rephrased to be
explicitly fully clothed; rejected jobs were not charged.)

### Conversion commands
The originals were 2K PNGs. They were converted with ffmpeg:

```bash
# spreads: 2048 px wide = 1024 px per page
ffmpeg -i polaroids.png -vf "scale=2048:-2:flags=lanczos" -c:v libwebp -quality 82 -compression_level 6 polaroids.webp
# the two busiest images use quality 74
ffmpeg -i collage.png   -vf "scale=2048:-2:flags=lanczos" -c:v libwebp -quality 74 -compression_level 6 collage.webp
# cover: one page wide
ffmpeg -i cover.png     -vf "scale=1024:-2:flags=lanczos" -c:v libwebp -quality 82 -compression_level 6 cover.webp
```

Use the same commands for new artwork. Aim for under ~450 KB per spread.

---

## 12. Accessibility

- The canvas has an `aria-label` describing the zine; the spread title region is
  `aria-live="polite"`, so screen readers announce each new spread.
- Every progress bar is a real `<button>` labelled with its spread title.
- `Play/Pause` is a button with `aria-pressed`.
- Everything is keyboard-operable (arrows, space, Esc; links and buttons are focusable).
- **`prefers-reduced-motion`:** CSS transitions are disabled and page turns jump instantly
  instead of animating.
- The About/Contact text is real HTML, not baked into images.

---

## 13. Browser support

Any current browser with WebGL, ES modules, import maps and WebP: Chrome/Edge 89+,
Firefox 108+, Safari 16.4+ (iOS and macOS). `100dvh` falls back gracefully on older browsers.

---

## 14. Deploying

It is a static site — upload the folder as-is to any static host (Netlify, Vercel, GitHub Pages,
Cloudflare Pages, S3…). No build command; publish directory = the folder root.

Notes:
- Folder and URL names with spaces work locally but are awkward in URLs; when deploying you may
  want to publish the folder's **contents** at the site root rather than the folder itself.
- Three.js and the font come from `cdn.jsdelivr.net` and `fonts.googleapis.com`. To be fully
  self-hosted, download `three.module.min.js` next to `script.js` and point the import map at
  `./three.module.min.js` (and update the `modulepreload` link).

---

## 15. Troubleshooting

| Symptom | Cause / fix |
|---|---|
| Black screen, nothing loads | Opened via `file://`. Serve it over http (§1). |
| Black screen on http | Open the browser console. A 404 on `pages/…` means an image path in `SPREADS` is wrong (paths are case-sensitive on most hosts). |
| Book never appears (stays black) but UI is visible | One image failed to decode, and the book waits for all images. Check the file isn't corrupt / is a supported format. |
| Edits don't show | Browser cache — hard refresh (`Ctrl+Shift+R`), or run the server with `-c-1`. |
| Cover words in the wrong font | The font hadn't loaded before the cover was drawn; the code waits for `document.fonts.ready`, so check the Google Fonts link and the font name in `drawCoverText()` match. |
| Important part of an image cut off | Spreads are cropped to 1.33:1 and split down the centre (§3). Re-frame the image. |
| Page turns feel too fast/slow | Adjust `TIMING` (§3). |

---

## 16. Placeholders to replace before launch

- [ ] Name "Idris Kaye" — `index.html` (title, top-left, meta description) and `COVER_TEXT` in `script.js`
- [ ] Title "Designer & Developer"
- [ ] About paragraph, location "Lahore / Remote", availability "Nov ’26"
- [ ] Email `hello@idriskaye.studio`
- [ ] Instagram / GitHub / Read.cv links (currently `#`)
- [ ] Spread titles and subtitles in `SPREADS`
- [ ] All six images in `pages/` (AI placeholders)

---

## 17. Known limitations & ideas

- Pages have no thickness; the book edge is implied by the stacking and shading only.
- The last sheet's back (the back cover) is plain paper and is never shown by the autoplay loop.
- Spread images are shared across the fold — there is no separate left/right image option yet
  (easy to add: give `SPREADS` entries `left` / `right` fields and pass them to `pageTexture`).
- No project detail pages — the spreads are visual only. A natural next step is making each
  spread link to a case study.
- Possible additions: page-turn sound, drag-to-turn with the page following the finger, a
  hi-res zoom on click, a back cover with contact details.

---

## 18. Project history

1. **First version (`flotsam/`, separate folder):** a portfolio recreating a different reference —
   a man in a white shirt and orange tie with everyday objects floating around him on grey.
   Evolved from Three.js primitives to photographed props generated with Higgsfield, with a
   cut-out portrait, knolling "Tidy up" mode, gravity flip and hover labels.
2. **This version:** rebuilt from a new screen recording — a 3D fashion zine on black. Studied
   frame by frame, rebuilt as bendable Three.js sheets, zine artwork generated with Higgsfield.
3. **Finalised:** split into `index.html` / `style.css` / `script.js`, editable config blocks,
   favicon, WebP images (−48%), render-on-demand loop, pre-uploaded textures, swipe support,
   background-tab pause. Folder renamed from `zine` to `idris kaye`.
