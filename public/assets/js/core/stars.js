/* Quy tắc sao dùng chung cho server và bản tĩnh. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.MathStars = api;
})(typeof window !== 'undefined' ? window : null, function () {
  'use strict';
  const practice = (alreadyAwarded, correct, guided) => !alreadyAwarded && (correct || guided === 'DONE') ? 1 : 0;
  function submission(correctCount, scorePercent, oldBest, starReward, alreadyAwarded) {
    const target = Math.max(correctCount, Math.round(Math.max(0, scorePercent - oldBest) / 100 * starReward));
    return Math.max(0, target - alreadyAwarded);
  }
  return { practice, submission };
});
