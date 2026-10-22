'use strict';
/**
 * Nhập nội dung Toán 3 (bài 9–15) từ project hoang-mai-math sang data/content/grade3.json.
 * Nguồn: content/grade3/curriculum.json, content/grade3/worksheets/*.json (phiếu GV đã qua
 * worksheets:check) và content/bank/grade3.json (câu tự sinh, đáp án do code tính, có lời giải).
 *
 * Chạy: node tools/import-hoang-mai.js [đường-dẫn-hoang-mai-math]   (mặc định ../hoang-mai-math)
 * Mọi câu nhập vào ở trạng thái DRAFT — giáo viên duyệt trên web trước khi dùng thật.
 */
const fs = require('fs');
const path = require('path');
const verifyH1 = require('./verify-h1');

const SRC = path.resolve(process.argv[2] || path.join(__dirname, '..', '..', 'hoang-mai-math'));
const OUT = path.join(__dirname, '..', 'data', 'content', 'grade3.json');
const read = p => JSON.parse(fs.readFileSync(path.join(SRC, p), 'utf8'));
const LETTERS = ['A', 'B', 'C', 'D'];
const exportDir = path.join(SRC, 'exports', 'math3');
const manifest = verifyH1(exportDir);

const curriculum = read('content/grade3/curriculum.json');
const aiSafe = read('content/grade3/ai-safe.json');
const active = new Set(curriculum.activeLessons);
const lessons = [];
const lessonSkills = new Map();
for (const t of curriculum.topics) {
  for (const l of t.lessons) {
    if (!active.has(l.number)) continue;
    lessonSkills.set(l.number, l.skills[0]);
    lessons.push({ id: `bai-${l.number}`, number: l.number, title: l.title, page: l.page || null,
      topic: `Chủ đề ${t.number}: ${t.title}`, description: `SGK Toán 3 tập một, trang ${l.page}` });
  }
}
lessons.sort((a, b) => a.number - b.number);
lessons.forEach((l, i) => { l.unlockAfter = null; l.sortOrder = i + 1; });

const skipped = {};
const skip = (why) => { skipped[why] = (skipped[why] || 0) + 1; return null; };

/** Đổi 1 câu (phiếu hoặc bank) sang dạng câu hỏi của math3. */
function convert({ id, stem, answerType, options, answer, level, source, hints, solution, origin, skillId, cognitiveLevel, verification, illustration, templateId, seed, templateVersion }) {
  const base = { id, prompt: stem, level: level || 'co-ban', source, origin, skillId, cognitiveLevel, reviewStatus: 'DRAFT',
    solution: solution && solution.length ? solution : null, hints: hints && hints.length ? hints : null,
    ...(verification && { verification }), ...(illustration && { illustration }), ...(templateId && { templateId }),
    ...(seed != null && { seed }), ...(templateVersion && { templateVersion }) };
  if (answerType === 'choice') {
    if (!Array.isArray(options) || options.length < 2 || options.length > 4) return skip('choice-khong-2-4-lua-chon');
    const clean = options.map(o => String(o).replace(/^[A-D]\.\s*/, ''));
    let idx = /^[A-D]\./.test(String(answer)) ? LETTERS.indexOf(String(answer)[0]) : clean.indexOf(String(answer));
    if (idx < 0) return skip('choice-khong-tim-thay-dap-an');
    return { ...base, type: 'multiple-choice', options: clean, correctAnswer: LETTERS[idx] };
  }
  if (answerType === 'truefalse') {
    if (!['Đ', 'S'].includes(answer)) return skip('truefalse-dap-an-la');
    return { ...base, type: 'multiple-choice', options: ['Đúng', 'Sai'], correctAnswer: answer === 'Đ' ? 'A' : 'B' };
  }
  if (answerType === 'compare') {
    if (!['<', '>', '='].includes(answer)) return skip('compare-dap-an-la');
    return { ...base, type: 'compare', correctAnswer: answer };
  }
  if (answerType === 'number') return { ...base, type: 'input', correctAnswer: String(answer) };
  return skip(`chua-ho-tro-${answerType}`);
}

const sets = {};
const addTo = (setId, meta, q) => {
  if (!q) return;
  sets[setId] = sets[setId] || { ...meta, questions: [] };
  sets[setId].questions.push(q);
};
const LEVEL_LABEL = { 'co-ban': 'Cơ bản', 'nang-cao': 'Nâng cao' };

// 1) Phiếu giáo viên
const wsDir = path.join(SRC, 'content/grade3/worksheets');
for (const f of fs.readdirSync(wsDir).filter(f => f.endsWith('.json')).sort()) {
  for (const it of JSON.parse(fs.readFileSync(path.join(wsDir, f), 'utf8'))) {
    if (it.supported === false || it.needsTeacher) { skip('phieu-can-giao-vien'); continue; }
    const lessonNum = (it.lesson || []).find(n => active.has(n)) || 15;
    const level = it.level || 'co-ban';
    const s = it.source || {};
    const src = `Phiếu GV: ${s.file || f}${s.exercise ? ' · ' + s.exercise : ''}${s.question ? ' · ' + s.question : ''}`;
    addTo(`bai-${lessonNum}-${level}`, { title: `Bài ${lessonNum} · ${LEVEL_LABEL[level]}`, kind: 'exercise', lessonId: `bai-${lessonNum}`, level },
      convert({ id: `ws-${it.id}`, stem: it.stem, answerType: it.answerType, options: it.options, answer: it.answer, level, source: src, origin: 'worksheet',
        skillId: lessonSkills.get(lessonNum), cognitiveLevel: level === 'nang-cao' ? 2 : 1 }));
  }
}

// 2) Câu tự sinh (bank) cho bài thiếu câu phiếu: bài 13 (tìm thành phần), 14 (một phần mấy), 15 (bảng 6–9)
const BANK_TO_LESSON = { 'g3.number.find-component': 13, 'g3.number.fraction-unit': 14, 'g3.number.tables-6-9': 15 };
const practiceQuestions = [];
let prerequisiteCount = 0;
for (const b of read('content/bank/grade3.json')) {
  const n = BANK_TO_LESSON[b.skillId];
  if (!n && (b.skillId !== 'g3.number.tables' || prerequisiteCount >= 12)) continue;
  const q = convert({ id: `bank-${b.skillId.split('.').pop()}-${b.templateId.split('#').pop()}-${b.seed}-${b.cognitiveLevel}`, stem: b.stem,
      answerType: b.answerType, options: b.options, answer: b.correctAnswer, level: b.level || 'co-ban',
      source: `Tự sinh: ${b.templateId} (seed ${b.seed})`, hints: b.hints, solution: b.solution, origin: 'template', skillId: b.skillId, cognitiveLevel: b.cognitiveLevel });
  if (n) addTo(`bai-${n}-luyen-them`, { title: `Bài ${n} · Luyện thêm (câu tự sinh)`, kind: 'exercise', lessonId: `bai-${n}`, level: 'co-ban' }, q);
  else if (q) { practiceQuestions.push(q); prerequisiteCount++; }
}
if (prerequisiteCount !== 12) throw new Error('Thiếu 12 câu bank ôn tiền đề');

// Gói H1 được xác thực ở đầu tool; giữ nguyên lời giải và nhân chứng tính toán.
const exported = JSON.parse(fs.readFileSync(path.join(exportDir, 'lesson-questions.json'), 'utf8'));
if (exported.length !== manifest.questionCount) throw new Error('Số câu gói H1 không khớp manifest');
let imported = 0, omitted = 0, verified = 0;
for (const b of exported) {
  if (['truefalse', 'multi'].includes(b.answerType)) { omitted++; continue; }
  const lessonNum = b.lessonNumber;
  if (!active.has(lessonNum)) { omitted++; continue; }
  const q = convert({ id: `coach-${b.templateId.replace(/[^a-z0-9]+/gi, '-')}-${b.seed}-${b.cognitiveLevel}`,
    stem: b.stem, answerType: b.answerType, options: b.options, answer: b.correctAnswer,
    level: b.level, source: `H1: ${b.templateId} (seed ${b.seed})`, hints: b.hints, solution: b.solution,
    origin: b.origin, skillId: b.skillId, cognitiveLevel: b.cognitiveLevel,
    verification: b.verification, illustration: b.illustration, templateId: b.templateId, seed: b.seed, templateVersion: b.templateVersion });
  if (!q) { omitted++; continue; }
  practiceQuestions.push({ ...q, lessonId: `bai-${lessonNum}` });
  imported++;
  if (q.verification) verified++;
}

// 3) Đề kiểm tra chủ đề 2: 20 câu trắc nghiệm 4 lựa chọn, rải đều bài 9–15 (exam.html chỉ hiển thị dạng này)
const pool = Object.values(sets).flatMap(s => s.questions.map(q => ({ ...q, lessonId: s.lessonId })))
  .filter(q => q.type === 'multiple-choice' && q.options.length === 4 && q.level === 'co-ban');
const byLesson = {};
pool.forEach(q => (byLesson[q.lessonId] = byLesson[q.lessonId] || []).push(q));
const exam = [];
for (let round = 0; exam.length < 20 && round < 20; round++) {
  for (const l of lessons) { const q = (byLesson[l.id] || [])[round]; if (q && exam.length < 20) exam.push(q); }
}
sets['bai-15-kiem-tra'] = { title: 'Kiểm tra Chủ đề 2 (bài 9–15)', kind: 'exam', lessonId: 'bai-15', level: 'co-ban', durationMinutes: 35,
  questions: exam.map(({ lessonId, ...q }) => ({ ...q, id: `exam-${q.id}` })) };

// Kiểm tra trùng id
const ids = new Set();
const allQuestions = [...Object.values(sets).flatMap(s => s.questions), ...practiceQuestions];
const usedSkills = new Set(allQuestions.map(q => q.skillId));
const skills = read('content/grade3/skills.json').filter(s => s.grade === 3 && usedSkills.has(s.id))
  .map(({ id, title, prerequisites }) => ({ id, title, prerequisites: prerequisites.filter(id => usedSkills.has(id)) }));
const skillIds = new Set(skills.map(s => s.id));
for (const q of allQuestions) {
  if (ids.has(q.id)) throw new Error(`Trùng id câu hỏi: ${q.id}`);
  if (!skillIds.has(q.skillId) || ![1, 2, 3].includes(q.cognitiveLevel)) throw new Error(`Sai kỹ năng/mức: ${q.id}`);
  ids.add(q.id);
}
const practicePool = [...practiceQuestions.filter(q => q.templateId), ...Object.values(sets).filter(s => s.kind === 'exercise').flatMap(s => s.questions), ...practiceQuestions.filter(q => !q.templateId)]
  .filter(q => skillIds.has(q.skillId)).map(q => q.id);
const feedbackRules = read('content/grade3/feedback-rules.json');

fs.mkdirSync(path.dirname(OUT), { recursive: true });
const vendor = path.join(__dirname, '..', 'public', 'assets', 'js', 'vendor', 'hm-coach.js');
fs.mkdirSync(path.dirname(vendor), { recursive: true });
fs.writeFileSync(vendor, `/* Nguồn: hoang-mai-math H1, version ${manifest.version}, commit ${manifest.commit}. */\n` + fs.readFileSync(path.join(exportDir, 'hm-coach.js'), 'utf8'));
fs.copyFileSync(path.join(exportDir, 'goi-mo-rules.json'), path.join(path.dirname(OUT), 'goi-mo-rules.json'));
fs.writeFileSync(OUT, JSON.stringify({ source: 'fossbk-spec/hoang-mai-math', lessons, questionSets: sets, skills, practiceQuestions, practicePool, feedbackRules, coachRules: JSON.parse(fs.readFileSync(path.join(exportDir, 'goi-mo-rules.json'), 'utf8')), aiSafe }, null, 2) + '\n', 'utf8');
console.log(`Gói H1: nhập ${imported}, bỏ ${omitted}, có verification ${verified}.`);
console.log(`Đã ghi ${path.relative(process.cwd(), OUT)}: ${lessons.length} bài, ${Object.keys(sets).length} bộ, ${ids.size} câu.`);
for (const [id, s] of Object.entries(sets)) console.log(`  ${id.padEnd(22)} ${String(s.questions.length).padStart(3)} câu`);
console.log('Bỏ qua:', skipped);
