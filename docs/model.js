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
export function validateState(value) {
  if (!value || value.version !== 1 || !/^\d{4}-\d{2}-\d{2}$/.test(value.day) ||
      !Number.isInteger(value.baseMinutes) || value.baseMinutes < 0 || value.baseMinutes > 180 ||
      !Number.isFinite(value.usedSeconds) || value.usedSeconds < 0 ||
      !(value.startedAt === null || Number.isFinite(value.startedAt)) ||
      !Array.isArray(value.entries) || !Array.isArray(value.missions)) return false;
  return value.entries.every(x => typeof x.id === 'string' && typeof x.day === 'string' && Number.isInteger(x.minutes) &&
    Number.isFinite(x.date) && typeof x.reason === 'string') &&
    value.missions.every(x => typeof x.id === 'string' && typeof x.title === 'string' &&
      Number.isInteger(x.minutes) && x.minutes >= 1 && x.minutes <= 120);
}
