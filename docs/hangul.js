import { createSentenceQuiz, ensureReading, markSentenceShown, noteSentenceWrong, recordSentenceCorrect } from './sentence-learning.js?v=sentence-reading';
import { sentencePicture } from './sentence-pictures.js?v=sentence-reading';
import { REGIONS } from './collection.js?v=partner-habitats';

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

// Keep the original IDs so existing learning progress remains valid.
const EXTRA_WORDS = [
  ["apple", "🍎", "사과"],
  ["train", "🚂", "기차"],
  ["duck", "🦆", "오리"],
  ["rabbit", "🐰", "토끼"],
  ["elephant", "🐘", "코끼리"],
  ["fox", "🦊", "여우"],
  ["pig", "🐷", "돼지"],
  ["whale", "🐳", "고래"],
  ["chef", "👩‍🍳", "요리사"],
  ["spider", "🕷️", "거미"],
  ["hippo", "🦛", "하마"],
  ["goose", "🪿", "거위"],
  ["frog", "🐸", "개구리"],
  ["badger", "🦡", "오소리"],
  ["deer", "🦌", "노루"],
  ["donkey", "🫏", "나귀"],
  ["llama", "🦙", "라마"],
  ["sweet-potato", "🍠", "고구마"],
  ["cookie", "🍪", "쿠키"],
  ["pizza", "🍕", "피자"],
  ["cheese", "🧀", "치즈"],
  ["coffee", "☕", "커피"],
  ["juice", "🧃", "주스"],
  ["cake", "🍰", "케이크"],
  ["cherry", "🍒", "체리"],
  ["kiwi", "🥝", "키위"],
  ["avocado", "🥑", "아보카도"],
  ["cabbage", "🥬", "배추"],
  ["sunflower", "🌻", "해바라기"],
  ["earth", "🌍", "지구"],
  ["lake", "🏞️", "호수"],
  ["city", "🏙️", "도시"],
  ["baseball", "⚾", "야구"],
  ["yoyo", "🪀", "요요"],
  ["clock", "🕒", "시계"],
  ["chair", "🪑", "의자"],
  ["tissue", "🧻", "휴지"],
  ["soap", "🧼", "비누"],
  ["scissors", "✂️", "가위"],
  ["map", "🗺️", "지도"],
  ["radio", "📻", "라디오"],
  ["camera", "📷", "카메라"],
  ["microphone", "🎤", "마이크"],
  ["piano", "🎹", "피아노"],
  ["axe", "🪓", "도끼"],
  ["ladder", "🪜", "사다리"],
  ["pants", "👖", "바지"],
  ["mosquito", "🦟", "모기"],
];
QUESTIONS.push(...EXTRA_WORDS.map(([id, picture, reading], index, words) => ({
  id, picture, reading, word: '', answer: reading,
  prompt: '그림에 맞는 낱말을 골라볼까?',
  choices: [reading, words[(index + 1) % words.length][2], words[(index + 2) % words.length][2]],
  hint: `뮤랑 읽어보자. ${[...reading].join('-')}. ${reading}!`
})));

function shuffled(items, random) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
export const DIFFICULTIES = {
  easy: { name: '쉬움', help: '소리를 듣고 낱말을 만들어요. 두 글자 2개·세 글자 2개·네 글자 1개를 섞어요. 오늘 푼 낱말은 다시 나오지 않아요.' },
  medium: { name: '보통', help: '짧은 낱말을 스스로 읽고, 알맞은 그림을 골라요. 막히면 뮤에게 소리 도움을 요청해요.' },
  hard: { name: '어려움', help: '짧은 문장을 혼자 읽고 그림을 골라요. 막히면 뮤에게 설명을 부탁해요. 5연속 오답이면 포획에 실패해요.' }
};
export function createQuiz(random = Math.random, completed = [], difficulty = 'easy') {
  if (difficulty === 'hard') return createSentenceQuiz({}, {random});
  const level = DIFFICULTIES[difficulty] ? difficulty : 'easy';
  const fresh = shuffled(QUESTIONS.filter(q => !completed.includes(q.id)), random);
  let selectedQuestions = fresh.slice(0, 5);
  if (level === 'easy') {
    const chosen = [];
    for (const length of [2, 2, 3, 3, 4]) {
      const question = fresh.find(q => !chosen.includes(q) && [...(q.reading ?? q.word.replace('□', q.answer))].length === length);
      if (question) chosen.push(question);
    }
    // Never repeat a completed word just to fill a length quota.
    selectedQuestions = [...chosen, ...fresh.filter(q => !chosen.includes(q))].slice(0, 5);
  }
  return { index: 0, answered: false, selected: [], difficulty: level,
    questions: selectedQuestions.map(q => {
      const reading = q.reading ?? q.word.replace('□', q.answer);
      if (level === 'easy') return { ...q, reading, word: '□'.repeat(reading.length), answer: reading,
        prompt: '글자를 순서대로 눌러 낱말을 만들어볼까?', choices: shuffled([...reading], random) };
      const alternatives = shuffled(QUESTIONS.filter(other => other.id !== q.id), random).slice(0, 2);
      return { ...q, reading, answer: q.picture, word: reading,
        prompt: '글을 읽고, 알맞은 그림을 골라봐!',
        hint: `뮤랑 읽어보자. ${[...reading].join('~ ')}. ${reading}!`,
        choices: shuffled([q.picture, ...alternatives.map(other => other.picture)], random) };
    }) };
}
export function chooseAnswer(quiz, answer) {
  if (quiz.index >= quiz.questions.length || quiz.answered) return false;
  if (answer !== quiz.questions[quiz.index].answer) return false;
  quiz.answered = true;
  return true;
}
export function nextQuestion(quiz) {
  if (!quiz.answered) return false;
  quiz.index++; quiz.answered = false; quiz.selected = [];
  quiz.assisted = false; quiz.failedAttempts = 0; quiz.recovery = null; quiz.mistakes = 0; quiz.answerRevealed = false;
  return true;
}
export function chooseQuizTile(quiz, tileIndex) {
  if (quiz.difficulty !== 'easy' || quiz.answered || quiz.index >= quiz.questions.length || !Number.isInteger(tileIndex)) return 'blocked';
  const q = quiz.questions[quiz.index];
  if (tileIndex < 0 || tileIndex >= q.choices.length || quiz.selected.includes(tileIndex)) return 'blocked';
  if (q.choices[tileIndex] !== q.reading[quiz.selected.length]) return 'wrong';
  quiz.selected.push(tileIndex);
  if (quiz.selected.length < q.reading.length) return 'partial';
  return chooseAnswer(quiz, q.reading) ? 'correct' : 'blocked';
}

// Recovery never grants collection credit; only an unassisted answer can do so.
export function noteQuizMistake(quiz) {
  quiz.totalMistakes = (quiz.totalMistakes ?? 0) + 1;
  quiz.mistakes = (quiz.mistakes ?? 0) + 1;
  quiz.assisted = true;
  if (quiz.mistakes >= 3) {
    quiz.failedAttempts = (quiz.failedAttempts ?? 0) + 1;
    quiz.recovery = quiz.failedAttempts >= 2 ? 'easy-practice' : 'practice';
  }
  return quiz.recovery ?? 'hint';
}
export function retryQuizQuestion(quiz, random = Math.random) {
  const q = quiz.questions[quiz.index], old = [...q.choices];
  q.choices = shuffled(old, random);
  if (q.choices.length > 1 && q.choices.every((x, i) => x === old[i])) q.choices.push(q.choices.shift());
  quiz.selected = []; quiz.answered = false; quiz.assisted = false;
  quiz.mistakes = 0; quiz.recovery = null;
}
export function quizCreditReady(quiz) { return quiz.answered && (quiz.difficulty === 'hard' || (!quiz.assisted && !quiz.recovery)); }

export function setupHangulQuiz({ getState, confirmMission, notify, speech, collection, saveSettings }) {
  const $ = selector => document.querySelector(selector);
  let quiz;
  let region = 'forest', walkSteps = 0;
  function renderAdventure(walking = false) {
    const place = REGIONS[region];
    $('#adventure-scene').dataset.region = region;
    $('#adventure-scenery').textContent = place.scenery;
    $('#adventure-walker').style.setProperty('--step', walkSteps);
    const walker = $('#adventure-walker');
    walker.classList.remove('walking');
    if (walking) { void walker.offsetWidth; walker.classList.add('walking'); }
    $('#adventure-status').textContent = `${place.name} 탐험 ${walkSteps}/5걸음${walkSteps === 5 ? ' · 누가 나타날까?' : ''}`;
    $('#adventure-footsteps').textContent = Array.from({ length: 5 }, (_, i) => i < walkSteps ? '👣' : '○').join(' ');
  }
  let inputLocked = false;
  let unlockTimer, advanceTimer;
  function advanceQuestion() {
    clearTimeout(advanceTimer);
    if ($('#quiz-dialog').open && quiz && nextQuestion(quiz)) {
      stopSpeaking(); // A new question may replace the old reading; individual tile taps may not.
      render();
    }
  }
  function scheduleNextQuestion() {
    clearTimeout(advanceTimer);
    const currentQuiz = quiz, currentIndex = quiz.index;
    advanceTimer = setTimeout(() => {
      if (quiz === currentQuiz && quiz.index === currentIndex) advanceQuestion();
    }, 650);
  }
  function lockInput() {
    inputLocked = true; clearTimeout(unlockTimer);
    unlockTimer = setTimeout(() => { inputLocked = false; }, 650);
  }
  const mission = () => getState().missions.find(m => m.id === 'hangul') ?? getState().missions.find(m => m.title.includes('한글'));
  const canSpeak = speech.supported;
  const savedLevel = getState().quizDifficulty;
  $('#quiz-difficulty').value = DIFFICULTIES[savedLevel] ? savedLevel : 'easy';
  $('#difficulty-help').textContent = DIFFICULTIES[$('#quiz-difficulty').value].help;
  $('#quiz-difficulty').addEventListener('change', () => {
    const level = $('#quiz-difficulty').value;
    getState().quizDifficulty = level; saveSettings();
    collection.render();
    $('#difficulty-help').textContent = DIFFICULTIES[level].help;
    $('#hard-reading-mode-label').hidden = level !== 'hard';
    say(`${DIFFICULTIES[level].name} 모험. ${DIFFICULTIES[level].help}`);
  });
  $('#hard-reading-mode-label').hidden = $('#quiz-difficulty').value !== 'hard';
  function stopSpeaking() { speech.stop(); }
  function say(text, options) { if (getState().speechAuto !== false) speech.speak(text, { interrupt: false, enqueue: true, ...options }); }
  function questionText(question) {
    if (quiz.difficulty === 'medium') return '글을 스스로 읽고, 알맞은 그림을 골라봐. 어려우면 뮤에게 소리 도움을 요청해도 괜찮아.';
    return `${quiz.difficulty === 'easy' ? question.answer : question.reading}. ${question.prompt} 글자가 궁금하면 작은 스피커를 눌러 들어 봐.`;
  }
  function render() {
    $('#quiz-dialog').dataset.mode = quiz.difficulty;
    renderAdventure();
    const finished = quiz.index === quiz.questions.length;
    $('#quiz-question-area').hidden = finished;
    $('#quiz-finish-area').hidden = !finished;
    $('#quiz-progress').textContent = finished ? '오늘의 작은 도전 성공!' : `${DIFFICULTIES[quiz.difficulty].name} · ${quiz.index + 1} / ${quiz.questions.length} 퀘스트`;
    $('#quiz-progress-bar').max = quiz.questions.length;
    $('#quiz-progress-bar').value = quiz.index;
    $('#quiz-dialog').scrollTop = 0;
    if (finished) {
      $('#quiz-reward-note').textContent = mission() ? '부모님이 확인하면 모험 보상을 받을 수 있어요. 오늘 시간 보상을 이미 받았어도 포켓몬 퀘스트는 계속할 수 있어요.' : '연결할 한글 미션이 없어요. 부모님 메뉴에서 이름에 ‘한글’이 들어가는 미션을 추가해 주세요.';
      $('#quiz-claim').disabled = !mission();
      $('#quiz-claim').focus();
      const waiting = collection.pendingCount({ includeRetry: true });
      $('#quiz-finish-area h3').textContent = waiting ? '탐험 성공! 야생 포켓몬을 발견했어!' : `${quiz.questions.length}문제 성공! 잘했어, 연우!`;
      say(waiting ? `${REGIONS[region].name} 탐험 성공! 누가 나타났을까?` : `${quiz.questions.length}문제 성공! 오늘도 멋져!`);
      collection.finishRound({ mistakes: quiz.difficulty === 'hard' ? (quiz.captureFailed ? 3 : 0) : quiz.totalMistakes ?? 0, region });
      return;
    }
    const question = quiz.questions[quiz.index];
    if (quiz.difficulty === 'hard') { renderSentence(question); return; }
    if (quiz.recovery) { renderPractice(question); return; }
    lockInput();
    $('#quiz-picture').hidden = quiz.difficulty === 'medium';
    $('#quiz-picture').textContent = question.picture;
    $('#quiz-speak').textContent = quiz.difficulty === 'medium' ? '🔊 뮤에게 읽기 도움 받기' : '🔊 낱말·문제 듣기';
    $('#quiz-word').textContent = question.word;
    $('#quiz-word').hidden = !question.word;
    $('#quiz-prompt').textContent = question.prompt;
    $('#quiz-feedback').textContent = '천천히 골라 봐. 틀려도 괜찮아!';
    $('#quiz-next').hidden = true;
    $('#quiz-answers').replaceChildren();
    $('#quiz-answers').dataset.longWord = String(question.choices.length >= 4);
    $('#quiz-answers').style.gridTemplateColumns = `repeat(${question.choices.length}, 1fr)`;
    for (const [tileIndex, answer] of question.choices.entries()) {
      const cell = document.createElement('div'); cell.className = 'quiz-choice';
      const button = document.createElement('button');
      button.type = 'button'; button.className = answer.length > 1 ? 'quiz-answer quiz-answer-word' : 'quiz-answer'; button.textContent = answer;
      if (quiz.difficulty === 'medium') button.classList.add('quiz-picture-answer');
      button.addEventListener('click', () => {
        if (quiz.answered || inputLocked) return;
        lockInput();
        const result = ['easy', 'hard'].includes(quiz.difficulty) ? chooseQuizTile(quiz, tileIndex) : (chooseAnswer(quiz, answer) ? 'correct' : 'wrong');
        if (result === 'blocked') return;
        if (result === 'partial') {
          button.disabled = true;
          $('#quiz-word').textContent = [...question.reading].map((letter, index) => index < quiz.selected.length ? letter : '□').join('');
          $('#quiz-feedback').textContent = '좋아! 다음 글자도 이어보자.';
          say($('#quiz-feedback').textContent, { enqueue: false });
          return;
        }
        if (result === 'correct') {
          if (['easy', 'hard'].includes(quiz.difficulty)) $('#quiz-word').textContent = question.reading;
          if (!quizCreditReady(quiz)) {
            quiz.recovery = 'practice'; render(); return;
          }
          const outcome = collection.recordCorrect(question.id, quiz.difficulty, region);
          if (outcome.counted || outcome.upgraded) { walkSteps = outcome.encountered ? 5 : outcome.steps; renderAdventure(true); }
          button.classList.add('correct');
          $('#quiz-feedback').textContent = `맞았어! ${(question.reading ?? question.word.replace('□', question.answer))}! 잘했어, 연우! ✦`;
          stopSpeaking(); // Clear this question and queued letter readings once the whole answer is correct.
          // Keep the success message visual so it cannot delay the next question's voice.
          $('#quiz-next').hidden = true;
          scheduleNextQuestion();
          $('#quiz-answers').querySelectorAll('.quiz-answer').forEach(node => { node.disabled = true; });
          $('#quiz-feedback').tabIndex = -1;
          $('#quiz-feedback').focus({ preventScroll: true });
        } else {
          const recovery = noteQuizMistake(quiz);
          if (quiz.totalMistakes >= 3) collection.markCaptureFailure();
          if (recovery !== 'hint') { render(); return; }
          const hint = ['easy', 'hard'].includes(quiz.difficulty) ? `천천히 해보자. 다음 글자는 ‘${question.reading[quiz.selected.length]}’야.` : question.hint;
          $('#quiz-feedback').textContent = hint;
          say(hint);
          button.classList.add('try-again');
        }
      });
      const listen = document.createElement('button');
      listen.type = 'button'; listen.className = 'quiz-choice-listen'; listen.textContent = '🔊 듣기';
      listen.setAttribute('aria-label', `${answer} 소리 듣기`); listen.disabled = !canSpeak;
      listen.addEventListener('click', () => speech.speak(answer, { interrupt: false, enqueue: true }));
      if (quiz.difficulty === 'medium') cell.append(button);
      else cell.append(button, listen); $('#quiz-answers').append(cell);
    }
    say(questionText(question));
  }
  function renderSentence(question) {
    markSentenceShown(getState(), question); saveSettings();
    lockInput();
    $('#quiz-progress').textContent = `어려움 · ${quiz.index + 1} / ${quiz.questions.length} · ${question.stage}단계 · ${question.isReview ? '복습' : '새 문제 · '+question.cycle+'바퀴'}`;
    $('#quiz-picture').hidden = true;
    $('#quiz-word').hidden = false;
    $('#quiz-word').textContent = question.sentence;
    $('#quiz-prompt').textContent = '문장을 읽고, 알맞은 그림을 골라봐!';
    $('#quiz-speak').textContent = '🔊 뮤에게 설명 듣기';
    $('#quiz-feedback').textContent = '천천히 읽어 봐. 도움이 필요하면 뮤를 불러 줘!';
    $('#quiz-next').hidden = true;
    $('#quiz-answers').replaceChildren();
    $('#quiz-answers').dataset.longWord = 'false';
    $('#quiz-answers').style.gridTemplateColumns = 'repeat(3, minmax(0, 1fr))';
    for (const option of question.options) {
      const button = document.createElement('button');
      button.type = 'button'; button.className = 'quiz-answer sentence-answer';
      button.dataset.choice = option.id;
      button.setAttribute('aria-label', option.description);
      button.innerHTML = sentencePicture(option.scene);
      button.addEventListener('click', () => {
        if (quiz.answered || inputLocked) return;
        lockInput();
        if (chooseAnswer(quiz, option.id)) {
          recordSentenceCorrect(getState(), quiz);
          const outcome = collection.recordCorrect(question.rewardId, 'hard', region);
          if (outcome.counted || outcome.upgraded) { walkSteps = outcome.encountered ? 5 : outcome.steps; renderAdventure(true); }
          saveSettings();
          button.classList.add('correct');
          $('#quiz-feedback').textContent = '맞았어! 문장을 잘 읽었어! ✦';
          stopSpeaking();
          $('#quiz-answers').querySelectorAll('button').forEach(b => { b.disabled = true; });
          scheduleNextQuestion();
        } else {
          const result = noteSentenceWrong(getState(), quiz);
          if (result === 'reveal') collection.markCaptureFailure();
          const message = result === 'reveal' ? `다섯 번 연속 틀렸어. 이번 포획은 실패야. ${question.reveal}` : question.hints[result === 'hint' ? 0 : 1];
          $('#quiz-feedback').textContent = message;
          if (result === 'reveal') {
            $('#quiz-answers').querySelectorAll('button').forEach(b => {
              if (b.dataset.choice === question.answer) b.classList.add('answer-revealed');
              else b.disabled = true;
            });
          }
          saveSettings(); say(message);
        }
      });
      $('#quiz-answers').append(button);
    }
    // Deliberately no automatic sentence reading, even on later questions or in review.
  }
  function renderPractice(question) {
    const easy = quiz.recovery === 'easy-practice';
    $('#quiz-picture').hidden = false;
    const mew = document.createElement('img'); mew.src = 'assets/mew.png'; mew.alt = '함께 연습하는 뮤'; mew.width = 96; mew.height = 96;
    $('#quiz-picture').replaceChildren(mew);
    $('#quiz-word').hidden = false;
    $('#quiz-word').textContent = easy ? question.reading[0] : question.reading;
    $('#quiz-prompt').textContent = easy
      ? '뮤: 조금 어려웠구나! 쉬운 글자부터 같이 해보자. 같은 글자를 찾아봐!'
      : '뮤: 포획은 잠깐 기다려! 틀린 낱말을 같이 연습하고 다시 도전하자.';
    $('#quiz-feedback').textContent = easy ? '연습에서는 틀려도 괜찮아. 보상과 오답 횟수는 변하지 않아.' : `${question.picture} ${question.reading}. ${question.hint}`;
    $('#quiz-collection-note').textContent = '연습 중에는 포획 실적이 올라가지 않아. 포켓몬과 확정 보상 기회는 그대로야!';
    $('#quiz-next').hidden = true;
    $('#quiz-answers').replaceChildren();
    $('#quiz-answers').dataset.longWord = 'false';
    $('#quiz-answers').style.gridTemplateColumns = '1fr';
    const retry = document.createElement('button');
    retry.type = 'button'; retry.className = 'primary'; retry.textContent = '연습했어! 다시 도전';
    retry.addEventListener('click', () => { retryQuizQuestion(quiz); render(); });
    if (easy) {
      const target = question.reading[0];
      const choices = shuffled([target, target === '가' ? '나' : '가'], Math.random);
      for (const letter of choices) {
        const button = document.createElement('button'); button.type = 'button';
        button.className = 'quiz-answer'; button.textContent = letter;
        button.addEventListener('click', () => {
          if (letter === target) {
            $('#quiz-feedback').textContent = '같은 글자를 찾았어! 준비되면 다시 도전해보자.';
            $('#quiz-answers').replaceChildren(retry);
            say($('#quiz-feedback').textContent);
          } else { $('#quiz-feedback').textContent = `뮤랑 찾아보자. ${target}!`; say($('#quiz-feedback').textContent); }
        });
        $('#quiz-answers').append(button);
      }
    } else $('#quiz-answers').append(retry);
    say(`${$('#quiz-prompt').textContent} ${easy ? question.reading[0] : question.reading + '. ' + question.hint}`);
  }
  $('#hangul-start').addEventListener('click', () => {
    clearTimeout(advanceTimer);
    stopSpeaking();
    const state = getState();
    // Starting the spoken easy adventure restores narration even after a saved mute.
    if ($('#quiz-difficulty').value === 'easy' && state.speechAuto === false) {
      state.speechAuto = true;
      const autoToggle = $('#speech-auto');
      if (autoToggle) autoToggle.checked = true;
      saveSettings();
    }
    region = document.querySelector('input[name="adventure-region"]:checked')?.value ?? 'forest';
    walkSteps = collection.explorationProgress(region);
    const completed = collection.completedToday();
    if ($('#quiz-difficulty').value !== 'hard' && QUESTIONS.every(q => completed.includes(q.id))) { notify('오늘의 낱말을 모두 탐험했어! 내일 다시 만나자!'); say('오늘의 낱말을 모두 탐험했어! 정말 잘했어! 내일 다시 만나자!'); return; }
    if ($('#quiz-difficulty').value === 'hard') {
      quiz = createSentenceQuiz(state, {review: $('#hard-reading-mode').value === 'review'});
      if (!quiz) { notify('복습할 문장이 없거나, 부모님 설정에서 복습이 꺼져 있어요.'); return; }
    } else quiz = createQuiz(Math.random, completed, $('#quiz-difficulty').value); $('#quiz-collection-note').textContent = `${REGIONS[region].name}에서 새로운 문제 5개를 성공하고 야생 포켓몬을 만나자!`; render(); $('#quiz-dialog').showModal();
  });
  $('#quiz-next').addEventListener('click', advanceQuestion);
  $('#quiz-speak').disabled = !canSpeak;
  $('#quiz-speak').addEventListener('click', () => {
    if (!canSpeak || quiz.index >= quiz.questions.length) return;
    const question = quiz.questions[quiz.index];
    if (quiz.difficulty === 'hard') {
      quiz.assisted = true;
      speech.speak(question.hints[0], {interrupt: false, enqueue: true});
      return;
    }
    if (quiz.difficulty === 'medium' && !quiz.answered) quiz.assisted = true;
    const text = quiz.difficulty === 'medium' ? `뮤랑 읽어보자. ${question.reading}. ${[...question.reading].join(', ')}. ${question.reading}.` : questionText(question);
    speech.speak(text); // Explicit replay must also recover from a missing native onend.
  });
  $('#quiz-claim').addEventListener('click', () => {
    if (!quiz || quiz.index !== quiz.questions.length) return;
    const linked = mission();
    if (!linked) { notify('부모님 메뉴에서 한글 미션을 추가해 주세요.'); return; }
    $('#quiz-dialog').close(); confirmMission(linked.id);
  });
  $('#quiz-dialog').addEventListener('close', () => { clearTimeout(unlockTimer); clearTimeout(advanceTimer); stopSpeaking(); });
}
