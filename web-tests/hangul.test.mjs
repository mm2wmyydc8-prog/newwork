import test from 'node:test';
import assert from 'node:assert/strict';
import { QUESTIONS, createQuiz, chooseAnswer, nextQuestion, chooseQuizTile, noteQuizMistake, retryQuizQuestion, quizCreditReady } from '../docs/hangul.js';

test('questions have unique IDs and exactly one correct choice', () => {
  assert.equal(new Set(QUESTIONS.map(q => q.id)).size, QUESTIONS.length);
  for (const q of QUESTIONS) {
    assert.equal(q.choices.length, 3);
    assert.equal(q.choices.filter(x => x === q.answer).length, 1);
    assert.equal(new Set(q.choices).size, 3);
  }
});
test('practice vocabulary and every choice contain no final consonants', () => {
  for (const q of QUESTIONS) {
    for (const text of [q.word, q.reading ?? '', ...q.choices]) {
      for (const letter of text) {
        const code = letter.charCodeAt(0);
        if (code >= 0xAC00 && code <= 0xD7A3) assert.equal((code - 0xAC00) % 28, 0, letter);
      }
    }
  }
});
test('five unique questions, retries do not advance, all five must be answered', () => {
  const quiz = createQuiz(() => 0.4);
  assert.equal(quiz.questions.length, 5);
  assert.equal(new Set(quiz.questions.map(q => q.id)).size, 5);
  assert.equal(nextQuestion(quiz), false);
  assert.equal(chooseAnswer(quiz, '間違い'), false);
  assert.equal(quiz.index, 0);
  for (let i = 0; i < 5; i++) {
    assert.equal(chooseAnswer(quiz, quiz.questions[i].answer), true);
    assert.equal(chooseAnswer(quiz, quiz.questions[i].answer), false);
    assert.equal(nextQuestion(quiz), true);
  }
  assert.equal(quiz.index, 5);
  assert.equal(nextQuestion(quiz), false);
  assert.equal(chooseAnswer(quiz, '나'), false);
});
test('new quests are preferred over same-day review', () => {
  const first = createQuiz(() => 0.4);
  const completed = first.questions.map(q => q.id);
  const next = createQuiz(() => 0.4, completed);
  assert.ok(next.questions.every(q => !completed.includes(q.id)));
  assert.equal(createQuiz(() => 0.4, QUESTIONS.map(q => q.id)).questions.length, 0);
});
test('three levels keep quest identity but present different tasks', () => {
  const easy = createQuiz(() => 0.4, [], 'easy');
  const medium = createQuiz(() => 0.4, [], 'medium');
  const hard = createQuiz(() => 0.4, [], 'hard');
  easy.questions.forEach(q => { assert.equal(q.answer, q.reading); assert.deepEqual([...q.choices].sort(), [...q.reading].sort()); });
  assert.deepEqual(medium.questions.map(q => q.id), hard.questions.map(q => q.id));
  medium.questions.forEach(q => { assert.equal(q.word, q.reading); assert.equal(q.answer, q.picture); assert.equal(new Set(q.choices).size, 3); assert.equal(q.choices.filter(c => c === q.picture).length, 1); });
  hard.questions.forEach(q => { assert.equal(q.answer, q.reading); assert.deepEqual([...q.choices].sort(), [...q.reading].sort()); });
});
test('hard requires ordered, distinct tiles including repeated syllables', () => {
  const quiz = createQuiz(() => 0.4, [], 'hard');
  quiz.questions[0] = { id: 'banana', reading: '바나나', answer: '바나나', choices: ['나', '바', '나'] };
  assert.equal(chooseQuizTile(quiz, 0), 'wrong');
  assert.equal(quiz.selected.length, 0);
  assert.equal(chooseQuizTile(quiz, 1), 'partial');
  assert.equal(chooseQuizTile(quiz, 1), 'blocked');
  assert.equal(chooseQuizTile(quiz, 0), 'partial');
  assert.equal(quiz.answered, false);
  assert.equal(chooseQuizTile(quiz, 2), 'correct');
  assert.equal(chooseQuizTile(quiz, 2), 'blocked');
  assert.equal(nextQuestion(quiz), true); assert.deepEqual(quiz.selected, []);
});

test('answer revealed by hint cannot earn credit until a shuffled independent retry', () => {
 const quiz = createQuiz(() => 0.4);
 const question = quiz.questions[0];
 noteQuizMistake(quiz);
 chooseAnswer(quiz, question.answer);
 assert.equal(quizCreditReady(quiz), false);
 const before = [...question.choices];
 retryQuizQuestion(quiz, () => 0.999);
 assert.notDeepEqual(question.choices, before);
 assert.equal(quiz.answered, false);
 assert.equal(quiz.selected.length, 0);
 chooseAnswer(quiz, question.answer);
 assert.equal(quizCreditReady(quiz), true);
});
test('three errors suspend reward; a second failed attempt enters easy practice', () => {
 const quiz = createQuiz(() => 0.4, [], 'hard');
 assert.equal(noteQuizMistake(quiz), 'hint');
 assert.equal(noteQuizMistake(quiz), 'hint');
 assert.equal(noteQuizMistake(quiz), 'practice');
 assert.equal(quizCreditReady(quiz), false);
 retryQuizQuestion(quiz);
 assert.equal(quiz.mistakes, 0);
 assert.equal(quiz.failedAttempts, 1);
 noteQuizMistake(quiz); noteQuizMistake(quiz);
 assert.equal(noteQuizMistake(quiz), 'easy-practice');
 retryQuizQuestion(quiz);
 quiz.questions[0].choices = [...quiz.questions[0].reading];
 for (let i = 0; i < quiz.questions[0].choices.length; i++) chooseQuizTile(quiz, i);
 assert.equal(quizCreditReady(quiz), true);
 nextQuestion(quiz);
 assert.equal(quiz.failedAttempts, 0);
});

test('easy now uses the previous hard tile mechanic, including repeated letters and retry', () => {
 const quiz = createQuiz(() => 0.4, [], 'easy');
 quiz.questions[0] = { id: 'banana', reading: '바나나', answer: '바나나', choices: ['나', '바', '나'] };
 assert.equal(chooseQuizTile(quiz, 0), 'wrong');
 noteQuizMistake(quiz);
 assert.equal(chooseQuizTile(quiz, 1), 'partial');
 assert.equal(chooseQuizTile(quiz, 0), 'partial');
 assert.equal(chooseQuizTile(quiz, 2), 'correct');
 assert.equal(quizCreditReady(quiz), false);
 retryQuizQuestion(quiz);
 const q = quiz.questions[0];
 for (const letter of q.reading) {
   const i = q.choices.findIndex((x, index) => x === letter && !quiz.selected.includes(index));
   chooseQuizTile(quiz, i);
 }
 assert.equal(quizCreditReady(quiz), true);
 assert.equal(quiz.difficulty, 'easy');
});

test('60 distinct pictured words allow twelve adventures without same-day repeats', () => {
 assert.equal(QUESTIONS.length,60);
 assert.equal(new Set(QUESTIONS.map(q=>q.picture)).size,60);
 const completed=[];
 for(let round=0;round<12;round++) {
  const quiz=createQuiz(()=>0.4,completed,'medium');
  assert.ok(quiz.questions.every(q=>!completed.includes(q.id)));
  for(const q of quiz.questions) {
   assert.equal(q.choices.length,3);
   assert.equal(new Set(q.choices).size,3);
   completed.push(q.id);
  }
 }
 assert.equal(new Set(completed).size,60);
});

test('today completed words never return even at a different difficulty or at the end of the bank', () => {
 const easy=createQuiz(()=>0.4,[],'easy');
 const done=easy.questions.map(q=>q.id);
 const medium=createQuiz(()=>0.4,done,'medium');
 assert.ok(medium.questions.every(q=>!done.includes(q.id)));
 const allButTwo=QUESTIONS.slice(0,-2).map(q=>q.id);
 assert.equal(createQuiz(()=>0.4,allButTwo,'hard').questions.length,2);
 assert.equal(createQuiz(()=>0.4,QUESTIONS.map(q=>q.id),'easy').questions.length,0);
 assert.equal(createQuiz(()=>0.4,[],'easy').questions.length,5);
});

test('easy balances two two-syllable, two three-syllable, and one four-syllable word', () => {
 for(const roll of [0,0.2,0.4,0.8,0.999]) {
  const quiz=createQuiz(()=>roll,[],'easy');
  assert.deepEqual(quiz.questions.map(q=>q.reading.length),[2,2,3,3,4]);
  assert.equal(new Set(quiz.questions.map(q=>q.id)).size,5);
 }
});
test('easy fills missing word lengths with fresh words instead of repeating same-day words', () => {
 const fourLetterIds=QUESTIONS.filter(q=>(q.reading??q.word.replace('□',q.answer)).length===4).map(q=>q.id);
 const quiz=createQuiz(()=>0.4,fourLetterIds,'easy');
 assert.equal(quiz.questions.length,5);
 assert.ok(quiz.questions.every(q=>!fourLetterIds.includes(q.id)));
 assert.deepEqual(quiz.questions.slice(0,4).map(q=>q.reading.length),[2,2,3,3]);
});

test('round mistake total survives question changes and practice retries', () => {
 const quiz=createQuiz(()=>0.4);
 noteQuizMistake(quiz);retryQuizQuestion(quiz);
 chooseAnswer(quiz,quiz.questions[0].answer);nextQuestion(quiz);
 noteQuizMistake(quiz);retryQuizQuestion(quiz);
 chooseAnswer(quiz,quiz.questions[1].answer);nextQuestion(quiz);
 noteQuizMistake(quiz);retryQuizQuestion(quiz);
 assert.equal(quiz.totalMistakes,3);
 assert.equal(quiz.mistakes,0);
});
