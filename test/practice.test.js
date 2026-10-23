'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const demoClient = require('./helpers/demo');
const data = require('../data/content/grade3.json');
const practice = require('../public/assets/js/core/practice');
const grading = require('../public/assets/js/core/grading');
const view = require('../public/assets/js/core/question-view');

test('nhận xét và lời giáo viên đúng tại ngưỡng 80/50; đề kiểm tra giữ ngưỡng cũ', () => {
  for (const [percent, index] of [[100, 0], [80, 0], [79, 1], [50, 1], [49, 2], [0, 2]]) {
    assert.equal(grading.commentFor(percent, data.feedbackRules), data.feedbackRules.summary[index].label);
    assert.equal(grading.feedbackFor(percent, data.feedbackRules).message, data.feedbackRules.summary[index].message);
  }
  const custom = { summary: [{ min: .6, label: 'A', message: 'B' }, { min: 0, label: 'C', message: 'D' }] };
  assert.equal(grading.commentFor(60, custom), 'A'); assert.equal(grading.commentFor(59, custom), 'C');
  const questions = Array.from({ length: 5 }, (_, i) => ({ ...practice.pool(data)[i], points: 1 }));
  const answers = Object.fromEntries(questions.slice(0, 4).map(q => [q.id, q.correctAnswer]));
  assert.equal(grading.gradeSubmission(questions, answers, { feedbackRules: data.feedbackRules }).comment, data.feedbackRules.summary[0].label);
  assert.equal(grading.gradeSubmission(questions, answers, { kind: 'exam' }).comment, data.feedbackRules.summary[1].label);
});

test('demo practice: lưu câu đang làm, 3 lần thử, bài chữa, không lặp; tách học sinh', async () => {
  const call = demoClient();
  await call('auth/login', 'POST', { role: 'student' });
  await assert.rejects(call('practice/next', 'POST', { lessonId: 'missing-lesson' }));
  const first = await call('practice/next', 'POST', { lessonId: 'bai-9' });
  assert.ok(first.question); assert.ok(first.reason); assert.deepEqual(first.feedbackRules, data.feedbackRules);
  assert.equal(first.question.correctAnswer, undefined); assert.equal(first.question.solution, undefined);
  assert.equal((await call('practice/next', 'POST')).question.id, first.question.id);
  const q = practice.pool(data).find(q => q.id === first.question.id);
  await assert.rejects(call('practice/answer', 'POST', { questionId: q.id, answer: q.correctAnswer, attemptNo: 3, hintsUsed: 0 }));
  for (let attemptNo = 1; attemptNo <= 3; attemptNo++) {
    const result = await call('practice/answer', 'POST', { questionId: q.id, answer: '__wrong__', attemptNo, hintsUsed: Math.min(attemptNo, (q.hints || []).length) });
    assert.equal(result.correct, false);
    assert.equal(result.solution !== undefined, attemptNo === 3 && result.guided !== 'PENDING');
    assert.equal(result.correctAnswer !== undefined, attemptNo === 3 && result.guided !== 'PENDING');
    if (attemptNo === 1) assert.equal((await call('practice/next', 'POST')).attemptNo, 1);
    if (attemptNo === 3 && result.guided === 'PENDING') {
      assert.equal((await call('practice/next', 'POST')).guided, 'PENDING');
      const done = await call('practice/complete', 'POST', { questionId: q.id, answer: q.correctAnswer });
      assert.equal(done.guided, 'DONE');
    }
  }
  await assert.rejects(call('practice/answer', 'POST', { questionId: q.id, answer: q.correctAnswer, attemptNo: 4, hintsUsed: 0 }));
  const next = (await call('practice/next', 'POST')).question;
  assert.notEqual(next.id, q.id);
  const original = practice.pool(data).find(q => q.id === next.id);
  const right = await call('practice/answer', 'POST', { questionId: next.id, answer: original.correctAnswer, attemptNo: 1, hintsUsed: 0 });
  assert.equal(right.correct, true); assert.deepEqual(right.solution, original.solution || []);
  await call('auth/logout', 'POST');
  await assert.rejects(call('practice/next', 'POST'), e => e.status === 401);
  await call('auth/login', 'POST', { role: 'teacher' });
  await call('teacher/students', 'POST', { username: 'alias-test', fullName: 'Bạn Thỏ' });
  await call('auth/login', 'POST', { username: 'alias-test', role: 'student' });
  assert.equal((await call('practice/next', 'POST')).question.id, first.question.id);
});

test('tất cả bài đã học chỉ chọn trong bài hoàn thành, vẫn có câu ôn tiền đề', () => {
  const bank = practice.pool(data);
  const lessons = data.lessons.map(l => ({ ...l, completed: l.id === 'bai-13', locked: false }));
  assert.equal(practice.next(data, bank, [], lessons).question.lessonId, 'bai-13');
});

test('trang practice: một câu mỗi lần, đủ 10 câu, gợi ý, thử lại, bài chữa và nhận xét', async () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const vm = require('node:vm');
  let call = demoClient(); await call('auth/login', 'POST', { role: 'student' });
  const nodes = new Map();
  const node = () => ({ hidden: false, disabled: false, value: '', textContent: '', children: [], listeners: {},
    addEventListener(type, fn) { this.listeners[type] = fn; }, querySelector() { return { hidden: false }; }, append(...children) { this.children.push(...children); },
    replaceChildren(...children) { this.children = children; }, get childElementCount() { return this.children.length; }, querySelectorAll() { return []; } });
  const get = id => { if (!nodes.has(id)) nodes.set(id, node()); return nodes.get(id); };
  const document = { getElementById: get, createElement: node, addEventListener(type, fn) { this[type] = fn; } };
  let rendered, selected = 0;
  const events = [];
  const window = { MathAPI: {
    get: route => call(route.replace('/api/', '')),
    post: (route, body) => { if (route.endsWith('/next')) selected++; return call(route.replace('/api/', ''), 'POST', body); },
  }, MathGrading: grading, MathAnalytics: { track(type, metadata) { events.push({ type, ...metadata }); } },
  MathQuestionView: { formatAnswer: view.formatAnswer,
    render(container, questions, answers, updateProgress, options) {
      assert.equal(questions.length, 1); assert.equal(options.hideLabel, true);
      rendered = { question: questions[0], answers };
    } } };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../public/assets/js/pages/practice.js'), 'utf8'), { window, document });
  await document['mathapp:user-ready']();
  get('practice-lesson').value = 'bai-9';
  await get('practice-start').listeners.click();
  for (let i = 0; i < 10; i++) {
    const original = practice.pool(data).find(q => q.id === rendered.question.id);
    rendered.answers[original.id] = '__wrong__';
    await get('practice-answer').listeners.click();
    assert.equal(get('practice-answer').disabled, false);
    if (i === 0) {
      await get('practice-answer').listeners.click(); await get('practice-answer').listeners.click();
      const said = get('practice-message').textContent;
      if (said.includes('Em điền số còn thiếu')) {
        get('practice-missing').value = original.correctAnswer;
        await get('practice-complete').listeners.click();
      } else if (said.includes('Em chọn lại')) {
        // Trắc nghiệm, so sánh: bước 3 là chọn lại (H3).
        await get('practice-rechoose').listeners.click({ target: { closest: () => ({ dataset: { answer: original.correctAnswer } }) } });
      } else assert.ok(said.includes('Đáp án'), `bước 3 không che được thì giữ cách cũ: ${said}`);
      assert.equal(get('practice-answer').disabled, true);
    } else {
      rendered.answers[original.id] = original.correctAnswer;
      await get('practice-answer').listeners.click();
    }
    await get('practice-next').listeners.click();
  }
  assert.equal(selected, 10); assert.equal(get('practice-result').hidden, false);
  // Nhận xét cuối lượt: mức đứng đầu, sau đó là số câu và lời nhận xét.
  const summary = get('practice-summary');
  const summaryText = summary.children.map(child => child.textContent).join('');
  assert.equal(summary.children[0].textContent, data.feedbackRules.summary[0].label);
  assert.match(summaryText, /9\/10/);
  assert.ok(summaryText.includes(data.feedbackRules.summary[0].message));
  assert.equal(get('practice-corrections').childElementCount, 10);
  const first = get('practice-corrections').children[0];
  const firstOriginal = practice.pool(data).find(q => q.prompt === first.children[0].textContent);
  assert.match(first.children[1].textContent, /Em đã tự|Em xem kỹ/);
  assert.ok(first.children[2].textContent.includes(`Đáp án: ${view.formatAnswer(firstOriginal, firstOriginal.correctAnswer)}`));
  // Ca riêng với pool câu có gợi ý, vẫn dùng nguyên câu/đáp án nhập từ nguồn.
  call = demoClient({ ...data, practicePool: practice.pool(data).filter(q => q.hints?.length).map(q => q.id) });
  await call('auth/login', 'POST', { role: 'student' });
  get('practice-again').listeners.click(); get('practice-lesson').value = 'bai-13';
  await get('practice-start').listeners.click();
  const hinted = practice.pool(data).find(q => q.id === rendered.question.id);
  for (let i = 0; i < 3; i++) get('practice-hint').listeners.click();
  assert.equal(get('practice-hints').childElementCount, 3);
  rendered.answers[hinted.id] = hinted.correctAnswer;
  await get('practice-answer').listeners.click();
  assert.ok(events.some(e => e.hintsUsed === 3 && e.correct));
  assert.ok(events.every(e => e.type === 'practice_answer' && !Object.hasOwn(e, 'answer')));
  assert.doesNotMatch(get('practice-reason').textContent, /TT27|đánh giá năng lực/);
  // A07 cũng chỉ hiển thị lý do thân thiện, không đưa ghi chú trace ra màn hình.
  call = demoClient({ ...data, practicePool: [] });
  await call('auth/login', 'POST', { role: 'student' });
  get('practice-again').listeners.click(); await get('practice-start').listeners.click();
  assert.doesNotMatch(get('practice-message').textContent, /TT27|đánh giá năng lực/);
  assert.doesNotMatch(fs.readFileSync(path.join(__dirname, '../public/practice.html'), 'utf8'), /TT27|đánh giá năng lực/);
});
