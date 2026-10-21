'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const view = require('../public/assets/js/core/question-view');
const data = require('../data/content/grade3.json');
const questions = Object.values(data.questionSets).flatMap(s => s.questions);

test('renderer mặc định có nhãn, practice ẩn số câu/điểm và nhãn input không ghi Câu 1', () => {
  const q = questions.find(q => q.type === 'input');
  const container = { innerHTML: '', querySelectorAll: () => [] };
  let updates = 0;
  view.render(container, [q], {}, () => { updates++; });
  assert.match(container.innerHTML, /Câu 1 •/);
  assert.match(container.innerHTML, /điểm/);
  assert.match(container.innerHTML, /aria-label="Đáp số câu 1"/);
  view.render(container, [q], {}, () => { updates++; }, { hideLabel: true });
  assert.doesNotMatch(container.innerHTML, /Câu 1|điểm|Đáp số câu 1/);
  assert.match(container.innerHTML, /aria-label="Đáp số"/);
  assert.ok(container.innerHTML.includes(q.prompt));
  assert.equal(updates, 2);
});

test('định dạng đáp án trắc nghiệm từ dữ liệu: chữ cái và nội dung; điền số giữ nguyên', () => {
  const choices = questions.filter(q => q.type === 'multiple-choice');
  for (const q of choices) {
    const index = ['A', 'B', 'C', 'D'].indexOf(q.correctAnswer);
    assert.ok(index >= 0 && q.options[index] != null, q.id);
    assert.equal(view.formatAnswer(q, q.correctAnswer), `${q.correctAnswer}. ${q.options[index]}`);
  }
  const input = questions.find(q => q.type === 'input');
  assert.equal(view.formatAnswer(input, input.correctAnswer), input.correctAnswer);
  assert.equal(view.formatAnswer(undefined, input.correctAnswer), input.correctAnswer);
  assert.equal(view.formatAnswer(choices[0], undefined), '');
});

test('modal exercise hiển thị cả chữ cái và lựa chọn của câu đã chữa', async () => {
  const setId = 'bai-9-co-ban';
  const q = data.questionSets[setId].questions.find(q => q.type === 'multiple-choice');
  const nodes = new Map();
  const node = () => ({ textContent: '', style: {}, dataset: {}, disabled: false, children: [], listeners: {},
    classList: { add() {}, remove() {} }, setAttribute() {}, append(...children) { this.children.push(...children); },
    addEventListener(type, fn) { this.listeners[type] = fn; } });
  const get = id => { if (!nodes.has(id)) nodes.set(id, node()); return nodes.get(id); };
  const document = { getElementById: get, createElement: node, addEventListener(type, fn) { this[type] = fn; } };
  get('feedback-modal').querySelector = selector => selector === '[data-corrections]' ? null : get(selector);
  const window = { MathQuestionView: { formatAnswer: view.formatAnswer, render() {} }, MathAPI: {
    get: async url => url === '/api/lessons' ? { lessons: [{ id: 'bai-9', number: 9, title: data.lessons[0].title,
      locked: false, questionSets: [{ id: setId, title: data.questionSets[setId].title, kind: 'exercise' }] }] } : { questions: [q] },
    post: async () => ({ scorePercent: 0, correctCount: 0, totalCount: 1, comment: '', attemptsLeft: 0,
      detail: [{ questionId: q.id, correct: false, correctAnswer: q.correctAnswer, solution: q.solution }] }),
  } };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../public/assets/js/pages/exercise.js'), 'utf8'), {
    window, document, location: { search: `?lesson=bai-9&set=${setId}` }, URLSearchParams, Date, setInterval() {},
    confirm: () => true, alert: message => assert.fail(message),
  });
  await document['mathapp:user-ready']();
  await get('btn-submit-exercise').listeners.click();
  const line = get('feedback-modal').children[0].children[0].textContent;
  const index = ['A', 'B', 'C', 'D'].indexOf(q.correctAnswer);
  assert.ok(line.includes(`Đáp án: ${q.correctAnswer}. ${q.options[index]}`), line);
});
