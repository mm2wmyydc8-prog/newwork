const COLORS = {
  confusion: '#d4ab4c', psychic: '#b77de2', shadowball: '#9770bd', aurasphere: '#5aaff3',
  fire: '#ff974c', water: '#64cafa', electric: '#f4d443', leaf: '#8acb62', ice: '#9ce3fa',
  rock: '#b19a79', normal: '#c6b3a0', wind: '#b7dbe9', poison: '#b66cce'
};
const SYMBOLS = { fang: '', needle: '➤', liquid: '●', flame: '▲', bolt: 'ϟ', leaf: '❧', ice: '✧',
  rock: '◆', slash: '╱', punch: '✦', kick: '✦', impact: '✹', wind: '≋', shield: '◇', heal: '✚',
  transform: '✦', status: '♪', psychic: '✦', beam: '━', ball: '●' };
const EXACT = {
 'string-shot':'thread',electroweb:'thread',surf:'surf','fly':'fly','body-slam':'impact','quick-attack':'impact','extreme-speed':'impact',
 'drill-peck':'needle','double-horn':'needle','fury-attack':'needle','poison-jab':'needle',
 'sand-attack':'sand','sand-tomb':'sand',spikes:'spikes','mud-slap':'mud','mud-shot':'mud','gunk-shot':'ball',
 'venoshock':'poison-burst','draining-kiss':'drain','leech-life':'drain','dream-eater':'drain',
 'fairy-wind':'wind','play-rough':'impact','iron-tail':'tail',sing:'song','double-slap':'slap',
 'pay-day':'coins','low-kick':'kick','low-sweep':'kick','karate-chop':'chop',submission:'roll',teleport:'teleport',
 barrier:'shield',hypnosis:'hypnosis',psybeam:'psybeam','brick-break':'chop','seismic-toss':'toss',
 sludge:'liquid',smog:'smog',lick:'tongue','rock-slide':'rock','rock-throw':'rock','self-destruct':'explosion',explosion:'explosion',
 'egg-bomb':'ball','bone-club':'bone','bone-rush':'bone',bonemerang:'bone','double-kick':'kick',
 'dragon-rage':'dragon-rage',outrage:'impact','dragon-breath':'flame',twister:'twister',rest:'heal','sleep-talk':'song','destiny-bond':'bond',
 'million-volt':'bolt','fury-cutter':'slash'
};
export function classifyMove(move) {
  const id = move.id;
  let motion;
  if (EXACT[id]) motion = EXACT[id];
  else if (id === 'sludge-bomb') motion = 'ball';
  else if (/fang|^bite$|^crunch$|^bug-bite$/.test(id)) motion = 'fang';
  else if (/sting|needle|jab|pin-missile/.test(id)) motion = 'needle';
  else if (/slash|claw|scratch|cut|razor-wind|fury-swipes/.test(id)) motion = 'slash';
  else if (/punch|palm|hammer-arm/.test(id)) motion = 'punch';
  else if (/kick|low-sweep|stomp|bounce/.test(id)) motion = 'kick';
  else if (/beam|^solar-beam$|^psybeam$/.test(id)) motion = 'beam';
  else if (/flame|fire-blast|ember|heat-wave|fire-spin/.test(id)) motion = 'flame';
  else if (/thunder|volt|spark|electro|^zap-cannon$/.test(id)) motion = 'bolt';
  else if (/water|surf|hydro|bubble|acid|sludge|smog|mud/.test(id)) motion = 'liquid';
  else if (/ball|sphere|bomb|seed/.test(id)) motion = 'ball';
  else if (/leaf|petal|vine|whip/.test(id)) motion = 'leaf';
  else if (/ice|blizzard|icy|aurora|freeze/.test(id)) motion = 'ice';
  else if (/rock|stone|earth|dig|sand/.test(id)) motion = 'rock';
  else if (/wing|gust|hurricane|fly|drill-peck|peck|air/.test(id)) motion = 'wind';
  else if (/protect|defense|harden|withdraw|barrier|screen|safeguard|armor/.test(id)) motion = 'shield';
  else if (/recover|rest$|heal|roost|synthesis|soft-boiled/.test(id)) motion = 'heal';
  else if (/growl|leer|screech|sing|powder|spore|smokescreen|dance|swagger|substitute|conversion|focus-energy/.test(id)) motion = 'status';
  else if (id === 'transform') motion = 'transform';
  else if (/psychic|confusion|psystrike|psycho|psyshock|extrasensory|telekinesis/.test(id)) motion = 'psychic';
  else if (/tackle|slam|headbutt|rage|flail|splash|rollout|take-down|super-fang|horn|quick-attack|tail|extreme-speed/.test(id)) motion = 'impact';
  else motion = ({ fire: 'flame', water: 'liquid', electric: 'bolt', leaf: 'leaf', ice: 'ice', rock: 'rock',
    poison: 'liquid', wind: 'wind', psychic: 'psychic', confusion: 'psychic', shadowball: 'ball', aurasphere: 'ball' })[move.effect] ?? 'impact';
  return { motion, color: ({'solar-beam':'#ffffff','draining-kiss':'#ff9ccd','fairy-wind':'#ffc5eb','play-rough':'#ff9cc2','dragon-breath':'#79caff'})[id] ?? COLORS[move.effect] ?? COLORS.normal,
    symbol: id === 'fire-blast' ? '大' : (SYMBOLS[motion] ?? '') };
}
