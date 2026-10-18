import test from 'node:test';
import assert from 'node:assert/strict';
import { missionMove, celebrationMoves, earnedMissionMinutes } from '../docs/moves.js';
import { initialState, adjust, start, settle } from '../docs/model.js';

test('existing missions have distinct moves without a storage migration', () => {
  assert.equal(missionMove({ id: 'hangul' }), 'confusion');
  assert.equal(missionMove({ id: 'bookclub' }), 'shadowball');
  assert.equal(missionMove({ id: 'reading' }), 'aurasphere');
});
test('parent choice is honored and unknown choices fall back safely', () => {
  assert.equal(missionMove({ id: 'custom', move: 'shadowball' }), 'shadowball');
  assert.equal(missionMove({ id: 'custom', move: 'invalid' }), 'confusion');
});
test('60 earned minutes queues special action after the mission action', () => {
  assert.deepEqual(celebrationMoves({ id: 'hangul' }, 0, 30), ['confusion']);
  assert.deepEqual(celebrationMoves({ id: 'bookclub' }, 30, 60), ['shadowball', 'psychic']);
  assert.deepEqual(celebrationMoves({ id: 'reading' }, 60, 90), ['aurasphere']);
  assert.deepEqual(celebrationMoves({ id: 'custom' }, 50, 70), ['confusion', 'psychic']);
});
test('earned mission time excludes baseline/manual changes and survives viewing and deductions', () => {
  const now = new Date(2026, 9, 18, 12).getTime();
  const state = initialState(now);
  assert.equal(earnedMissionMinutes(state), 0);
  adjust(state, 30, '한글', now, 'hangul');
  start(state, now); settle(state, now + 1800_000);
  assert.equal(earnedMissionMinutes(state), 30);
  adjust(state, -15, '차감', now + 1800_000);
  adjust(state, 10, '직접 보상', now + 1800_000);
  assert.equal(earnedMissionMinutes(state), 30);
  adjust(state, 30, '북클럽', now + 1800_000, 'bookclub');
  assert.equal(earnedMissionMinutes(state), 60);
  settle(state, now + 86400_000);
  assert.equal(earnedMissionMinutes(state), 0);
});
