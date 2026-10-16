const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const sourcePath = path.join(root, '..', 'hoang-mai-math', 'content', 'grade3', 'ai-safe.json');
const imported = JSON.parse(fs.readFileSync(path.join(root, 'data', 'content', 'grade3.json'), 'utf8')).aiSafe;

test('aiSafe import has six situations and DRAFT status', () => {
  assert.equal(imported.reviewStatus, 'DRAFT');
  assert.equal(imported.situations.length, 6);
});

// So khớp nguồn chỉ khi có repo hoang-mai-math cạnh math3 (CI không có)
test('aiSafe import matches hoang-mai-math source', { skip: !fs.existsSync(sourcePath) }, () => {
  assert.deepEqual(imported, JSON.parse(fs.readFileSync(sourcePath, 'utf8')));
});
