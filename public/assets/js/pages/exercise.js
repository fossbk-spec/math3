/* Phiếu bài tập từ API, dùng renderer chung với lesson.js. */
(function exercisePlayer() {
  'use strict';
  const startedAt = Date.now();
  const params = new URLSearchParams(location.search);
  const container = document.getElementById('questions-container');
  const submit = document.getElementById('btn-submit-exercise');
  const reset = document.getElementById('btn-reset-exercise');
  const modal = document.getElementById('feedback-modal');
  let setId;
  let questions = [];
  let answers = {};
  let exhausted = false;
  let busy = false;
  function updateProgress() {
    const done = questions.filter(q => answers[q.id] != null && String(answers[q.id]).trim() !== '').length;
    document.getElementById('exercise-progress-text').textContent = `Đã trả lời ${done}/${questions.length} câu`;
    document.getElementById('exercise-progress').style.width = `${questions.length ? Math.round(done / questions.length * 100) : 0}%`;
  }
  const render = () => window.MathQuestionView.render(container, questions, answers, updateProgress);
  const elapsed = () => Math.round((Date.now() - startedAt) / 1000);
  setInterval(() => {
    const seconds = elapsed();
    document.getElementById('display-timer').textContent = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
  }, 1000);
  async function init() {
    try {
      const { lessons } = await window.MathAPI.get('/api/lessons');
      const requestedLesson = params.get('lesson');
      setId = params.get('set');
      const candidates = lessons.filter(l => !l.locked && l.questionSets.some(s => s.kind === 'exercise' && s.id === `${l.id}-co-ban`));
      const lesson = requestedLesson ? lessons.find(l => l.id === requestedLesson)
        : setId ? lessons.find(l => l.questionSets.some(s => s.id === setId))
          : candidates.find(l => !l.completed) || candidates[0];
      if (!lesson || lesson.locked) throw new Error('Bài học chưa sẵn sàng. Em quay lại Mục Lục chọn bài nhé!');
      const set = lesson.questionSets.find(s => s.id === (setId || `${lesson.id}-co-ban`) && s.kind === 'exercise');
      if (!set) throw new Error('Chưa có phiếu bài tập này. Em quay lại Mục Lục chọn bộ bài nhé!');
      setId = set.id;
      document.getElementById('exercise-lesson').textContent = `Bài ${lesson.number}: ${lesson.title}`;
      document.getElementById('exercise-title').textContent = set.title;
      questions = (await window.MathAPI.get(`/api/question-sets/${encodeURIComponent(setId)}/questions`)).questions;
      if (!questions.length) throw new Error('Bộ bài chưa có câu hỏi.');
      render();
      submit.disabled = reset.disabled = false;
      window.MathAnalytics?.track('lesson_open', { lessonId: lesson.id, setId });
    } catch (err) { container.textContent = `Chưa tải được bài: ${err.message}`; }
    finally { container.setAttribute('aria-busy', 'false'); }
  }
  reset.addEventListener('click', () => { answers = {}; modal.classList.add('hidden'); render(); });
  document.getElementById('btn-close-result').addEventListener('click', () => modal.classList.add('hidden'));
  submit.addEventListener('click', async () => {
    if (busy || exhausted || !questions.length) return;
    const missing = questions.filter(q => !String(answers[q.id] ?? '').trim()).length;
    if (missing && !confirm(`Em còn ${missing} câu chưa trả lời. Vẫn nộp bài nhé?`)) return;
    busy = true;
    submit.disabled = reset.disabled = true;
    submit.textContent = 'Đang kiểm tra…';
    try {
      const result = await window.MathAPI.post('/api/submissions', { setId, answers: { ...answers }, durationSec: elapsed() });
      exhausted = result.attemptsLeft === 0;
      modal.querySelector('h4').textContent = `${result.scorePercent >= 80 ? '✓' : '☆'} Em đạt ${result.scorePercent}% — ${result.comment}`;
      if (result.message) modal.querySelector('h4').textContent += ` — ${result.message}`;
      if (result.totalStars != null) document.dispatchEvent(new CustomEvent('math:stars', { detail: { totalStars: result.totalStars } }));
      modal.querySelector('p').textContent = `Đúng ${result.correctCount}/${result.totalCount} câu. Còn ${result.attemptsLeft} lượt. Nhận thêm ${result.starsEarned || 0} sao. Kết quả đã được lưu.`;
      modal.querySelector('[data-corrections]')?.remove();
      const corrections = document.createElement('div');
      corrections.dataset.corrections = '';
      (result.detail || []).forEach((item, index) => {
        if (item.correctAnswer === undefined) return;
        const line = document.createElement('p');
        const question = questions.find(q => q.id === item.questionId);
        line.textContent = `Câu ${index + 1}: ${item.correct ? '✓ Đúng' : '✗ Chưa đúng'} — Đáp án: ${window.MathQuestionView.formatAnswer(question, item.correctAnswer)}`;
        if (item.solution) line.textContent += ` — Bài chữa: ${Array.isArray(item.solution) ? item.solution.join(' ') : JSON.stringify(item.solution)}`;
        corrections.append(line);
      });
      modal.append(corrections);
      modal.classList.remove('hidden');
    } catch (err) {
      if (err.status === 409) exhausted = true;
      alert(`Chưa nộp được bài: ${err.message}`);
    } finally {
      busy = false;
      submit.disabled = exhausted;
      reset.disabled = false;
      submit.textContent = exhausted ? 'Đã hết lượt làm bài' : 'Kiểm tra đáp án & nhận sao';
    }
  });
  document.addEventListener('mathapp:user-ready', init, { once: true });
})();
