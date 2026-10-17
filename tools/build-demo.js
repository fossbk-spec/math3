'use strict';
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const dist = path.join(root, 'dist');
fs.rmSync(dist, { recursive: true, force: true });
fs.cpSync(path.join(root, 'public'), dist, { recursive: true });
fs.mkdirSync(path.join(dist, 'data'), { recursive: true });
fs.copyFileSync(path.join(root, 'data/content/grade3.json'), path.join(dist, 'data/grade3.json'));
fs.writeFileSync(path.join(dist, '.nojekyll'), '');
const prefix = `<script>window.MATH_DEMO=true;window.MATH_ANALYTICS_URL=${JSON.stringify(process.env.ANALYTICS_URL || '').replace(/</g, '\\u003c')}</script>\n<script src="assets/js/core/grading.js"></script>\n<script src="assets/js/core/analytics.js"></script>\n<script src="assets/js/core/demo-api.js"></script>\n`;
const banner = `<style>body{padding-top:48px!important}#math-demo-banner{position:fixed;top:0;left:0;right:0;z-index:9999;min-height:48px;display:flex;align-items:center;justify-content:center;padding:6px 14px;background:#164e32;color:white;text-align:center;font:600 16px/1.3 system-ui,sans-serif}header.sticky,header.fixed{top:48px!important}</style><div id="math-demo-banner" role="note">BẢN DEMO – dữ liệu học tập chỉ lưu trên máy này, không phải tài khoản thật</div>`;
const pages = fs.readdirSync(dist).filter(name => name.endsWith('.html'));
for (const name of pages) {
  const file = path.join(dist, name);
  let html = fs.readFileSync(file, 'utf8');
  if (!html.includes('assets/js/core/api.js')) throw new Error(`${name} thiếu api.js`);
  html = html.replace('<script src="assets/js/core/api.js"></script>', prefix + '<script src="assets/js/core/api.js"></script>');
  html = html.replace(/<body([^>]*)>/i, `<body$1>${banner}`);
  fs.writeFileSync(file, html);
}
console.log(`Demo build: ${pages.length} trang, data/grade3.json, .nojekyll`);
