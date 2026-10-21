/**
 * Bản đồ điều hướng dùng chung (trước đây các link trong trang đều là href="#" chết).
 * Mọi nơi cần nối link menu đều tra cứu tại bảng này — sửa đường dẫn chỉ sửa 1 chỗ.
 */
window.MathApp = window.MathApp || {};
window.MathApp.routes = {
  home: 'index.html',
  curriculum: 'index.html#lesson-9',
  exercise: 'exercise.html',
  exam: 'exam.html',
  games: 'game.html',
  game2: 'game2.html',
  game3: 'game3.html',
  game4: 'game4.html',
  leaderboard: 'leaderboard.html',
  teacher: 'schedule.html',
  introduce: 'introduce.html',
  login: 'login.html',
};

/** Đoán đích đến của 1 link menu dựa trên data-path hoặc nội dung chữ của nó. */
window.MathApp.resolveRoute = function (el) {
  const routes = window.MathApp.routes;
  const path = (el.getAttribute('data-path') || '').toLowerCase();
  const text = (el.textContent || '').toLowerCase();
  const hay = `${path} ${text}`;
  if (hay.includes('giao-vien') || hay.includes('giáo viên') || hay.includes('thay-co') || hay.includes('thầy cô') || hay.includes('goc-thay')) return routes.teacher;
  if (hay.includes('bang-xep-hang') || hay.includes('xếp hạng') || hay.includes('vinh-danh') || hay.includes('vinh danh')) return routes.leaderboard;
  if (hay.includes('dua-xe') || hay.includes('đua xe')) return routes.game2;
  if (hay.includes('lat-the') || hay.includes('lật thẻ') || hay.includes('nối cặp') || hay.includes('trí nhớ')) return routes.game3;
  if (hay.includes('cau-ca') || hay.includes('câu cá')) return routes.game4;
  if (hay.includes('ban-bong') || hay.includes('bắn bóng') || hay.includes('bong-bay')) return routes.games;
  if (hay.includes('dau-truong') || hay.includes('đấu trường') || hay.includes('tro-choi') || hay.includes('trò chơi')) return routes.games;
  if (hay.includes('luyen-tap') || hay.includes('luyện tập')) return routes.exercise;
  if (hay.includes('kiem-tra') || hay.includes('kiểm tra')) return routes.exam;
  if (hay.includes('muc-luc') || hay.includes('mục lục') || hay.includes('sgk')) return routes.curriculum;
  if (hay.includes('trang-chu') || hay.includes('trang chủ')) return routes.home;
  return routes.home;
};
