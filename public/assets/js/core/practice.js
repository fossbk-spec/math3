/* Hợp đồng lượt luyện tập dùng chung, không đọc storage/DB/clock. */
(function (root, factory) {
  const api = typeof module === 'object' && module.exports
    ? factory(require('./adaptive'), require('./grading'), (() => { const context = {}; require('vm').runInNewContext(require('fs').readFileSync(require.resolve('../vendor/hm-coach.js'), 'utf8'), context); return context.HMCoach; })()) : factory(root.MathAdaptive, root.MathGrading, root.HMCoach);
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.MathPractice = api;
})(typeof window !== 'undefined' ? window : null, function (adaptive, grading, coachContext) {
  'use strict';
  const coach = coachContext?.HMCoach || coachContext;
  const fail = message => { const e = new Error(message); e.status = 409; throw e; };
  function pool(data) {
    const ids = new Set(data.practicePool);
    const all = [...Object.values(data.questionSets).filter(s => s.kind === 'exercise').flatMap(s => s.questions.map(q => ({ ...q, lessonId: s.lessonId }))), ...(data.practiceQuestions || [])];
    const byId = new Map(all.map(q => [q.id, q]));
    return data.practicePool.filter(id => ids.has(id) && byId.has(id)).map(id => byId.get(id));
  }
  function next(data, bank, history, lessons, lessonId, allowDraft = true) {
    if (lessonId && !lessons.some(l => l.id === lessonId && !l.locked)) fail('Bài học chưa được mở.');
    const pending = history.find(a => !a.completed || a.guided === 'PENDING');
    if (pending) {
      const question = bank.find(q => q.id === pending.questionId);
      if (!question || question.reviewStatus === 'REJECTED' || (!allowDraft && question.reviewStatus !== 'APPROVED')) fail('Câu đang làm không còn được mở. Em nhờ thầy cô kiểm tra nhé.');
      return { question, reason: pending.reason, attemptNo: pending.attemptNo, hintsUsed: pending.hintsUsed, guided: pending.guided, guidedTries: pending.guidedTries || 0,
        ...(pending.guided === 'PENDING' ? { coach: { step: 3, masked: coach.maskSolution(question.solution || [], String(question.correctAnswer), 'number').masked } } : {}) };
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
    return { question: result.question, reason: result.trace.rules.includes('A08-MISCONCEPTION') ? 'Mình luyện thêm dạng này nhé.' : result.trace.reason,
      trace: result.trace, attemptNo: 0, hintsUsed: 0 };
  }
  function answer(question, entry, body) {
    if (!entry || entry.completed || entry.questionId !== body.questionId) fail('Em hãy mở câu tiếp theo trước.');
    if (!Number.isInteger(body.attemptNo) || body.attemptNo !== entry.attemptNo + 1 || body.attemptNo > 3) fail('Lần thử không hợp lệ.');
    if (!Number.isInteger(body.hintsUsed) || body.hintsUsed < entry.hintsUsed || body.hintsUsed > (question.hints || []).length) fail('Số gợi ý không hợp lệ.');
    const correct = grading.isCorrect(question, body.answer);
    const answerType = question.type === 'input' ? 'number' : question.type === 'multiple-choice' ? 'choice' : question.type;
    const guided = !correct && body.attemptNo === 3 ? coach.maskSolution(question.solution || [], String(question.correctAnswer), answerType) : null;
    const read = !correct && body.attemptNo === 1 ? coach.readStep(question.prompt) : null;
    const guide = !correct && body.attemptNo === 2 ? coach.guideStep({ question: { ...question, answerType, hints: question.hints || [], verification: question.verification || '' }, answer: String(body.answer), tryNo: 1 }) : null;
    const errorTag = !correct && question.verification ? coach.guideStep({ question: { ...question, answerType, hints: question.hints || [], verification: question.verification }, answer: String(body.answer), tryNo: 1 }).errorTag : null;
    const completed = correct || body.attemptNo === 3;
    const updated = { ...entry, attemptNo: body.attemptNo, hintsUsed: body.hintsUsed, isCorrect: correct, completed,
      guided: guided?.ok ? 'PENDING' : null,
      steps: [...(entry.steps || []), ...(!correct ? [{ tryNo: body.attemptNo, answer: String(body.answer), errorTag }] : [])],
      errorTags: [...(entry.errorTags || []), ...(errorTag ? [errorTag] : [])] };
    const coachResponse = read ? { step: 1, ...read } : guide ? { step: 2, prompt: guide.prompt || question.hints?.[1] || 'Em thử tính lại từng bước nhé.', errorTag: guide.errorTag } : guided?.ok ? { step: 3, masked: guided.masked } : undefined;
    return { updated, response: { correct, ...(coachResponse && { coach: coachResponse }), ...(guided?.ok ? { guided: 'PENDING' } : {}),
      ...(completed && !guided?.ok ? { solution: question.solution || [], correctAnswer: question.correctAnswer } : {}) } };
  }
  function complete(question, entry, body, rules) {
    if (!entry || entry.questionId !== body.questionId || entry.guided !== 'PENDING') fail('Câu này chưa chờ em điền số cuối.');
    const correct = grading.isCorrect(question, body.answer);
    const guidedTries = (entry.guidedTries || 0) + 1;
    const guided = correct ? 'DONE' : guidedTries >= 2 ? 'REVEALED' : 'PENDING';
    return { updated: { ...entry, guidedTries, guided }, response: { correct, guided,
      ...(correct ? { message: rules?.done || 'Em đã tự hoàn thành lời giải!', correctAnswer: question.correctAnswer, solution: question.solution || [] } : {}),
      ...(guided === 'REVEALED' ? { correctAnswer: question.correctAnswer, solution: question.solution || [] } : {}) } };
  }
  const studentQuestion = q => q && ({ id: q.id, type: q.type, prompt: q.prompt, options: q.options || undefined,
    hints: q.hints || [], points: q.points || 1, skillId: q.skillId, cognitiveLevel: q.cognitiveLevel });
  return { pool, next, answer, complete, studentQuestion };
});
