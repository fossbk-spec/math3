/* Shared CSV and Web Crypto helpers. No roster is persisted by the teacher picker. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.MathClassroom = api;
})(typeof window !== 'undefined' ? window : null, function () {
  'use strict';
  const normalize = value => String(value || '').trim().toLowerCase();
  function classCode(value) {
    const code = String(value || '').trim().toUpperCase();
    if (!/^[A-Z0-9][A-Z0-9-]{0,11}$/.test(code)) throw new Error('Mã lớp không hợp lệ.');
    return code;
  }
  function parseCSV(text) {
    const rows = []; let row = [], field = '', quoted = false, closed = false;
    text = String(text).replace(/^\uFEFF/, '');
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (quoted) {
        if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
        else if (c === '"') { quoted = false; closed = true; }
        else field += c;
      } else if (c === ',' || c === '\n' || c === '\r') {
        row.push(field); field = ''; closed = false;
        if (c !== ',') { rows.push(row); row = []; if (c === '\r' && text[i + 1] === '\n') i++; }
      } else if (c === '"' && !field && !closed) quoted = true;
      else {
        if (closed || c === '"') throw new Error('CSV có dấu nháy không hợp lệ.');
        field += c;
      }
    }
    if (quoted) throw new Error('CSV chưa đóng dấu nháy.');
    if (field || row.length || closed) rows.push([...row, field]);
    return rows.filter(r => r.some(v => v.trim()));
  }
  function roster(text, code) {
    code = classCode(code);
    const rows = parseCSV(text);
    if (JSON.stringify(rows.shift()) !== JSON.stringify(['TT', 'Họ và tên', 'username', 'password'])) {
      throw new Error('CSV cần tiêu đề TT,Họ và tên,username,password.');
    }
    const ids = new Set(), usernames = new Set();
    const students = rows.map((r, index) => {
      const tt = Number(r[0]), username = normalize(r[2]), password = r[3];
      if (r.length !== 4 || !/^\d{1,2}$/.test(r[0].trim()) || tt < 1 || tt > 99 || !r[1].trim() || !username) {
        throw new Error(`Dòng ${index + 2}: thiếu hoặc sai dữ liệu.`);
      }
      if (ids.has(tt) || usernames.has(username)) throw new Error(`Dòng ${index + 2}: TT hoặc username trùng.`);
      if (Array.from(password).length < 6 || normalize(password) === username) throw new Error(`Dòng ${index + 2}: mật khẩu cần ít nhất 6 ký tự và khác username.`);
      ids.add(tt); usernames.add(username);
      return { id: `${code}-${String(tt).padStart(2, '0')}`, name: r[1].trim(), username, password };
    });
    if (!students.length) throw new Error('CSV chưa có học sinh.');
    return students;
  }
  const to64 = bytes => btoa(String.fromCharCode(...new Uint8Array(bytes)));
  const from64 = text => Uint8Array.from(atob(text), c => c.charCodeAt(0));
  async function derive(crypto, username, password, kdf) {
    const material = await crypto.subtle.importKey('raw', new TextEncoder().encode(`${normalize(username)}\n${password}`), 'PBKDF2', false, ['deriveKey']);
    return crypto.subtle.deriveKey({ name: 'PBKDF2', hash: kdf.hash, iterations: kdf.iterations, salt: from64(kdf.salt) }, material,
      { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
  }
  async function encrypt(text, code, crypto) {
    const students = roster(text, code);
    const kdf = { name: 'PBKDF2', hash: 'SHA-256', iterations: 200000, salt: to64(crypto.getRandomValues(new Uint8Array(16))) };
    const encrypted = [];
    for (const student of students) {
      const key = await derive(crypto, student.username, student.password, kdf);
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(JSON.stringify({ name: student.name, username: student.username })));
      encrypted.push({ id: student.id, iv: to64(iv), ct: to64(ct) });
    }
    return { classId: classCode(code), kdf, students: encrypted };
  }
  async function login(data, username, password, crypto) {
    if (data.kdf?.name !== 'PBKDF2' || data.kdf.hash !== 'SHA-256' || data.kdf.iterations !== 200000 || !Array.isArray(data.students)) {
      throw new Error('Dữ liệu tài khoản lớp không hợp lệ.');
    }
    const code = classCode(data.classId);
    const key = await derive(crypto, username, password, data.kdf);
    for (const student of data.students) {
      try {
        const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: from64(student.iv) }, key, from64(student.ct));
        const account = JSON.parse(new TextDecoder().decode(plain));
        if (account.username === normalize(username) && student.id.startsWith(`${code}-`)) {
          return { id: student.id, role: 'student', className: code, fullName: account.name, totalStars: 0 };
        }
      } catch { /* Wrong key: try the next encrypted record. */ }
    }
    return null;
  }
  function csv(rows) {
    return rows.map(row => row.map(value => {
      let text = String(value ?? '');
      if (/^[\s]*[=+\-@]/.test(text)) text = `'${text}`;
      return `"${text.replace(/"/g, '""')}"`;
    }).join(',')).join('\r\n');
  }
  function picker(root, host, changed) {
    const document = root.document;
    const box = document.createElement('div');
    box.style.cssText = 'margin:16px 0;font:18px/1.5 system-ui,sans-serif;overflow-wrap:anywhere';
    const button = document.createElement('button'); button.type = 'button'; button.textContent = 'Mở danh sách lớp (CSV)';
    button.style.cssText = 'min-height:48px;padding:10px 18px;border-radius:12px;background:#164e32;color:white;font:700 18px system-ui,sans-serif';
    const input = document.createElement('input'); input.type = 'file'; input.accept = '.csv,text/csv'; input.hidden = true;
    const status = document.createElement('p'); status.setAttribute('role', 'status');
    status.textContent = 'Lớp 3A2: danh sách chỉ giữ trong bộ nhớ trang này, không gửi đi. Tải lại trang để xoá.';
    button.addEventListener('click', () => input.click());
    input.addEventListener('change', () => {
      const file = input.files[0]; if (!file) return;
      const reader = new root.FileReader();
      reader.onload = () => {
        try {
          const names = new Map(roster(reader.result, '3A2').map(s => [s.id, s.name]));
          changed(names); status.textContent = `Đã mở ${names.size} em của lớp 3A2 trong bộ nhớ trang này.`;
        } catch (error) { status.textContent = error.message; }
        input.value = '';
      };
      reader.onerror = () => { status.textContent = 'Không đọc được CSV. Hãy chọn lại tệp UTF-8.'; input.value = ''; };
      reader.readAsText(file, 'UTF-8');
    });
    box.append(button, input, status); host.prepend(box);
  }
  return { normalize, parseCSV, roster, encrypt, login, csv, picker };
});
