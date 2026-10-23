'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const illustration = require('../public/assets/js/components/illustration');
const content = require('../data/content/grade3.json');

function fakeDocument() {
  return { createElementNS(namespace, tagName) {
    return { namespace, tagName, attributes: {}, children: [], textContent: '',
      setAttribute(name, value) { this.attributes[name] = value; },
      append(child) { this.children.push(child); } };
  } };
}

test('hình hợp lệ có nhãn tiếng Việt và SVG đúng số đồ vật', () => {
  const data = { kind: 'groups', item: 'flower', groups: 3, perGroup: 4 };
  assert.equal(illustration.valid(data), true);
  assert.equal(illustration.label(data), '3 nhóm, mỗi nhóm 4 bông hoa');
  const svg = illustration.render(data, fakeDocument());
  assert.equal(svg.tagName, 'svg');
  assert.equal(svg.namespace, 'http://www.w3.org/2000/svg');
  assert.equal(svg.attributes.role, 'img');
  assert.equal(svg.attributes['aria-label'], illustration.label(data));
  assert.equal(svg.children.length, 12);
  assert.ok(svg.children.every(child => child.tagName === 'g'));
  const shared = { kind: 'share', item: 'book', groups: 2, perGroup: 5 };
  assert.equal(illustration.label(shared), '10 quyển vở để chia đều cho 2 nhóm');
  assert.equal(illustration.render(shared, fakeDocument()).children.length, 10);
});

test('dữ liệu xấu và hơn 90 đồ vật không tạo SVG', () => {
  const base = { kind: 'groups', item: 'orange', groups: 9, perGroup: 10 };
  for (const bad of [null, {}, { ...base, kind: 'other' }, { ...base, item: '__proto__' },
    { ...base, groups: 0 }, { ...base, groups: 1.5 }, { ...base, perGroup: -1 },
    { ...base, perGroup: '10' }, { ...base, groups: 10, perGroup: 10 }]) {
    assert.equal(illustration.valid(bad), false);
    assert.equal(illustration.render(bad, fakeDocument()), null);
  }
  assert.equal(illustration.render(base), null);
});

test('mọi hình trong dữ liệu lớp 3 đều hợp lệ', () => {
  const questions = [...Object.values(content.questionSets).flatMap(set => set.questions), ...(content.practiceQuestions || [])];
  const illustrated = questions.filter(question => question.illustration);
  assert.ok(illustrated.length > 0);
  for (const question of illustrated) {
    assert.equal(illustration.valid(question.illustration), true, question.id);
    assert.ok(illustration.render(question.illustration, fakeDocument()), question.id);
  }
});
