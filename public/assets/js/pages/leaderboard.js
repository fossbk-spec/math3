document.addEventListener('mathapp:user-ready', async () => {
  const root = document.getElementById('leaderboard-content');
  try {
    const { leaderboard } = await window.MathAPI.get('/api/leaderboard');
    root.replaceChildren();
    const summary = document.createElement('p');
    summary.className = 'font-body-md text-lg text-on-surface-variant mb-5';
    summary.textContent = `${leaderboard.length} bạn tham gia · ${leaderboard.reduce((n, row) => n + row.total_stars, 0).toLocaleString('vi-VN')} sao`;
    root.append(summary);
    if (!leaderboard.length) {
      root.append('Chưa có kết quả.');
      return;
    }
    const wrap = document.createElement('div');
    wrap.className = 'overflow-x-auto rounded-3xl bg-surface-container-lowest shadow-sm';
    const table = document.createElement('table');
    table.className = 'w-full min-w-[580px] font-body-md text-lg';
    const head = document.createElement('thead');
    const headings = ['Hạng', 'Bạn', 'Lớp', 'Lượt làm bài', 'Điểm TB', 'Sao'];
    const headRow = document.createElement('tr');
    for (const label of headings) {
      const th = document.createElement('th');
      th.className = 'p-3 text-left bg-primary text-on-primary';
      th.textContent = label;
      headRow.append(th);
    }
    head.append(headRow);
    const body = document.createElement('tbody');
    for (const row of leaderboard) {
      const tr = document.createElement('tr');
      tr.className = row.isMe ? 'bg-secondary-fixed/50 font-bold' : 'border-b border-surface-container';
      const values = [row.rank, row.full_name, row.class_name || '—', row.attempts_count, row.avg_score == null ? '—' : `${row.avg_score}%`, row.total_stars];
      for (const value of values) {
        const td = document.createElement('td');
        td.className = 'p-3';
        td.textContent = String(value);
        tr.append(td);
      }
      body.append(tr);
    }
    table.append(head, body);
    wrap.append(table);
    root.append(wrap);
  } catch (err) {
    root.textContent = 'Chưa tải được bảng xếp hạng. Em hãy tải lại trang.';
  }
});
