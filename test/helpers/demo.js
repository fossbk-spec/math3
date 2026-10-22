'use strict';
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

module.exports = function demoClient(data = require('../../data/content/grade3.json')) {
  const memory = new Map();
  const localStorage = { getItem: k => memory.get(k) ?? null, setItem: (k, v) => memory.set(k, v), removeItem: k => memory.delete(k) };
  const context = { window: { MathPractice: require('../../public/assets/js/core/practice.js'), MathGrading: require('../../public/assets/js/core/grading.js'), MathStars: require('../../public/assets/js/core/stars.js') }, localStorage,
    fetch: async () => ({ ok: true, json: async () => data }), URL, Date, Math, Object, JSON };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../../public/assets/js/core/demo-api.js'), 'utf8'), context);
  return async (route, method = 'GET', body = {}) => JSON.parse(JSON.stringify(await context.window.MathDemoAPI.request(`/api/${route}`, { method, body: JSON.stringify(body) })));
};
