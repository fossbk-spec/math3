/* Chuyển từ hoang-mai-math/src/lib/adaptive/index.ts; không có A06/template. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.MathAdaptive = api;
})(typeof window !== 'undefined' ? window : null, function () {
  'use strict';
  const note = 'Đây là điều chỉnh mức hỗ trợ luyện tập, không phải đánh giá năng lực hay mức TT27.';
  function selectNext({ history, skills, unlocked, bank, allowDraft = true, choiceFirst = false }) {
    const eligible = bank.filter(q => unlocked.includes(q.skillId) && skills.some(s => s.id === q.skillId)
      && q.reviewStatus !== 'REJECTED' && (allowDraft || q.reviewStatus === 'APPROVED'));
    const available = skills.filter(s => unlocked.includes(s.id) && eligible.some(q => q.skillId === s.id));
    const latest = history.at(-1);
    let skill = available.find(s => s.id === latest?.skillId) ?? available[0];
    const rules = ['A01-CONTINUE'];
    let reason = latest && skill?.id === latest.skillId ? 'Tiếp tục kỹ năng em đang luyện.' : 'Bắt đầu một kỹ năng đã được giáo viên mở.';
    let sampleSize = 0, correct = 0;
    if (skill) for (const id of skill.prerequisites) {
      const samples = history.filter(a => a.skillId === id && a.completed);
      const successes = samples.filter(a => a.isCorrect).length;
      const prerequisite = available.find(s => s.id === id);
      if (prerequisite && samples.length >= 4 && successes / samples.length < .5) {
        skill = prerequisite; sampleSize = samples.length; correct = successes;
        rules.push('A02-PREREQUISITE'); reason = 'Mình ôn lại kỹ năng nền tảng để làm bài vững hơn nhé.'; break;
      }
    }
    const trace = { ruleId: rules.at(-1), skillId: skill?.id ?? null, cognitiveLevel: null,
      reason, data: { sampleSize, correct, recentCount: Math.min(history.length, 20), streak: 0 }, rules };
    const empty = () => {
      trace.ruleId = 'A07-EMPTY'; rules.push(trace.ruleId);
      trace.reason = 'Không còn câu phù hợp ở mức này. Em hãy nhờ thầy cô bổ sung câu nhé. ' + note;
      return { question: null, trace };
    };
    if (!skill) return empty();
    const levels = [...new Set(eligible.filter(q => q.skillId === skill.id).map(q => q.cognitiveLevel))].sort((a, b) => a - b);
    const completed = history.filter(a => a.skillId === skill.id && a.completed);
    if (!sampleSize) { trace.data.sampleSize = completed.length; trace.data.correct = completed.filter(a => a.isCorrect).length; }
    const last = completed.at(-1);
    trace.data.levels = levels;
    if (last) { trace.data.previousLevel = last.cognitiveLevel; trace.data.lastAttemptNo = last.attemptNo; trace.data.lastHintsUsed = last.hintsUsed; }
    let index = Math.max(0, levels.indexOf(last?.cognitiveLevel));
    const pair = completed.slice(-2);
    if (last && ((!last.isCorrect && last.attemptNo >= 3) || last.hintsUsed >= 3)) {
      index = Math.max(0, index - 1); rules.push('A04-SUPPORT');
      reason += ' Mình thử câu có thêm hỗ trợ nhé.';
    } else if (pair.length === 2 && pair.every(a => a.cognitiveLevel === levels[index] && a.isCorrect && a.attemptNo === 1 && a.hintsUsed === 0)) {
      index = Math.min(levels.length - 1, index + 1); trace.data.streak = 2; rules.push('A03-ADVANCE');
      reason += ' Em đã tự làm đúng hai câu liền, mình thử mức tiếp theo nhé.';
    }
    trace.cognitiveLevel = levels[index]; trace.reason = reason + ' ' + note;
    const recent = new Set(history.slice(-20).map(a => a.questionId));
    let candidates = eligible.filter(q => q.skillId === skill.id && q.cognitiveLevel === levels[index] && !recent.has(q.id));
    if (choiceFirst) candidates = candidates.sort((a, b) => Number(b.type === 'multiple-choice') - Number(a.type === 'multiple-choice'));
    rules.push('A05-NO-REPEAT'); trace.ruleId = rules.at(-1);
    return candidates.length ? { question: candidates[0], trace } : empty();
  }
  return { selectNext, note };
});
