/* Trang làm bài chung (Đợt 2): dùng cho MỌI bộ câu hỏi giáo viên tạo trên web.
 * Mở bằng: lesson.html?lesson=bai-16&set=bo-de-moi — render câu hỏi từ API,
 * nộp lên server chấm giống phiếu luyện tập/đề kiểm tra chuyên biệt. */
(function lessonPlayer() {
  const params = new URLSearchParams(location.search);
  const lessonId = params.get('lesson');
  const setId = params.get('set');
  const startedAt = Date.now();
  const answers = {};
  let questions = [];

  const container = document.getElementById('questions-container');
  const progressBar = document.getElementById('lesson-progress');
  const progressText = document.getElementById('lesson-progress-text');

  function updateProgress() {
    const done = questions.filter(q => answers[q.id] != null && String(answers[q.id]).trim() !== '').length;
    if (progressBar) progressBar.style.width = questions.length ? `${Math.round(done / questions.length * 100)}%` : '0%';
    if (progressText) progressText.textContent = `Đã trả lời ${done}/${questions.length} câu`;
  }

  function render() { window.MathQuestionView.render(container, questions, answers, updateProgress); }

  async function init() {
    if (!setId) { container.innerHTML = '<p class="font-body-md">Thiếu mã bộ bài. Em quay lại Mục Lục chọn bài nhé!</p>'; return; }
    try {
      if (lessonId) {
        const { lessons } = await window.MathAPI.get('/api/lessons');
        const lesson = lessons.find(l => l.id === lessonId);
        if (lesson) {
          document.getElementById('lesson-title').textContent = `Bài ${lesson.number}: ${lesson.title}`;
          document.getElementById('lesson-desc').textContent = lesson.description || '';
        }
      }
      const data = await window.MathAPI.get(`/api/question-sets/${encodeURIComponent(setId)}/questions`);
      questions = data.questions;
      window.MathAnalytics?.track('lesson_open', { lessonId, setId });
      document.getElementById('set-kind').textContent = `Bộ bài: ${setId} • ${questions.length} câu`;
      render();
    } catch (err) { container.textContent = `Chưa tải được bài: ${err.message}`; }
  }

  document.getElementById('btn-submit-lesson').addEventListener('click', async () => {
    const missing = questions.length - Object.keys(answers).filter(k => String(answers[k]).trim() !== '').length;
    if (missing > 0 && !confirm(`Em còn ${missing} câu chưa trả lời. Vẫn nộp bài nhé?`)) return;
    try {
      const r = await window.MathAPI.post('/api/submissions', { setId, answers, durationSec: Math.round((Date.now() - startedAt) / 1000) });
      const box = document.getElementById('lesson-result');
      box.classList.remove('hidden');
      box.replaceChildren();
      const heading = document.createElement('h3');
      heading.className = 'font-headline-md text-headline-md';
      heading.textContent = `${r.scorePercent >= 80 ? '🎉' : r.scorePercent >= 50 ? '💪' : '🌱'} Em đạt ${r.scorePercent}% — ${r.comment}`;
      box.append(heading);
      const summary = document.createElement('p');
      summary.className = 'font-body-md mt-2';
      summary.textContent = r.maxAttempts === 1 ? 'Bài kiểm tra đã được ghi nhận.' : `Đúng ${r.correctCount}/${r.totalCount} câu. Lượt ${r.attemptNo}/${r.maxAttempts}; còn ${r.attemptsLeft} lượt. ${r.starsEarned ? `Nhận thêm ${r.starsEarned} sao.` : ''}`;
      box.append(summary);
      if (r.message) {
        const feedback = document.createElement('p'); feedback.textContent = r.message; box.append(feedback);
      }
      if (r.maxAttempts !== 1) {
        const list = document.createElement('div');
        list.className = 'mt-3 space-y-2 font-body-md';
        r.detail.forEach((item, i) => {
          const line = document.createElement('p');
          line.textContent = `Câu ${i + 1}: ${item.correct ? '✓ Đúng' : '✗ Chưa đúng'}`;
          if (item.correctAnswer !== undefined) {
            line.textContent += ` — Đáp án: ${item.correctAnswer}`;
            if (item.solution) line.textContent += ` — Bài chữa: ${Array.isArray(item.solution) ? item.solution.join(' ') : typeof item.solution === 'object' ? JSON.stringify(item.solution) : item.solution}`;
          }
          list.append(line);
        });
        box.append(list);
      }
      if (r.attemptsLeft === 0) document.getElementById('btn-submit-lesson').disabled = true;
      box.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'center' });
    } catch (err) { alert(`Chưa nộp được bài: ${err.message}`); }
  });

  document.addEventListener('mathapp:user-ready', init);
})();
