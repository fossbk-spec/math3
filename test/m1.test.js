'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const data = require('../data/content/grade3.json');
const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const all = [...Object.values(data.questionSets).flatMap(s => s.questions), ...data.practiceQuestions];

test('M1: mọi câu có kỹ năng/mức hợp lệ, pool đầy đủ và không có đề kiểm tra', () => {
  const skills = new Set(data.skills.map(s => s.id));
  const ids = new Set(all.map(q => q.id));
  assert.equal(ids.size, all.length);
  for (const q of all) {
    assert.ok(skills.has(q.skillId), q.id);
    assert.ok([1, 2, 3].includes(q.cognitiveLevel), q.id);
    assert.equal(q.reviewStatus, 'DRAFT');
  }
  for (const s of data.skills) assert.ok(s.prerequisites.every(id => skills.has(id)));
  assert.deepEqual([...skills].sort(), ['g3.number.find-component', 'g3.number.fraction-unit', 'g3.number.tables', 'g3.number.tables-6-9']);
  assert.equal(new Set(data.practicePool).size, data.practicePool.length);
  assert.ok(data.practicePool.every(id => ids.has(id)));
  assert.deepEqual(new Set(data.practicePool), new Set([...Object.values(data.questionSets).filter(s => s.kind === 'exercise').flatMap(s => s.questions), ...data.practiceQuestions].map(q => q.id)));
  assert.equal(data.practiceQuestions.length, 252);
  assert.ok(data.practiceQuestions.filter(q => !q.templateId).every(q => q.skillId === 'g3.number.tables'));
  assert.ok(data.practiceQuestions.every(q => !Object.values(data.questionSets).some(s => s.questions.some(item => item.id === q.id))));
});

const sourceRoot = path.join(root, '../hoang-mai-math');
test('M1: metadata, câu ôn tiền đề và feedback khớp nguồn', { skip: !fs.existsSync(sourceRoot) }, () => {
  const source = file => JSON.parse(fs.readFileSync(path.join(sourceRoot, file), 'utf8'));
  const curriculum = source('content/grade3/curriculum.json');
  const lessons = curriculum.topics.flatMap(t => t.lessons);
  const bank = source('content/bank/grade3.json');
  for (const set of Object.values(data.questionSets)) {
    for (const q of set.questions) {
      if (set.kind === 'exam') {
        const original = all.find(item => item.id === q.id.slice(5));
        assert.deepEqual(q, { ...original, id: q.id });
      } else if (q.origin === 'worksheet') {
        assert.equal(q.skillId, lessons.find(l => `bai-${l.number}` === set.lessonId).skills[0]);
        assert.equal(q.cognitiveLevel, q.level === 'nang-cao' ? 2 : 1);
      } else assert.ok([...bank, ...source('exports/math3/lesson-questions.json')].some(b => q.skillId === b.skillId && q.cognitiveLevel === b.cognitiveLevel && q.prompt === b.stem));
    }
  }
  assert.deepEqual(data.feedbackRules, source('content/grade3/feedback-rules.json'));
  const exported = source('exports/math3/lesson-questions.json');
  for (const q of data.practiceQuestions) assert.ok([...bank, ...exported].some(b => b.skillId === q.skillId && b.stem === q.prompt && b.cognitiveLevel === q.cognitiveLevel));
  const expectedSkills = source('content/grade3/skills.json').filter(s => data.skills.some(item => item.id === s.id))
    .map(({ id, title, prerequisites }) => ({ id, title, prerequisites: prerequisites.filter(id => data.skills.some(s => s.id === id)) }));
  assert.deepEqual(data.skills, expectedSkills);
});

test('M1: phiếu không còn câu/đáp án/tiến độ cũ, hai trang dùng chung renderer', () => {
  const html = read('public/exercise.html');
  assert.doesNotMatch(html, /6 × 4|30 : 6|math-input-|setCompare|paintCard|<!-- [123] Done|value="(?:9|42)"|phieu-bai-9-10/);
  const questionArea = html.slice(html.indexOf('<!-- Phiếu'), html.indexOf('<!-- Popup'));
  assert.doesNotMatch(questionArea, /bg-secondary-container/);
  assert.match(html, /id="exercise-progress"[^>]*style="width:0%"/);
  for (const page of ['exercise', 'lesson']) {
    assert.match(read(`public/${page}.html`), /core\/question-view.js/);
    assert.match(read(`public/assets/js/pages/${page}.js`), /MathQuestionView.render/);
    assert.doesNotMatch(read(`public/assets/js/pages/${page}.js`), /class="opt-btn/);
    assert.match(read(`public/assets/js/pages/${page}.js`), /Date.now\(\) - startedAt/);
  }
  assert.match(read('public/assets/js/pages/exam.js'), /durationSec: Math.round\(\(Date.now\(\) - startedAt\) \/ 1000\)/);
  assert.equal(require('../data/seed.json').questionSets['phieu-bai-9-10'], undefined);
});

test('M1: API demo trả đúng thứ tự câu của từng bộ dữ liệu', async () => {
  const call = require('./helpers/demo')();
  await call('auth/login', 'POST', { role: 'student' });
  for (const [id, set] of Object.entries(data.questionSets)) {
    const actual = (await call(`question-sets/${id}/questions`)).questions;
    assert.deepEqual(actual.map(q => q.id), set.questions.map(q => q.id));
    assert.deepEqual(actual.map(q => q.prompt), set.questions.map(q => q.prompt));
    assert.ok(actual.every(q => q.correctAnswer === undefined));
  }
});

test('M1: luồng phiếu chọn bài, trả lời, tiến độ, nộp thời gian thật và làm lại', async () => {
  const vm = require('node:vm');
  async function player(search, expectedSet) {
    const nodes = new Map();
    const node = () => ({ textContent: '', style: {}, dataset: {}, disabled: true, listeners: {},
      classList: { add() {}, remove() {} }, setAttribute() {}, append() {},
      addEventListener(type, fn) { this.listeners[type] = fn; } });
    const get = id => { if (!nodes.has(id)) nodes.set(id, node()); return nodes.get(id); };
    const document = { getElementById: get, createElement: node, addEventListener(type, fn) { this[type] = fn; } };
    get('feedback-modal').querySelector = selector => selector === '[data-corrections]' ? null : get(selector);
    let clock = 0;
    let rendered;
    let posted;
    const lessons = data.lessons.map((l, i) => ({ ...l, completed: i === 0, locked: false,
      questionSets: Object.entries(data.questionSets).filter(([, s]) => s.lessonId === l.id).map(([id, s]) => ({ ...s, id })) }));
    const window = { MathAPI: {
      get: async url => {
        if (url === '/api/lessons') return { lessons };
        assert.equal(url, `/api/question-sets/${expectedSet}/questions`);
        return { questions: data.questionSets[expectedSet].questions };
      },
      post: async (url, body) => {
        assert.equal(url, '/api/submissions'); posted = body;
        return { scorePercent: 0, comment: '', correctCount: 0, totalCount: rendered.questions.length, attemptsLeft: 2, detail: [] };
      }
    }, MathQuestionView: { render(container, questions, answers, update) { rendered = { questions, answers, update }; update(); } } };
    vm.runInNewContext(read('public/assets/js/pages/exercise.js'), { window, document, location: { search }, URLSearchParams,
      Date: { now: () => clock }, setInterval() {}, confirm: () => true, alert: message => assert.fail(message) });
    await document['mathapp:user-ready']();
    assert.equal(get('btn-submit-exercise').disabled, false);
    assert.equal(get('exercise-progress').style.width, '0%');
    rendered.answers[rendered.questions[0].id] = 'A'; rendered.update();
    assert.equal(get('exercise-progress-text').textContent, `Đã trả lời 1/${rendered.questions.length} câu`);
    clock = 17000;
    await get('btn-submit-exercise').listeners.click();
    assert.equal(posted.setId, expectedSet);
    assert.equal(posted.durationSec, 17);
    assert.equal(Object.keys(posted.answers).length, 1);
    get('btn-reset-exercise').listeners.click();
    assert.equal(Object.keys(rendered.answers).length, 0);
    assert.equal(get('exercise-progress').style.width, '0%');
  }
  await player('', 'bai-10-co-ban');
  await player('?lesson=bai-9&set=bai-9-nang-cao', 'bai-9-nang-cao');
  await player('?set=bai-13-luyen-them', 'bai-13-luyen-them');
});

test('M1: menu luyện tập và menu kết hợp mở phiếu, kiểm tra riêng vẫn mở đề thi', () => {
  const context = { window: {} };
  require('node:vm').runInNewContext(read('public/assets/js/components/sidebar.js'), context);
  const route = (textContent, path = '') => context.window.MathApp.resolveRoute({ textContent, getAttribute: () => path });
  assert.equal(route('Luyện tập'), 'exercise.html');
  assert.equal(route('Luyện Tập & Kiểm Tra', 'luyen-tap-va-kiem-tra'), 'exercise.html');
  assert.equal(route('Kiểm tra'), 'exam.html');
});
