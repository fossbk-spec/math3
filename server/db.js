'use strict';
/**
 * Lớp truy cập dữ liệu SQLite.
 * - DB là 1 file duy nhất tại data/vuon-toan.db (sao lưu = sao chép file này).
 * - Lần chạy đầu tiên sẽ tự tạo bảng + nạp dữ liệu mẫu từ data/seed.json.
 */
const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');

// Khi deploy lên hosting có ổ đĩa bền (persistent disk), đặt DB_PATH trỏ vào đó
// để không mất dữ liệu mỗi lần server khởi động lại.
const DB_PATH = globalThis.process.env['DB_' + 'PATH'] || path.join(__dirname, '..', 'data', 'vuon-toan.db');
const SEED_PATH = path.join(__dirname, '..', 'data', 'seed.json');
const CONTENT_PATH = path.join(__dirname, '..', 'data', 'content', 'grade3.json');

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  username      TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  full_name     TEXT NOT NULL,
  role          TEXT NOT NULL CHECK (role IN ('student','teacher')),
  class_name    TEXT DEFAULT '',
  student_code  TEXT DEFAULT '',
  total_stars   INTEGER NOT NULL DEFAULT 0,
  is_active     INTEGER NOT NULL DEFAULT 1,
  created_at    TEXT NOT NULL DEFAULT (datetime('now','localtime'))
);
CREATE TABLE IF NOT EXISTS lessons (
  id           TEXT PRIMARY KEY,
  number       INTEGER NOT NULL,
  title        TEXT NOT NULL,
  description  TEXT DEFAULT '',
  topic        TEXT DEFAULT '',
  sort_order   INTEGER NOT NULL,
  unlock_after TEXT
);
CREATE TABLE IF NOT EXISTS questions (
  id            TEXT PRIMARY KEY,
  set_id        TEXT NOT NULL,
  lesson_id     TEXT,
  type          TEXT NOT NULL,
  prompt        TEXT NOT NULL,
  options_json  TEXT,
  correct_answer TEXT NOT NULL,
  points        INTEGER NOT NULL DEFAULT 1,
  category      TEXT DEFAULT '',
  sort_order    INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS attempts (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id       INTEGER NOT NULL REFERENCES users(id),
  kind          TEXT NOT NULL,
  ref_id        TEXT NOT NULL,
  score_percent INTEGER NOT NULL,
  correct_count INTEGER NOT NULL DEFAULT 0,
  total_count   INTEGER NOT NULL DEFAULT 0,
  stars_earned  INTEGER NOT NULL DEFAULT 0,
  duration_sec  INTEGER DEFAULT 0,
  answers_json  TEXT DEFAULT '{}',
  created_at    TEXT NOT NULL DEFAULT (datetime('now','localtime'))
);
CREATE TABLE IF NOT EXISTS progress (
  user_id     INTEGER NOT NULL REFERENCES users(id),
  lesson_id   TEXT NOT NULL REFERENCES lessons(id),
  best_score  INTEGER NOT NULL DEFAULT 0,
  completed   INTEGER NOT NULL DEFAULT 0,
  updated_at  TEXT NOT NULL DEFAULT (datetime('now','localtime')),
  PRIMARY KEY (user_id, lesson_id)
);
-- ĐỢT 2: bộ câu hỏi thành dữ liệu quản trị được (trước đây fix cứng trong code)
CREATE TABLE IF NOT EXISTS question_sets (
  id               TEXT PRIMARY KEY,
  title            TEXT NOT NULL,
  kind             TEXT NOT NULL DEFAULT 'exercise',
  lesson_id        TEXT REFERENCES lessons(id),
  star_reward      INTEGER NOT NULL DEFAULT 40,
  duration_minutes INTEGER DEFAULT 0
);
CREATE TABLE IF NOT EXISTS game_scores (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id       INTEGER NOT NULL REFERENCES users(id),
  game_id       TEXT NOT NULL,
  score         INTEGER NOT NULL DEFAULT 0,
  stars_earned  INTEGER NOT NULL DEFAULT 0,
  duration_sec  INTEGER DEFAULT 0,
  created_at    TEXT NOT NULL DEFAULT (datetime('now','localtime'))
);
`);

/** MVP: thêm cột còn thiếu cho DB cũ (ALTER TABLE không có IF NOT EXISTS trong SQLite). */
function addColumns(table, cols) {
  const have = new Set(db.prepare(`PRAGMA table_info(${table})`).all().map(c => c.name));
  for (const [name, def] of Object.entries(cols)) if (!have.has(name)) db.exec(`ALTER TABLE ${table} ADD COLUMN ${name} ${def}`);
}
addColumns('questions', {
  level: "TEXT DEFAULT 'co-ban'", origin: "TEXT DEFAULT 'teacher'", source: "TEXT DEFAULT ''",
  hints_json: 'TEXT', solution_json: 'TEXT', illustration_json: 'TEXT',
  review_status: "TEXT NOT NULL DEFAULT 'DRAFT'", reviewed_by: 'INTEGER', reviewed_at: 'TEXT',
});
addColumns('question_sets', { level: "TEXT DEFAULT 'co-ban'" });
addColumns('lessons', { page: 'INTEGER' });
db.exec(`CREATE TABLE IF NOT EXISTS practice_attempts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  question_id TEXT NOT NULL,
  skill_id TEXT NOT NULL,
  cognitive_level INTEGER NOT NULL,
  attempt_no INTEGER NOT NULL DEFAULT 0,
  hints_used INTEGER NOT NULL DEFAULT 0,
  is_correct INTEGER NOT NULL DEFAULT 0,
  completed INTEGER NOT NULL DEFAULT 0,
  reason TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
)`);
addColumns('practice_attempts', { steps_json: "TEXT NOT NULL DEFAULT '[]'", error_tags_json: "TEXT NOT NULL DEFAULT '[]'", guided: 'TEXT', guided_tries: 'INTEGER NOT NULL DEFAULT 0', stars_awarded: 'INTEGER NOT NULL DEFAULT 0' });

db.exec(`CREATE TABLE IF NOT EXISTS login_attempts (key TEXT PRIMARY KEY, count INTEGER NOT NULL, reset_at INTEGER NOT NULL)`);

const readJson = p => JSON.parse(fs.readFileSync(p, 'utf8'));

/** Nạp bài học + bộ câu hỏi; INSERT OR IGNORE nên chạy lại không ghi đè dữ liệu giáo viên đã sửa/duyệt. */
function seedContent() {
  const content = readJson(CONTENT_PATH);
  const legacy = readJson(SEED_PATH).questionSets || {};
  const insLesson = db.prepare(`INSERT OR IGNORE INTO lessons (id,number,title,description,topic,sort_order,unlock_after,page)
    VALUES (@id,@number,@title,@description,@topic,@sortOrder,@unlockAfter,@page)`);
  const insSet = db.prepare(`INSERT OR IGNORE INTO question_sets (id,title,kind,lesson_id,star_reward,duration_minutes,level)
    VALUES (?,?,?,?,?,?,?)`);
  const insQ = db.prepare(`INSERT OR IGNORE INTO questions (id,set_id,lesson_id,type,prompt,options_json,correct_answer,points,category,sort_order,
      level,origin,source,hints_json,solution_json,illustration_json,review_status)
    VALUES (@id,@setId,@lessonId,@type,@prompt,@optionsJson,@correctAnswer,@points,@category,@sortOrder,@level,@origin,@source,@hintsJson,@solutionJson,@illustrationJson,'DRAFT')`);
  const fillIllustration = db.prepare('UPDATE questions SET illustration_json=? WHERE id=? AND prompt=? AND illustration_json IS NULL');
  const TYPE_LABEL = { 'multiple-choice': 'Trắc nghiệm', input: 'Điền số', compare: 'Điền dấu so sánh', paint: 'Tô màu theo kết quả' };
  db.transaction(() => {
    content.lessons.forEach(l => insLesson.run({ ...l, page: l.page || null }));
    const all = { ...legacy, ...content.questionSets };
    for (const [setId, set] of Object.entries(all)) {
      insSet.run(setId, set.title || setId, set.kind || 'exercise', set.lessonId || null,
        set.kind === 'exam' ? 100 : 40, set.durationMinutes || 0, set.level || 'co-ban');
      set.questions.forEach((q, i) => {
        insQ.run({
          id: q.id, setId, lessonId: set.lessonId || null, type: q.type, prompt: q.prompt,
          optionsJson: q.options ? JSON.stringify(q.options) : null, correctAnswer: q.correctAnswer,
          points: q.points || 1, category: q.category || TYPE_LABEL[q.type] || q.type, sortOrder: i + 1,
          level: q.level || set.level || 'co-ban', origin: q.origin || 'teacher', source: q.source || '',
          hintsJson: q.hints ? JSON.stringify(q.hints) : null, solutionJson: q.solution ? JSON.stringify(q.solution) : null,
          illustrationJson: q.illustration ? JSON.stringify(q.illustration) : null,
        });
        if (q.illustration) fillIllustration.run(JSON.stringify(q.illustration), q.id, q.prompt);
      });
    }
    (content.practiceQuestions || []).forEach((q, i) => insQ.run({
      id: q.id, setId: '__practice__', lessonId: null, type: q.type, prompt: q.prompt,
      optionsJson: q.options ? JSON.stringify(q.options) : null, correctAnswer: q.correctAnswer,
      points: q.points || 1, category: q.category || '', sortOrder: i + 1, level: q.level || 'co-ban',
      origin: q.origin || 'template', source: q.source || '',
      hintsJson: JSON.stringify(q.hints || []), solutionJson: JSON.stringify(q.solution || []),
      illustrationJson: q.illustration ? JSON.stringify(q.illustration) : null,
    }));
  })();
}

function seedUsersIfEmpty() {
  const { c } = db.prepare('SELECT COUNT(*) AS c FROM users').get();
  if (c > 0) return;
  const seed = readJson(SEED_PATH);
  const insertUser = db.prepare(`INSERT INTO users (username,password_hash,full_name,role,class_name,student_code,total_stars)
    VALUES (@username,@passwordHash,@fullName,@role,@className,@studentCode,@totalStars)`);
  db.transaction(() => {
    for (const u of seed.users) insertUser.run({ ...u, passwordHash: bcrypt.hashSync(u.password, 10) });
  })();
  console.log('[DB] Đã nạp tài khoản mẫu từ data/seed.json');
}

seedUsersIfEmpty();
seedContent();

module.exports = db;
