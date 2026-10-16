const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('aiSafe import preserves six source situations and DRAFT status', () => {
  const root = path.join(__dirname, '..');
  const source = JSON.parse(fs.readFileSync(path.join(root, '..', 'hoang-mai-math', 'content', 'grade3', 'ai-safe.json'), 'utf8'));
  const imported = JSON.parse(fs.readFileSync(path.join(root, 'data', 'content', 'grade3.json'), 'utf8')).aiSafe;
  assert.deepEqual(imported, source);
  assert.equal(imported.reviewStatus, 'DRAFT');
  assert.equal(imported.situations.length, 6);
});
