/* Hợp đồng lượt luyện tập dùng chung, không đọc storage/DB/clock. */
(function (root, factory) {
  const api = typeof module === 'object' && module.exports
    ? factory(require('./adaptive'), require('./grading')) : factory(root.MathAdaptive, root.MathGrading);
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.MathPractice = api;
})(typeof window !== 'undefined' ? window : null, function (adaptive, grading) {
  'use strict';
  const fail = message => { const e = new Error(message); e.status = 409; throw e; };
  function pool(data) {
    const ids = new Set(data.practicePool);
    return [...Object.values(data.questionSets).filter(s => s.kind === 'exercise').flatMap(s => s.questions.map(q => ({ ...q, lessonId: s.lessonId }))),
      ...(data.practiceQuestions || [])].filter(q => ids.has(q.id));
  }
  function next(data, bank, history, lessons, lessonId, allowDraft = true) {
    if (lessonId && !lessons.some(l => l.id === lessonId && !l.locked)) fail('Bài học chưa được mở.');
    const pending = history.find(a => !a.completed);
    if (pending) {
      const question = bank.find(q => q.id === pending.questionId);
      if (!question || question.reviewStatus === 'REJECTED' || (!allowDraft && question.reviewStatus !== 'APPROVED')) fail('Câu đang làm không còn được mở. Em nhờ thầy cô kiểm tra nhé.');
      return { question, reason: pending.reason, attemptNo: pending.attemptNo, hintsUsed: pending.hintsUsed };
    }
    const learned = lessons.filter(l => l.completed && !l.locked);
    const selected = lessonId ? [lessonId] : (learned.length ? learned : lessons.filter(l => !l.locked).slice(0, 1)).map(l => l.id);
    const skillIds = new Set(bank.filter(q => selected.includes(q.lessonId)).map(q => q.skillId));
    const primary = data.skills.filter(s => skillIds.has(s.id));
    function addPrerequisites(id) {
      for (const p of data.skills.find(s => s.id === id)?.prerequisites || []) {
        if (!skillIds.has(p)) { skillIds.add(p); addPrerequisites(p); }
      }
    }
    primary.forEach(s => addPrerequisites(s.id));
    const scoped = bank.filter(q => selected.includes(q.lessonId) || (!primary.some(s => s.id === q.skillId) && skillIds.has(q.skillId)));
    const result = adaptive.selectNext({ history, skills: [...primary, ...data.skills.filter(s => !primary.includes(s))],
      unlocked: [...skillIds], bank: scoped, allowDraft });
    return { question: result.question, reason: result.trace.reason, attemptNo: 0, hintsUsed: 0 };
  }
  function answer(question, entry, body) {
    if (!entry || entry.completed || entry.questionId !== body.questionId) fail('Em hãy mở câu tiếp theo trước.');
    if (!Number.isInteger(body.attemptNo) || body.attemptNo !== entry.attemptNo + 1 || body.attemptNo > 3) fail('Lần thử không hợp lệ.');
    if (!Number.isInteger(body.hintsUsed) || body.hintsUsed < entry.hintsUsed || body.hintsUsed > (question.hints || []).length) fail('Số gợi ý không hợp lệ.');
    const correct = grading.isCorrect(question, body.answer);
    const completed = correct || body.attemptNo === 3;
    const updated = { ...entry, attemptNo: body.attemptNo, hintsUsed: body.hintsUsed, isCorrect: correct, completed };
    return { updated, response: { correct, ...(completed ? { solution: question.solution || [], correctAnswer: question.correctAnswer } : {}) } };
  }
  const studentQuestion = q => q && ({ id: q.id, type: q.type, prompt: q.prompt, options: q.options || undefined,
    hints: q.hints || [], points: q.points || 1, skillId: q.skillId, cognitiveLevel: q.cognitiveLevel });
  return { pool, next, answer, studentQuestion };
});
