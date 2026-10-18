import test from 'node:test';
import assert from 'node:assert/strict';
import { QUESTIONS, createQuiz, chooseAnswer, nextQuestion } from '../docs/hangul.js';

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
