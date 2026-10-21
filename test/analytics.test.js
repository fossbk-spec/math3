'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const makeAnalytics = require('../public/assets/js/core/analytics.js');
const stats = require('../public/assets/js/pages/thong-ke.js');
const sample = require('../public/data/stats-sample.json');

function fixture(url = '') {
  const values = new Map(); const sent = [];
  const storage = { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) };
  const root = { localStorage: storage, MATH_ANALYTICS_URL: url, crypto: { randomUUID: () => 'test-device-id' },
    navigator: { sendBeacon: (target, body) => { sent.push({ target, body }); return true; } }, Blob };
  return { analytics: makeAnalytics(root), sent, storage, root };
}

test('URL rỗng giữ hàng đợi, tuyệt đối không gửi', () => {
  const { analytics, sent } = fixture();
  analytics.setContext({ role: 'student', className: '3A', fullName: 'Bạn Cú' });
  analytics.track('page_view', { page: 'index.html', fullName: 'Không được thu' });
  assert.equal(analytics.flush(), false);
  assert.equal(sent.length, 0);
  assert.equal(analytics.queue().length, 2);
  assert.equal(JSON.stringify(analytics.queue()).includes('Không được thu'), false);
});

test('practice_answer chỉ ghi metadata, không ghi nội dung câu trả lời', () => {
  const { analytics } = fixture();
  assert.equal(analytics.track('practice_answer', { skillId: 'skill', level: 2, correct: false, attemptNo: 3, hintsUsed: 2, answer: 'PRIVATE' }), true);
  const event = analytics.queue()[0];
  assert.equal(event.skillId, 'skill'); assert.equal(event.level, 2); assert.equal(event.correct, false);
  assert.equal(event.attemptNo, 3); assert.equal(event.hintsUsed, 2);
  assert.equal(JSON.stringify(event).includes('PRIVATE'), false);
});

test('Tắt thống kê xóa hàng đợi và chặn sự kiện, bật lại hoạt động', () => {
  const { analytics, sent } = fixture('https://example.test');
  analytics.setContext({ role: 'student', className: '3A', fullName: 'Bạn Cú' });
  analytics.track('page_view', { page: 'index.html' });
  analytics.setEnabled(false);
  assert.equal(analytics.queue().length, 0);
  assert.equal(analytics.track('page_view', { page: 'lesson.html' }), false);
  assert.equal(analytics.flush(), false);
  assert.equal(sent.length, 0);
  analytics.setEnabled(true);
  assert.equal(analytics.track('page_view', { page: 'lesson.html' }), true);
  assert.equal(analytics.flush(), true);
  assert.equal(sent.length, 1);
});

test('Sự kiện học sinh vào lô gửi, mọi sự kiện có bí danh và mã lớp', async () => {
  const { analytics, sent } = fixture('https://example.test');
  analytics.track('page_view', { page: 'login.html' });
  analytics.setContext({ role: 'student', className: '3A', fullName: 'Bạn Cú' });
  analytics.track('page_view', { page: 'index.html' });
  assert.equal(analytics.flush(), true);
  assert.equal(sent.length, 1);
  assert.equal(sent[0].target, 'https://example.test/e');
  const batch = JSON.parse(await sent[0].body.text());
  assert.equal(batch.events.length, 3);
  for (const event of batch.events) {
    assert.equal(event.role, 'student');
    assert.equal(event.alias, 'Bạn Cú');
    assert.equal(event.classCode, '3A');
  }
});

test('Không đưa họ tên thật vào sự kiện', async () => {
  const { analytics, sent } = fixture('https://example.test');
  analytics.setContext({ role: 'student', className: '3B', fullName: 'Bạn Nguyễn Văn A' });
  analytics.track('page_view', { page: 'index.html' });
  analytics.flush();
  const batch = JSON.parse(await sent[0].body.text());
  assert.ok(batch.events.every(event => event.alias === null && event.classCode === '3B'));
  assert.equal(JSON.stringify(batch).includes('Nguyễn Văn A'), false);
});

test('Gửi từng lô tối đa 20 và giữ lại khi sendBeacon từ chối', () => {
  const { analytics, sent, root } = fixture('https://example.test');
  root.navigator.sendBeacon = () => false;
  analytics.setContext({ role: 'teacher' });
  for (let i = 0; i < 25; i++) analytics.track('page_view', { page: String(i) });
  const before = analytics.queue().length;
  assert.ok(before > 20);
  assert.equal(analytics.flush(), false);
  assert.equal(analytics.queue().length, before);
  root.navigator.sendBeacon = (target, body) => { sent.push({ target, body }); return true; };
  analytics.flush();
  assert.equal(analytics.queue().length, before - 20);
  assert.equal(sent.length, 1);
});

test('Hàng đợi giới hạn 200 sự kiện', () => {
  const { analytics } = fixture();
  for (let i = 0; i < 250; i++) analytics.track('page_view', { page: String(i) });
  assert.equal(analytics.queue().length, 200);
  assert.equal(analytics.queue()[0].page, '50');
  assert.equal(analytics.queue()[199].page, '249');
});

test('Tính số liệu từ dữ liệu mẫu', () => {
  assert.deepEqual(stats.calc(sample), { dailyPeak: 24, weeklyPeak: 57, firstLastDelta: 15, avgSessionMin: 8 });
  const csv = stats.csvRows(sample);
  assert.match(csv, /Bài 9/);
  assert.match(csv, /2026-10-10/);
  assert.match(csv, /Bạn Cú/);
  assert.match(csv, /Số lượt/);
});
