'use strict';
// Chuyển các ca không thuộc A06 từ hoang-mai-math/src/lib/adaptive/adaptive.test.ts.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { selectNext, note } = require('../public/assets/js/core/adaptive');
const { pool } = require('../public/assets/js/core/practice');
const data = require('../data/content/grade3.json');
const skills = data.skills;
const bank = pool(data);
const unlocked = skills.map(s => s.id);
const skill = skills[0];
const levels = [...new Set(bank.filter(q => q.skillId === skill.id).map(q => q.cognitiveLevel))].sort();
const base = { skills, unlocked, bank };
const attempt = (changes = {}) => ({ questionId: 'old', skillId: skill.id, cognitiveLevel: levels[0],
  isCorrect: false, attemptNo: 1, hintsUsed: 0, completed: true, ...changes });
const run = history => selectNext({ ...base, history });
test('học sinh mới bắt đầu mức thấp nhất', () => {
  assert.equal(run([]).question.skillId, skill.id); assert.equal(run([]).question.cognitiveLevel, levels[0]);
});
test('đoán đúng một câu rồi sai không tăng mức', () => {
  assert.equal(run([attempt({ isCorrect: true }), attempt()]).question.cognitiveLevel, levels[0]);
});
test('hai câu đúng nhưng có gợi ý không tăng mức', () => {
  assert.equal(run([attempt({ isCorrect: true, hintsUsed: 1 }), attempt({ isCorrect: true })]).question.cognitiveLevel, levels[0]);
});
test('hai câu đúng ngay lần đầu không hỗ trợ tăng đúng một mức', () => {
  assert.equal(run([attempt({ isCorrect: true }), attempt({ isCorrect: true })]).question.cognitiveLevel, levels[1]);
});
test('sai lần 3 hạ một mức hỗ trợ', () => {
  const r = run([attempt({ cognitiveLevel: levels.at(-1), attemptNo: 3 })]);
  assert.equal(r.question.cognitiveLevel, levels.at(-2)); assert.ok(r.trace.rules.includes('A04-SUPPORT'));
});
test('gợi ý bậc 3 ngăn tăng mức kể cả đúng', () => {
  assert.ok(run([attempt({ cognitiveLevel: levels.at(-1), isCorrect: true, hintsUsed: 3 })]).trace.rules.includes('A04-SUPPORT'));
});
const dependent = skills.find(s => s.prerequisites.length);
const prerequisite = dependent.prerequisites[0];
const history = [0, 1, 2, 3].map(i => attempt({ skillId: prerequisite, questionId: `p${i}`, isCorrect: i === 0 }));
history.push(attempt({ skillId: dependent.id }));
test('tiền đề dưới 50% đã mở được chọn trước', () => {
  const r = run(history); assert.equal(r.question.skillId, prerequisite); assert.equal(r.trace.data.sampleSize, 4);
});
test('tiền đề chưa mở không được chọn', () => {
  assert.equal(selectNext({ ...base, history, unlocked: unlocked.filter(id => id !== prerequisite) }).question.skillId, dependent.id);
});
test('ít hơn 4 câu không đủ căn cứ chuyển tiền đề', () => {
  assert.equal(run(history.slice(1)).question.skillId, dependent.id);
});
test('đúng ở lần thử thứ hai không được tăng mức', () => {
  assert.equal(run([attempt({ isCorrect: true, attemptNo: 2 }), attempt({ isCorrect: true })]).question.cognitiveLevel, levels[0]);
});
test('đúng chính xác 50% không chuyển tiền đề', () => {
  assert.equal(run(history.map((a, i) => i === 1 ? { ...a, isCorrect: true } : a)).question.skillId, dependent.id);
});
test('không lặp câu trong 20 lượt gần nhất; cửa sổ dịch chuyển', () => {
  const first = bank.find(q => q.skillId === skill.id && q.cognitiveLevel === levels[0]);
  const questions = Array.from({ length: 22 }, (_, i) => ({ ...first, id: `window-${i}` }));
  const recent = questions.slice(0, 20).map(q => attempt({ questionId: q.id }));
  assert.equal(selectNext({ ...base, bank: questions, history: recent }).question.id, 'window-20');
  assert.equal(selectNext({ ...base, bank: questions, history: questions.slice(0, 21).map(q => attempt({ questionId: q.id })) }).question.id, 'window-0');
});
test('không còn câu trả null kèm lý do và ghi chú TT27', () => {
  const r = selectNext({ ...base, history: [], bank: [] });
  assert.equal(r.question, null); assert.equal(r.trace.ruleId, 'A07-EMPTY'); assert.ok(r.trace.reason.includes(note));
});
test('kỹ năng bị khóa không bao giờ được chọn', () => {
  assert.equal(selectNext({ ...base, history: [], unlocked: [] }).question, null);
});
test('chế độ chỉ câu đã duyệt không dùng DRAFT', () => {
  assert.equal(selectNext({ ...base, history: [], allowDraft: false }).question, null);
});
test('tất định, không sửa đầu vào; cạn bank không sinh A06', () => {
  const input = { ...base, history: bank.filter(q => q.skillId === skill.id && q.cognitiveLevel === levels[0]).map(q => attempt({ questionId: q.id })) };
  const before = JSON.stringify(input);
  const result = selectNext(input);
  assert.deepEqual(result, selectNext(input)); assert.equal(JSON.stringify(input), before);
  assert.equal(result.question, null); assert.equal(result.trace.ruleId, 'A07-EMPTY'); assert.ok(!result.trace.rules.includes('A06-GENERATE'));
});
