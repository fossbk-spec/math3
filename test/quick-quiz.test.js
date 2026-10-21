'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const quiz = require('../public/assets/js/core/quick-quiz');
// Kết quả lấy bằng cách chạy questions.ts nguồn qua node:module.stripTypeScriptTypes,
// không sinh từ quick-quiz.js. 12 câu/seed bao gồm nhánh hết 10 phép của một bảng.
const fixtures = require('./quick-quiz-fixtures.json');
const script = name => fs.readFileSync(path.join(__dirname, '../public/assets/js', name), 'utf8');

function sequence(api, seed, settings, count = 20) {
  const random = api.seededRandom(seed), recent = [];
  return Array.from({ length: count }, () => {
    const q = api.nextGameQuestion(settings, recent, random);
    recent.push(q.key);
    return q;
  });
}

for (const { seed, settings, expected } of fixtures) {
  test(`khớp 12 câu từ questions.ts nguồn: seed ${seed}`, () => {
    assert.deepEqual(sequence(quiz, seed, settings, expected.length), expected);
  });
}

// Chuyển các ca questions.test.ts nguồn, giữ ngoại lệ dung lượng 10 phép.
for (const tables of [6, 7, 8, 9, 'mixed']) for (const ops of ['multiply', 'divide', 'both']) {
  test(`đúng phép, 4 đáp án phân biệt, tránh lặp: ${tables}/${ops}`, () => {
    const settings = { tables, ops };
    const questions = sequence(quiz, 12345, settings, 100);
    assert.deepEqual(questions, sequence(quiz, 12345, settings, 100));
    const capacity = (tables === 'mixed' ? 4 : 1) * (ops === 'both' ? 2 : 1) * 10;
    questions.forEach((q, i) => {
      const [op, aText, bText] = q.key.split(':');
      const a = Number(aText), b = Number(bText);
      assert.ok([6, 7, 8, 9].includes(a));
      if (tables !== 'mixed') assert.equal(a, tables);
      if (ops !== 'both') assert.equal(op, ops);
      assert.ok(b >= 1 && b <= 10);
      assert.equal(q.answer, op === 'multiply' ? a * b : b);
      const fact = op === 'multiply' ? `${a} × ${b} = ${a * b}` : `${a * b} : ${a} = ${b}`;
      assert.equal(q.fact, fact);
      assert.equal(q.stem, fact.replace(/= \d+$/, '= ?'));
      assert.equal(q.options.length, 4);
      assert.equal(new Set(q.options).size, 4);
      assert.ok(q.options.includes(q.answer));
      assert.ok(q.options.every(n => Number.isInteger(n) && n >= 0));
      const lookback = capacity === 10 ? 9 : 10;
      assert.ok(!questions.slice(Math.max(0, i - lookback), i).some(old => old.key === q.key));
      if (capacity === 10 && i >= 10) assert.equal(q.key, questions[i - 10].key);
    });
  });
}

test('UMD trong trình duyệt trả cùng dãy với Node', () => {
  const context = vm.createContext({});
  vm.runInContext(script('core/quick-quiz.js'), context);
  assert.deepEqual(JSON.parse(JSON.stringify(sequence(context.MathQuickQuiz, 2026, { tables: 'mixed', ops: 'both' }))),
    sequence(quiz, 2026, { tables: 'mixed', ops: 'both' }));
});

function gameHarness(duration = '60') {
  class Element {
    constructor() { this.listeners = {}; this.dataset = {}; this.children = []; this.hidden = false; }
    addEventListener(type, callback) { this.listeners[type] = callback; }
    focus() { this.focused = true; }
    querySelector() { return this.number; }
    replaceChildren() { this.children = []; }
    appendChild(child) { this.children.push(child); }
    fire(type) { return this.listeners[type]({ preventDefault() {} }); }
  }
  const elements = new Map();
  const el = id => { if (!elements.has(id)) elements.set(id, new Element()); return elements.get(id); };
  const balloons = Array.from({ length: 4 }, () => { const b = new Element(); b.number = new Element(); return b; });
  el('quiz-tables').value = '7'; el('quiz-ops').value = 'divide'; el('quiz-duration').value = duration;
  let now = 1000, timeout, interval;
  const saves = [];
  const window = {
    MathQuickQuiz: quiz,
    MathGameScore: { finish: async (...args) => { saves.push(args); return { bestScore: args[1] }; } },
  };
  vm.runInNewContext(script('pages/game.js'), {
    window, Date: { now: () => now },
    document: { getElementById: el, querySelectorAll: () => balloons, createElement: () => new Element(), addEventListener() {} },
    setInterval: fn => { interval = fn; return 1; }, clearInterval: () => { interval = null; },
    setTimeout: fn => { timeout = fn; return 2; }, clearTimeout: () => { timeout = null; },
  });
  return { el, balloons, saves, start: () => el('quick-quiz-settings').fire('submit'),
    setNow: value => { now = value; }, tick: () => interval?.(), next: () => { const fn = timeout; timeout = null; fn?.(); },
    hasTimers: () => !!(timeout || interval) };
}

test('ván chơi: bắt đầu khi chọn xong, khóa bấm lặp, lưu một lần, chữa bằng fact, chơi lại', async () => {
  const h = gameHarness('90');
  assert.equal(h.hasTimers(), false);
  h.start();
  assert.equal(h.el('countdown-val').textContent, '90');
  const first = sequence(quiz, 1000, { tables: 7, ops: 'divide' })[0];
  assert.equal(h.el('quiz-question').textContent, first.stem);
  const wrong = h.balloons.find(b => Number(b.dataset.value) !== first.answer);
  wrong.fire('click'); wrong.fire('click');
  h.next();
  const second = sequence(quiz, 1000, { tables: 7, ops: 'divide' })[1];
  const correct = h.balloons.find(b => Number(b.dataset.value) === second.answer);
  correct.fire('click'); correct.fire('click');
  assert.equal(h.el('score-val').textContent, '30');
  h.setNow(5000);
  await h.el('quiz-finish').fire('click');
  await h.el('quiz-finish').fire('click');
  assert.equal(h.saves.length, 1);
  assert.deepEqual(Array.from(h.saves[0].slice(0, 3)), ['game-bong-bay', 30, 1000]);
  assert.equal(h.saves[0][3].showResult, false);
  assert.equal(h.hasTimers(), false);
  assert.match(h.el('quiz-result-summary').textContent, /2 câu/);
  assert.equal(h.el('quiz-mistakes').children.length, 1);
  assert.ok(h.el('quiz-mistakes').children[0].textContent.includes(first.fact));
  h.el('quiz-replay').fire('click');
  assert.equal(h.el('quick-quiz-settings').hidden, false);
  h.start();
  assert.equal(h.el('score-val').textContent, '0');
});

test('hết giờ 60/90 giây: không nhận bấm muộn, không sinh câu mới, dừng mọi timer', async () => {
  for (const duration of [60, 90]) {
    const h = gameHarness(String(duration));
    h.start();
    h.setNow(1000 + duration * 1000);
    h.balloons[0].fire('click');
    h.tick(); h.next();
    await Promise.resolve();
    assert.equal(h.saves.length, 1);
    assert.equal(h.saves[0][1], 0);
    assert.equal(h.hasTimers(), false);
    assert.equal(h.el('quick-quiz-results').hidden, false);
    assert.match(h.el('quiz-result-summary').textContent, /0 câu/);
  }
});

test('game-score giữ lưu điểm, có thể tắt panel mặc định riêng cho M3', async () => {
  const calls = [], panels = [];
  const window = { MathAPI: { post: async (...args) => { calls.push(args); return { score: 30 }; } } };
  vm.runInNewContext(script('core/game-score.js'), { window, Date: { now: () => 5000 } });
  window.MathGameScore.showResult = r => panels.push(r);
  await window.MathGameScore.finish('game-bong-bay', 30, 1000, { showResult: false });
  assert.equal(calls[0][0], '/api/game-scores');
  assert.equal(calls[0][1].durationSec, 4);
  assert.equal(panels.length, 0);
  await window.MathGameScore.finish('other-game', 30, 1000);
  assert.equal(panels.length, 1);
  window.MathAPI.post = async () => { throw new Error('offline'); };
  assert.equal(await window.MathGameScore.finish('game-bong-bay', 30, 1000, { showResult: false }), null);
  assert.equal(panels.length, 1);
});
