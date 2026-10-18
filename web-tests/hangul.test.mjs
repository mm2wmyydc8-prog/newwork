import test from 'node:test';
import assert from 'node:assert/strict';
import { QUESTIONS, createQuiz, chooseAnswer, nextQuestion, chooseQuizTile } from '../docs/hangul.js';

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
  assert.equal(createQuiz(() => 0.4, QUESTIONS.map(q => q.id)).questions.length, 5);
});
test('three levels keep quest identity but present different tasks', () => {
  const easy = createQuiz(() => 0.4, [], 'easy');
  const medium = createQuiz(() => 0.4, [], 'medium');
  const hard = createQuiz(() => 0.4, [], 'hard');
  assert.deepEqual(easy.questions.map(q => q.id), hard.questions.map(q => q.id));
  easy.questions.forEach(q => { assert.equal(q.word, q.answer); assert.equal(q.answer.length, 1); });
  medium.questions.forEach(q => { assert.ok(q.word.endsWith('□')); assert.equal(q.word.replace('□', q.answer), q.reading); });
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
