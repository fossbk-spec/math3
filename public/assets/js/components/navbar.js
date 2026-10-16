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
    // Thay tên mẫu "Bảo Nam" bằng tên thật trong vùng header/footer
    document.querySelectorAll('header span, header p').forEach((el) => {
      if (el.textContent.trim() === 'Bảo Nam' || el.textContent.trim() === 'Nguyễn Bảo Nam') el.textContent = user.fullName;
    });
    const header = document.querySelector('header');
    if (!header || header.querySelector('#btn-logout')) return;
    const btn = document.createElement('button');
    btn.id = 'btn-logout';
    btn.type = 'button';
    btn.title = `Đăng xuất (${user.fullName})`;
    btn.className = 'ml-1 w-10 h-10 shrink-0 rounded-full bg-surface-container hover:bg-error-container text-on-surface-variant hover:text-on-error-container flex items-center justify-center transition-all';
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
