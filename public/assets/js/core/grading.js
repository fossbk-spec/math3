(function (root, factory) {
  const grading = factory();
  if (typeof module === 'object' && module.exports) module.exports = grading;
  if (root) root.MathGrading = grading;
})(typeof window !== 'undefined' ? window : null, function () {
  'use strict';
  const norm = value => String(value == null ? '' : value).trim().toLowerCase()
    .replace(/\s+/g, '').replace(/(\d)\.(?=\d{3}(\D|$))/g, '$1');
  const isCorrect = (q, given) => norm(given) !== '' && norm(given) === norm(q.correct_answer ?? q.correctAnswer);
  const commentFor = (percent, thresholds = {}) => {
    const good = thresholds.good ?? 90;
    const pass = thresholds.pass ?? 50;
    return percent >= good ? 'Hoàn thành rất tốt' : percent >= pass ? 'Hoàn thành' : 'Cố gắng hơn';
  };
  function gradeSubmission(questions, answers, { kind = 'exercise', lastAttempt = false } = {}) {
    let earned = 0, max = 0, correctCount = 0;
    const detail = questions.map(q => {
      const points = Number(q.points) || 0;
      max += points;
      const ok = isCorrect(q, answers?.[q.id]);
      if (ok) { earned += points; correctCount++; }
      const item = { questionId: q.id };
      if (kind !== 'exam') {
        item.correct = ok;
        if (lastAttempt) {
          item.correctAnswer = q.correct_answer ?? q.correctAnswer;
          const solution = q.solution_json ?? q.solution;
          if (solution) item.solution = typeof solution === 'string' ? JSON.parse(solution) : solution;
        }
      }
      return item;
    });
    const scorePercent = max ? Math.round(earned / max * 100) : 0;
    return { scorePercent, correctCount, totalCount: questions.length, comment: commentFor(scorePercent), detail };
  }
  return { norm, isCorrect, commentFor, gradeSubmission };
});
