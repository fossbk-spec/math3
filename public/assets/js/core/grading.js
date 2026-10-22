(function (root, factory) {
  const grading = factory();
  if (typeof module === 'object' && module.exports) module.exports = grading;
  if (root) root.MathGrading = grading;
})(typeof window !== 'undefined' ? window : null, function () {
  'use strict';
  const norm = value => String(value == null ? '' : value).trim().toLowerCase()
    .replace(/\s+/g, '').replace(/(\d)\.(?=\d{3}(\D|$))/g, '$1');
  const isCorrect = (q, given) => norm(given) !== '' && norm(given) === norm(q.correct_answer ?? q.correctAnswer);
  const defaultRules = { summary: [
    { min: .8, label: 'Hoàn thành rất tốt', message: 'Em làm bài rất cẩn thận. Cô khen em!' },
    { min: .5, label: 'Hoàn thành', message: 'Em đã làm xong bài. Em xem lại các câu sai trong bài chữa nhé.' },
    { min: 0, label: 'Cố gắng hơn', message: 'Em đã cố gắng làm hết bài. Em xem bài chữa rồi luyện thêm, lần sau sẽ tốt hơn nhé.' },
  ] };
  const feedbackFor = (percent, rules = defaultRules) => [...(rules.summary || defaultRules.summary)]
    .sort((a, b) => b.min - a.min).find(r => percent / 100 >= r.min) || defaultRules.summary.at(-1);
  const commentFor = (percent, rules) => feedbackFor(percent, rules).label;
  function gradeSubmission(questions, answers, { kind = 'exercise', lastAttempt = false, feedbackRules } = {}) {
    let earned = 0, max = 0, correctCount = 0;
    const detail = questions.map(q => {
      const points = 1;
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
    return { scorePercent, correctCount, totalCount: questions.length, comment: kind === 'exam' ? (scorePercent >= 90 ? 'Hoàn thành rất tốt' : scorePercent >= 50 ? 'Hoàn thành' : 'Cố gắng hơn') : commentFor(scorePercent, feedbackRules),
      ...(kind !== 'exam' ? { message: feedbackFor(scorePercent, feedbackRules).message } : {}), detail };
  }
  return { norm, isCorrect, commentFor, feedbackFor, gradeSubmission };
});
