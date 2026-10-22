export const REGION_SYMBOLS = ["cave","🌳", "🌲", "🌼", "🌿", "🌊", "🐚", "🪸", "🪨", "💎", "✨", "⚡", "🏭", "🔋", "👻", "🕸️", "🏚️", "🕯️", "❄️", "🧊", "⛄", "🌋", "🔥", "👣", "❓", "❔"];
export function regionImagePath(symbol) {
  if (symbol === 'cave') return 'assets/regions/cave.svg';
  if (symbol === '🪨') return 'assets/regions/rock-angular.svg';
  if (!REGION_SYMBOLS.includes(symbol)) throw new Error('Unknown region illustration');
  const code = [...symbol].map(c => c.codePointAt(0)).filter(n => n !== 0xfe0f).map(n => n.toString(16)).join('-');
  return `assets/regions/${code}.svg`;
}
export function regionArt(symbol, className = 'scenery-icon') {
  return `<img class="${className}" src="${regionImagePath(symbol)}" alt="" aria-hidden="true" width="36" height="36">`;
}
export function sceneryArt(scenery) {
  return scenery.split(' ').map(symbol => regionArt(symbol)).join('');
}
