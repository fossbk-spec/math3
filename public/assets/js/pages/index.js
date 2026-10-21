document.addEventListener('mathapp:user-ready', async () => {
  const grid = document.getElementById('lesson-grid');
  const status = document.getElementById('lesson-status');
  try {
    const [{ lessons }, progress] = await Promise.all([
      window.MathAPI.get('/api/lessons'),
      window.MathAPI.get('/api/me/progress'),
    ]);
    const done = lessons.filter(lesson => lesson.completed).length;
    const percent = lessons.length ? Math.round(done / lessons.length * 100) : 0;
    document.getElementById('topic-progress').textContent = `Tiến độ chủ đề: ${done}/${lessons.length} bài học`;
    document.getElementById('topic-percent').textContent = `${percent}% hoàn thành`;
    document.getElementById('topic-progress-bar').style.width = `${percent}%`;
    document.getElementById('total-stars').textContent = Number(progress.totalStars || 0).toLocaleString('vi-VN');
    document.getElementById('best-score').textContent = String(Math.max(0, ...lessons.map(lesson => lesson.bestScore || 0)));
    grid.replaceChildren();
    for (const lesson of lessons) {
      const card = document.createElement('article');
      card.className = 'rounded-3xl bg-surface-container-lowest p-6 shadow-sm flex flex-col gap-3';
      card.id = `lesson-${lesson.number}`;
      const heading = document.createElement('h3');
      heading.className = 'font-headline-md text-headline-md text-primary';
      heading.textContent = `Bài ${lesson.number}: ${lesson.title}`;
      const description = document.createElement('p');
      description.className = 'font-body-md text-lg text-on-surface-variant';
      description.textContent = lesson.description || '';
      const page = document.createElement('p');
      page.className = 'font-body-md text-lg text-on-surface-variant';
      page.textContent = lesson.page ? `SGK tập một, tr. ${lesson.page}` : '';
      const state = document.createElement('p');
      state.className = 'font-headline-sm text-lg';
      state.textContent = lesson.completed ? `Đã hoàn thành · Điểm cao nhất ${lesson.bestScore}/100` : lesson.locked ? 'Chưa mở' : 'Sẵn sàng học';
      card.append(heading, description, page, state);
      for (const set of lesson.questionSets || []) {
        const link = document.createElement('a');
        link.className = 'min-h-12 px-4 py-3 rounded-2xl bg-primary text-on-primary font-headline-sm text-lg flex items-center justify-center text-center';
        link.textContent = set.title || 'Luyện tập';
        link.href = `${set.kind === 'exercise' ? 'exercise' : 'lesson'}.html?lesson=${encodeURIComponent(lesson.id)}&set=${encodeURIComponent(set.id)}`;
        if (lesson.locked) {
          link.removeAttribute('href');
          link.setAttribute('aria-disabled', 'true');
          link.classList.add('opacity-50');
        }
        card.append(link);
      }
      grid.append(card);
    }
    status.textContent = lessons.length ? '' : 'Chưa có bài học.';
  } catch (err) {
    status.textContent = 'Chưa tải được bài học. Em hãy tải lại trang.';
  }
});
