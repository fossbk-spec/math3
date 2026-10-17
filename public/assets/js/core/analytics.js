/* Anonymous, bounded analytics queue for the static demo. */
(function (root, factory) {
  const api = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = factory;
  if (root) root.MathAnalytics = api;
})(typeof window !== 'undefined' ? window : null, function (root) {
  'use strict';
  const QUEUE = 'math3_analytics_queue_v1';
  const DEVICE = 'math3_analytics_device_v1';
  const ENABLED = 'math3_analytics_enabled_v1';
  const MAX = 200;
  const fields = {
    session_start: ['screen'], page_view: ['page'], lesson_open: ['lessonId', 'setId'],
    submission: ['setId', 'lessonId', 'kind', 'attemptNo', 'scorePercent', 'correctCount', 'totalCount', 'durationSec', 'comment', 'questions'],
    hint_used: ['questionId', 'hintNo'], game_end: ['gameId', 'score', 'durationSec'],
    ai_safe_choice: ['situationId', 'choice', 'best'], teacher_review: ['approved', 'rejected'],
  };
  const storage = root?.localStorage;
  const get = key => { try { return storage?.getItem(key); } catch { return null; } };
  const put = (key, value) => { try { storage?.setItem(key, value); } catch { /* Storage unavailable. */ } };
  const remove = key => { try { storage?.removeItem(key); } catch { /* Storage unavailable. */ } };
  const enabled = () => get(ENABLED) !== 'false';
  const queue = () => { try { const value = JSON.parse(get(QUEUE) || '[]'); return Array.isArray(value) ? value.slice(-MAX) : []; } catch { return []; } };
  const url = () => String(root?.MATH_ANALYTICS_URL || '').trim().replace(/\/+$/, '');
  const deviceId = () => {
    let id = get(DEVICE);
    if (!id) { id = root.crypto?.randomUUID?.(); if (id) put(DEVICE, id); }
    return id || null;
  };
  let context = { role: null, classCode: null };
  let sessionTracked = false;
  function setContext(user) {
    context = {
      role: ['student', 'teacher'].includes(user?.role) ? user.role : null,
      classCode: /^[\p{L}\p{N}-]{1,12}$/u.test(String(user?.className || '')) ? user.className : null,
    };
    if (context.role) put(QUEUE, JSON.stringify(queue().map(event => event.role ? event : { ...event, role: context.role, classCode: context.classCode })));
    if (!sessionTracked && context.role) {
      sessionTracked = true;
      const width = root.screen?.width || root.innerWidth || 1024;
      track('session_start', { screen: width < 600 ? 'mobile' : width < 1100 ? 'tablet' : 'desktop' });
    }
  }
  function flush() {
    if (!enabled() || !url() || !root.navigator?.sendBeacon) return false;
    const pending = queue();
    const outbound = pending.filter(event => event.role === 'teacher').slice(0, 20);
    if (!outbound.length) return false;
    try {
      const payload = JSON.stringify({ schemaVersion: 1, events: outbound });
      const body = typeof root.Blob === 'function' ? new root.Blob([payload], { type: 'text/plain' }) : payload;
      if (!root.navigator.sendBeacon(`${url()}/e`, body)) return false;
      put(QUEUE, JSON.stringify(pending.filter(event => !outbound.includes(event))));
      return true;
    } catch { return false; }
  }
  function track(type, details = {}) {
    if (!enabled() || !Object.hasOwn(fields, type)) return false;
    const data = {};
    for (const key of fields[type]) {
      const value = details[key];
      if (key === 'questions') {
        if (Array.isArray(value)) data.questions = value.slice(0, 100).filter(q => typeof q?.questionId === 'string').map(q => ({ questionId: q.questionId.slice(0, 80), correct: q.correct === true }));
      } else if (typeof value === 'string') data[key] = value.slice(0, 80);
      else if (typeof value === 'number' && Number.isFinite(value)) data[key] = value;
      else if (typeof value === 'boolean') data[key] = value;
    }
    const event = { type, deviceId: deviceId(), role: context.role, classCode: context.classCode, at: new Date().toISOString(), ...data };
    put(QUEUE, JSON.stringify([...queue(), event].slice(-MAX)));
    if (queue().length >= 20) flush();
    return true;
  }
  function setEnabled(value) {
    put(ENABLED, value ? 'true' : 'false');
    if (!value) { remove(QUEUE); remove(DEVICE); }
    updateBanner();
    if (value) flush();
  }
  function updateBanner() {
    const bar = root?.document?.getElementById('math-analytics-notice');
    if (!bar) return;
    const button = bar.querySelector('button');
    if (button) button.textContent = enabled() ? 'Tắt thống kê' : 'Bật thống kê';
    const message = bar.querySelector('span');
    if (message) message.textContent = enabled() ? 'Web ghi nhận ẩn danh cách sử dụng để cải thiện sản phẩm.' : 'Thống kê đã tắt trên máy này.';
  }
  function init() {
    if (!root?.document || root.MATH_DEMO !== true) return;
    const bar = root.document.createElement('div');
    bar.id = 'math-analytics-notice';
    bar.setAttribute('role', 'note');
    bar.style.cssText = 'position:fixed;bottom:0;left:0;right:0;z-index:9998;background:#164e32;color:white;padding:8px 16px;display:flex;align-items:center;justify-content:center;gap:16px;flex-wrap:wrap;font:18px/1.4 system-ui,sans-serif';
    const message = root.document.createElement('span');
    const button = root.document.createElement('button');
    button.type = 'button'; button.style.cssText = 'min-height:48px;padding:8px 18px;border-radius:12px;background:white;color:#164e32;font:700 18px system-ui,sans-serif';
    button.addEventListener('click', () => setEnabled(!enabled()));
    bar.append(message, button);
    root.document.body.append(bar);
    updateBanner();
    track('page_view', { page: root.location?.pathname?.split('/').pop() || 'index.html' });
    flush();
    root.addEventListener?.('pagehide', flush);
    root.addEventListener?.('online', flush);
    root.setInterval?.(flush, 30000);
  }
  root?.document?.addEventListener('DOMContentLoaded', init);
  return { track, flush, enabled, setEnabled, setContext, init, queue, MAX };
});
