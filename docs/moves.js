export const MOVES = {
  confusion: { name: '염동력', quote: '집중하는 힘이 느껴져, 연우!', description: '뮤츠가 집중해서 초능력 고리를 만들었어요!' },
  shadowball: { name: '섀도볼', quote: '멋진 도전이야! 에너지를 모아볼까?', description: '뮤츠가 보라색 에너지를 모아 섀도볼을 날렸어요!' },
  aurasphere: { name: '파동탄', quote: '연우의 노력, 힘차게 날아가라!', description: '푸른 파동을 모아 파동탄 발사!' },
  psychic: { name: '사이코키네시스', quote: '연우의 힘이 깨어났어! 사이코키네시스!', description: '마스터볼이 공중으로! 연우가 특별 기술을 깨웠어요!' }
};
export const PSYCHIC_THRESHOLD = 60;
export function earnedMissionMinutes(state) {
  return state.entries.filter(entry => entry.day === state.day && entry.missionId && entry.minutes > 0)
    .reduce((sum, entry) => sum + entry.minutes, 0);
}
export function missionMove(mission) {
  if (['confusion', 'shadowball', 'aurasphere', 'psychic'].includes(mission.move)) return mission.move;
  return { hangul: 'confusion', bookclub: 'shadowball', reading: 'aurasphere' }[mission.id] ?? 'confusion';
}
export function celebrationMoves(mission, before, after) {
  const result = [missionMove(mission)];
  if (before < PSYCHIC_THRESHOLD && after >= PSYCHIC_THRESHOLD && !result.includes('psychic')) result.push('psychic');
  return result;
}
