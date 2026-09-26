const fs = require('fs');
const path = require('path');
const root = path.resolve(process.argv[2] || 'src');
const bad = [];
function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p);
    else if (/\.js$/.test(e.name)) {
      const src = fs.readFileSync(p, 'utf8');
      const re = /(?:from\s+|import\s*\()\s*['"](\.[^'"]+)['"]/g;
      let m;
      while ((m = re.exec(src))) {
        const spec = m[1].split('?')[0];
        const full = path.resolve(path.dirname(p), spec);
        if (!fs.existsSync(full)) bad.push(path.relative(root, p) + ' -> ' + spec);
      }
    }
  }
}
walk(root);
console.log(bad.length ? bad.join('\n') : 'ALL RELATIVE IMPORTS OK');
