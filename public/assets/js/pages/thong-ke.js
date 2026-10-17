(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root?.document) api.init(root);
})(typeof window !== 'undefined' ? window : null, function () {
  'use strict';
  const questions = [
    'Nội dung phù hợp với học sinh lớp 3.',
    'Các thao tác dễ hiểu và dễ sử dụng.',
    'Phản hồi sau khi làm bài giúp hướng dẫn học sinh.',
    'Trang thống kê giúp tôi theo dõi việc sử dụng.',
    'Tôi muốn tiếp tục dùng thử sản phẩm.',
  ];
  const num = value => Number.isFinite(Number(value)) ? Number(value) : 0;
  const calc = data => {
    const u = data.users || {}, g = data.usage || {}, l = data.learning || {};
    return {
      dailyPeak: Math.max(0, ...(u.daily || []).map(row => num(row.value))),
      weeklyPeak: Math.max(0, ...(u.weekly || []).map(row => num(row.value))),
      firstLastDelta: num(l.firstLast?.last) - num(l.firstLast?.first),
      avgSessionMin: Math.round(num(g.avgSessionSec?.value) / 60 * 10) / 10,
    };
  };
  const definitions = [
    ['Người dùng', [['Thiết bị theo ngày', 'users.daily', 'count'], ['Thiết bị theo tuần', 'users.weekly', 'count'], ['Quay lại ≥ 2 ngày', 'users.returning', 'count'], ['Theo vai', 'users.roles', 'count'], ['Theo lớp', 'users.classes', 'count'], ['Loại màn hình', 'users.screens', 'count']]],
    ['Quá trình sử dụng', [['Số phiên', 'usage.sessions', 'count'], ['Thời lượng trung bình', 'usage.avgSessionSec', 'seconds'], ['Trang dùng nhiều', 'usage.pages', 'count'], ['Phễu học tập', 'usage.funnel', 'count'], ['Dùng gợi ý', 'usage.hintRate', 'percent'], ['Lượt chơi game', 'usage.gamePlays', 'count']]],
    ['Học tập', [['Điểm trung bình theo bài', 'learning.byLesson', 'percent'], ['Điểm trung bình theo bộ', 'learning.bySet', 'percent'], ['Đạt Hoàn thành trở lên', 'learning.completionRate', 'percent'], ['Lượt 1 và lượt cuối cùng bộ', 'learning.firstLast', 'pair'], ['Câu hoặc dạng hay sai', 'learning.mistakes', 'count'], ['Thời gian trung bình mỗi câu', 'learning.avgQuestionSec', 'seconds'], ['Kiểm tra Chủ đề 2', 'learning.topic2Exam', 'percent'], ['AI Safe: chọn tốt nhất', 'learning.aiSafe', 'percent']]],
  ];
  const get = (data, path) => path.split('.').reduce((value, key) => value?.[key], data);
  const periodText = data => `${data.period?.from || '?'} đến ${data.period?.to || '?'}`;
  const format = (value, unit) => value == null ? 'Chưa có dữ liệu' : unit === 'percent' ? `${num(value)}%` : unit === 'seconds' ? `${num(value)} giây` : String(num(value));
  function row(document, label, item, unit, max) {
    const wrap = document.createElement('div'); wrap.className = 'row';
    const heading = document.createElement('div'); heading.className = 'text-lg';
    heading.textContent = `${label}: ${format(item?.value, unit)} · n=${num(item?.n)}`;
    wrap.append(heading);
    const bar = document.createElement('div'); bar.className = 'bar'; bar.setAttribute('role', 'img');
    bar.setAttribute('aria-label', heading.textContent);
    const fill = document.createElement('span'); fill.style.width = `${Math.max(0, Math.min(100, max ? num(item?.value) / max * 100 : 0))}%`;
    bar.append(fill); wrap.append(bar); return wrap;
  }
  function render(data, document) {
    const host = document.getElementById('stats-blocks'); host.replaceChildren();
    for (const [title, groups] of definitions) {
      const card = document.createElement('section'); card.className = 'card';
      const h2 = document.createElement('h2'); h2.textContent = title; card.append(h2);
      for (const [label, path, unit] of groups) {
        const h3 = document.createElement('h3'); h3.className = 'mt-5 mb-2'; h3.textContent = label; card.append(h3);
        const value = get(data, path);
        if (unit === 'pair') {
          card.append(row(document, 'Lượt 1', { value: value?.first, n: value?.n }, 'percent', 100));
          card.append(row(document, 'Lượt cuối', { value: value?.last, n: value?.n }, 'percent', 100));
          continue;
        }
        const items = Array.isArray(value) ? value : [value];
        const max = unit === 'percent' ? 100 : Math.max(1, ...items.map(item => num(item?.value)));
        for (const item of items) card.append(row(document, item?.label || label, item, unit, max));
      }
      if (title === 'Học tập') {
        const delta = calc(data).firstLastDelta;
        const summary = document.createElement('p'); summary.className = 'text-lg mt-5';
        summary.textContent = `Chênh lệch lượt 1 → lượt cuối: ${delta >= 0 ? '+' : ''}${delta} điểm phần trăm · n=${num(data.learning?.firstLast?.n)} cặp`;
        card.append(summary);
      }
      host.append(card);
    }
    const card = document.createElement('section'); card.className = 'card';
    const heading = document.createElement('h2'); heading.textContent = 'Theo từng em'; card.append(heading);
    const students = Array.isArray(data.students) ? data.students : [];
    if (!students.length) {
      const empty = document.createElement('p'); empty.className = 'text-lg mt-5'; empty.textContent = 'Chưa có dữ liệu theo từng em.'; card.append(empty);
    }
    for (const student of students) {
      const name = document.createElement('h3'); name.className = 'mt-5 mb-2';
      name.textContent = `${student.alias || 'Chưa chọn bí danh'} · Lớp ${student.classCode || 'chưa chọn'}`;
      card.append(name);
      card.append(row(document, 'Số lượt', student.attempts, 'count', Math.max(1, num(student.attempts?.value))));
      card.append(row(document, 'Điểm trung bình', student.avgScorePercent, 'percent', 100));
      card.append(row(document, 'Lượt 1', { value: student.firstLast?.first, n: student.firstLast?.n }, 'percent', 100));
      card.append(row(document, 'Lượt cuối', { value: student.firstLast?.last, n: student.firstLast?.n }, 'percent', 100));
    }
    host.append(card);
  }
  function csvRows(data) {
    const rows = [['Khối', 'Chỉ số', 'Giá trị', 'n', 'Từ ngày', 'Đến ngày']];
    for (const [title, groups] of definitions) for (const [label, path] of groups) {
      const value = get(data, path);
      const items = Array.isArray(value) ? value : path === 'learning.firstLast' ? [
        { label: 'Lượt 1', value: value?.first, n: value?.n }, { label: 'Lượt cuối', value: value?.last, n: value?.n }] : [value];
      for (const item of items) rows.push([title, item?.label || label, item?.value == null ? '' : num(item.value), num(item?.n), data.period?.from || '', data.period?.to || '']);
    }
    for (const student of data.students || []) {
      const label = `${student.alias || 'Chưa chọn bí danh'} · Lớp ${student.classCode || 'chưa chọn'}`;
      for (const [metric, item] of [['Số lượt', student.attempts], ['Điểm trung bình', student.avgScorePercent],
        ['Lượt 1', { value: student.firstLast?.first, n: student.firstLast?.n }], ['Lượt cuối', { value: student.firstLast?.last, n: student.firstLast?.n }]]) {
        rows.push(['Theo từng em', `${label} · ${metric}`, item?.value == null ? '' : num(item.value), num(item?.n), data.period?.from || '', data.period?.to || '']);
      }
    }
    return rows.map(row => row.map(value => `"${String(value).replace(/"/g, '""')}"`).join(',')).join('\r\n');
  }
  function init(root) {
    const document = root.document;
    let data;
    const feedbackKey = 'math3_teacher_feedback_v1';
    const readFeedback = () => { try { const value = JSON.parse(root.localStorage.getItem(feedbackKey) || '[]'); return Array.isArray(value) ? value : []; } catch { return []; } };
    const count = () => {
      const answers = readFeedback();
      document.getElementById('feedback-count').textContent = `Số phiếu trả lời trên máy này: n=${answers.length}.`;
    };
    document.addEventListener('mathapp:user-ready', async () => {
      const logout = document.getElementById('btn-logout');
      if (logout) logout.textContent = 'Đăng xuất';
      const source = document.getElementById('stats-source');
      const url = String(root.MATH_ANALYTICS_URL || '').trim().replace(/\/+$/, '');
      try {
        if (url) {
          const response = await root.fetch(`${url}/stats`);
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          data = await response.json(); source.textContent = `Dữ liệu tổng hợp · ${periodText(data)} · cập nhật ${data.generatedAt || 'chưa rõ'}`;
        } else {
          const response = await root.fetch('data/stats-sample.json');
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          data = await response.json(); source.textContent = `DỮ LIỆU MẪU · ${periodText(data)} · n là mẫu số minh họa`;
        }
        if (data.schemaVersion !== 1) throw new Error('Định dạng số liệu chưa được hỗ trợ.');
        render(data, document);
      } catch (error) { source.textContent = `Chưa tải được thống kê: ${error.message}`; }
    });
    const form = document.getElementById('teacher-feedback');
    questions.forEach((question, i) => {
      const label = document.createElement('label'); label.className = 'text-lg'; label.textContent = `${i + 1}. ${question} `;
      const select = document.createElement('select'); select.name = `q${i + 1}`; select.required = true;
      const blank = document.createElement('option'); blank.value = ''; blank.textContent = 'Chọn mức'; select.append(blank);
      for (let value = 1; value <= 5; value++) { const option = document.createElement('option'); option.value = String(value); option.textContent = String(value); select.append(option); }
      label.append(select); form.append(label);
    });
    const button = document.createElement('button'); button.type = 'submit'; button.textContent = 'Lưu phiếu trên máy này'; form.append(button);
    form.addEventListener('submit', event => {
      event.preventDefault();
      const answers = questions.map((_, i) => Number(form.elements[`q${i + 1}`].value));
      if (answers.some(v => v < 1 || v > 5)) return;
      try { root.localStorage.setItem(feedbackKey, JSON.stringify([...readFeedback(), { at: new Date().toISOString(), answers }]));
        form.reset(); count(); document.getElementById('feedback-status').textContent = 'Đã lưu phiếu cục bộ.';
      } catch { document.getElementById('feedback-status').textContent = 'Không lưu được phiếu trên máy này.'; }
    });
    document.getElementById('download-csv').addEventListener('click', () => {
      if (!data) return;
      const href = root.URL.createObjectURL(new root.Blob(['\ufeff', csvRows(data)], { type: 'text/csv;charset=utf-8' }));
      const link = document.createElement('a'); link.href = href; link.download = 'thong-ke-tong-hop.csv'; link.click();
      root.setTimeout(() => root.URL.revokeObjectURL(href), 1000);
    });
    count();
  }
  return { calc, csvRows, render, init };
});
