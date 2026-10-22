(function () {
  const choices = { say: 'Em sẽ nói', no: 'Em không chia sẻ', ask: 'Em hỏi người lớn' };
  const root = document.getElementById('ai-safe-situations');

  document.addEventListener('mathapp:user-ready', async () => {
    try {
      const { aiSafe } = await window.MathAPI.get('/api/ai-safe');
      document.getElementById('ai-safe-title').textContent = aiSafe.title;
      root.replaceChildren();
      aiSafe.situations.forEach((situation, index) => {
        const card = document.createElement('section');
        card.className = 'clay-card p-6';
        const title = document.createElement('h2');
        title.className = 'font-headline-md text-2xl';
        title.textContent = `Tình huống ${index + 1}: ${situation.prompt}`;
        const buttons = document.createElement('div');
        buttons.className = 'mt-4 flex flex-wrap gap-3';
        const result = document.createElement('p');
        result.className = 'mt-4 text-lg';
        result.setAttribute('aria-live', 'polite');
        Object.keys(situation.feedback).forEach(key => {
          const button = document.createElement('button');
          button.type = 'button';
          button.className = 'clay-btn';
          button.textContent = choices[key] || key;
          button.addEventListener('click', () => {
            if (window.MATH_DEMO === true) window.MathAnalytics?.track('ai_safe_choice', { situationId: situation.id || String(index + 1), choice: key, best: key === situation.best });
            buttons.querySelectorAll('button').forEach(item => {
              item.setAttribute('aria-pressed', String(item === button));
              if (item.dataset.choice === situation.best) item.textContent = `${choices[situation.best] || situation.best} ✓ Lựa chọn tốt nhất`;
            });
            result.textContent = situation.feedback[key];
          });
          button.dataset.choice = key;
          button.setAttribute('aria-pressed', 'false');
          buttons.append(button);
        });
        card.append(title, buttons, result);
        root.append(card);
      });
    } catch (error) {
      root.textContent = `Chưa tải được tình huống: ${error.message}`;
    }
  });
})();
