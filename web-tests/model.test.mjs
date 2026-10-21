import test from 'node:test';
import assert from 'node:assert/strict';
import { initialState, totalMinutes, remainingSeconds, settle, start, pause, adjust, missionDone, validateState } from '../docs/model.js';

const now = () => new Date(2026, 9, 18, 12).getTime();
test('default missions and saved state round trip', () => {
  const s = initialState(now());
  assert.equal(s.missions.length, 3); assert.equal(totalMinutes(s), 30);
  assert.ok(validateState(JSON.parse(JSON.stringify(s))));
  assert.equal(validateState({}), false);
});
test('mission reward, daily completion and bounded ledger', () => {
  const s = initialState(now());
  assert.equal(adjust(s, 30, '한글 공부', now(), 'hangul'), 30);
  assert.equal(totalMinutes(s), 60); assert.ok(missionDone(s, 'hangul'));
  assert.equal(adjust(s, 500, '상한', now()), 180);
  assert.equal(totalMinutes(s), 240);
  assert.equal(adjust(s, -500, '하한', now()), -240);
  assert.equal(totalMinutes(s), 0);
});
test('countdown, pause and resume preserve used time', () => {
  const s = initialState(now()); start(s, now());
  assert.equal(remainingSeconds(s, now() + 60_000), 1740);
  pause(s, now() + 60_000);
  assert.equal(remainingSeconds(s, now() + 600_000), 1740);
  start(s, now() + 600_000);
  assert.equal(remainingSeconds(s, now() + 660_000), 1680);
});
test('reload uses elapsed wall clock; timeout stops and does not give free time', () => {
  const s = initialState(now()); start(s, now());
  const restored = JSON.parse(JSON.stringify(s));
  settle(restored, now() + 3600_000);
  assert.equal(restored.startedAt, null); assert.equal(remainingSeconds(restored), 0);
  adjust(restored, 30, '보상', now() + 3600_000);
  assert.equal(remainingSeconds(restored), 1800);
});
test('lowering a running budget preserves already consumed time', () => {
  const s = initialState(now()); start(s, now());
  adjust(s, -25, '차감', now() + 600_000);
  assert.equal(s.startedAt, null);
  assert.equal(s.usedSeconds, 600);
  adjust(s, 25, '복원', now() + 600_000);
  assert.equal(remainingSeconds(s), 1200);
});
test('daily reset expires rewards, completes session and restores base', () => {
  const s = initialState(now()); adjust(s, 30, '북클럽', now(), 'bookclub'); start(s, now());
  settle(s, now() + 86400_000);
  assert.equal(s.startedAt, null); assert.equal(totalMinutes(s), 30);
  assert.equal(remainingSeconds(s), 1800); assert.equal(missionDone(s, 'bookclub'), false);
});
test('renaming/deleting a mission retains earned rewards', () => {
  const s = initialState(now()); adjust(s, 30, '한글 공부', now(), 'hangul');
  s.missions[0].minutes = 10; s.missions.splice(0, 1);
  assert.equal(totalMinutes(s), 60); assert.equal(s.entries[0].minutes, 30);
});

test('reset today quests removes only today mission rewards while preserving collection and other timer records', async () => {
 const {resetTodayQuests}=await import('../docs/model.js');
 const now=new Date(2026,9,21,12).getTime();
 const state=initialState(now);
 adjust(state,10,'manual',now);
 adjust(state,30,'study',now,'hangul');
 adjust(state,30,'club',now,'bookclub');
 state.entries.push({id:'yesterday',day:'2026-10-20',date:now-86400000,minutes:20,reason:'old',missionId:'reading'});
 state.usedSeconds=100;
 state.collection={total:7,day:state.day,questions:[]};
 const collection=JSON.stringify(state.collection),missions=JSON.stringify(state.missions);
 resetTodayQuests(state,now);
 assert.equal(missionDone(state,'hangul'),false);
 assert.equal(missionDone(state,'bookclub'),false);
 assert.equal(totalMinutes(state),40);
 assert.equal(state.usedSeconds,100);
 assert.ok(state.entries.some(e=>e.id==='yesterday'));
 assert.equal(JSON.stringify(state.collection),collection);
 assert.equal(JSON.stringify(state.missions),missions);
 assert.ok(validateState(state));
});
