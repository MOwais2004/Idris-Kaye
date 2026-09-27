// Rebuilds pages.js from the images in pages/. Run: node make-pages.js
const fs = require('fs');
const data = {};
for (const f of fs.readdirSync('pages').filter(f => f.endsWith('.webp')))
  data['pages/' + f] = 'data:image/webp;base64,' + fs.readFileSync('pages/' + f).toString('base64');
fs.writeFileSync('pages.js', '// Page images embedded so index.html also works when opened straight from disk (file://).\n// After changing anything in pages/, regenerate this file with:  node make-pages.js\nwindow.PAGE_DATA = ' + JSON.stringify(data) + ';\n');
