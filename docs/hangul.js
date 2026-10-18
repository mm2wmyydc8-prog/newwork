export const QUESTIONS = [
  { id: 'tree', picture: '🌳', word: '', reading: '나무', prompt: '그림에 맞는 낱말을 골라볼까?', answer: '나무', choices: ['나무', '나비', '누나'], hint: '나무! “나” 하고 천천히 읽어 봐.' },
  { id: 'sea', picture: '🌊', word: '', reading: '바다', prompt: '그림에 맞는 낱말을 골라볼까?', answer: '바다', choices: ['바나나', '바다', '바지'], hint: '바다! 입술을 붙였다 떼며 “바”라고 해 봐.' },
  { id: 'hat', picture: '🧢', word: '모□', prompt: '모자를 완성해 볼까?', answer: '자', choices: ['자', '나', '다'], hint: '모자! 마지막 글자는 “자”야.' },
  { id: 'banana', picture: '🍌', word: '바나□', prompt: '바나나의 마지막 글자는?', answer: '나', choices: ['마', '나', '라'], hint: '바-나-나. 마지막에도 “나”가 나와.' },
  { id: 'butterfly', picture: '🦋', word: '나□', prompt: '나비를 완성해 볼까?', answer: '비', choices: ['미', '비', '기'], hint: '나비! “비” 하고 소리 내어 보자.' },
  { id: 'shoes', picture: '👞', word: '', reading: '구두', prompt: '그림에 맞는 낱말을 골라볼까?', answer: '구두', choices: ['기차', '구두', '구이'], hint: '구두! 처음에는 “구”야.' },
  { id: 'cucumber', picture: '🥒', word: '오□', prompt: '오이를 완성해 볼까?', answer: '이', choices: ['아', '이', '우'], hint: '오-이! 웃는 입으로 “이”라고 해 봐.' },
  { id: 'milk', picture: '🥛', word: '', reading: '우유', prompt: '그림에 맞는 낱말을 골라볼까?', answer: '우유', choices: ['오이', '우유', '오리'], hint: '우유! 첫 글자는 “우”야.' },
  { id: 'tomato', picture: '🍅', word: '토마□', prompt: '토마토를 완성해 볼까?', answer: '토', choices: ['도', '토', '고'], hint: '토-마-토! 처음과 끝이 같아.' },
  { id: 'lion', picture: '🦁', word: '', reading: '사자', prompt: '그림에 맞는 낱말을 골라볼까?', answer: '사자', choices: ['사과', '기차', '사자'], hint: '사자! 맨 앞 글자는 “사”야.' },
  { id: 'bus', picture: '🚌', word: '버□', prompt: '버스를 완성해 볼까?', answer: '스', choices: ['즈', '스', '츠'], hint: '버-스! 마지막은 “스”야.' },
  { id: 'grape', picture: '🍇', word: '', reading: '포도', prompt: '그림에 맞는 낱말을 골라볼까?', answer: '포도', choices: ['파도', '포도', '포기'], hint: '포도! “포” 하고 바람을 내어 보자.' }
];

function shuffled(items, random) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
export function createQuiz(random = Math.random, completed = []) {
  const fresh = shuffled(QUESTIONS.filter(q => !completed.includes(q.id)), random);
  const review = shuffled(QUESTIONS.filter(q => completed.includes(q.id)), random);
  return { index: 0, answered: false,
    questions: [...fresh, ...review].slice(0, 5).map(q => ({ ...q, choices: shuffled(q.choices, random) })) };
}
export function chooseAnswer(quiz, answer) {
  if (quiz.index >= quiz.questions.length || quiz.answered) return false;
  if (answer !== quiz.questions[quiz.index].answer) return false;
  quiz.answered = true;
  return true;
}
export function nextQuestion(quiz) {
  if (!quiz.answered) return false;
  quiz.index++; quiz.answered = false;
  return true;
}

export function setupHangulQuiz({ getState, confirmMission, notify, speech, collection }) {
  const $ = selector => document.querySelector(selector);
  let quiz;
  const mission = () => getState().missions.find(m => m.id === 'hangul') ?? getState().missions.find(m => m.title.includes('한글'));
  const canSpeak = speech.supported;
  function stopSpeaking() { speech.stop(); }
  function say(text) { if (getState().speechAuto !== false) speech.speak(text); }
  function questionText(question) {
    return `${question.reading ?? question.word.replace('□', question.answer)}. ${question.prompt} 글자가 궁금하면 작은 스피커를 눌러 들어 봐.`;
  }
  function render() {
    stopSpeaking();
    const finished = quiz.index === quiz.questions.length;
    $('#quiz-question-area').hidden = finished;
    $('#quiz-finish-area').hidden = !finished;
    $('#quiz-progress').textContent = finished ? '오늘의 작은 도전 성공!' : `${quiz.index + 1} / ${quiz.questions.length} 퀘스트`;
    $('#quiz-progress-bar').value = quiz.index;
    $('#quiz-dialog').scrollTop = 0;
    if (finished) {
      $('#quiz-reward-note').textContent = mission() ? '부모님이 확인하면 모험 보상을 받을 수 있어요. 오늘 시간 보상을 이미 받았어도 포켓몬 퀘스트는 계속할 수 있어요.' : '연결할 한글 미션이 없어요. 부모님 메뉴에서 이름에 ‘한글’이 들어가는 미션을 추가해 주세요.';
      $('#quiz-claim').disabled = !mission();
      $('#quiz-claim').focus();
      say('다섯 번의 도전 성공! 잘했어, 연우! 부모님께 보여드리자.');
      collection.finishRound();
      return;
    }
    const question = quiz.questions[quiz.index];
    $('#quiz-picture').textContent = question.picture;
    $('#quiz-word').textContent = question.word;
    $('#quiz-word').hidden = !question.word;
    $('#quiz-prompt').textContent = question.prompt;
    $('#quiz-feedback').textContent = '천천히 골라 봐. 틀려도 괜찮아!';
    $('#quiz-next').hidden = true;
    $('#quiz-answers').replaceChildren();
    for (const answer of question.choices) {
      const cell = document.createElement('div'); cell.className = 'quiz-choice';
      const button = document.createElement('button');
      button.type = 'button'; button.className = answer.length > 1 ? 'quiz-answer quiz-answer-word' : 'quiz-answer'; button.textContent = answer;
      button.addEventListener('click', () => {
        if (quiz.answered) return;
        if (chooseAnswer(quiz, answer)) {
          collection.recordCorrect(question.id);
          button.classList.add('correct');
          $('#quiz-feedback').textContent = `맞았어! ${(question.reading ?? question.word.replace('□', question.answer))}! 잘했어, 연우! ✦`;
          say($('#quiz-feedback').textContent);
          $('#quiz-next').hidden = false;
          $('#quiz-next').textContent = quiz.index === 4 ? '다 풀었어요! ✦' : '다음 퀘스트 →';
          $('#quiz-answers').querySelectorAll('.quiz-answer').forEach(node => { node.disabled = true; });
          $('#quiz-next').focus();
        } else {
          $('#quiz-feedback').textContent = question.hint;
          say(question.hint);
          button.classList.add('try-again');
        }
      });
      const listen = document.createElement('button');
      listen.type = 'button'; listen.className = 'quiz-choice-listen'; listen.textContent = '🔊 듣기';
      listen.setAttribute('aria-label', `${answer} 소리 듣기`); listen.disabled = !canSpeak;
      listen.addEventListener('click', () => speech.speak(answer));
      cell.append(button, listen); $('#quiz-answers').append(cell);
    }
    say(questionText(question));
  }
  $('#hangul-start').addEventListener('click', () => {
    const state = getState();
    const completed = state.collection?.day === state.day ? state.collection.questions : [];
    quiz = createQuiz(Math.random, completed); $('#quiz-collection-note').textContent = '퀘스트를 성공하면 새로운 포켓몬을 만날 수 있어!'; render(); $('#quiz-dialog').showModal();
  });
  $('#quiz-next').addEventListener('click', () => { if (nextQuestion(quiz)) render(); });
  $('#quiz-speak').disabled = !canSpeak;
  $('#quiz-speak').addEventListener('click', () => {
    if (!canSpeak || quiz.index >= quiz.questions.length) return;
    stopSpeaking();
    const question = quiz.questions[quiz.index];
    const text = questionText(question);
    speech.speak(text);
  });
  $('#quiz-claim').addEventListener('click', () => {
    if (!quiz || quiz.index !== quiz.questions.length) return;
    const linked = mission();
    if (!linked) { notify('부모님 메뉴에서 한글 미션을 추가해 주세요.'); return; }
    $('#quiz-dialog').close(); confirmMission(linked.id);
  });
  $('#quiz-dialog').addEventListener('close', stopSpeaking);
}
