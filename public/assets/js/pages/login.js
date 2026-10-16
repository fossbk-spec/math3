/* Logic trang Đăng nhập — giao diện giữ nguyên bản gốc, xử lý đăng nhập nối API thật.
 * Tài khoản do GIÁO VIÊN cấp (xem trang Góc Giáo Viên). Tài khoản mẫu để test:
 * Học sinh: hocsinh01 / 123456  •  Giáo viên: giaovien01 / 123456 */
let selectedRole = 'student';
if (window.MATH_DEMO === true) {
  const form = document.getElementById('authForm');
  const panel = document.createElement('div');
  panel.className = 'space-y-3 my-5';
  panel.innerHTML = '<button type="button" data-demo-role="student" class="w-full min-h-14 p-3 rounded-2xl bg-primary text-on-primary text-lg font-bold">Vào với vai Học sinh (Bạn Cú)</button><button type="button" data-demo-role="teacher" class="w-full min-h-14 p-3 rounded-2xl bg-secondary text-on-secondary text-lg font-bold">Vào với vai Giáo viên</button><button type="button" id="demo-reset" class="w-full min-h-12 p-3 rounded-2xl bg-surface-container text-on-surface text-lg">Xoá dữ liệu demo</button>';
  form.before(panel);
  form.hidden = true;
  const roleTabs = document.getElementById('btnRoleStudent')?.parentElement?.parentElement;
  if (roleTabs) roleTabs.hidden = true;
  panel.addEventListener('click', async event => {
    const role = event.target.dataset.demoRole;
    if (event.target.id === 'demo-reset') {
      window.MathDemoAPI.reset();
      showToast('Đã xoá dữ liệu demo trên máy này.');
      return;
    }
    if (!role) return;
    try {
      const { user } = await window.MathAPI.post('/api/auth/login', { role });
      location.href = user.role === 'teacher' ? 'schedule.html' : 'index.html';
    } catch (error) { showToast(error.message); }
  });
}
// Chuyển đổi qua lại giữa Học sinh và Giáo viên
  const btnRoleStudent = document.getElementById('btnRoleStudent');
  const btnRoleTeacher = document.getElementById('btnRoleTeacher');
  const formTitle = document.getElementById('formTitle');
  const formSubtitle = document.getElementById('formSubtitle');
  const studentCodeInput = document.getElementById('studentCodeInput');

  btnRoleStudent.addEventListener('click', () => {
    btnRoleStudent.className = 'flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-on-primary font-label-md text-label-md transition-all shadow-sm';
    btnRoleTeacher.className = 'flex items-center gap-2 px-4 py-2 rounded-xl text-on-surface-variant hover:text-on-surface font-label-md text-label-md transition-all';
    formTitle.textContent = 'Sẵn sàng làm toán nào! 🌟';
    formSubtitle.textContent = 'Chọn đúng lớp và điền mã của em để bước vào đảo học tập nhé.';
    selectedRole = 'student';
    studentCodeInput.value = 'hocsinh01';
  });

  btnRoleTeacher.addEventListener('click', () => {
    btnRoleTeacher.className = 'flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-on-primary font-label-md text-label-md transition-all shadow-sm';
    btnRoleStudent.className = 'flex items-center gap-2 px-4 py-2 rounded-xl text-on-surface-variant hover:text-on-surface font-label-md text-label-md transition-all';
    formTitle.textContent = 'Cổng Quản Trị Giáo Viên 📚';
    formSubtitle.textContent = 'Kính mời thầy cô đăng nhập tài khoản sư phạm trường Hoàng Mai.';
    selectedRole = 'teacher';
    studentCodeInput.value = 'giaovien01';
  });

  // Chuyển đổi tab Đăng nhập / Tạo tài khoản
  const tabLogin = document.getElementById('tabLogin');
  const tabRegister = document.getElementById('tabRegister');
  tabLogin.addEventListener('click', () => {
    tabLogin.className = 'px-3.5 py-1.5 rounded-xl font-label-md text-label-md text-primary font-bold bg-primary-fixed/40';
    tabRegister.className = 'px-3.5 py-1.5 rounded-xl font-label-md text-label-md text-on-surface-variant hover:text-on-surface';
  });
  tabRegister.addEventListener('click', () => {
    tabRegister.className = 'px-3.5 py-1.5 rounded-xl font-label-md text-label-md text-primary font-bold bg-primary-fixed/40';
    tabLogin.className = 'px-3.5 py-1.5 rounded-xl font-label-md text-label-md text-on-surface-variant hover:text-on-surface';
    showToast('Liên hệ Thầy/Cô chủ nhiệm để nhận tài khoản cấp mới.');
  });

  // Ẩn hiện mật khẩu
  const passField = document.getElementById('passwordField');
  const togglePassBtn = document.getElementById('togglePasswordBtn');
  const eyeIcon = document.getElementById('eyeIcon');
  let isShown = false;

  togglePassBtn.addEventListener('click', () => {
    isShown = !isShown;
    passField.type = isShown ? 'text' : 'password';
    eyeIcon.textContent = isShown ? 'visibility_off' : 'visibility';
  });

  // Gợi ý bấm số nhanh
  function appendPin(num) {
    if (passField.value.length < 20) {
      passField.value += num;
    }
  }

  function clearPin() {
    passField.value = '';
  }

  // QR Modal Handlers
  const qrModal = document.getElementById('qrModal');
  function openQrModal() {
    qrModal.classList.remove('hidden');
  }

  function closeQrModal() {
    qrModal.classList.add('hidden');
  }

  function simulateQrSuccess() {
    closeQrModal();
    studentCodeInput.value = "hocsinh01";
    showToast('Nhận diện thẻ thông minh thành công! Đang vào học...');
  }

  // Xử lý nộp form: gọi API đăng nhập thật, server trả cookie phiên làm việc
  async function handleLoginSubmit() {
    const username = studentCodeInput.value.trim();
    const password = passField.value;
    if (!username || !password) { showToast('Em điền tên đăng nhập và mật khẩu nhé!'); return; }
    showToast('Đang mở cánh cổng Vườn Toán Lớp 3...');
    try {
      const { user } = await window.MathAPI.post('/api/auth/login', { username, password, role: selectedRole });
      showToast(`Chào ${user.fullName}! Đang vào Vườn Toán...`);
      setTimeout(() => { location.href = user.role === 'teacher' ? 'schedule.html' : 'index.html'; }, 600);
    } catch (err) {
      showToast(err.message);
    }
  }

  // Toast Functionality
  function showToast(message) {
    const toast = document.getElementById('toastMessage');
    toast.querySelector('p').textContent = message;
    toast.classList.remove('translate-y-24', 'opacity-0');
    toast.classList.add('translate-y-0', 'opacity-100');

    setTimeout(() => {
      toast.classList.remove('translate-y-0', 'opacity-100');
      toast.classList.add('translate-y-24', 'opacity-0');
    }, 3200);
  }
