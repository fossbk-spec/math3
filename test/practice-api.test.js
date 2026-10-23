'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const express = require('express');
const data = require('../data/content/grade3.json');
const practice = require('../public/assets/js/core/practice');

test('server practice: migration DB, duyệt câu, hợp đồng demo, không lộ đáp án, lưu lịch sử', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'math3-m2-'));
  const previous = { DB_PATH: process.env.DB_PATH, ALLOW_DRAFT: process.env.ALLOW_DRAFT };
  process.env.DB_PATH = path.join(dir, 'practice.db'); process.env.ALLOW_DRAFT = 'false';
  let db, server;
  try {
    db = require('../server/db');
    const auth = require('../server/auth');
    const app = express(); app.use(express.json()); app.use(auth.attachUser(db)); app.use('/api', require('../server/api'));
    server = await new Promise((resolve, reject) => { const s = app.listen(0, '127.0.0.1', () => resolve(s)); s.on('error', reject); });
    const base = `http://127.0.0.1:${server.address().port}/api/`;
    async function call(route, token, body) {
      const response = await fetch(base + route, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify(body || {}) });
      return { status: response.status, data: await response.json() };
    }
    assert.equal((await call('practice/next')).status, 401);
    const student = (await call('auth/login', null, { username: 'hocsinh01', password: '123456' })).data.token;
    const teacher = (await call('auth/login', null, { username: 'giaovien01', password: '123456' })).data.token;
    assert.equal((await call('practice/next', student)).data.question, null);
    assert.equal((await call('practice/next', student, { lessonId: 'missing-lesson' })).status, 409);
    await call('teacher/question-sets/bai-9-co-ban/approve-all', teacher);
    const illustratedSetId = Object.keys(data.questionSets).find(id => data.questionSets[id].questions.some(q => q.illustration));
    await call(`teacher/question-sets/${illustratedSetId}/approve-all`, teacher);
    const picturedResponse = await fetch(`${base}question-sets/${illustratedSetId}/questions`, { headers: { Authorization: `Bearer ${student}` } });
    assert.equal(picturedResponse.status, 200);
    const pictured = (await picturedResponse.json()).questions.find(q => q.illustration);
    assert.deepEqual(pictured.illustration, data.questionSets[illustratedSetId].questions.find(q => q.id === pictured.id).illustration);
    assert.equal(db.prepare('SELECT illustration_json FROM questions WHERE id=?').get(pictured.id).illustration_json, JSON.stringify(pictured.illustration));
    db.prepare("UPDATE questions SET review_status='APPROVED' WHERE id LIKE 'coach-%'").run();
    const first = (await call('practice/next', student, { lessonId: 'bai-9' })).data;
    assert.ok(first.question);
    assert.equal(first.question.correctAnswer, undefined); assert.equal(first.question.correct_answer, undefined);
    assert.equal(first.question.solution, undefined); assert.equal(first.question.solution_json, undefined);
    assert.equal((await call('practice/next', student)).data.question.id, first.question.id);
    const demo = require('./helpers/demo')(); await demo('auth/login', 'POST', { role: 'student' });
    const demoNext = await demo('practice/next', 'POST', { lessonId: 'bai-9' });
    assert.deepEqual(first, demoNext);
    const q = practice.pool(data).find(q => q.id === first.question.id);
    assert.equal((await call('practice/answer', student, { questionId: q.id, answer: q.correctAnswer, attemptNo: 3, hintsUsed: 0 })).status, 409);
    for (let attemptNo = 1; attemptNo <= 3; attemptNo++) {
      const body = { questionId: q.id, answer: '__wrong__', attemptNo, hintsUsed: 0 };
      const response = await call('practice/answer', student, body);
      assert.equal(response.status, 200); assert.equal(response.data.correct, false);
      assert.equal(response.data.solution !== undefined, attemptNo === 3 && !q.solution?.length);
      assert.deepEqual(response.data, await demo('practice/answer', 'POST', body));
    }
    if (q.type === 'input' && q.solution?.length) {
      assert.equal((await call('practice/next', student)).data.guided, 'PENDING');
      const completed = await call('practice/complete', student, { questionId: q.id, answer: q.correctAnswer });
      assert.deepEqual(completed.data, await demo('practice/complete', 'POST', { questionId: q.id, answer: q.correctAnswer }));
    }
    const row = db.prepare('SELECT * FROM practice_attempts WHERE question_id=?').get(q.id);
    assert.equal(row.attempt_no, 3); assert.equal(row.completed, 1); assert.equal(row.is_correct, 0);
    assert.equal(db.prepare('SELECT COUNT(*) c FROM practice_attempts').get().c, 1);
    const next = (await call('practice/next', student)).data;
    assert.notEqual(next.question.id, q.id);
    assert.deepEqual(next, await demo('practice/next', 'POST'));
    const nextOriginal = practice.pool(data).find(q => q.id === next.question.id);
    const answer = { questionId: next.question.id, answer: nextOriginal.correctAnswer, attemptNo: 1, hintsUsed: 0 };
    assert.deepEqual((await call('practice/answer', student, answer)).data, await demo('practice/answer', 'POST', answer));
    assert.equal(db.prepare('SELECT is_correct FROM practice_attempts WHERE question_id=?').get(next.question.id).is_correct, 1);
    assert.equal((await call('practice/answer', student, answer)).status, 409);
    let sawInput = false;
    for (let i = 0; i < 6; i++) {
      const selected = (await call('practice/next', student)).data;
      assert.deepEqual(selected, await demo('practice/next', 'POST'));
      if (selected.question.type === 'input') sawInput = true;
      const original = practice.pool(data).find(q => q.id === selected.question.id);
      // Giữ cùng mức: server chỉ mở bộ cơ bản, demo có cả câu DRAFT mức cao.
      const wrong = { questionId: original.id, answer: '__wrong__', attemptNo: 1, hintsUsed: 0 };
      assert.deepEqual((await call('practice/answer', student, wrong)).data, await demo('practice/answer', 'POST', wrong));
      const body = { questionId: original.id, answer: original.correctAnswer, attemptNo: 2, hintsUsed: 0 };
      assert.deepEqual((await call('practice/answer', student, body)).data, await demo('practice/answer', 'POST', body));
    }
    assert.equal(sawInput, true);
    const pending = (await call('practice/next', student)).data;
    await call(`teacher/questions/${pending.question.id}/review`, teacher, { status: 'REJECTED' });
    assert.equal((await call('practice/next', student)).status, 409);
    assert.equal((await call('practice/answer', student, { questionId: pending.question.id, answer: '', attemptNo: 1, hintsUsed: 0 })).status, 404);
    assert.equal(db.prepare("SELECT COUNT(*) c FROM questions WHERE set_id='__practice__'").get().c, data.practiceQuestions.length);
  } finally {
    if (server) await new Promise(resolve => server.close(resolve));
    db?.close();
    for (const [key, value] of Object.entries(previous)) { if (value === undefined) delete process.env[key]; else process.env[key] = value; }
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
