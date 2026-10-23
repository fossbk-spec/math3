'use strict';
// Mật khẩu giáo viên giả cho test (mật khẩu thật chỉ chủ nhiệm giữ; code chỉ có mã băm).
const crypto = require('node:crypto');
const PASSWORD = 'mat-khau-thu';
const salt = crypto.randomBytes(16);
const KDF = { iterations: 1000, salt: salt.toString('base64'),
  hash: crypto.pbkdf2Sync(`giaovien01\n${PASSWORD}`, salt, 1000, 32, 'sha256').toString('base64') };
module.exports = { KDF, PASSWORD, login: { username: 'giaovien01', password: PASSWORD, role: 'teacher' } };
