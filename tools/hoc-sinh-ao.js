'use strict';
const data = require('../data/content/grade3.json');
const practice = require('../public/assets/js/core/practice');
const adaptive = require('../public/assets/js/core/adaptive');
const bank = practice.pool(data);
const lessons = data.lessons.map(l => ({ ...l, completed: true, locked: false }));
const profiles = ['Tiếp thu nhanh', 'Tiếp thu chậm', 'Lặp lỗi cộng thay nhân', 'Hay mở gợi ý', 'Ngẫu nhiên'];
for (const name of profiles) {
  const history = [];
  console.log(`\n### ${name}\n| Câu | Mức | Luật | Nhãn lỗi |\n|---:|---:|---|---|`);
  for (let i = 0; i < 30; i++) {
    const skillId = name === 'Lặp lỗi cộng thay nhân' ? data.skills[1].id : data.skills[1 + Math.floor(i / 10)].id;
    const picked = practice.next(data, bank.filter(q => q.skillId === skillId), history, lessons);
    if (!picked.question) { console.log(`| ${i + 1} | — | A07-EMPTY | — |`); break; }
    const q = picked.question;
    let entry = { questionId: q.id, skillId: q.skillId, cognitiveLevel: q.cognitiveLevel,
      attemptNo: 0, hintsUsed: 0, isCorrect: false, completed: false, steps: [], errorTags: [] };
    const right = name === 'Tiếp thu nhanh' || (name === 'Tiếp thu chậm' && i % 4 === 0) ||
      (name === 'Hay mở gợi ý' && i % 3 !== 0) || (name === 'Ngẫu nhiên' && (i * 17 + 7) % 5 < 2);
    const attempts = right ? 1 : name === 'Hay mở gợi ý' ? 2 : 3;
    for (let tryNo = 1; tryNo <= attempts; tryNo++) {
      const wrong = name === 'Lặp lỗi cộng thay nhân' && q.verification?.op === '*' && q.verification.args?.length === 2
        ? String(Number(q.verification.args[0]) + Number(q.verification.args[1])) : '999999';
      const result = practice.answer(q, entry, { questionId: q.id, answer: right || (name === 'Hay mở gợi ý' && tryNo === 2) ? q.correctAnswer : wrong,
        attemptNo: tryNo, hintsUsed: name === 'Hay mở gợi ý' ? Math.min(3, (q.hints || []).length) : 0 });
      entry = result.updated;
    }
    if (entry.guided === 'PENDING') entry = practice.complete(q, entry, { questionId: q.id, answer: '999999' }, data.coachRules).updated;
    if (entry.guided === 'PENDING') entry = practice.complete(q, entry, { questionId: q.id, answer: '999999' }, data.coachRules).updated;
    history.push(entry);
    console.log(`| ${i + 1} | ${q.cognitiveLevel} | ${picked.trace?.rules.join(', ') || '—'} | ${entry.errorTags.join(', ') || '—'} |`);
  }
  console.log('\npaceBySkill:', JSON.stringify(adaptive.paceBySkill(history)));
}
