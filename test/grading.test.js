const test = require('node:test');
const assert = require('node:assert/strict');
const { norm, isCorrect, commentFor, gradeSubmission } = require('../public/assets/js/core/grading');

test('chuẩn hoá đáp án và so sánh', () => {
  assert.equal(norm(' 9.721 '), '9721');
  assert.equal(norm(' A '), 'a');
  assert.equal(isCorrect({ correct_answer: '9721' }, '9.721'), true);
  assert.equal(isCorrect({ correct_answer: '>' }, '>'), true);
  assert.equal(isCorrect({ correct_answer: 'A' }, ''), false);
  assert.equal(commentFor(90), 'Hoàn thành rất tốt');
  assert.equal(commentFor(50), 'Hoàn thành');
  assert.equal(commentFor(49), 'Cố gắng hơn');
});

test('bài chữa chỉ xuất hiện ở lượt luyện tập cuối', () => {
  const questions = [{ id: 'q1', points: 1, correct_answer: 'A', solution_json: '["Giải thích"]' }];
  assert.equal(gradeSubmission(questions, {}, { kind: 'exercise' }).detail[0].correctAnswer, undefined);
  assert.deepEqual(gradeSubmission(questions, {}, { kind: 'exercise', lastAttempt: true }).detail[0].solution, ['Giải thích']);
  assert.equal(gradeSubmission(questions, {}, { kind: 'exam', lastAttempt: true }).detail[0].correctAnswer, undefined);
});
