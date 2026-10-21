// Chuyển từ hoang-mai-math/src/lib/game/questions.ts; giữ nguyên thứ tự gọi PRNG.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.MathQuickQuiz = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
// PRNG cục bộ: cùng seed và cấu hình sinh cùng dãy câu.
function seededRandom(seed) {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function shuffle(items, random) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function nextGameQuestion(settings, recent, random) {
  const tables = settings.tables === 'mixed' ? [6, 7, 8, 9] : [settings.tables];
  const ops = settings.ops === 'both' ? ['multiply', 'divide'] : [settings.ops];
  const candidates = tables.flatMap(a => Array.from({ length: 10 }, (_, i) => i + 1).flatMap(b => ops.map(op => ({ a, b, op, key: `${op}:${a}:${b}` }))));
  // Một bảng + một phép chỉ có 10 phép: câu thứ 11 không thể tránh lặp trong 10 câu.
  // Khi hết lựa chọn, dùng phép lâu nhất để không lặp sớm hơn mức bắt buộc.
  const fresh = candidates.filter(c => !recent.slice(-10).includes(c.key));
  const available = fresh.length ? fresh : candidates.filter(c => c.key === recent[recent.length - 10]);
  const picked = available[Math.floor(random() * available.length)];
  const { a, b, op, key } = picked;
  const answer = op === 'multiply' ? a * b : b;
  const stem = op === 'multiply' ? `${a} × ${b} = ?` : `${a * b} : ${a} = ?`;
  const fact = op === 'multiply' ? `${a} × ${b} = ${a * b}` : `${a * b} : ${a} = ${b}`;
  const nearby = op === 'multiply'
    ? [a * (b - 1), a * (b + 1), answer - 1, answer + 1, answer - a * 2, answer + a * 2]
    : [b - 1, b + 1, b - 2, b + 2, a, a + 1];
  const wrong = [...new Set(nearby)].filter(n => n >= 0 && n !== answer);
  for (let offset = 1; wrong.length < 3; offset++) {
    for (const n of [answer - offset, answer + offset]) if (n >= 0 && n !== answer && !wrong.includes(n)) wrong.push(n);
  }
  return { key, stem, answer, fact, options: shuffle([answer, ...shuffle(wrong, random).slice(0, 3)], random) };
}

return { seededRandom, nextGameQuestion };
});
