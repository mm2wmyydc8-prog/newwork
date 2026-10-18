import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { POKEMON, collectionProgress, recordQuest } from '../docs/collection.js';
import { initialState, settle, validateState } from '../docs/model.js';

test('151 ordered species have PNG artwork, basic to legendary and mythical', () => {
  assert.equal(POKEMON.length, 151);
  assert.equal(new Set(POKEMON.map(p => p.id)).size, 151);
  assert.equal(POKEMON[0].threshold, 5);
  POKEMON.forEach((p, i) => {
    if (i) assert.ok(p.threshold > POKEMON[i - 1].threshold);
    assert.equal(readFileSync(new URL(`../docs/assets/${p.id}.png`, import.meta.url)).subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
  });
  assert.ok(POKEMON.some(p => p.rarity === '전설'));
  assert.ok(POKEMON.some(p => p.rarity === '환상'));
});
test('first partner unlocks at 5, same-day duplicates do not advance', () => {
  const state = initialState();
  assert.equal(collectionProgress(state).total, 0);
  for (let i = 0; i < 4; i++) assert.deepEqual(recordQuest(state, `q${i}`).unlocked, []);
  assert.equal(recordQuest(state, 'q4').unlocked[0].name, '이상해씨');
  assert.equal(recordQuest(state, 'q4').counted, false);
  assert.equal(collectionProgress(state).total, 5);
  assert.equal(collectionProgress(state).owned.length, 1);
  assert.ok(validateState(state));
});
test('collection persists across days, reward deductions and serialization', () => {
  const now = new Date(2026, 9, 18, 12).getTime();
  const state = initialState(now);
  recordQuest(state, 'tree');
  settle(state, now + 86400_000);
  assert.equal(recordQuest(state, 'tree').counted, true);
  const restored = JSON.parse(JSON.stringify(state));
  assert.equal(collectionProgress(restored).total, 2);
  assert.equal(restored.entries.length, 0); // Capture progress never grants viewing time.
});
