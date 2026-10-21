/**
 * Tiện ích cho thanh header có sẵn trong từng trang (giữ nguyên thiết kế gốc):
 * - Cập nhật tên/lớp/số sao của người đang đăng nhập vào header.
 * - Gắn nút Đăng xuất vào header.
 * (Bản cũ phụ thuộc vào window.MathApp.store không hề tồn tại nên không chạy được;
 *  bản này dùng trực tiếp dữ liệu thật từ /api/auth/me.)
 */
window.MathApp = window.MathApp || {};
window.MathApp.components = window.MathApp.components || {};

window.MathApp.components.Navbar = {
  updateUser(user) {
    if (!user) return;
    if (user.role === 'student') {
      const nav = document.querySelector('header nav');
      if (nav && !nav.querySelector('[href="practice.html"]')) {
        const link = document.createElement('a'); link.href = 'practice.html';
        link.textContent = 'Luyện tập thích ứng';
        link.style.cssText = 'display:inline-flex;align-items:center;min-height:48px;padding:8px 16px;font-size:18px';
        nav.append(link);
      }
    }
    if (user.role === 'teacher') {
      const nav = document.querySelector('header nav');
      if (nav && !nav.querySelector('[href="thong-ke.html"]')) {
        const stats = document.createElement('a'); stats.href = 'thong-ke.html';
        stats.className = 'font-label-md text-label-md px-4 py-2 rounded-full text-on-surface-variant hover:text-on-surface hover:bg-surface-container';
        stats.textContent = 'Thống kê'; nav.append(stats);
      }
    }
    // Cập nhật bí danh và lớp trong header theo phiên đăng nhập.
    document.querySelectorAll('header span, header p').forEach((el) => {
      if (el.textContent.trim() === 'Bạn Cú') el.textContent = user.fullName;
      if (el.textContent.trim() === 'Lớp 3A' || el.textContent.trim().startsWith('Lớp 3A •')) el.textContent = `Lớp ${user.className || '3A'}`;
    });
    const header = document.querySelector('header');
    if (!header || header.querySelector('#btn-logout')) return;
    const btn = document.createElement('button');
    btn.id = 'btn-logout';
    btn.type = 'button';
    btn.title = `Đăng xuất (${user.fullName})`;
    btn.setAttribute('aria-label', `Đăng xuất (${user.fullName})`);
    btn.className = 'ml-1 min-w-12 min-h-12 shrink-0 rounded-full bg-surface-container hover:bg-error-container text-on-surface-variant hover:text-on-error-container flex items-center justify-center transition-colors';
    btn.innerHTML = '<span class="material-symbols-outlined text-[20px]">logout</span>';
    btn.addEventListener('click', async () => {
      await window.MathAPI.logout();
      location.href = 'login.html';
    });
    (header.querySelector('.flex.items-center.gap-space-sm:last-of-type') || header.firstElementChild || header).appendChild(btn);
  },
};

document.addEventListener('DOMContentLoaded', () => {
  const nav = document.querySelector('header nav');
  if (!nav) return;
  const link = document.createElement('a');
  link.href = 'ai-safe.html';
  link.className = 'font-label-md text-label-md px-4 py-2 rounded-full text-on-surface-variant hover:text-on-surface hover:bg-surface-container';
  link.textContent = 'AI Safe & Smart';
  nav.append(link);
});
