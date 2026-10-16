// node patch.cjs <file> <patches.js> — patches module exports [[old,new],...]; normalizes CRLF->LF; each old must match exactly once
const fs = require('fs');
const path = require('path');
const [file, pfile] = process.argv.slice(2);
let s = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n');
const patches = require(path.resolve(pfile));
patches.forEach(([o, n], i) => {
  const c = s.split(o).length - 1;
  if (c !== 1) { console.error(`patch ${i} matched ${c} times: ${o.slice(0, 80)}`); process.exit(1); }
  s = s.replace(o, () => n);
});
fs.writeFileSync(file, s);
console.log(`${file}: ${patches.length} patches ok`);
