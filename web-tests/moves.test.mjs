import test from 'node:test';
import assert from 'node:assert/strict';
import { missionMove, celebrationMoves } from '../docs/moves.js';

test('existing missions have distinct moves without a storage migration', () => {
  assert.equal(missionMove({ id: 'hangul' }), 'confusion');
  assert.equal(missionMove({ id: 'bookclub' }), 'shadowball');
  assert.equal(missionMove({ id: 'reading' }), 'aurasphere');
});
test('parent choice is honored and unknown choices fall back safely', () => {
  assert.equal(missionMove({ id: 'custom', move: 'shadowball' }), 'shadowball');
  assert.equal(missionMove({ id: 'custom', move: 'invalid' }), 'confusion');
});
test('90 minute crossing queues special action after the mission action', () => {
  assert.deepEqual(celebrationMoves({ id: 'hangul' }, 30, 60), ['confusion']);
  assert.deepEqual(celebrationMoves({ id: 'bookclub' }, 60, 90), ['shadowball', 'psychic']);
  assert.deepEqual(celebrationMoves({ id: 'reading' }, 90, 120), ['aurasphere']);
  assert.deepEqual(celebrationMoves({ id: 'custom' }, 80, 100), ['confusion', 'psychic']);
});
