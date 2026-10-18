import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { POKEMON, collectionProgress, recordQuest, shinyDifficulty, SHINY_CHANCE } from '../docs/collection.js';
import { initialState, settle, validateState } from '../docs/model.js';

test('151 species plus two Mega forms have PNG artwork', () => {
  assert.equal(POKEMON.length, 153);
  assert.equal(new Set(POKEMON.map(p => p.id)).size, 153);
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
test('easy cannot unlock rare or legendary species; medium and hard have separate goals', () => {
  const state = initialState();
  for (let i = 0; i < 800; i++) recordQuest(state, `easy-${i}`, 'easy');
  assert.ok(collectionProgress(state).owned.every(p => !['희귀', '전설', '환상'].includes(p.rarity)));
  for (let i = 0; i < 50; i++) recordQuest(state, `medium-${i}`, 'medium');
  assert.ok(collectionProgress(state).owned.some(p => p.id === 'articuno'));
  assert.ok(!collectionProgress(state).owned.some(p => p.id === 'mewtwo'));
  for (let i = 0; i < 25; i++) recordQuest(state, `hard-${i}`, 'hard');
  assert.ok(collectionProgress(state).owned.some(p => p.id === 'mewtwo'));
  assert.ok(!collectionProgress(state).owned.some(p => p.id === 'mew'));
  for (let i = 25; i < 40; i++) recordQuest(state, `hard-${i}`, 'hard');
  assert.ok(collectionProgress(state).owned.some(p => p.id === 'mew'));
});
test('harder repeat upgrades its difficulty without counting the quest twice', () => {
  const state = initialState();
  recordQuest(state, 'tree', 'easy');
  assert.equal(recordQuest(state, 'tree', 'easy').counted, false);
  assert.equal(recordQuest(state, 'tree', 'hard').upgraded, true);
  assert.equal(collectionProgress(state).total, 1);
  assert.deepEqual(state.collection.byDifficulty, { easy: 0, medium: 0, hard: 1 });
  assert.equal(recordQuest(state, 'tree', 'medium').upgraded, false);
  assert.ok(validateState(state));
});
test('migration keeps previously collected legendary Pokemon without inventing hard scores', () => {
  const state = initialState();
  state.collection = { total: 755, day: state.day, questions: ['tree'] };
  assert.equal(collectionProgress(state).owned.length, 151);
  assert.equal(state.collection.byDifficulty.hard, 0);
  assert.ok(validateState(state));
});
test('all 151 shiny assets exist; genuine Mewtwo and Mew artwork differs from normal', () => {
  for (const p of POKEMON) assert.equal(readFileSync(new URL(`../docs/assets/shiny/${p.id}.png`, import.meta.url)).subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
  for (const id of ['mewtwo', 'mew']) assert.notDeepEqual(readFileSync(new URL(`../docs/assets/${id}.png`, import.meta.url)), readFileSync(new URL(`../docs/assets/shiny/${id}.png`, import.meta.url)));
});
test('shiny requires a higher difficulty and duplicate/review never rerolls', () => {
  const state = initialState(); let rolls = 0;
  for (let i = 0; i < 5; i++) recordQuest(state, `q${i}`, 'easy', () => { rolls++; return 0; });
  assert.equal(state.collection.shiny.length, 0); assert.equal(rolls, 0);
  const result = recordQuest(state, 'q0', 'medium', () => { rolls++; return 0; });
  assert.equal(result.unlocked[0].shiny, true); assert.equal(state.collection.shiny.length, 1);
  const count = rolls; recordQuest(state, 'q0', 'medium', () => { rolls++; return 0; }); assert.equal(rolls, count);
  const restored = JSON.parse(JSON.stringify(state)); assert.equal(collectionProgress(restored).shiny.length, 1); assert.ok(validateState(restored));
  assert.equal(shinyDifficulty(POKEMON.find(p => p.id === 'bulbasaur')), 'medium');
  assert.equal(shinyDifficulty(POKEMON.find(p => p.id === 'mewtwo')), 'hard');
  assert.ok(SHINY_CHANCE.hard > SHINY_CHANCE.medium);
});
test('20 advanced successes guarantee a shiny even when every random roll misses', () => {
  const state = initialState();
  for (let i = 0; i < 20; i++) recordQuest(state, `q${i}`, 'medium', () => 0.999);
  assert.equal(state.collection.shiny.length, 1); assert.equal(state.collection.shinyBonusAwards, 1);
  assert.ok(state.collection.shiny.every(id => shinyDifficulty(POKEMON.find(p => p.id === id)) === 'medium'));
  for (let i = 0; i < 20; i++) recordQuest(state, `q${i}`, 'medium', () => 0);
  assert.equal(state.collection.shiny.length, 1);
});

test('Mega Mewtwo forms unlock at hard 50 and 60 without awarding them during legacy migration', () => {
  const state = initialState();
  for (let i = 0; i < 60; i++) {
    const result = recordQuest(state, `mega-${i}`, 'hard', () => 0.999);
    if (i === 48) assert.ok(!collectionProgress(state).owned.some(p => p.form));
    if (i === 49) assert.ok(result.unlocked.some(p => p.id === 'mewtwo-mega-x' && !p.shiny));
    if (i === 59) assert.ok(result.unlocked.some(p => p.id === 'mewtwo-mega-y' && !p.shiny));
  }
  const restored = JSON.parse(JSON.stringify(state));
  assert.equal(collectionProgress(restored).owned.filter(p => p.form).length, 2);
  assert.ok(validateState(restored));
  const legacy = initialState();
  legacy.collection = { total: 755, day: legacy.day, questions: [] };
  assert.ok(!collectionProgress(legacy).owned.some(p => p.form));
});
