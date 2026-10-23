'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

test('demo mới: hocsinh dùng mật khẩu chính xác, tách khỏi tài khoản mẫu cũ', async () => {
  const call = require('./helpers/demo')();
  const trial = (await call('auth/login', 'POST', { username: 'hocsinh', password: '123456' })).user;
  assert.equal(trial.id, 3);
  assert.equal(trial.fullName, 'Bạn Dùng Thử');
  assert.equal(trial.role, 'student');
  assert.equal(trial.className, 'DEMO');
  await call('auth/logout', 'POST');
  for (const username of ['hocsinh', 'hocsinh01']) {
    for (const password of ['wrong', '', '123456 ']) {
      await assert.rejects(call('auth/login', 'POST', { username, password }), e => e.status === 401);
    }
  }
  assert.equal((await call('auth/login', 'POST', { username: 'hocsinh01', password: '123456' })).user.id, 2);
});

test('demo API: học sinh làm 3 lượt, bài chữa cuối, giáo viên duyệt câu', async () => {
  const data = require('../data/content/grade3.json');
  const memory = new Map();
  const localStorage = { getItem: key => memory.get(key) ?? null, setItem: (key, value) => memory.set(key, value), removeItem: key => memory.delete(key) };
  const context = { window: { MATH_TEACHER_KDF: require('./helpers/teacher').KDF, crypto: globalThis.crypto, MathPractice: require('../public/assets/js/core/practice.js'), MathGrading: require('../public/assets/js/core/grading.js'), MathStars: require('../public/assets/js/core/stars.js') }, localStorage,
    fetch: async url => { assert.equal(url, 'data/grade3.json'); return { ok: true, json: async () => data }; },
    TextEncoder, atob, btoa, URL, Date, Math, Object, JSON };
  context.window.localStorage = localStorage;
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../public/assets/js/core/demo-api.js'), 'utf8'), context);
  const call = (url, method = 'GET', body = {}) => context.window.MathDemoAPI.request(`/api/${url}`, { method, body: JSON.stringify(body) });
  const student = await call('auth/login', 'POST', { role: 'student' });
  assert.equal(student.user.fullName, 'Bạn Cú');
  const lessons = await call('lessons');
  assert.equal(lessons.lessons.length, 7);
  assert.equal(lessons.lessons[0].page, 28);
  const setId = Object.keys(data.questionSets).find(id => data.questionSets[id].kind === 'exercise' && data.questionSets[id].questions.some(q => q.hints?.length));
  assert.ok(setId);
  const questions = (await call(`question-sets/${setId}/questions`)).questions;
  assert.ok(questions.some(q => q.hints.length));
  assert.equal(Object.hasOwn(questions[0], 'correctAnswer'), false);
  const illustratedSetId = Object.keys(data.questionSets).find(id => data.questionSets[id].questions.some(q => q.illustration));
  const pictured = (await call(`question-sets/${illustratedSetId}/questions`)).questions.find(q => q.illustration);
  assert.deepEqual(pictured.illustration, data.questionSets[illustratedSetId].questions.find(q => q.id === pictured.id).illustration);
  assert.equal((await call('ai-safe')).aiSafe.situations.length, 6);
  for (let n = 1; n <= 3; n++) {
    const answers = n === 2 ? Object.fromEntries(data.questionSets[setId].questions.map(q => [q.id, q.correctAnswer])) : {};
    const result = await call('submissions', 'POST', { setId, answers });
    assert.equal(result.attemptNo, n);
    assert.equal(result.attemptsLeft, 3 - n);
    assert.equal(result.detail[0].correct, n === 2);
    if (n === 2) assert.equal(result.scorePercent, 100);
    assert.equal(Object.hasOwn(result.detail[0], 'correctAnswer'), n === 3);
  }
  await assert.rejects(call('submissions', 'POST', { setId, answers: {} }), error => error.status === 409);
  await call('auth/logout', 'POST');
  await call('auth/login', 'POST', require('./helpers/teacher').login);
  const before = (await call(`teacher/question-sets/${setId}/questions`)).questions;
  assert.equal(before[0].review_status, 'DRAFT');
  await call(`teacher/questions/${before[0].id}/review`, 'POST', { status: 'APPROVED' });
  const after = (await call(`teacher/question-sets/${setId}/questions`)).questions;
  assert.equal(after[0].review_status, 'APPROVED');
  const approved = await call(`teacher/question-sets/${setId}/approve-all`, 'POST');
  assert.ok(approved.approved > 0);
  assert.ok((await call('teacher/analytics')).students >= 1);
});
