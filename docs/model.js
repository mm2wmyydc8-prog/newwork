import { validateReading } from './sentence-learning.js?v=family-art';
export const MAX_MINUTES = 240;
export function dayKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
export function initialState(now = Date.now()) {
  return { version: 1, day: dayKey(new Date(now)), baseMinutes: 30, entries: [],
    usedSeconds: 0, startedAt: null,
    missions: [
      { id: 'hangul', title: '한글 공부', minutes: 30 },
      { id: 'bookclub', title: '북클럽 오늘 학습', minutes: 30 },
      { id: 'reading', title: '책읽기', minutes: 30 }
    ] };
}
export function resetTestProgress(state, now = Date.now()) {
  const clean = initialState(now);
  clean.missions = state.missions.map(m=>({...m}));
  clean.baseMinutes = state.baseMinutes;
  for (const key of ['speechAuto','speechRate','quizDifficulty']) if (state[key] !== undefined) clean[key] = state[key];
  return clean;
}
export function totalMinutes(state) {
  const bonus = state.entries.filter(x => x.day === state.day).reduce((sum, x) => sum + x.minutes, 0);
  return Math.max(0, Math.min(MAX_MINUTES, state.baseMinutes + bonus));
}
export function remainingSeconds(state, now = Date.now()) {
  const elapsed = state.startedAt === null ? 0 : Math.max(0, (now - state.startedAt) / 1000);
  return Math.max(0, Math.ceil(totalMinutes(state) * 60 - state.usedSeconds - elapsed));
}
export function settle(state, now = Date.now()) {
  const day = dayKey(new Date(now));
  if (day !== state.day) {
    state.day = day; state.usedSeconds = 0; state.startedAt = null;
  } else if (state.startedAt !== null) {
    const elapsed = Math.max(0, (now - state.startedAt) / 1000);
    state.usedSeconds = Math.max(state.usedSeconds, Math.min(totalMinutes(state) * 60, state.usedSeconds + elapsed));
    state.startedAt = state.usedSeconds >= totalMinutes(state) * 60 ? null : now;
  }
}
export function pause(state, now = Date.now()) {
  if (state.startedAt !== null) state.usedSeconds += Math.max(0, (now - state.startedAt) / 1000);
  state.startedAt = null;
}
export function start(state, now = Date.now()) {
  settle(state, now);
  if (state.startedAt === null && remainingSeconds(state, now) > 0) state.startedAt = now;
}
export function adjust(state, minutes, reason, now = Date.now(), missionId = null) {
  settle(state, now);
  if (!Number.isInteger(minutes) || !reason.trim()) throw new Error('시간과 이유를 확인해 주세요.');
  const before = totalMinutes(state);
  const applied = Math.max(0, Math.min(MAX_MINUTES, before + minutes)) - before;
  if (applied === 0) return 0;
  state.entries.unshift({ id: crypto.randomUUID(), date: now, day: state.day, minutes: applied,
    reason: reason.trim().slice(0, 60), missionId });
  // Keep all today's entries; pruning today's ledger could change the budget.
  state.entries = state.entries.filter(x => x.date >= now - 90 * 86400_000);
  settle(state, now);
  return applied;
}
export function missionDone(state, id) {
  return state.entries.some(x => x.day === state.day && x.missionId === id);
}
export function resetTodayQuests(state, now = Date.now()) {
  settle(state, now);
  state.entries = state.entries.filter(entry => entry.day !== state.day || entry.missionId == null);
  settle(state, now);
}
export function validateState(value) {
  if (!value || value.version !== 1 || !/^\d{4}-\d{2}-\d{2}$/.test(value.day) ||
      !Number.isInteger(value.baseMinutes) || value.baseMinutes < 0 || value.baseMinutes > 180 ||
      !Number.isFinite(value.usedSeconds) || value.usedSeconds < 0 ||
      !(value.startedAt === null || Number.isFinite(value.startedAt)) ||
      !Array.isArray(value.entries) || !Array.isArray(value.missions)) return false;
  if (value.hardReading !== undefined && !validateReading(value.hardReading)) return false;
  if (value.partner !== undefined && (!value.partner || typeof value.partner.id !== 'string' || typeof value.partner.shiny !== 'boolean')) return false;
  if (value.collection !== undefined && (!value.collection || !Number.isSafeInteger(value.collection.total) || value.collection.total < 0 ||
      typeof value.collection.day !== 'string' || !Array.isArray(value.collection.questions) ||
      !value.collection.questions.every(id => typeof id === 'string'))) return false;
  if (value.collection?.byDifficulty) {
    const c = value.collection;
    if (!['easy', 'medium', 'hard'].every(level => Number.isSafeInteger(c.byDifficulty[level]) && c.byDifficulty[level] >= 0) ||
        !Array.isArray(c.owned) || !c.owned.every(id => typeof id === 'string') ||
        !c.levels || typeof c.levels !== 'object' || Array.isArray(c.levels) ||
        !Object.values(c.levels).every(level => ['easy', 'medium', 'hard'].includes(level))) return false;
  }
  if (value.collection?.adventureMode !== undefined && typeof value.collection.adventureMode !== 'boolean') return false;
  if (value.collection?.explorationSteps !== undefined && (!value.collection.explorationSteps || Array.isArray(value.collection.explorationSteps) ||
      !Object.entries(value.collection.explorationSteps).every(([region, steps]) => ['forest', 'sea', 'cave', 'powerplant', 'haunted', 'ice', 'volcano'].includes(region) && Number.isInteger(steps) && steps >= 0 && steps < 5))) return false;
  if (value.collection?.pendingEncounters !== undefined && (!Array.isArray(value.collection.pendingEncounters) ||
      !value.collection.pendingEncounters.every(p => p && typeof p.id === 'string' && typeof p.pendingId === 'string' &&
        typeof p.shiny === 'boolean' && (!p.exploration || ['forest', 'sea', 'cave', 'powerplant', 'haunted', 'ice', 'volcano'].includes(p.region))) ||
      new Set(value.collection.pendingEncounters.map(p => p.pendingId)).size !== value.collection.pendingEncounters.length)) return false;
  if (value.collection?.testAllCaptured !== undefined && typeof value.collection.testAllCaptured !== 'boolean') return false;
  if (value.collection?.captureRetryRequired !== undefined && typeof value.collection.captureRetryRequired !== 'boolean') return false;
  if (value.collection?.shinyIntroSeen !== undefined && typeof value.collection.shinyIntroSeen !== 'boolean') return false;
  if (value.collection?.pikachuGiftClaimed !== undefined && typeof value.collection.pikachuGiftClaimed !== 'boolean') return false;
  if (value.collection?.stoneNoticeSeen !== undefined && typeof value.collection.stoneNoticeSeen !== 'boolean') return false;
  if (value.collection?.shiny !== undefined && (!Array.isArray(value.collection.shiny) ||
      !value.collection.shiny.every(id => typeof id === 'string') || new Set(value.collection.shiny).size !== value.collection.shiny.length)) return false;
  if (value.collection?.shinyBonusAwards !== undefined && (!Number.isSafeInteger(value.collection.shinyBonusAwards) || value.collection.shinyBonusAwards < 0)) return false;
  return value.entries.every(x => typeof x.id === 'string' && typeof x.day === 'string' && Number.isInteger(x.minutes) &&
    Number.isFinite(x.date) && typeof x.reason === 'string') &&
    value.missions.every(x => typeof x.id === 'string' && typeof x.title === 'string' &&
      Number.isInteger(x.minutes) && x.minutes >= 1 && x.minutes <= 120);
}
