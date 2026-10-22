/* Bộ chọn câu H1, dùng chung ở server và bản demo tĩnh. */
(function (root, factory) {
  const coach = typeof module === 'object' && module.exports
    ? (() => { const context = {}; require('vm').runInNewContext(require('fs').readFileSync(require.resolve('../vendor/hm-coach.js'), 'utf8'), context); return context.HMCoach; })()
    : root.HMCoach;
  const api = factory(coach);
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.MathAdaptive = api;
})(typeof window !== 'undefined' ? window : null, function (coach) {
  'use strict';
  const note = 'Đây là điều chỉnh mức hỗ trợ luyện tập, không phải đánh giá năng lực hay mức TT27.';
  function selectNext(input) {
    const bank = input.bank.filter(q => q.reviewStatus !== 'REJECTED').map(q => ({ ...q,
      answerType: q.type === 'input' ? 'number' : q.type === 'multiple-choice' ? 'choice' : q.type }));
    return coach.selectNextCore({ ...input, bank });
  }
  return { selectNext, note, paceBySkill: coach.paceBySkill };
});
