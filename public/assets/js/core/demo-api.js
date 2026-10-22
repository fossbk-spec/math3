/* Browser-only API for the static demo. All state belongs to this browser. */
(function (root) {
  'use strict';
  const KEY = 'math3_demo_v1';
  const GRADING = root.MathGrading;
  const STARS = root.MathStars;
  let contentPromise;
  const users = [
    { id: 1, username: 'giaovien01', fullName: 'Cô giáo Demo', role: 'teacher', className: '3A', studentCode: 'GV-01', totalStars: 0 },
    { id: 2, username: 'hocsinh01', fullName: 'Bạn Cú', role: 'student', className: '3A', studentCode: 'HM-3A-08', totalStars: 0 },
  ];
  const fresh = () => ({ currentId: null, users: users.map(u => ({ ...u })), lessons: {}, sets: {}, questions: {}, attempts: [], progress: {}, gameScores: [], practiceAttempts: [] });
  const read = () => { try { return { ...fresh(), ...JSON.parse(localStorage.getItem(KEY)) }; } catch { return fresh(); } };
  const save = state => localStorage.setItem(KEY, JSON.stringify(state));
  const fail = (message, status = 400) => { const error = new Error(message); error.status = status; throw error; };
  const copy = value => JSON.parse(JSON.stringify(value));
  const content = () => contentPromise ||= fetch('data/grade3.json').then(r => { if (!r.ok) return fail('Không tải được nội dung demo.', r.status); return r.json(); });
  const userFor = state => state.users.find(u => u.id === state.currentId);
  const setsFor = (state, data) => Object.fromEntries(Object.entries({ ...data.questionSets, ...state.sets }).filter(([, s]) => !s.deleted));
  const lessonsFor = (state, data) => [...data.lessons.filter(l => !state.lessons[l.id]?.deleted).map(l => ({ ...l, ...state.lessons[l.id] })), ...Object.values(state.lessons).filter(l => !data.lessons.some(x => x.id === l.id) && !l.deleted)];
  const questionsFor = (state, setId, data) => {
    const base = (setsFor(state, data)[setId]?.questions || []).filter(q => !state.questions[q.id]?.deleted).map(q => ({ ...q, ...state.questions[q.id] }));
    const added = Object.values(state.questions).filter(q => q.set_id === setId && !q.deleted && !base.some(x => x.id === q.id));
    return [...base, ...added];
  };
  const review = q => q.review_status || 'DRAFT';
  const visible = q => review(q) !== 'REJECTED';
  const studentQuestion = q => ({ id: q.id, type: q.type, prompt: q.prompt, options: q.options, points: 1, category: q.category, level: q.level, hints: q.hints || [] });
  const teacherQuestion = q => ({ ...q, correct_answer: q.correctAnswer, review_status: review(q), set_id: q.set_id });
  const progressKey = (id, lessonId) => `${id}:${lessonId}`;
  const lessonList = (state, data, user) => lessonsFor(state, data).map(l => {
    const p = state.progress[progressKey(user.id, l.id)];
    const prior = l.unlockAfter && state.progress[progressKey(user.id, l.unlockAfter)];
    return { id: l.id, number: l.number, title: l.title, description: l.description, topic: l.topic, page: l.page,
      bestScore: p?.bestScore || 0, completed: !!p?.completed, locked: !!l.unlockAfter && !prior?.completed,
      questionSets: Object.entries(setsFor(state, data)).filter(([, s]) => s.lessonId === l.id).map(([id, s]) => ({ id, title: s.title, kind: s.kind })).sort((a, b) => a.kind.localeCompare(b.kind)) };
  });
  const studentRows = state => state.users.filter(u => u.role === 'student').map(u => {
    const attempts = state.attempts.filter(a => a.userId === u.id);
    const scored = attempts.filter(a => a.kind !== 'game');
    const classAccount = typeof u.id === 'string' && /^3A2-\d{2}$/.test(u.id);
    return { id: u.id, username: classAccount ? '' : u.username, full_name: classAccount ? u.id : u.fullName, class_name: u.className, student_code: u.studentCode,
      total_stars: u.totalStars, avg_score: scored.length ? Math.round(scored.reduce((n, a) => n + a.scorePercent, 0) / scored.length * 10) / 10 : null,
      attempts_count: attempts.length };
  });
  const metric = values => values.length ? Math.round(values.reduce((n, x) => n + x, 0) / values.length * 10) / 10 : 0;

  async function request(url, options = {}) {
    const path = new URL(url, 'https://demo.local/').pathname.replace(/^\/api\/?/, '');
    const method = options.method || 'GET';
    const body = typeof options.body === 'string' ? JSON.parse(options.body) : (options.body || {});
    const state = read();
    const data = await content();
    if (path === 'auth/login' && method === 'POST') {
      const role = body.role || (body.username === 'giaovien01' ? 'teacher' : 'student');
      const username = String(body.username || '').trim().toLowerCase();
      let user = state.users.find(u => typeof u.id === 'number' && u.role === role && (u.username === username || (!username && users.some(sample => sample.id === u.id))));
      if (user && username && users.some(sample => sample.id === user.id) && body.password !== '123456') user = null;
      if (!user && username && role === 'student' && root.MathClassroom) {
        const response = await fetch('data/class-3a2.json');
        if (response.ok) {
          const classData = await response.json();
          const password = String(body.password || '').trim();
          // Máy tính bảng hay tự viết hoa chữ đầu: thử lại với chữ thường nếu mật khẩu gõ có chữ hoa.
          let account = await root.MathClassroom.login(classData, username, password, root.crypto);
          if (!account && password !== password.toLowerCase()) account = await root.MathClassroom.login(classData, username, password.toLowerCase(), root.crypto);
          if (account) {
            user = state.users.find(u => u.id === account.id);
            if (user) Object.assign(user, account, { totalStars: user.totalStars || 0 });
            else { user = account; state.users.push(user); }
          }
        } else if (response.status !== 404) return fail('Không tải được tài khoản lớp. Em hãy thử lại.', response.status);
      }
      if (!user) return fail('Tên đăng nhập hoặc mật khẩu chưa đúng.', 401);
      state.currentId = user.id; save(state); root.MathAnalytics?.setContext(user); return { user: copy(user) };
    }
    if (path === 'auth/logout' && method === 'POST') { state.currentId = null; save(state); return { ok: true }; }
    if (path === 'auth/me') { const user = userFor(state); if (!user) return fail('Chưa đăng nhập.', 401); return { user: copy(user) }; }
    const user = userFor(state);
    if (!user) return fail('Chưa đăng nhập.', 401);
    if (path === 'lessons') return { lessons: lessonList(state, data, user) };
    if (path === 'me/progress') return { lessons: lessonList(state, data, user), totalStars: user.totalStars };
    if (path === 'ai-safe') return { aiSafe: copy(data.aiSafe) };
    let match = path.match(/^question-sets\/([^/]+)\/questions$/);
    if (match && method === 'GET') {
      const questions = questionsFor(state, decodeURIComponent(match[1]), data).filter(visible).map(studentQuestion);
      if (!questions.length) return fail('Không tìm thấy bộ câu hỏi.', 404);
      return { setId: match[1], questions };
    }
    if (path.startsWith('practice/') && method === 'POST') {
      const engine = root.MathPractice;
      const bank = engine.pool(data).filter(q => !state.questions[q.id]?.deleted).map(q => ({ ...q, ...state.questions[q.id],
        reviewStatus: state.questions[q.id]?.review_status || q.reviewStatus || 'DRAFT' }));
      const history = state.practiceAttempts.filter(a => a.userId === user.id);
      if (path === 'practice/next') {
        const result = engine.next(data, bank, history, lessonList(state, data, user), body.lessonId);
        if (result.question && !history.some(a => !a.completed || a.guided === 'PENDING')) state.practiceAttempts.push({
          userId: user.id, questionId: result.question.id, skillId: result.question.skillId,
          cognitiveLevel: result.question.cognitiveLevel, attemptNo: 0, hintsUsed: 0, isCorrect: false, completed: false, reason: result.reason,
        });
        save(state);
        return { ...result, question: engine.studentQuestion(result.question), feedbackRules: copy(data.feedbackRules) };
      }
      if (path === 'practice/answer') {
        const entry = history.find(a => !a.completed);
        const q = bank.find(q => q.id === body.questionId && q.reviewStatus !== 'REJECTED');
        if (!q) return fail('Không tìm thấy câu đang mở.', 404);
        const result = engine.answer(q, entry, body);
        const starsEarned = STARS.practice(entry.starsAwarded, result.response.correct, null);
        Object.assign(entry, result.updated);
        if (starsEarned) { entry.starsAwarded = true; user.totalStars += starsEarned; }
        save(state); return { ...result.response, starsEarned, totalStars: user.totalStars };
      }
      if (path === 'practice/complete') {
        const entry = history.find(a => a.guided === 'PENDING');
        const q = bank.find(q => q.id === body.questionId && q.reviewStatus !== 'REJECTED');
        if (!q) return fail('Không tìm thấy câu đang mở.', 404);
        const result = engine.complete(q, entry, body, data.coachRules);
        const starsEarned = STARS.practice(entry.starsAwarded, false, result.response.guided);
        Object.assign(entry, result.updated);
        if (starsEarned) { entry.starsAwarded = true; user.totalStars += starsEarned; }
        save(state); return { ...result.response, starsEarned, totalStars: user.totalStars };
      }
    }
    if (path === 'submissions' && method === 'POST') {
      const set = setsFor(state, data)[body.setId];
      if (!set) return fail('Bộ bài không hợp lệ.');
      const maxAttempts = set.kind === 'exam' ? 1 : 3;
      const used = state.attempts.filter(a => a.userId === user.id && a.refId === body.setId).length;
      if (used >= maxAttempts) return fail(`Em đã làm đủ ${maxAttempts} lượt cho bộ bài này.`, 409);
      const questions = questionsFor(state, body.setId, data).filter(visible).map(q => ({ ...q, points: 1, correct_answer: q.correctAnswer, solution: q.solution }));
      if (!questions.length) return fail('Bộ bài chưa có câu hỏi để làm.', 404);
      const attemptNo = used + 1;
      const graded = GRADING.gradeSubmission(questions, body.answers || {}, { kind: set.kind, lastAttempt: attemptNo === maxAttempts, feedbackRules: data.feedbackRules });
      const key = progressKey(user.id, set.lessonId);
      const prior = state.progress[key] || { bestScore: 0, completed: false };
      const awarded = state.attempts.filter(a => a.userId === user.id && a.refId === body.setId).reduce((n, a) => n + (a.starsEarned || 0), 0);
      const starsEarned = STARS.submission(graded.correctCount, graded.scorePercent, prior.bestScore,
        set.starReward ?? (set.kind === 'exam' ? 100 : 40), awarded);
      state.progress[key] = { bestScore: Math.max(prior.bestScore, graded.scorePercent), completed: prior.completed || graded.scorePercent >= 50 };
      user.totalStars += starsEarned;
      state.attempts.push({ userId: user.id, refId: body.setId, kind: set.kind, scorePercent: graded.scorePercent, starsEarned, answers: body.answers || {}, day: new Date().toISOString().slice(0, 10) });
      save(state);
      root.MathAnalytics?.track('submission', { setId: body.setId, lessonId: set.lessonId, kind: set.kind,
        attemptNo, scorePercent: graded.scorePercent, correctCount: graded.correctCount, totalCount: graded.totalCount,
        durationSec: Number(body.durationSec) || 0, comment: graded.comment,
        questions: questions.map(q => ({ questionId: q.id, correct: GRADING.isCorrect(q, (body.answers || {})[q.id]) })) });
      return { ...graded, starsEarned, totalStars: user.totalStars, attemptNo, maxAttempts, attemptsLeft: maxAttempts - attemptNo };
    }
    if (path === 'leaderboard') return { leaderboard: studentRows(state).sort((a, b) => b.total_stars - a.total_stars || a.full_name.localeCompare(b.full_name)).map((r, i) => ({ rank: i + 1, ...r, isMe: r.id === user.id })) };
    if (path === 'game-scores' && method === 'POST') {
      if (!['game-bong-bay', 'game-dua-xe', 'game-lat-the', 'game-cau-ca'].includes(body.gameId)) return fail('Trò chơi không hợp lệ.');
      const score = Math.max(0, Math.min(100000, Math.round(Number(body.score) || 0)));
      const old = state.gameScores.filter(g => g.userId === user.id && g.gameId === body.gameId);
      const best = Math.max(0, ...old.map(g => g.score));
      const starsEarned = Math.min(50, Math.ceil(Math.max(0, score - best) / 10));
      state.gameScores.push({ userId: user.id, gameId: body.gameId, score }); user.totalStars += starsEarned; save(state);
      return { score, bestScore: Math.max(best, score), starsEarned, totalStars: user.totalStars };
    }
    if (path === 'me/game-scores') {
      const games = {};
      state.gameScores.filter(g => g.userId === user.id).forEach(g => { const v = games[g.gameId] || { game_id: g.gameId, best: 0, plays: 0 }; v.best = Math.max(v.best, g.score); v.plays++; games[g.gameId] = v; });
      return { games };
    }
    if (!path.startsWith('teacher/') || user.role !== 'teacher') return fail('Không có quyền truy cập.', 403);
    if (path === 'teacher/students' && method === 'GET') return { students: studentRows(state) };
    if (path === 'teacher/students' && method === 'POST') {
      if (!body.username || !body.fullName) return fail('Cần tên đăng nhập và bí danh.');
      if (state.users.some(u => u.username === body.username)) return fail('Tên đăng nhập này đã tồn tại.', 409);
      const student = { id: Math.max(...state.users.map(u => typeof u.id === 'number' ? u.id : 0)) + 1, username: body.username, fullName: body.fullName, role: 'student', className: body.className || '3A', studentCode: body.studentCode || '', totalStars: 0 };
      state.users.push(student); save(state); return { student };
    }
    if (/^teacher\/students\/\d+\/reset-password$/.test(path) && method === 'POST') return { ok: true };
    if (path === 'teacher/lessons' && method === 'GET') return { lessons: lessonsFor(state, data).map(l => ({ ...l, unlock_after: l.unlockAfter, set_count: Object.values(setsFor(state, data)).filter(s => s.lessonId === l.id).length })) };
    if (path === 'teacher/lessons' && method === 'POST') {
      const id = `bai-${parseInt(body.number, 10)}`;
      if (lessonsFor(state, data).some(l => l.id === id)) return fail('Bài học đã tồn tại.', 409);
      state.lessons[id] = { id, number: Number(body.number), title: body.title, description: body.description || '', topic: body.topic || '', unlockAfter: body.unlockAfter || null };
      save(state); return { lesson: { id, number: Number(body.number), title: body.title } };
    }
    match = path.match(/^teacher\/lessons\/([^/]+)$/);
    if (match && method === 'PUT') { state.lessons[match[1]] = { ...state.lessons[match[1]], ...body, id: match[1] }; save(state); return { ok: true }; }
    if (match && method === 'DELETE') { state.lessons[match[1]] = { ...state.lessons[match[1]], deleted: true }; save(state); return { ok: true }; }
    if (path === 'teacher/question-sets' && method === 'GET') return { questionSets: Object.entries(setsFor(state, data)).map(([id, s]) => ({ id, title: s.title, kind: s.kind, lesson_id: s.lessonId, star_reward: s.starReward ?? 40, duration_minutes: s.durationMinutes || 0, lesson_number: lessonsFor(state, data).find(l => l.id === s.lessonId)?.number, question_count: questionsFor(state, id, data).length })) };
    if (path === 'teacher/question-sets' && method === 'POST') {
      const id = String(body.id || '').trim().toLowerCase().replace(/[^a-z0-9-]+/g, '-');
      if (!id || !body.title) return fail('Cần mã và tên bộ đề.');
      if (setsFor(state, data)[id]) return fail('Mã bộ đề đã tồn tại.', 409);
      state.sets[id] = { title: body.title, kind: body.kind || 'exercise', lessonId: body.lessonId || null, starReward: Number(body.starReward) || 40, durationMinutes: Number(body.durationMinutes) || 0, questions: [] };
      save(state); return { questionSet: { id } };
    }
    match = path.match(/^teacher\/question-sets\/([^/]+)$/);
    if (match && method === 'DELETE') { state.sets[match[1]] = { ...setsFor(state, data)[match[1]], deleted: true }; save(state); return { ok: true }; }
    match = path.match(/^teacher\/question-sets\/([^/]+)\/questions$/);
    if (match && method === 'GET') return { questions: questionsFor(state, match[1], data).map(teacherQuestion) };
    if (match && method === 'POST') {
      if (!setsFor(state, data)[match[1]]) return fail('Không tìm thấy bộ đề.', 404);
      const id = `q-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
      state.questions[id] = { id, set_id: match[1], type: body.type, prompt: body.prompt, options: body.options, correctAnswer: body.correctAnswer, points: Number(body.points) || 1, category: body.category || '', origin: 'teacher', review_status: 'APPROVED' };
      save(state); return { question: { id } };
    }
    match = path.match(/^teacher\/questions\/([^/]+)(\/review)?$/);
    if (match) {
      const id = match[1];
      const found = Object.keys(setsFor(state, data)).some(setId => questionsFor(state, setId, data).some(q => q.id === id));
      if (!found) return fail('Không tìm thấy câu hỏi.', 404);
      if (method === 'POST' && match[2]) {
        const status = String(body.status || '').toUpperCase();
        if (!['APPROVED', 'REJECTED'].includes(status)) return fail('Trạng thái không hợp lệ.');
        state.questions[id] = { ...state.questions[id], review_status: status }; save(state);
        root.MathAnalytics?.track('teacher_review', { approved: status === 'APPROVED' ? 1 : 0, rejected: status === 'REJECTED' ? 1 : 0 });
        return { ok: true, status };
      }
      if (method === 'PUT') { state.questions[id] = { ...state.questions[id], ...body, points: Number(body.points) || 1, review_status: 'APPROVED' }; save(state); return { ok: true }; }
      if (method === 'DELETE') { state.questions[id] = { ...state.questions[id], deleted: true }; save(state); return { ok: true }; }
    }
    match = path.match(/^teacher\/question-sets\/([^/]+)\/approve-all$/);
    if (match && method === 'POST') {
      let approved = 0;
      questionsFor(state, match[1], data).forEach(q => { if (review(q) === 'DRAFT') { state.questions[q.id] = { ...state.questions[q.id], review_status: 'APPROVED' }; approved++; } });
      save(state); root.MathAnalytics?.track('teacher_review', { approved, rejected: 0 }); return { ok: true, approved };
    }
    if (path === 'teacher/analytics') {
      const students = studentRows(state);
      const attempts = state.attempts.filter(a => a.kind !== 'game');
      const scored = students.filter(s => s.avg_score !== null);
      const lessons = lessonsFor(state, data);
      const progress = Object.entries(state.progress);
      const byDay = Object.groupBy(attempts, a => a.day);
      return { students: students.length, lessons: lessons.length, attempts: attempts.length,
        completionRate: students.length && lessons.length ? Math.round(progress.filter(([, p]) => p.completed).length / (students.length * lessons.length) * 100) : 0,
        studentsWithCompleted: new Set(progress.filter(([, p]) => p.completed).map(([key]) => key.split(':')[0])).size,
        avgScore: metric(attempts.map(a => a.scorePercent)), excellent: scored.filter(s => s.avg_score >= 90).length,
        needSupport: scored.filter(s => s.avg_score < 60).length, noDataStudents: students.length - scored.length,
        last7: Object.entries(byDay).map(([day, rows]) => ({ day, c: rows.length })).slice(-7), topMistakes: [],
        perLesson: lessons.map(l => { const rows = progress.filter(([key]) => key.endsWith(`:${l.id}`)).map(([, p]) => p); return { id: l.id, number: l.number, title: l.title, completed: rows.filter(p => p.completed).length, avgBest: Math.round(metric(rows.map(p => p.bestScore))) }; }) };
    }
    return fail('Chức năng demo chưa hỗ trợ.', 404);
  }
  root.MathDemoAPI = { request, reset() { localStorage.removeItem(KEY); } };
})(window);
