/* Hình minh hoạ bài có lời văn (nhóm đồ vật, chia đều), chuyển từ hoang-mai-math/src/components/lesson-illustration.tsx.
   Dựng SVG bằng DOM, không dùng innerHTML. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.MathIllustration = api;
})(typeof window !== 'undefined' ? window : null, function () {
  'use strict';
  const NS = 'http://www.w3.org/2000/svg';
  const LABELS = { flower: 'bông hoa', pencil: 'bút chì', orange: 'quả cam', candy: 'cái kẹo', chicken: 'con gà', book: 'quyển vở', chair: 'cái ghế', stick: 'que tính' };
  const KINDS = ['groups', 'share'];

  function valid(data) {
    return !!data && KINDS.includes(data.kind) && Object.hasOwn(LABELS, data.item)
      && Number.isInteger(data.groups) && data.groups > 0 && Number.isInteger(data.perGroup) && data.perGroup > 0
      && data.groups * data.perGroup <= 90;
  }
  function label(data) {
    const total = data.groups * data.perGroup;
    return data.kind === 'share' ? `${total} ${LABELS[data.item]} để chia đều cho ${data.groups} nhóm`
      : `${data.groups} nhóm, mỗi nhóm ${data.perGroup} ${LABELS[data.item]}`;
  }
  function node(doc, name, attrs) {
    const el = doc.createElementNS(NS, name);
    for (const [key, value] of Object.entries(attrs)) el.setAttribute(key, String(value));
    return el;
  }
  function symbol(doc, item, x, y) {
    const g = node(doc, 'g', { transform: `translate(${x} ${y})` });
    if (item === 'flower') {
      g.append(node(doc, 'circle', { r: 5, fill: '#f59e0b' }));
      for (const angle of [0, 72, 144, 216, 288]) {
        g.append(node(doc, 'circle', { cx: Math.cos(angle * Math.PI / 180) * 11, cy: Math.sin(angle * Math.PI / 180) * 11, r: 6, fill: '#f472b6' }));
      }
    } else if (item === 'pencil' || item === 'stick') {
      g.append(node(doc, 'rect', { x: -12, y: -3, width: 24, height: 6, rx: 2, fill: item === 'pencil' ? '#eab308' : '#92400e' }));
      if (item === 'pencil') g.append(node(doc, 'path', { d: 'M12 -3 L18 0 L12 3Z', fill: '#334155' }));
    } else {
      g.append(node(doc, 'circle', { r: 12, fill: item === 'orange' ? '#fb923c' : item === 'candy' ? '#a78bfa' : '#99f6e4', stroke: '#0f766e', 'stroke-width': 2 }));
      const letter = item === 'chicken' ? 'G' : item === 'book' ? 'V' : item === 'chair' ? 'Gh' : '';
      if (letter) { const t = node(doc, 'text', { 'text-anchor': 'middle', 'dominant-baseline': 'central', 'font-size': 12 }); t.textContent = letter; g.append(t); }
    }
    return g;
  }
  /** Trả về phần tử SVG, hoặc null nếu dữ liệu không hợp lệ hay quá nhiều đồ vật (> 90). */
  function render(data, doc = typeof document !== 'undefined' ? document : null) {
    if (!doc || !valid(data)) return null;
    const total = data.groups * data.perGroup;
    const columns = data.kind === 'share' ? 10 : data.perGroup;
    const rows = Math.ceil(total / columns);
    const width = columns * 38 + 20, height = rows * 38 + 20;
    const svg = node(doc, 'svg', { width, height, viewBox: `0 0 ${width} ${height}`, role: 'img', 'aria-label': label(data), class: 'math-illustration' });
    for (let i = 0; i < total; i++) svg.append(symbol(doc, data.item, 30 + (i % columns) * 38, 30 + Math.floor(i / columns) * 38));
    return svg;
  }
  return { render, label, valid };
});
