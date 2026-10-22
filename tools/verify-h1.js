'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function verifyH1(exportDir) {
  const manifest = JSON.parse(fs.readFileSync(path.join(exportDir, 'manifest.json'), 'utf8'));
  for (const name of ['hm-coach.js', 'lesson-questions.json', 'goi-mo-rules.json']) {
    // Manifest H1 được tạo trên LF; Git trên Windows có thể checkout thành CRLF.
    const source = fs.readFileSync(path.join(exportDir, name), 'utf8').replace(/\r\n/g, '\n');
    const digest = crypto.createHash('sha256').update(source).digest('hex');
    if (digest !== manifest.sha256?.[name]) throw new Error(`SHA256 không khớp: ${name}`);
  }
  return manifest;
}
module.exports = verifyH1;
