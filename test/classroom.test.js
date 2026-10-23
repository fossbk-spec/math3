'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const vm = require('node:vm');
const { webcrypto } = require('node:crypto');
const classroom = require('../public/assets/js/core/classroom');
const makeClass = require('../tools/make-class');
const makeAnalytics = require('../public/assets/js/core/analytics');
const stats = require('../public/assets/js/pages/thong-ke');
const fixture = path.join(__dirname, 'fixtures/class-fake.csv');
const text = fs.readFileSync(fixture, 'utf8');

test('CSV giả UTF-8 BOM: dấu tiếng Việt, dấu phẩy, nháy kép và TT giữ đúng', () => {
  assert.equal(text.charCodeAt(0), 0xFEFF);
  const rows = classroom.roster(text, '3A2');
  assert.equal(rows[1].id, '3A2-07');
  assert.equal(rows[1].name, 'Bạn Sóc, Lá Giả');
  assert.deepEqual(classroom.parseCSV('a,b\r\n"c""d","e\nf"\r\n'), [['a', 'b'], ['c"d', 'e\nf']]);
  assert.throws(() => classroom.parseCSV('"chưa đóng'), /CSV/);
  assert.throws(() => classroom.parseCSV('"a"b'), /CSV/);
  assert.throws(() => classroom.roster(text.replace('7,"', '1,"'), '3A2'), /trùng/);
  assert.throws(() => classroom.roster(text.replace('socla.demo', ' CAMAY.DEMO '), '3A2'), /trùng/);
  assert.throws(() => classroom.roster(text.replace('gia-may-846', '12345'), '3A2'), /6 ký tự/);
  assert.throws(() => classroom.roster(text, '../bad'), /Mã lớp/);
});

test('Công cụ tạo file mã hoá; demo đăng nhập; thống kê gửi mã, không gửi danh tính', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'math3-m5-'));
  const file = path.join(dir, 'class-fake.json');
  try {
    assert.equal(await makeClass(fixture, '3A2', file), 2);
    const json = fs.readFileSync(file, 'utf8');
    const data = JSON.parse(json);
    assert.equal(data.classId, '3A2');
    assert.deepEqual(Object.keys(data), ['classId', 'kdf', 'students']);
    assert.equal(data.kdf.iterations, 200000);
    assert.equal(Buffer.from(data.kdf.salt, 'base64').length, 16);
    const roster = classroom.roster(text, '3A2');
    for (const student of roster) for (const secret of [student.name, student.username, student.password]) assert.equal(json.includes(secret), false);
    for (const student of data.students) {
      assert.deepEqual(Object.keys(student), ['id', 'iv', 'ct']);
      assert.equal(Buffer.from(student.iv, 'base64').length, 12);
    }
    assert.notEqual(data.students[0].iv, data.students[1].iv);
    const invalid = path.join(dir, 'invalid.csv');
    fs.writeFileSync(invalid, text.replace('gia-may-846', 'camay.demo'), 'utf8');
    await assert.rejects(makeClass(invalid, '3A2', file), /khác username/);
    assert.equal(fs.readFileSync(file, 'utf8'), json, 'invalid input must not overwrite output');
    const missing = path.join(dir, 'not-written.json');
    await assert.rejects(makeClass(invalid, '3A2', missing), /khác username/);
    assert.equal(fs.existsSync(missing), false);

    const memory = new Map(), sent = [];
    const localStorage = { getItem: k => memory.get(k) ?? null, setItem: (k, v) => memory.set(k, v), removeItem: k => memory.delete(k) };
    let derives = 0;
    const crypto = { subtle: {
      importKey: (...args) => webcrypto.subtle.importKey(...args),
      deriveKey: (...args) => { derives++; return webcrypto.subtle.deriveKey(...args); },
      decrypt: (...args) => webcrypto.subtle.decrypt(...args),
    }, randomUUID: () => 'fake-device' };
    const root = { MathClassroom: classroom, crypto: { ...crypto, subtle: { ...crypto.subtle, deriveBits: (...args) => webcrypto.subtle.deriveBits(...args) } }, MATH_TEACHER_KDF: require('./helpers/teacher').KDF, localStorage, MATH_ANALYTICS_URL: 'https://example.test', Blob,
      navigator: { sendBeacon: (url, body) => { sent.push(body); return true; } } };
    root.MathAnalytics = makeAnalytics(root);
    let available = true;
    const context = { window: root, TextEncoder, atob, btoa, URL, localStorage, fetch: async url => {
      if (url === 'data/class-3a2.json') return { ok: available, status: available ? 200 : 404, json: async () => data };
      assert.equal(url, 'data/grade3.json'); return { ok: true, json: async () => require('../data/content/grade3.json') };
    } };
    vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../public/assets/js/core/demo-api.js'), 'utf8'), context);
    const call = (route, body, method = 'POST') => root.MathDemoAPI.request(`/api/${route}`, { method, body });
    const creds = { username: ' SOCLA.DEMO ', password: roster[1].password, role: 'student' };
    const { user } = await call('auth/login', creds);
    assert.equal(derives, 1, 'one PBKDF2 derivation for the entire login');
    assert.equal(user.id, '3A2-07'); assert.equal(user.fullName, roster[1].name); assert.equal(user.className, '3A2');
    assert.equal(user.username, undefined); assert.equal(user.password, undefined);
    assert.equal((await call('auth/me', {}, 'GET')).user.fullName, roster[1].name);
    root.MathAnalytics.track('page_view', { page: 'index.html', fullName: user.fullName, username: creds.username });
    root.MathAnalytics.flush();
    const payload = await sent[0].text();
    assert.ok(JSON.parse(payload).events.every(e => e.alias === '3A2-07' && e.classCode === '3A2'));
    for (const secret of [user.fullName, roster[1].username, creds.password]) assert.equal(payload.includes(secret), false);
    await call('auth/logout', {});
    await assert.rejects(call('auth/login', { ...creds, password: 'wrong-password' }), e => e.status === 401 && e.message === 'Tên đăng nhập hoặc mật khẩu chưa đúng.');
    const capitalized = creds.password[0].toUpperCase() + creds.password.slice(1);
    if (capitalized !== creds.password) { assert.equal((await call('auth/login', { ...creds, password: capitalized })).user.id, '3A2-07'); await call('auth/logout', {}); }
    await assert.rejects(call('auth/me', {}, 'GET'), e => e.status === 401);
    await assert.rejects(call('auth/login', { role: 'teacher' }), e => e.status === 401);
    await assert.rejects(call('auth/login', { username: 'giaovien01', password: '123456', role: 'teacher' }), e => e.status === 401);
    await call('auth/login', require('./helpers/teacher').login);
    const students = (await call('teacher/students', {}, 'GET')).students;
    const student = students.find(s => s.id === '3A2-07');
    assert.equal(student.full_name, student.id); assert.equal(student.username, '');
    available = false;
    await assert.rejects(call('auth/login', creds), e => e.status === 401);
    assert.equal((await call('auth/login', { username: 'hocsinh01', password: '123456' })).user.fullName, 'Bạn Cú');
    await assert.rejects(call('auth/login', { username: 'hocsinh01', password: 'wrong' }), e => e.status === 401);
    assert.equal((await call('auth/login', { username: 'giaovien01', password: require('./helpers/teacher').PASSWORD })).user.role, 'teacher');

    // Bộ nhớ demo cũ: id 3 đã thuộc học sinh do giáo viên tạo; giữ nguyên tiến độ.
    const saved = JSON.parse(memory.get('math3_demo_v1'));
    saved.users = saved.users.filter(u => u.username !== 'hocsinh');
    saved.users.push({ id: 3, username: 'student-created', fullName: 'Bạn Thỏ', role: 'student', className: '3A', totalStars: 7 });
    memory.set('math3_demo_v1', JSON.stringify(saved));
    const trial = (await call('auth/login', { username: 'hocsinh', password: '123456' })).user;
    assert.equal(typeof trial.id, 'number');
    assert.notEqual(trial.id, 3);
    assert.equal(trial.username, 'hocsinh');
    assert.equal(trial.fullName, 'Bạn Dùng Thử');
    assert.equal(trial.role, 'student');
    assert.equal(trial.className, 'DEMO');
    const migrated = JSON.parse(memory.get('math3_demo_v1'));
    assert.deepEqual(migrated.progress, saved.progress);
    assert.equal(migrated.users.find(u => u.id === 3).totalStars, 7);
    root.MathAnalytics.track('page_view', { page: 'index.html' });
    assert.equal(root.MathAnalytics.queue().at(-1).classCode, 'DEMO');
    root.MathAnalytics.flush();
    const trialEvents = JSON.parse(await sent.at(-1).text()).events;
    assert.equal(trialEvents.at(-1).classCode, 'DEMO');
    await call('auth/logout', {});
    for (const password of ['wrong', '', '123456 ']) {
      await assert.rejects(call('auth/login', { username: 'hocsinh', password }), e => e.status === 401);
    }
    await assert.rejects(call('auth/me', {}, 'GET'), e => e.status === 401);
    // Cả lớp 3A2 và giáo viên vẫn đăng nhập được sau khi dùng tài khoản thử.
    available = true;
    assert.equal((await call('auth/login', creds)).user.id, '3A2-07');
    assert.equal((await call('auth/login', require('./helpers/teacher').login)).user.role, 'teacher');
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('CSV thống kê ghép tên tại máy theo alias=id, không sửa dữ liệu đầu vào', () => {
  const names = new Map(classroom.roster(text, '3A2').map(s => [s.id, s.name]));
  const data = { students: [{ alias: '3A2-07', classCode: '3A2', attempts: { value: 2, n: 2 } }] };
  const before = JSON.stringify(data);
  assert.ok(stats.csvRows(data, names).includes('Bạn Sóc, Lá Giả'));
  assert.equal(stats.csvRows(data).includes('Bạn Sóc, Lá Giả'), false);
  assert.equal(JSON.stringify(data), before);
  assert.equal(classroom.csv([['=1+1', 'a"b']]), '"\'=1+1","a""b"');
});

test('FileReader của giáo viên chỉ trả map tên trong bộ nhớ, không storage / network', () => {
  class Element {
    constructor(tag) { this.tag = tag; this.style = {}; this.children = []; this.events = {}; }
    append(...nodes) { this.children.push(...nodes); }
    prepend(node) { this.children.unshift(node); }
    setAttribute() {}
    addEventListener(name, fn) { this.events[name] = fn; }
  }
  const host = new Element('main'); let names;
  const forbidden = () => assert.fail('Roster must stay in memory');
  const root = { document: { createElement: tag => new Element(tag) }, fetch: forbidden,
    localStorage: { setItem: forbidden }, sessionStorage: { setItem: forbidden },
    FileReader: class { readAsText(file, encoding) { assert.equal(encoding, 'UTF-8'); this.result = file; this.onload(); } } };
  classroom.picker(root, host, value => { names = value; });
  const input = host.children[0].children.find(el => el.tag === 'input');
  input.files = [text]; input.events.change();
  assert.equal(names.get('3A2-07'), 'Bạn Sóc, Lá Giả');
  assert.equal(names.size, 2); assert.equal(input.value, '');
  assert.equal(JSON.stringify([...names]).includes('gia-la-957'), false);
  const original = names;
  input.files = ['invalid']; input.events.change();
  assert.equal(names, original, 'invalid CSV keeps the previous roster');
});
