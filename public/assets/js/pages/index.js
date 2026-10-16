/* Logic riêng của trang index.html (tách từ HTML gốc, giữ nguyên hành vi) */
document.addEventListener('DOMContentLoaded', function () {
      const soundBtn = document.getElementById('soundToggle');
      let soundEnabled = true;

      if (soundBtn) {
        soundBtn.addEventListener('click', function () {
          soundEnabled = !soundEnabled;
          const icon = soundBtn.querySelector('.material-symbols-outlined');
          if (icon) {
            icon.textContent = soundEnabled ? 'volume_up' : 'volume_off';
          }
        });
      }

      // Add tactile audio/visual click response to chunky 3D buttons
      const buttons = document.querySelectorAll('button:not([disabled]), a[class*="shadow-"]');
      buttons.forEach(btn => {
        btn.addEventListener('click', function () {
          if (soundEnabled && window.AudioContext) {
            try {
              const ctx = new (window.AudioContext || window.webkitAudioContext)();
              const osc = ctx.createOscillator();
              const gain = ctx.createGain();
              osc.type = 'triangle';
              osc.frequency.setValueAtTime(520, ctx.currentTime);
              osc.frequency.exponentialRampToValueAtTime(780, ctx.currentTime + 0.08);
              gain.gain.setValueAtTime(0.12, ctx.currentTime);
              gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);
              osc.connect(gain);
              gain.connect(ctx.destination);
              osc.start();
              osc.stop(ctx.currentTime + 0.08);
            } catch (e) {
              // Graceful fallback if audio context is blocked
            }
          }
        });
      });
    });

/* --- NÂNG CẤP ĐỢT 1: Thẻ bài học render từ API (/api/lessons) ---
 * Dữ liệu bài (tiêu đề, mô tả, điểm cao nhất, khóa/mở) lấy từ server + DB.
 * Thêm bài mới trong DB là trang chủ tự hiện, không cần sửa HTML này. */
document.addEventListener('mathapp:user-ready', async () => {
  try {
    const { lessons } = await window.MathAPI.get('/api/lessons');
    const firstCard = document.querySelector('[data-lesson-card]');
    if (firstCard && !document.getElementById('ai-safe-link')) {
      const link = document.createElement('a');
      link.id = 'ai-safe-link';
      link.href = 'ai-safe.html';
      link.className = 'block mb-5 min-h-12 p-4 rounded-2xl bg-secondary-container text-on-secondary-container font-headline-sm text-lg';
      link.textContent = 'AI Safe & Smart: Bảo vệ thông tin của em';
      firstCard.parentElement.before(link);
    }
    lessons.forEach((lesson) => {
      let card = document.querySelector(`[data-lesson-card="${lesson.id}"]`);
      if (!card) {
        const grid = document.querySelector('[data-lesson-card]')?.parentElement;
        if (!grid) return;
        card = document.createElement('div');
        card.className = 'rounded-3xl bg-surface-container-lowest p-6 shadow-sm flex flex-col justify-between';
        card.dataset.lessonCard = lesson.id;
        const heading = document.createElement('h3');
        heading.className = 'font-headline-md text-headline-md';
        heading.dataset.lessonTitle = '';
        const description = document.createElement('p');
        description.className = 'font-body-md text-lg mt-2';
        description.dataset.lessonDesc = '';
        card.append(heading, description);
        grid.append(card);
      }
      const title = card.querySelector('[data-lesson-title]');
      const desc = card.querySelector('[data-lesson-desc]');
      if (title) title.textContent = `Bài ${lesson.number}: ${lesson.title}`;
      if (desc) desc.textContent = lesson.description;
      let page = card.querySelector('[data-lesson-page]');
      if (!page) {
        page = document.createElement('p');
        page.dataset.lessonPage = '';
        page.className = 'font-body-md text-lg text-on-surface-variant mt-2';
        (desc || title).after(page);
      }
      page.textContent = lesson.page ? `SGK tập một, tr. ${lesson.page}` : '';
      // Cập nhật dòng điểm trong thẻ (nếu có)
      card.querySelectorAll('span, p').forEach((el) => {
        if (/^(Điểm|Điểm hiện tại):/.test(el.textContent.trim())) {
          el.innerHTML = el.innerHTML.replace(/Điểm( hiện tại)?:\s*[^<]*/, `Điểm${el.textContent.includes('hiện') ? ' hiện tại' : ''}: ${lesson.bestScore}/100`);
        }
      });
      card.querySelectorAll('button, a').forEach(btn => {
        if (/Bắt đầu học|Tiếp tục|Ôn lại|Chưa thể vào|Xem bài làm/.test(btn.textContent)) btn.classList.add('hidden');
      });
      const list = document.createElement('div');
      list.className = 'mt-4 grid gap-2';
      for (const set of lesson.questionSets || []) {
        const link = document.createElement('a');
        link.className = 'min-h-12 px-4 py-3 rounded-2xl bg-primary text-on-primary font-headline-sm text-lg flex items-center justify-center text-center';
        link.textContent = set.title || ({ exam: 'Kiểm tra', 'co-ban': 'Cơ bản', 'nang-cao': 'Nâng cao', 'luyen-them': 'Luyện thêm' }[set.kind] || 'Luyện tập');
        link.href = set.id === 'phieu-bai-9-10' ? 'exercise.html' : `lesson.html?lesson=${encodeURIComponent(lesson.id)}&set=${encodeURIComponent(set.id)}`;
        if (lesson.locked) { link.removeAttribute('href'); link.setAttribute('aria-disabled', 'true'); link.classList.add('opacity-50'); }
        list.append(link);
      }
      card.append(list);
    });
    // Tiến độ chủ đề trên banner
    const done = lessons.filter((l) => l.completed).length;
    document.querySelectorAll('span, p, div').forEach((el) => {
      if (/^\d+\/7 bài học$/.test(el.textContent.trim())) el.textContent = `${done}/7 bài học`;
    });
  } catch (err) { console.warn('Không tải được danh sách bài học:', err.message); }
});
