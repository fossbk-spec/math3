/* M3: Bóng bay dùng bộ sinh Đố nhanh chung với Node và bản demo. */
(function balloonGame() {
  'use strict';
  const byId = id => document.getElementById(id);
  const form = byId('quick-quiz-settings');
  const stage = byId('quick-quiz-stage');
  const results = byId('quick-quiz-results');
  const balloons = [...document.querySelectorAll('[data-quiz-option]')];
  let startedAt, deadline, timer, transition;
  let settings, random, current, recent, mistakes;
  let score = 0, answered = 0, active = false, locked = true;

  function lock(value) {
    locked = value;
    balloons.forEach(btn => { btn.disabled = value; });
  }

  function nextRound() {
    if (!active) return;
    if (Date.now() >= deadline) return finish();
    current = window.MathQuickQuiz.nextGameQuestion(settings, recent, random);
    recent.push(current.key);
    recent = recent.slice(-10);
    byId('quiz-question').textContent = current.stem;
    byId('quiz-round').textContent = `Câu ${answered + 1}`;
    balloons.forEach((btn, i) => {
      btn.dataset.value = String(current.options[i]);
      btn.querySelector('[data-quiz-value]').textContent = String(current.options[i]);
    });
    byId('game-toast').hidden = true;
    lock(false);
    balloons[0].focus();
  }

  function tick() {
    const left = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
    byId('countdown-val').textContent = String(left);
    if (!left) finish();
  }

  async function finish() {
    if (!active) return;
    active = false;
    lock(true);
    clearInterval(timer);
    clearTimeout(transition);
    stage.hidden = true;
    results.hidden = false;
    byId('quiz-result-summary').textContent = `Em được ${score} điểm qua ${answered} câu đã trả lời.`;
    const list = byId('quiz-mistakes');
    list.replaceChildren();
    mistakes.forEach(({ answer, fact }) => {
      const item = document.createElement('li');
      item.textContent = `Em chọn ${answer}. Phép tính đúng: ${fact}.`;
      list.appendChild(item);
    });
    if (!mistakes.length) {
      const item = document.createElement('li');
      item.textContent = answered ? 'Em không có câu trả lời sai trong ván này!' : 'Em chưa trả lời câu nào. Hãy thử một ván mới nhé!';
      list.appendChild(item);
    }
    byId('quiz-result-title').focus();
    byId('quiz-save-status').textContent = 'Đang lưu điểm…';
    byId('quiz-replay').disabled = true;
    const result = await window.MathGameScore.finish('game-bong-bay', score, startedAt, { showResult: false });
    byId('quiz-save-status').textContent = result ? 'Đã lưu điểm ván chơi của em.' : 'Chưa lưu được điểm. Em kiểm tra đăng nhập hoặc kết nối nhé!';
    if (result) byId('game-best').textContent = String(result.bestScore);
    byId('quiz-replay').disabled = false;
  }

  form.addEventListener('submit', event => {
    event.preventDefault();
    if (active) return;
    settings = {
      tables: byId('quiz-tables').value === 'mixed' ? 'mixed' : Number(byId('quiz-tables').value),
      ops: byId('quiz-ops').value,
      durationSec: Number(byId('quiz-duration').value),
    };
    startedAt = Date.now();
    deadline = startedAt + settings.durationSec * 1000;
    random = window.MathQuickQuiz.seededRandom(startedAt);
    recent = []; mistakes = []; score = 0; answered = 0; active = true;
    byId('score-val').textContent = '0';
    byId('game-current').textContent = '0';
    form.hidden = true;
    results.hidden = true;
    stage.hidden = false;
    nextRound();
    tick();
    timer = setInterval(tick, 250);
  });

  balloons.forEach(btn => btn.addEventListener('click', () => {
    if (!active || locked) return;
    if (Date.now() >= deadline) return finish();
    lock(true);
    answered++;
    const answer = Number(btn.dataset.value);
    const correct = answer === current.answer;
    if (correct) score += 30;
    else mistakes.push({ answer, fact: current.fact });
    byId('score-val').textContent = String(score);
    byId('game-current').textContent = String(score);
    byId('quiz-feedback').textContent = correct ? 'Chính xác! +30 điểm.' : 'Mình sẽ cùng xem lại phép tính này sau ván nhé!';
    byId('game-toast').hidden = false;
    transition = setTimeout(nextRound, 650);
  }));
  byId('quiz-finish').addEventListener('click', finish);
  byId('quiz-replay').addEventListener('click', () => {
    results.hidden = true;
    form.hidden = false;
    byId('quiz-tables').focus();
  });
  document.addEventListener('mathapp:user-ready', async () => {
    try {
      const { games } = await window.MathAPI.get('/api/me/game-scores');
      byId('game-best').textContent = String(games['game-bong-bay']?.best || 0);
    } catch { /* Vẫn chơi được khi chưa tải được kỷ lục cá nhân. */ }
  });
})();
