import { POKEMON, collectionProgress, canUseMegaMoves, shinyDiscovered } from './collection.js?v=test-all-captured';
import { PARTNER_MOVESETS } from './partner-moves.js?v=partner-habitats';
import { PSYCHIC_THRESHOLD, earnedMissionMinutes } from './moves.js?v=partner-habitats';

function decorate(pokemon, shiny = false) {
  return { ...pokemon, shiny, moves: PARTNER_MOVESETS[pokemon.id], image: `assets/${shiny ? 'shiny/' : ''}${pokemon.id}.png` };
}
export function availablePartners(state) {
  const { owned, shiny } = collectionProgress(state);
  const defaultPartner = POKEMON.find(p => p.id === 'mewtwo');
  const normal = [defaultPartner, ...owned.filter(p => p.id !== 'mewtwo' && (!p.form || canUseMegaMoves(state, p.id)))];
  return normal.flatMap(p => [decorate(p), ...(shinyDiscovered(state) && shiny.includes(p.id) ? [decorate(p, true)] : [])]);
}
export function getPartner(state) {
  return availablePartners(state).find(p => p.id === state.partner?.id && p.shiny === Boolean(state.partner?.shiny))
    ?? decorate(POKEMON.find(p => p.id === 'mewtwo'));
}
export function selectPartner(state, id, shiny = false) {
  if (!availablePartners(state).some(p => p.id === id && p.shiny === shiny)) return false;
  state.partner = { id, shiny }; return true;
}
export function missionPartnerSlot(state, mission) {
  const slots = { confusion: 0, shadowball: 1, aurasphere: 2, psychic: 3 };
  if (Object.hasOwn(slots, mission.move)) return slots[mission.move];
  return { hangul: 0, bookclub: 1, reading: 2 }[mission.id] ?? Math.max(0, state.missions.findIndex(m => m.id === mission.id)) % 4;
}
export function partnerCelebrationSlots(state, mission, before, after) {
  const slot = missionPartnerSlot(state, mission);
  return before < PSYCHIC_THRESHOLD && after >= PSYCHIC_THRESHOLD && slot !== 3 ? [slot, 3] : [slot];
}

// Only today's confirmed quests reveal move names. Manual time grants never unlock them.
export function revealedPartnerSlots(state) {
  const slots = new Set();
  for (const entry of state.entries) {
    if (entry.day !== state.day || !entry.missionId || entry.minutes <= 0) continue;
    const mission = state.missions.find(m => m.id === entry.missionId);
    if (mission) slots.add(missionPartnerSlot(state, mission));
  }
  if (earnedMissionMinutes(state) >= PSYCHIC_THRESHOLD) slots.add(3);
  return slots;
}
