'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { webcrypto } = require('node:crypto');
const classroom = require('../public/assets/js/core/classroom');

async function makeClass(csvPath, classId, output) {
  // Validate and encrypt completely before touching any existing output.
  const data = await classroom.encrypt(fs.readFileSync(csvPath, 'utf8'), classId, webcrypto);
  const file = output || path.join(__dirname, '..', 'data', 'content', `class-${data.classId.toLowerCase()}.json`);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n', 'utf8');
  return data.students.length;
}
if (require.main === module) {
  const [csvPath, flag, classId, ...extra] = process.argv.slice(2);
  if (!csvPath || flag !== '--class' || !classId || extra.length) {
    console.error('Cách dùng: node tools/make-class.js <csv> --class 3A2'); process.exitCode = 1;
  } else {
    makeClass(csvPath, classId).then(count => console.log(`Đã mã hoá ${count} em.`)).catch(error => {
      // File-system errors can include paths; never print CSV data or names.
      console.error(error.code ? 'Không đọc hoặc ghi được tệp danh sách lớp.' : error.message); process.exitCode = 1;
    });
  }
}
module.exports = makeClass;
