// Vercel always excludes any path containing a "node_modules" segment when
// deploying, but `expo export --platform web` nests font/icon assets under
// dist/assets/node_modules/... (mirroring their package path). Without this,
// every custom font 404s on Vercel even though the export itself is fine.
const fs = require('fs');
const path = require('path');

const distDir = path.join(__dirname, '..', 'dist');
const oldDir = path.join(distDir, 'assets', 'node_modules');
const newDir = path.join(distDir, 'assets', 'vendor');

if (fs.existsSync(oldDir)) {
  fs.cpSync(oldDir, newDir, { recursive: true });
  fs.rmSync(oldDir, { recursive: true, force: true });
  console.log('Renamed dist/assets/node_modules -> dist/assets/vendor');
}

function walk(dir, cb) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, cb);
    else cb(full);
  }
}

let patched = 0;
walk(distDir, (file) => {
  if (!/\.(js|html|css)$/.test(file)) return;
  const content = fs.readFileSync(file, 'utf8');
  if (content.includes('assets/node_modules')) {
    fs.writeFileSync(file, content.split('assets/node_modules').join('assets/vendor'));
    patched++;
  }
});
console.log(`Patched ${patched} file(s) referencing assets/node_modules`);
