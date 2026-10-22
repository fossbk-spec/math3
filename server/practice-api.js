'use strict';
const practice = require('../public/assets/js/core/practice');
const content = require('../data/content/grade3.json');
const coachRules = require('../data/content/goi-mo-rules.json');
const stars = require('../public/assets/js/core/stars');

module.exports = function registerPractice(router, db, requireAuth, lessonsWithProgress, allowDraft) {
  function bank() {
    const rows = new Map(db.prepare('SELECT * FROM questions').all().map(q => [q.id, q]));
    return practice.pool(content).flatMap(q => {
      const row = rows.get(q.id);
      return row ? [{ ...q, prompt: row.prompt, type: row.type, correctAnswer: row.correct_answer,
        options: JSON.parse(row.options_json || 'null'), hints: JSON.parse(row.hints_json || '[]'),
        solution: JSON.parse(row.solution_json || '[]'), reviewStatus: row.review_status }] : [];
    });
  }
  function history(userId) {
    return db.prepare('SELECT * FROM practice_attempts WHERE user_id=? ORDER BY id').all(userId).map(a => ({
      id: a.id, questionId: a.question_id, skillId: a.skill_id, cognitiveLevel: a.cognitive_level,
      attemptNo: a.attempt_no, hintsUsed: a.hints_used, isCorrect: !!a.is_correct, completed: !!a.completed, reason: a.reason,
      steps: JSON.parse(a.steps_json || '[]'), errorTags: JSON.parse(a.error_tags_json || '[]'), guided: a.guided, guidedTries: a.guided_tries, starsAwarded: !!a.stars_awarded,
    }));
  }
  router.post('/practice/next', requireAuth, (req, res) => {
    try {
      const entries = history(req.user.id);
      const result = practice.next(content, bank(), entries, lessonsWithProgress(req.user.id), req.body?.lessonId, allowDraft);
      if (result.question && !entries.some(a => !a.completed || a.guided === 'PENDING')) {
        const q = result.question;
        db.prepare('INSERT INTO practice_attempts (user_id,question_id,skill_id,cognitive_level,reason) VALUES (?,?,?,?,?)')
          .run(req.user.id, q.id, q.skillId, q.cognitiveLevel, result.reason);
      }
      res.json({ ...result, question: practice.studentQuestion(result.question), feedbackRules: content.feedbackRules });
    } catch (e) { res.status(e.status || 400).json({ error: e.message }); }
  });
  router.post('/practice/answer', requireAuth, (req, res) => {
    try {
      const body = req.body || {};
      const entry = history(req.user.id).find(a => !a.completed);
      const q = bank().find(q => q.id === body.questionId && q.reviewStatus !== 'REJECTED' && (allowDraft || q.reviewStatus === 'APPROVED'));
      if (!q) return res.status(404).json({ error: 'Không tìm thấy câu đang mở.' });
      const { updated: a, response } = practice.answer(q, entry, body);
      const starsEarned = stars.practice(entry.starsAwarded, response.correct, null);
      db.transaction(() => {
        db.prepare('UPDATE practice_attempts SET attempt_no=?,hints_used=?,is_correct=?,completed=?,steps_json=?,error_tags_json=?,guided=?,guided_tries=?,stars_awarded=? WHERE id=? AND user_id=?')
          .run(a.attemptNo, a.hintsUsed, Number(a.isCorrect), Number(a.completed), JSON.stringify(a.steps), JSON.stringify(a.errorTags), a.guided, a.guidedTries || 0, Number(entry.starsAwarded || !!starsEarned), a.id, req.user.id);
        if (starsEarned) db.prepare('UPDATE users SET total_stars=total_stars+? WHERE id=?').run(starsEarned, req.user.id);
      })();
      const totalStars = db.prepare('SELECT total_stars FROM users WHERE id=?').get(req.user.id).total_stars;
      res.json({ ...response, starsEarned, totalStars });
    } catch (e) { res.status(e.status || 400).json({ error: e.message }); }
  });
  router.post('/practice/complete', requireAuth, (req, res) => {
    try {
      const body = req.body || {};
      const entry = history(req.user.id).find(a => a.guided === 'PENDING');
      const q = bank().find(q => q.id === body.questionId && q.reviewStatus !== 'REJECTED' && (allowDraft || q.reviewStatus === 'APPROVED'));
      if (!q) return res.status(404).json({ error: 'Không tìm thấy câu đang mở.' });
      const { updated, response } = practice.complete(q, entry, body, coachRules);
      const starsEarned = stars.practice(entry.starsAwarded, false, response.guided);
      db.transaction(() => {
        db.prepare('UPDATE practice_attempts SET guided=?,guided_tries=?,stars_awarded=? WHERE id=? AND user_id=?')
          .run(updated.guided, updated.guidedTries, Number(entry.starsAwarded || !!starsEarned), updated.id, req.user.id);
        if (starsEarned) db.prepare('UPDATE users SET total_stars=total_stars+? WHERE id=?').run(starsEarned, req.user.id);
      })();
      const totalStars = db.prepare('SELECT total_stars FROM users WHERE id=?').get(req.user.id).total_stars;
      res.json({ ...response, starsEarned, totalStars });
    } catch (e) { res.status(e.status || 400).json({ error: e.message }); }
  });
};
