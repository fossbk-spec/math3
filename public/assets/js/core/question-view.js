/* Renderer chung cho phiếu bài tập và trang bộ bài. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.MathQuestionView = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const escape = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  // Mặc định giữ nhãn cho exercise/lesson; practice có tiến độ riêng bên ngoài.
  function render(container, questions, answers, updateProgress, { hideLabel = false } = {}) {
    container.innerHTML = questions.map((q, idx) => {
      let body = '';
      if (q.type === 'multiple-choice' && q.options) {
        body = `<div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-3">${q.options.map((op, i) => `
          <button type="button" data-q="${escape(q.id)}" data-val="${['A', 'B', 'C', 'D'][i]}" class="opt-btn text-left px-4 py-3 rounded-2xl bg-surface-container-low hover:bg-secondary-container/60 font-body-md transition-all">
            <strong class="text-primary">${['A', 'B', 'C', 'D'][i]}.</strong> ${escape(op)}</button>`).join('')}</div>`;
      } else if (q.type === 'paint') {
        body = `<div class="flex gap-2.5 mt-3">
          <button type="button" data-q="${escape(q.id)}" data-val="green" class="opt-btn px-5 py-3 rounded-2xl bg-secondary-fixed text-on-secondary-fixed font-headline-sm">Tô Xanh lá</button>
          <button type="button" data-q="${escape(q.id)}" data-val="yellow" class="opt-btn px-5 py-3 rounded-2xl bg-tertiary-fixed text-on-tertiary-fixed font-headline-sm">Tô Vàng</button></div>
          <p class="mt-2 font-label-sm text-label-sm text-on-surface-variant">Chọn màu đúng theo kết quả của phép tính.</p>`;
      } else if (q.type === 'compare') {
        body = `<div class="flex gap-2.5 mt-3">${['>', '<', '='].map(s => `
          <button type="button" data-q="${escape(q.id)}" data-val="${escape(s)}" class="opt-btn w-14 h-14 rounded-2xl bg-surface-container-low font-headline-lg text-primary">${escape(s)}</button>`).join('')}</div>`;
      } else {
        body = `<input data-q="${escape(q.id)}" aria-label="${hideLabel ? 'Đáp số' : `Đáp số câu ${idx + 1}`}" type="text" inputmode="numeric" placeholder="Điền đáp số..." class="mt-3 w-56 h-14 text-center rounded-2xl bg-surface-container-low text-primary font-headline-lg focus:outline-none focus:ring-4 focus:ring-primary-fixed"/>`;
      }
      return `<article class="rounded-3xl bg-surface-container-lowest shadow-[0_8px_24px_rgba(0,97,39,0.06)] p-6">
        ${hideLabel ? '' : `<p class="font-label-sm text-label-sm text-tertiary font-bold">Câu ${idx + 1} • ${q.points || 1} điểm${q.category ? ' • ' + escape(q.category) : ''}</p>`}
        <h3 class="font-headline-md text-headline-md mt-1">${escape(q.prompt)}</h3>${body}</article>`;
    }).join('');

    container.querySelectorAll('article').forEach((article, index) => {
      const hints = questions[index].hints;
      if (!Array.isArray(hints) || !hints.length) return;
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'mt-4 min-h-12 px-5 rounded-2xl bg-secondary-container text-on-secondary-container font-headline-sm text-lg';
      button.textContent = 'Gợi ý';
      const list = document.createElement('ol');
      list.className = 'mt-3 space-y-2 font-body-md text-lg list-decimal pl-7';
      let shown = 0;
      button.addEventListener('click', () => {
        const item = document.createElement('li');
        item.textContent = hints[shown++];
        list.append(item);
        window.MathAnalytics?.track('hint_used', { questionId: questions[index].id, hintNo: shown });
        if (shown === hints.length) button.disabled = true;
      });
      article.append(button, list);
    });

    container.querySelectorAll('.opt-btn').forEach(btn => btn.addEventListener('click', () => {
      answers[btn.dataset.q] = btn.dataset.val;
      btn.closest('article').querySelectorAll('.opt-btn').forEach(b => b.setAttribute('aria-pressed', String(b === btn)));
      btn.closest('article').querySelectorAll('.opt-btn').forEach(b =>
        b.classList.toggle('ring-4', b === btn));
      if (btn.dataset.val) btn.closest('article').querySelectorAll('.opt-btn').forEach(b =>
        b.classList.toggle('ring-primary-fixed-dim', b === btn));
      updateProgress();
    }));
    container.querySelectorAll('input[data-q]').forEach(inp => inp.addEventListener('input', () => { answers[inp.dataset.q] = inp.value.trim(); updateProgress(); }));
    updateProgress();
  }

  // Chỉ định dạng đáp án API đã trả; không suy ra đáp án khi đang làm bài.
  function formatAnswer(question, answer) {
    const value = String(answer ?? '').trim();
    const index = ['A', 'B', 'C', 'D'].indexOf(value.toUpperCase());
    if (question?.type === 'multiple-choice' && index >= 0 && question.options?.[index] != null) {
      return `${value.toUpperCase()}. ${question.options[index]}`;
    }
    return value;
  }
  return { render, formatAnswer };
});
