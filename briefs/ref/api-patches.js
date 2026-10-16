module.exports = [
[`const bcrypt = require('bcryptjs');`, `const crypto = require('crypto');
const bcrypt = require('bcryptjs');`],
[`const router = express.Router();
const publicUser`, `const router = express.Router();
const env = globalThis.process.env;
const str = v => (v == null ? '' : String(v));
// Bản demo cho phép học sinh làm câu DRAFT (chưa duyệt); dùng thật thì đặt ALLOW_DRAFT=false
const ALLOW_DRAFT = env.ALLOW_DRAFT !== 'false';
const MAX_ATTEMPTS = Math.max(1, parseInt(env.MAX_ATTEMPTS, 10) || 3); // YC 6: làm lại 2–3 lần
// YC 5: ngưỡng nhận xét TẠM — chờ giáo viên chốt
const COMMENT_GOOD = parseInt(env.COMMENT_GOOD, 10) || 90;
const COMMENT_PASS = parseInt(env.COMMENT_PASS, 10) || 50;
const visibleClause = ALLOW_DRAFT ? "review_status != 'REJECTED'" : "review_status = 'APPROVED'";
/** Chuẩn hoá đáp án: bỏ khoảng trắng, dấu chấm phân cách hàng nghìn (9.721 = 9721), không phân biệt hoa thường. */
const norm = v => str(v).trim().toLowerCase().replace(/\s+/g, '').replace(/(\d)\.(?=\d{3}(\D|$))/g, '$1');
const commentFor = p => (p >= COMMENT_GOOD ? 'Hoàn thành rất tốt' : p >= COMMENT_PASS ? 'Hoàn thành' : 'Cố gắng hơn');
const publicUser`],
[`router.post('/auth/login', (req, res) => {
  const { username = '', password = '', role } = req.body || {};
  const user = db.prepare('SELECT * FROM users WHERE username=? AND is_active=1').get(String(username).trim());
  if (!user || !bcrypt.compareSync(String(password), user.password_hash)) {
    return res.status(401)`, `/* Chống dò mật khẩu: tối đa 10 lần sai / 15 phút cho mỗi cặp tên đăng nhập + IP */
const LOGIN_MAX = 10, LOGIN_WINDOW_MS = 15 * 60 * 1000;
function loginBlocked(key) {
  const r = db.prepare('SELECT * FROM login_attempts WHERE key=?').get(key);
  return r && r.reset_at > Date.now() && r.count >= LOGIN_MAX;
}
function loginFailed(key) {
  const r = db.prepare('SELECT * FROM login_attempts WHERE key=?').get(key);
  if (!r || r.reset_at <= Date.now()) db.prepare('INSERT OR REPLACE INTO login_attempts (key,count,reset_at) VALUES (?,1,?)').run(key, Date.now() + LOGIN_WINDOW_MS);
  else db.prepare('UPDATE login_attempts SET count=count+1 WHERE key=?').run(key);
}
router.post('/auth/login', (req, res) => {
  const { username = '', password = '', role } = req.body || {};
  const key = `${str(username).trim().toLowerCase()}|${req.ip}`;
  if (loginBlocked(key)) return res.status(429).json({ error: 'Em nhập sai nhiều lần quá. Đợi 15 phút rồi thử lại, hoặc nhờ thầy/cô nhé!' });
  const user = db.prepare('SELECT * FROM users WHERE username=? AND is_active=1').get(str(username).trim());
  if (!user || !bcrypt.compareSync(str(password), user.password_hash)) {
    loginFailed(key);
    return res.status(401)`],
[`  const rows = db.prepare('SELECT id,type,prompt,options_json,points,category FROM questions WHERE set_id=? ORDER BY sort_order').all(req.params.setId);`,
 `  const rows = db.prepare(\`SELECT id,type,prompt,options_json,points,category,level FROM questions WHERE set_id=? AND \${visibleClause} ORDER BY sort_order\`).all(req.params.setId);`],
[`  const questions = db.prepare('SELECT * FROM questions WHERE set_id=? ORDER BY sort_order').all(setId);
  let earned = 0, max = 0, correct = 0;
  const detail = questions.map(q => {
    max += q.points;
    const given = answers[q.id] == null ? '' : String(answers[q.id]).trim().toLowerCase();
    const ok = given === String(q.correct_answer).trim().toLowerCase();
    if (ok) { earned += q.points; correct++; }
    return { questionId: q.id, correct: ok, correctAnswer: q.correct_answer };
  });
  const percent = max ? Math.round((earned / max) * 100) : 0;`,
 `  if (!answers || typeof answers !== 'object' || Array.isArray(answers)) return res.status(400).json({ error: 'Bài nộp không hợp lệ.' });
  // YC 6: giới hạn số lượt; bài kiểm tra chỉ 1 lượt
  const maxAttempts = meta.kind === 'exam' ? 1 : MAX_ATTEMPTS;
  const used = db.prepare('SELECT COUNT(*) AS c FROM attempts WHERE user_id=? AND ref_id=?').get(req.user.id, setId).c;
  if (used >= maxAttempts) {
    return res.status(409).json({ error: meta.kind === 'exam' ? 'Em đã nộp bài kiểm tra này rồi.' : \`Em đã làm đủ \${maxAttempts} lượt cho bộ bài này.\` });
  }
  const attemptNo = used + 1;
  const lastAttempt = attemptNo >= maxAttempts;
  const questions = db.prepare(\`SELECT * FROM questions WHERE set_id=? AND \${visibleClause} ORDER BY sort_order\`).all(setId);
  let earned = 0, max = 0, correct = 0;
  const detail = questions.map(q => {
    max += q.points;
    const ok = answers[q.id] != null && norm(answers[q.id]) !== '' && norm(answers[q.id]) === norm(q.correct_answer);
    if (ok) { earned += q.points; correct++; }
    // YC 7 – bài chữa: đáp án + lời giải chỉ hiện ở lượt luyện tập cuối; bài kiểm tra không trả đáp án
    const reveal = meta.kind !== 'exam' && lastAttempt;
    return { questionId: q.id, correct: meta.kind === 'exam' ? undefined : ok,
      correctAnswer: reveal ? q.correct_answer : undefined,
      solution: reveal && q.solution_json ? JSON.parse(q.solution_json) : undefined };
  });
  const percent = max ? Math.round((earned / max) * 100) : 0;`],
[`  res.json({ scorePercent: percent, correctCount: correct, totalCount: questions.length, starsEarned, totalStars: me.total_stars, detail });`,
 `  res.json({ scorePercent: percent, correctCount: correct, totalCount: questions.length, starsEarned, totalStars: me.total_stars,
    comment: commentFor(percent), attemptNo, maxAttempts, attemptsLeft: maxAttempts - attemptNo, detail });`],
[`  const { username = '', password = '', fullName = '', className = '3A', studentCode = '' } = req.body || {};
  if (!username.trim() || !fullName.trim() || String(password).length < 4) {`,
 `  const b = req.body || {};
  const username = str(b.username), password = str(b.password), fullName = str(b.fullName), className = str(b.className || '3A'), studentCode = str(b.studentCode);
  if (!username.trim() || !fullName.trim() || password.length < 4) {`],
[`const GAME_IDS = ['game-bong-bay', 'game-dua-xe', 'game-lat-the', 'game-cau-ca'];`,
 `// Điểm tối đa đạt được của từng game (theo luật chơi trong public/assets/js/pages/game*.js) — chặn điểm giả gửi từ trình duyệt
const GAME_MAX = { 'game-bong-bay': 300, 'game-dua-xe': 1500, 'game-lat-the': 200, 'game-cau-ca': 300 };
const GAME_IDS = Object.keys(GAME_MAX);
const GAME_STARS_PER_PLAY = 10, GAME_STARS_PER_DAY = 30;`],
[`  const raw = Math.max(0, Math.min(100000, Math.round(Number(score) || 0)));
  const prev = db.prepare('SELECT MAX(score) AS best FROM game_scores WHERE user_id=? AND game_id=?').get(req.user.id, gameId);
  const prevBest = prev && prev.best ? prev.best : 0;
  // Sao chỉ cộng theo phần điểm vượt kỷ lục cũ (mỗi 10 điểm = 1 sao, tối đa 50 sao/lượt phá kỷ lục)
  const starsEarned = Math.min(50, Math.ceil(Math.max(0, raw - prevBest) / 10));`,
 `  const raw = Math.round(Number(score) || 0);
  if (raw < 0 || raw > GAME_MAX[gameId]) return res.status(400).json({ error: 'Điểm trò chơi không hợp lệ.' });
  const prev = db.prepare('SELECT MAX(score) AS best FROM game_scores WHERE user_id=? AND game_id=?').get(req.user.id, gameId);
  const prevBest = prev && prev.best ? prev.best : 0;
  // YC 9: trò chơi không tính vào đánh giá; sao chỉ để động viên — theo phần vượt kỷ lục, tối đa 10 sao/lượt, 30 sao/ngày
  const today = db.prepare("SELECT COALESCE(SUM(stars_earned),0) AS s FROM game_scores WHERE user_id=? AND date(created_at)=date('now','localtime')").get(req.user.id).s;
  const starsEarned = Math.max(0, Math.min(GAME_STARS_PER_PLAY, GAME_STARS_PER_DAY - today, Math.ceil(Math.max(0, raw - prevBest) / 10)));`],
[`    db.prepare(\`INSERT INTO attempts (user_id,kind,ref_id,score_percent,correct_count,total_count,stars_earned,duration_sec,answers_json)
      VALUES (?, 'game', ?, ?, 0, 0, ?, ?, '{}')\`).run(req.user.id, gameId, raw, starsEarned, Number(durationSec) || 0);
`, ``],
[`  const { number, title = '', description = '', topic = '', unlockAfter = null } = req.body || {};
  const num = parseInt(number, 10);`,
 `  const b = req.body || {};
  const number = b.number, title = str(b.title), description = str(b.description), topic = str(b.topic), unlockAfter = b.unlockAfter || null;
  const num = parseInt(number, 10);`],
[`  const { title = '', description = '', topic = '', unlockAfter = null } = req.body || {};
  if (!title.trim()) return res.status(400).json({ error: 'Tên bài học không được trống.' });`,
 `  const b = req.body || {};
  const title = str(b.title), description = str(b.description), topic = str(b.topic), unlockAfter = b.unlockAfter || null;
  if (!title.trim()) return res.status(400).json({ error: 'Tên bài học không được trống.' });`],
[`  const { id = '', title = '', kind = 'exercise', lessonId = null, starReward = 40, durationMinutes = 0 } = req.body || {};`,
 `  const b = req.body || {};
  const id = str(b.id), title = str(b.title), kind = b.kind, lessonId = b.lessonId || null, starReward = b.starReward ?? 40, durationMinutes = b.durationMinutes ?? 0;`],
[`  const { type = 'multiple-choice', prompt = '', options, correctAnswer = '', points = 5, category = '' } = req.body || {};
  if (!prompt.trim() || !String(correctAnswer).trim()) return res.status(400).json({ error: 'Cần nội dung câu hỏi và đáp án đúng.' });
  if (type === 'multiple-choice'`,
 `  const b = req.body || {};
  const type = ['multiple-choice', 'input', 'compare', 'paint'].includes(b.type) ? b.type : 'multiple-choice';
  const prompt = str(b.prompt), options = Array.isArray(b.options) ? b.options.map(str) : undefined, correctAnswer = str(b.correctAnswer), points = b.points ?? 5, category = str(b.category);
  if (!prompt.trim() || !correctAnswer.trim()) return res.status(400).json({ error: 'Cần nội dung câu hỏi và đáp án đúng.' });
  if (type === 'multiple-choice'`],
[`  const id = \`q-\${Date.now().toString(36)}\`;`, `  const id = \`q-\${crypto.randomUUID()}\`;`],
[`  db.prepare('INSERT INTO questions (id,set_id,lesson_id,type,prompt,options_json,correct_answer,points,category,sort_order) VALUES (?,?,?,?,?,?,?,?,?,?)')
    .run(id, req.params.id, set.lesson_id, type, prompt.trim(), options ? JSON.stringify(options) : null, String(correctAnswer).trim(), Number(points) || 1, String(category).trim(), maxSort + 1);`,
 `  // Câu giáo viên tự soạn: giáo viên chịu trách nhiệm đáp án nên được tính là đã duyệt bởi chính giáo viên đó
  db.prepare(\`INSERT INTO questions (id,set_id,lesson_id,type,prompt,options_json,correct_answer,points,category,sort_order,origin,review_status,reviewed_by,reviewed_at)
    VALUES (?,?,?,?,?,?,?,?,?,?,'teacher','APPROVED',?,datetime('now','localtime'))\`)
    .run(id, req.params.id, set.lesson_id, type, prompt.trim(), options ? JSON.stringify(options) : null, correctAnswer.trim(), Number(points) || 1, category.trim(), maxSort + 1, req.user.id);`],
[`  const { prompt = '', options, correctAnswer = '', points = 5, category = '' } = req.body || {};
  if (!prompt.trim() || !String(correctAnswer).trim()) return res.status(400).json({ error: 'Cần nội dung câu hỏi và đáp án đúng.' });
  const info = db.prepare('UPDATE questions SET prompt=?,options_json=?,correct_answer=?,points=?,category=? WHERE id=?')
    .run(prompt.trim(), options ? JSON.stringify(options) : null, String(correctAnswer).trim(), Number(points) || 1, String(category).trim(), req.params.id);`,
 `  const b = req.body || {};
  const prompt = str(b.prompt), options = Array.isArray(b.options) ? b.options.map(str) : undefined, correctAnswer = str(b.correctAnswer), points = b.points ?? 5, category = str(b.category);
  if (!prompt.trim() || !correctAnswer.trim()) return res.status(400).json({ error: 'Cần nội dung câu hỏi và đáp án đúng.' });
  const info = db.prepare(\`UPDATE questions SET prompt=?,options_json=?,correct_answer=?,points=?,category=?,
      review_status='APPROVED',reviewed_by=?,reviewed_at=datetime('now','localtime') WHERE id=?\`)
    .run(prompt.trim(), options ? JSON.stringify(options) : null, correctAnswer.trim(), Number(points) || 1, category.trim(), req.user.id, req.params.id);`],
[`router.delete('/teacher/questions/:id', requireTeacher, (req, res) => {`,
 `/* Duyệt câu hỏi (hoang-mai-math: DRAFT -> APPROVED/REJECTED chỉ do giáo viên, lưu người duyệt + thời điểm) */
const REVIEW = ['DRAFT', 'APPROVED', 'REJECTED'];
router.post('/teacher/questions/:id/review', requireTeacher, (req, res) => {
  const status = str((req.body || {}).status).toUpperCase();
  if (!REVIEW.includes(status)) return res.status(400).json({ error: 'Trạng thái không hợp lệ.' });
  const info = db.prepare("UPDATE questions SET review_status=?,reviewed_by=?,reviewed_at=datetime('now','localtime') WHERE id=?").run(status, req.user.id, req.params.id);
  if (!info.changes) return res.status(404).json({ error: 'Không tìm thấy câu hỏi.' });
  res.json({ ok: true, status });
});
router.post('/teacher/question-sets/:id/approve-all', requireTeacher, (req, res) => {
  const info = db.prepare("UPDATE questions SET review_status='APPROVED',reviewed_by=?,reviewed_at=datetime('now','localtime') WHERE set_id=? AND review_status='DRAFT'").run(req.user.id, req.params.id);
  res.json({ ok: true, approved: info.changes });
});
router.delete('/teacher/questions/:id', requireTeacher, (req, res) => {`],
[`  const esc = v => \`"\${String(v == null ? '' : v).replace(/"/g, '""')}"\`;`,
 `  // Chặn "formula injection" khi mở CSV bằng Excel (ô bắt đầu bằng = + - @)
  const esc = v => \`"\${String(v == null ? '' : v).replace(/^([=+\\-@])/, "'$1").replace(/"/g, '""')}"\`;`],
];
