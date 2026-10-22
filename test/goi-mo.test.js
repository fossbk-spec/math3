'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const data = require('../data/content/grade3.json');
const practice = require('../public/assets/js/core/practice');
const bank = practice.pool(data);
const fs = require('fs');
const os = require('os');
const path = require('path');
const verifyH1 = require('../tools/verify-h1');
const number = bank.find(q => q.verification?.op === '*' && q.type === 'input' && q.correctAnswer === '42');
const entry = q => ({ questionId: q.id, skillId: q.skillId, cognitiveLevel: q.cognitiveLevel,
  attemptNo: 0, hintsUsed: 0, completed: false, steps: [], errorTags: [] });

test('ba bước 6 × 7 sai 13: không lộ đáp án, điền đúng và sai hai lần', () => {
  assert.ok(number);
  let current = entry(number);
  for (let i = 1; i <= 3; i++) {
    const { updated, response } = practice.answer(number, current, { questionId: number.id, answer: '13', attemptNo: i, hintsUsed: 0 });
    current = updated;
    assert.equal(response.coach.step, i);
    assert.equal(response.correctAnswer, undefined);
    assert.equal(response.solution, undefined);
    if (i === 2) assert.equal(response.coach.errorTag, 'cong-thay-nhan');
  }
  assert.equal(current.guided, 'PENDING');
  assert.equal(current.isCorrect, false);
  assert.equal(current.steps.length, 3);
  assert.throws(() => practice.complete(number, entry(number), { questionId: number.id, answer: '42' }));
  const done = practice.complete(number, current, { questionId: number.id, answer: '42' }, data.coachRules);
  assert.equal(done.updated.guided, 'DONE');
  assert.equal(done.response.message, data.coachRules.done);
  const once = practice.complete(number, current, { questionId: number.id, answer: '0' }, data.coachRules);
  assert.equal(once.updated.guided, 'PENDING');
  const twice = practice.complete(number, once.updated, { questionId: number.id, answer: '0' }, data.coachRules);
  assert.equal(twice.updated.guided, 'REVEALED');
  assert.equal(twice.response.correctAnswer, '42');
});

test('SHA256 H1 sai thì dừng trước khi nhập', () => {
  // Gói giả trong thư mục tạm: CI không có repo hoang-mai-math bên cạnh.
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'math3-h1-'));
  try {
    const files = { 'hm-coach.js': fs.readFileSync(path.join(__dirname, '../public/assets/js/vendor/hm-coach.js')),
      'lesson-questions.json': Buffer.from('[{"id":"q1"},{"id":"q2"}]'), 'goi-mo-rules.json': fs.readFileSync(path.join(__dirname, '../data/content/goi-mo-rules.json')) };
    const sha256 = {};
    for (const [name, raw] of Object.entries(files)) {
      const body = raw.toString('utf8').replace(/\r\n/g, '\n');
      fs.writeFileSync(path.join(temp, name), body);
      sha256[name] = require('crypto').createHash('sha256').update(body).digest('hex');
    }
    fs.writeFileSync(path.join(temp, 'manifest.json'), JSON.stringify({ version: 1, commit: 'test', questionCount: 2, sha256 }));
    assert.equal(verifyH1(temp).questionCount, 2);
    fs.appendFileSync(path.join(temp, 'hm-coach.js'), 'tampered');
    assert.throws(() => verifyH1(temp), /SHA256 không khớp: hm-coach.js/);
  } finally { fs.rmSync(temp, { recursive: true, force: true }); }
});

test('trắc nghiệm sai 3 lần: chọn lại, không lộ đáp án; chọn đúng → DONE', () => {
  const q = bank.find(item => item.type === 'multiple-choice' && item.solution?.length);
  const wrong = ['A', 'B', 'C', 'D'].find(l => l !== q.correctAnswer);
  let current = entry(q);
  let response;
  for (let i = 1; i <= 3; i++) ({ updated: current, response } = practice.answer(q, current, { questionId: q.id, answer: wrong, attemptNo: i, hintsUsed: 0 }));
  assert.equal(current.guided, 'PENDING');
  assert.equal(response.coach.mode, 'rechoose');
  assert.equal(response.correctAnswer, undefined);
  assert.equal(response.solution, undefined);
  const done = practice.complete(q, current, { questionId: q.id, answer: q.correctAnswer });
  assert.equal(done.updated.guided, 'DONE');
});

test('toàn practicePool: thông điệp 1–3 không lộ đáp số đứng riêng', () => {
  for (const q of bank.filter(q => q.type === 'input')) {
    let current = entry(q);
    for (let i = 1; i <= 3; i++) {
      const { updated, response } = practice.answer(q, current, { questionId: q.id, answer: '999999', attemptNo: i, hintsUsed: 0 });
      current = updated;
      const coach = response.coach;
      if (!coach) continue;
      const text = coach.message || coach.prompt || coach.masked?.join(' ') || '';
      const answer = String(q.correctAnswer);
      if (q.prompt.includes(answer) || q.verification?.args?.includes(answer)) continue;
      const escaped = answer.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      assert.doesNotMatch(text, new RegExp(`(^|[^0-9])${escaped}(?![0-9])`), q.id);
    }
  }
});

test('practice.next giữ mức sau một lần sai và ưu tiên dạng lỗi lặp', () => {
  const lessons = data.lessons.map(l => ({ ...l, completed: true, locked: false }));
  const scoped = bank.filter(q => q.skillId === number.skillId);
  let history = [{ ...entry(number), completed: true, attemptNo: 3, isCorrect: false }];
  const held = practice.next(data, scoped, history, lessons);
  assert.ok(held.trace.rules.includes('A04-HOLD'));
  for (let i = 0; i < 30; i++) {
    const picked = practice.next(data, scoped, history, lessons);
    assert.ok(picked.question);
    let current = entry(picked.question);
    for (let tryNo = 1; tryNo <= 3; tryNo++) {
      const witness = picked.question.verification;
      const wrong = witness?.op === '*' && witness.args?.length === 2
        ? String(Number(witness.args[0]) + Number(witness.args[1])) : '999999';
      current = practice.answer(picked.question, current, { questionId: picked.question.id, answer: wrong, attemptNo: tryNo, hintsUsed: 0 }).updated;
    }
    if (current.guided === 'PENDING') {
      current = practice.complete(picked.question, current, { questionId: picked.question.id, answer: '999999' }).updated;
      current = practice.complete(picked.question, current, { questionId: picked.question.id, answer: '999999' }).updated;
    }
    history.push(current);
    if (picked.trace.rules.includes('A08-MISCONCEPTION')) {
      assert.equal(picked.reason, 'Mình luyện thêm dạng này nhé.');
      return;
    }
  }
  assert.fail('Chưa gặp luật A08 trong 30 câu');
});
