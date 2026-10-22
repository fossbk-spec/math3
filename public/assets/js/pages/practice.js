(function () {
  'use strict';
  const el = id => document.getElementById(`practice-${id}`);
  const api = window.MathAPI;
  let question, answers, attemptNo = 0, hintsUsed = 0, busy = false, rules;
  let results = [];
  // Báo header cập nhật sao; lỗi ở đây không được làm hỏng lượt trả lời.
  const updateStars = result => {
    if (result.totalStars == null) return;
    try { document.dispatchEvent(new CustomEvent('math:stars', { detail: { totalStars: result.totalStars } })); } catch { /* môi trường không có CustomEvent */ }
  };
  const message = text => { el('message').textContent = text; };
  const friendlyReason = reason => String(reason || '').split(' Đây là điều chỉnh')[0].split('. ').at(-1);
  const solutionText = solution => Array.isArray(solution) ? solution.join('\n') : typeof solution === 'string' ? solution : JSON.stringify(solution);
  function showCoach(coach) {
    const panel = el('coach'), body = el('coach-body');
    panel.hidden = !coach; body.replaceChildren(); el('completion').hidden = true;
    if (!coach) return;
    const heading = document.createElement('p'); heading.textContent = `Bước ${coach.step}/3`;
    body.append(heading);
    if (coach.step === 1) {
      const prompt = document.createElement('p');
      (coach.segments || []).forEach(segment => {
        const node = document.createElement(segment.mark ? 'strong' : 'span'); node.textContent = segment.text; prompt.append(node);
      });
      body.append(prompt);
      const hint = document.createElement('p'); hint.textContent = coach.message; body.append(hint);
    } else if (coach.step === 2) {
      const hint = document.createElement('strong'); hint.textContent = coach.prompt; body.append(hint);
    } else {
      const list = document.createElement('ol');
      (coach.masked || []).forEach(line => { const item = document.createElement('li'); item.textContent = line; list.append(item); });
      body.append(list); el('completion').hidden = false; el('missing').value = '';
      const rechoose = coach.mode === 'rechoose';
      el('missing').hidden = rechoose; el('complete').hidden = rechoose;
      const label = el('completion').querySelector('label');
      label.hidden = rechoose;
      const choices = el('rechoose');
      choices.replaceChildren(); choices.hidden = !rechoose;
      if (rechoose) {
        const options = question.type === 'compare' ? ['<', '>', '='] : question.options || [];
        options.forEach((option, index) => {
          const button = document.createElement('button');
          button.type = 'button'; button.className = 'clay-btn';
          button.textContent = question.type === 'compare' ? option : `${'ABCD'[index]}. ${option}`;
          button.dataset.answer = question.type === 'compare' ? option : 'ABCD'[index];
          choices.append(button);
        });
      }
    }
  }
  function finish() {
    el('player').hidden = true;
    el('result').hidden = false;
    if (!results.length) {
      el('summary').textContent = 'Chưa có câu phù hợp để hoàn tất lượt luyện. Em có thể chọn bài khác hoặc nhờ thầy cô nhé.';
      el('corrections').textContent = 'Chưa có bài chữa.';
      return;
    }
    const correct = results.filter(r => r.correct).length;
    const firstTry = results.filter(r => r.correct && !r.hadError).length;
    const feedback = window.MathGrading.feedbackFor(results.length ? correct / results.length * 100 : 0, rules);
    el('summary').textContent = `${correct}/${results.length} câu đúng trong 3 lần thử; ${firstTry} câu đúng ngay lần đầu. ${feedback.label}. ${feedback.message}`;
    el('corrections').replaceChildren();
    results.filter(r => r.hadError || !r.correct).forEach(r => {
      const article = document.createElement('article');
      const prompt = document.createElement('h3'); prompt.textContent = r.question.prompt;
      const solution = document.createElement('p'); solution.textContent = `Đáp án: ${window.MathQuestionView.formatAnswer(r.question, r.correctAnswer)}\n${solutionText(r.solution)}`;
      article.append(prompt, solution); el('corrections').append(article);
    });
    if (!el('corrections').childElementCount) el('corrections').textContent = 'Em đã làm đúng các câu trong lượt này.';
  }
  async function next() {
    if (busy) return;
    if (results.length === 10) { message('Em đã hoàn thành lượt luyện tập!'); finish(); return; }
    busy = true; el('next').disabled = true;
    el('player').hidden = false; el('answer').disabled = el('hint').disabled = true;
    message('Đang chọn câu phù hợp…');
    try {
      const response = await api.post('/api/practice/next', { lessonId: el('lesson').value || undefined });
      rules = response.feedbackRules;
      question = response.question;
      if (!question) { message(friendlyReason(response.reason)); finish(); return; }
      attemptNo = response.attemptNo; hintsUsed = response.hintsUsed;
      answers = {}; question.hadError = attemptNo > 0;
      el('progress').textContent = `Câu ${results.length + 1}/10 • Đã thử ${attemptNo}/3 lần`;
      el('reason').textContent = friendlyReason(response.reason);
      window.MathQuestionView.render(el('question'), [{ ...question, hints: [] }], answers, () => {}, { hideLabel: true });
      el('hints').replaceChildren();
      showCoach(response.coach);
      (question.hints || []).slice(0, hintsUsed).forEach(addHint);
      el('hint').disabled = hintsUsed >= question.hints.length;
      el('answer').disabled = response.guided === 'PENDING'; el('next').hidden = true;
      el('player').hidden = false;
      message('Em đọc đề rồi chọn hoặc điền câu trả lời nhé.');
    } catch (e) { message(e.message); el('next').hidden = false; }
    finally { busy = false; el('next').disabled = false; }
  }
  function addHint(text) { const li = document.createElement('li'); li.textContent = text; el('hints').append(li); }
  el('hint').addEventListener('click', () => {
    if (busy || hintsUsed >= question.hints.length) return;
    addHint(question.hints[hintsUsed++]);
    el('hint').disabled = hintsUsed >= question.hints.length;
  });
  el('answer').addEventListener('click', async () => {
    if (busy) return;
    if (!String(answers[question.id] ?? '').trim()) { message('Em điền hoặc chọn câu trả lời trước nhé.'); return; }
    busy = true; el('answer').disabled = true; el('hint').disabled = true;
    message('Đang kiểm tra…');
    try {
      const result = await api.post('/api/practice/answer', { questionId: question.id, answer: answers[question.id], attemptNo: attemptNo + 1, hintsUsed });
      updateStars(result);
      attemptNo++;
      window.MathAnalytics?.track('practice_answer', { skillId: question.skillId, level: question.cognitiveLevel, correct: result.correct, attemptNo, hintsUsed });
      if (!result.correct) question.hadError = true;
      el('progress').textContent = `Câu ${results.length + 1}/10 • Đã thử ${attemptNo}/3 lần`;
      showCoach(result.coach);
      if (result.correct || attemptNo === 3) {
        if (result.guided !== 'PENDING') results.push({ ...result, question, hadError: question.hadError });
        el('question').querySelectorAll('button,input').forEach(control => { control.disabled = true; });
        message(result.guided === 'PENDING' ? (result.coach?.mode === 'rechoose' ? 'Em chọn lại đáp án nhé.' : 'Em điền số còn thiếu trong lời giải nhé.') : `${result.correct ? '✓ Đúng rồi!' : '✗ Chưa đúng. Mình cùng xem bài chữa nhé.'}\nĐáp án: ${window.MathQuestionView.formatAnswer(question, result.correctAnswer)}\n${solutionText(result.solution)}`);
        el('next').textContent = results.length === 10 ? 'Xem kết quả lượt luyện' : 'Câu tiếp theo'; el('next').hidden = result.guided === 'PENDING';
      } else { message(`✗ Chưa đúng, em thử lại nhé. Còn ${3 - attemptNo} lần thử.`); el('answer').disabled = false; }
    } catch (e) { message(e.message); el('answer').disabled = false; }
    finally { busy = false; el('hint').disabled = el('answer').disabled || hintsUsed >= question.hints.length; }
  });
  async function complete(answer) {
    if (busy) return;
    if (!answer) { message('Em điền số còn thiếu nhé.'); return; }
    busy = true; el('complete').disabled = true;
    try {
      const result = await api.post('/api/practice/complete', { questionId: question.id, answer });
      updateStars(result);
      if (result.guided === 'PENDING') { message('Chưa đúng, em thử điền lại nhé.'); return; }
      el('completion').hidden = true;
      results.push({ ...result, correct: false, question, hadError: true, correctAnswer: result.correctAnswer, solution: result.solution });
      message(result.guided === 'DONE' ? result.message : `Mình cùng xem bài chữa nhé.\nĐáp án: ${window.MathQuestionView.formatAnswer(question, result.correctAnswer)}\n${solutionText(result.solution)}`);
      el('next').textContent = results.length === 10 ? 'Xem kết quả lượt luyện' : 'Câu tiếp theo'; el('next').hidden = false;
    } catch (e) { message(e.message); }
    finally { busy = false; el('complete').disabled = false; }
  }
  el('complete').addEventListener('click', () => complete(el('missing').value.trim()));
  el('rechoose').addEventListener('click', event => {
    const button = event.target.closest('button[data-answer]');
    if (button) complete(button.dataset.answer);
  });
  el('read').addEventListener('click', () => {
    if (!question) return;
    const speech = window.speechSynthesis;
    const voices = speech?.getVoices?.() || [];
    if (!speech || !voices.some(v => v.lang?.toLowerCase().startsWith('vi'))) { message('Máy chưa có giọng tiếng Việt. Em đọc đề và phần Bạn Cú gợi ý trên màn hình nhé.'); return; }
    speech.cancel();
    const words = [question.prompt, el('coach').hidden ? '' : el('coach-body').textContent].filter(Boolean).join('. ');
    const utterance = new SpeechSynthesisUtterance(words); utterance.lang = 'vi-VN'; utterance.rate = 0.9;
    utterance.voice = voices.find(v => v.lang?.toLowerCase().startsWith('vi'));
    speech.speak(utterance);
  });
  el('start').addEventListener('click', async () => { results = []; el('setup').hidden = true; el('result').hidden = true; await next(); });
  el('next').addEventListener('click', next);
  el('again').addEventListener('click', () => { el('result').hidden = true; el('setup').hidden = false; message(''); });
  document.addEventListener('mathapp:user-ready', async () => {
    try {
      const { lessons } = await api.get('/api/lessons');
      lessons.filter(l => !l.locked).forEach(l => {
        const option = document.createElement('option'); option.value = l.id; option.textContent = `Bài ${l.number}: ${l.title}`; el('lesson').append(option);
      });
      el('lesson').disabled = el('start').disabled = false;
    } catch (e) { message(e.message); }
  }, { once: true });
})();
