const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawn } = require('node:child_process');
const net = require('node:net');

test('API T1 với DB mới', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'math3-t1-'));
  const dbPath = path.join(dir, 'test.db');
  const port = await new Promise(resolve => { const s = net.createServer(); s.listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => resolve(p)); }); });
  const server = spawn(process.execPath, ['server/index.js'], {
    cwd: path.join(__dirname, '..'),
    env: { ...process.env, DB_PATH: dbPath, SESSION_SECRET: 'test-secret-only', ALLOW_DRAFT: 'false', PORT: String(port) },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let output = '';
  server.stdout.on('data', chunk => { output += chunk; });
  server.stderr.on('data', chunk => { output += chunk; });
  const base = `http://127.0.0.1:${port}/api`;
  async function request(route, token, method = 'GET', body) {
    const response = await fetch(base + route, { method, headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), 'Content-Type': 'application/json' }, ...(body ? { body: JSON.stringify(body) } : {}) });
    return { status: response.status, data: await response.json() };
  }
  try {
    let ready = false;
    for (let i = 0; i < 100; i++) {
      if (server.exitCode !== null) throw new Error(output);
      try { ready = (await request('/health')).status === 200; if (ready) break; } catch {}
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    assert.equal(ready, true, output);
    const student = (await request('/auth/login', null, 'POST', { username: 'hocsinh01', password: '123456' })).data.token;
    const teacher = (await request('/auth/login', null, 'POST', { username: 'giaovien01', password: '123456' })).data.token;
    assert.ok(student && teacher);
    const lessons = (await request('/lessons', student)).data.lessons;
    assert.deepEqual(lessons.map(l => l.number), [9, 10, 11, 12, 13, 14, 15]);
    assert.equal(lessons[0].page, require('../data/content/grade3.json').lessons[0].page);
    assert.ok(lessons[0].questionSets.length > 1);
    const setId = lessons[0].questionSets.find(s => s.id !== 'phieu-bai-9-10').id;
    assert.equal((await request(`/question-sets/${setId}/questions`, student)).status, 404);
    const sets = (await request('/teacher/question-sets', teacher)).data.questionSets;
    const examId = sets.find(s => s.kind === 'exam').id;
    const examBefore = await request(`/question-sets/${examId}/questions`, student);
    assert.equal(examBefore.status, 404);
    assert.equal((await request(`/teacher/question-sets/${setId}/approve-all`, teacher, 'POST', {})).status, 200);
    const qs = (await request(`/question-sets/${setId}/questions`, student)).data.questions;
    assert.ok(qs.length > 0);
    assert.ok(qs.every(q => Array.isArray(q.hints)));
    assert.ok(qs.every(q => q.correctAnswer === undefined && q.solution === undefined && q.hints_json === undefined));
    const hintSet = 'bai-13-luyen-them';
    await request(`/teacher/question-sets/${hintSet}/approve-all`, teacher, 'POST', {});
    const hinted = (await request(`/question-sets/${hintSet}/questions`, student)).data.questions;
    const imported = require('../data/content/grade3.json').questionSets[hintSet].questions;
    assert.deepEqual(hinted[0].hints, imported[0].hints);
    assert.ok(hinted[0].hints.length > 0);
    assert.equal(hinted[0].correctAnswer, undefined);
    assert.equal(hinted[0].solution, undefined);
    const aiSafe = (await request('/ai-safe', student)).data.aiSafe;
    assert.equal(aiSafe.situations.length, 6);
    const first = (await request('/submissions', student, 'POST', { setId, answers: {} })).data;
    assert.equal(first.attemptNo, 1);
    assert.equal(first.detail[0].correctAnswer, undefined);
    await request('/submissions', student, 'POST', { setId, answers: {} });
    const third = (await request('/submissions', student, 'POST', { setId, answers: {} })).data;
    assert.equal(third.attemptsLeft, 0);
    assert.ok(third.detail[0].correctAnswer !== undefined);
    assert.equal((await request('/submissions', student, 'POST', { setId, answers: {} })).status, 409);
    await request(`/teacher/question-sets/${examId}/approve-all`, teacher, 'POST', {});
    const exam = (await request('/submissions', student, 'POST', { setId: examId, answers: {} })).data;
    assert.equal(exam.maxAttempts, 1);
    assert.equal(exam.detail[0].correctAnswer, undefined);
    assert.equal(exam.detail[0].correct, undefined);
    const qid = qs[0].id;
    assert.equal((await request(`/teacher/questions/${qid}/review`, teacher, 'POST', { status: 'REJECTED' })).status, 200);
    assert.equal((await request(`/question-sets/${setId}/questions`, student)).data.questions.length, qs.length - 1);
    const own = await request(`/teacher/question-sets/${setId}/questions`, teacher, 'POST', {
      type: 'input', prompt: 'Câu kiểm thử do giáo viên soạn', correctAnswer: '1', points: 1,
    });
    assert.equal(own.status, 201);
    const ownRow = (await request(`/teacher/question-sets/${setId}/questions`, teacher)).data.questions.find(q => q.id === own.data.question.id);
    assert.equal(ownRow.review_status, 'APPROVED');
    assert.equal(ownRow.reviewed_by > 0, true);
  } finally {
    server.kill();
    await new Promise(resolve => server.once('exit', resolve));
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
