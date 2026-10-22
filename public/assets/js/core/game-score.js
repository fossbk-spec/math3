/**
 * Lưu điểm mini-game dùng chung (Đợt 2).
 * Cách dùng trong từng game: MathGameScore.finish('game-bong-bay', score, startTime)
 * Server cộng sao theo phần điểm vượt kỷ lục cũ của chính học sinh đó.
 */
window.MathGameScore = {
  async finish(gameId, score, startedAt, { showResult = true } = {}) {
    const durationSec = startedAt ? Math.round((Date.now() - startedAt) / 1000) : 0;
    if (window.MATH_DEMO === true) window.MathAnalytics?.track('game_end', { gameId, score, durationSec });
    try {
      const r = await window.MathAPI.post('/api/game-scores', { gameId, score, durationSec });
      if (showResult) this.showResult(r);
      return r;
    } catch (err) {
      if (showResult) this.showResult({ score, error: err.message });
      return null;
    }
  },
  showResult(r) {
    document.getElementById('game-result-panel')?.remove();
    const panel = document.createElement('div');
    panel.id = 'game-result-panel';
    panel.setAttribute('role', 'status');
    panel.setAttribute('aria-live', 'polite');
    panel.className = 'fixed inset-x-0 bottom-0 z-[90] flex justify-center p-4 pointer-events-none';
    const safe = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
    panel.innerHTML = `
      <div class="pointer-events-auto w-full max-w-xl clay-card p-5 text-center">
        <div class="text-4xl mb-1 text-amber-500" aria-hidden="true">★</div>
        <h3 class="font-headline-md text-headline-md text-primary">Kết thúc trò chơi!</h3>
        <p class="font-body-md text-body-md text-on-surface-variant mt-1">
          ${r.error ? `Chưa lưu được điểm (${safe(r.error)}). Em kiểm tra đăng nhập nhé!`
            : `Điểm của em: <strong class="text-on-surface">${safe(r.score)}</strong> • Kỷ lục: <strong class="text-on-surface">${safe(r.bestScore)}</strong>` +
              (r.starsEarned ? `<br/><span class="text-amber-600" aria-hidden="true">★</span> Em nhận thêm <strong class="text-amber-700">+${safe(r.starsEarned)} Sao</strong> (tổng: ${safe(r.totalStars)} Sao)` : '<br/>Chưa phá kỷ lục cũ nên chưa cộng thêm sao — cố lên nhé!')}
        </p>
        <div class="flex flex-wrap justify-center gap-3 mt-4">
          <button onclick="location.reload()" class="clay-btn">Chơi lại</button>
          <a href="leaderboard.html" class="clay-btn clay-btn--sun">Xem Bảng Xếp Hạng</a>
          <a href="game.html" class="inline-flex min-h-12 items-center px-5 text-primary font-headline-sm">Đổi trò chơi</a>
        </div>
      </div>`;
    document.body.appendChild(panel);
  },
  /** Nút kết thúc thủ công (dự phòng khi học sinh muốn dừng sớm). */
  addFinishButton(gameId, getScore, startedAt) {
    const btn = document.createElement('button');
    btn.className = 'fixed bottom-4 right-4 z-[80] clay-btn';
    btn.innerHTML = '<span class="material-symbols-outlined align-middle text-[18px]">flag</span> Kết thúc & Lưu điểm';
    btn.addEventListener('click', () => { btn.disabled = true; window.MathGameScore.finish(gameId, getScore(), startedAt); });
    document.body.appendChild(btn);
  },
};
