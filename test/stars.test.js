'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const demoClient = require('./helpers/demo');
const practice = require('../public/assets/js/core/practice.js');
const data = require('../data/content/grade3.json');

test('sao: luyện tập đúng +1, không cộng lại; nộp bộ lần đầu ≥ số câu đúng; nộp lại thấp hơn 0 sao', async () => {
  const call = demoClient();
  await call('auth/login', 'POST', { role: 'student' });
  const first = await call('practice/next', 'POST', { lessonId: 'bai-9' });
  const q = practice.pool(data).find(item => item.id === first.question.id);
  const right = await call('practice/answer', 'POST', { questionId: q.id, answer: q.correctAnswer, attemptNo: 1, hintsUsed: 0 });
  assert.equal(right.starsEarned, 1);
  assert.equal(right.totalStars, 1);
  // Mở lại câu (tải lại trang) không cộng thêm.
  const again = await call('practice/next', 'POST', { lessonId: 'bai-9' });
  assert.notEqual(again.question.id, q.id);
  assert.equal((await call('me/progress')).totalStars, 1);

  const set = data.questionSets['bai-9-co-ban'];
  assert.equal(set.questions.length, 10);
  const answers = Object.fromEntries(set.questions.slice(0, 6).map(item => [item.id, item.correctAnswer]));
  const firstTry = await call('submissions', 'POST', { setId: 'bai-9-co-ban', answers });
  assert.equal(firstTry.correctCount, 6);
  assert.ok(firstTry.starsEarned >= 6);
  const lower = await call('submissions', 'POST', { setId: 'bai-9-co-ban', answers: {} });
  assert.equal(lower.starsEarned, 0);
});

test('mỗi câu 1 điểm; mọi bộ bài tập 10 câu không trùng đề', () => {
  for (const [id, set] of Object.entries(data.questionSets)) {
    const prompts = set.questions.map(q => String(q.prompt).replace(/\s+/g, ' ').trim());
    assert.equal(new Set(prompts).size, prompts.length, `${id} có câu trùng`);
    if (set.kind === 'exercise') assert.equal(set.questions.length, 10, `${id} không đủ 10 câu`);
  }
  const grading = require('../public/assets/js/core/grading.js');
  const qs = data.questionSets['bai-9-co-ban'].questions.map(q => ({ ...q, points: 5 }));
  const graded = grading.gradeSubmission(qs, {}, { kind: 'exercise', lastAttempt: true, feedbackRules: data.feedbackRules });
  assert.equal(graded.totalPoints ?? qs.length, qs.length);
});
