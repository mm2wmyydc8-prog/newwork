import { initialState, validateState, settle, totalMinutes, remainingSeconds, start, pause, adjust, missionDone } from './model.js?v=shiny-forms';
import { MOVES, PSYCHIC_THRESHOLD, missionMove, celebrationMoves, earnedMissionMinutes } from './moves.js?v=daily60';
import { setupHangulQuiz } from './hangul.js?v=medium-reading';
import { createKoreanSpeech } from './speech.js';
import { setupCollection } from './collection.js?v=swipe-throw';
import { setupTrainer } from './trainer.js?v=photo-picker-fix';

const $ = selector => document.querySelector(selector);
const key = 'yeonwoo-pocket-web-v1';
let state = initialState(), editingId = null, pendingNewMission = false, storageAvailable = true;
let confirmingMissionId = null;
let celebration = null;
try {
  const saved = localStorage.getItem(key);
  if (saved) {
    const parsed = JSON.parse(saved);
    if (!validateState(parsed)) throw new Error('Invalid saved state');
    state = parsed;
  }
} catch { storageAvailable = false; }

let toastTimeout;
function toast(text) {
  $('#toast').textContent = text;
  $('#toast').classList.add('visible');
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => $('#toast').classList.remove('visible'), 3500);
}
const speech = createKoreanSpeech({ getRate: () => state.speechRate ?? 0.8, onError: toast });
const collection = setupCollection({ getState: () => { settle(state); return state; }, save: persist, speech });
const autoSpeak = text => { if (state.speechAuto !== false) speech.speak(text); };
$('#speech-auto').checked = state.speechAuto !== false;
$('#speech-auto').addEventListener('change', () => { state.speechAuto = $('#speech-auto').checked; persist(); if (!state.speechAuto) speech.stop(); });
$('#welcome-speak').addEventListener('click', () => speech.speak('연우야, 안녕! 뮤와 포켓몬 모험을 떠나자. 모험 떠나기를 누르면 퀘스트를 읽어줄게. 작은 스피커를 누르면 글자도 들을 수 있어.'));
$('#speech-rate').value = String(state.speechRate ?? 0.8);
$('#speech-rate').addEventListener('change', () => {
  state.speechRate = Number($('#speech-rate').value); persist();
  speech.speak('연우야, 천천히 함께 읽어보자.');
});
$('#celebration-speak').addEventListener('click', () => {
  speech.speak(`${$('#move-name').textContent}. ${$('.mewtwo-quote').textContent}. ${$('#celebration-mission').textContent}`);
});
$('#speech-stop').addEventListener('click', speech.stop);
function persist() {
  if (!storageAvailable) return;
  try { localStorage.setItem(key, JSON.stringify(state)); }
  catch { storageAvailable = false; toast('저장 공간에 접근할 수 없어요. 이 창을 닫으면 변경 내용이 사라질 수 있어요.'); }
}
function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}
function readable(minutes) {
  if (minutes < 60) return `${minutes}분`;
  return `${Math.floor(minutes / 60)}시간${minutes % 60 ? ` ${minutes % 60}분` : ''}`;
}
function questTitle(mission) { return mission.id === 'hangul' && mission.title === '한글 공부' ? '뮤의 퀴즈 퀘스트' : mission.title; }
function showDialog(id) { if (!$(id).open) $(id).showModal(); }
function replayCelebration() {
  const dialog = $('#celebration-dialog');
  dialog.classList.remove('playing');
  void dialog.offsetWidth; // Restart visual effects only; never re-apply the reward.
  dialog.classList.add('playing');
  dialog.scrollTop = 0;
}
function renderCelebration() {
  const { mission, minutes, moves, index } = celebration;
  const id = moves[index], move = MOVES[id], special = id === 'psychic';
  $('#celebration-dialog').dataset.move = id;
  $('#celebration-title').textContent = special ? '특별 기술 해금!' : '연우, 미션 성공!';
  $('#move-name').textContent = `뮤츠의 ${move.name}!`;
  $('.mewtwo-quote').textContent = `“${move.quote}”`;
  $('#celebration-mission').textContent = special ? `오늘 미션 보상 ${PSYCHIC_THRESHOLD}분 달성!` : `${questTitle(mission)} 성공!`;
  $('#celebration-reward').textContent = special ? '기술 해금 ✦' : `+${minutes}분`;
  $('#celebration-message').textContent = move.description + (special ? ' (추가 시간 보상은 없어요.)' : ' 보상은 시간볼에 넣었어요!');
  $('#celebration-continue').textContent = index + 1 < moves.length ? '특별 기술 보기 · 사이코키네시스 ✦' : '좋아! 모험 계속하기 ✦';
}
function celebrate(mission, minutes, before, after) {
  celebration = { mission, minutes, moves: celebrationMoves(mission, before, after), index: 0 };
  renderCelebration();
  showDialog('#celebration-dialog');
  replayCelebration();
  autoSpeak(`${$('#move-name').textContent}. ${$('.mewtwo-quote').textContent}. ${$('#celebration-mission').textContent}`);
}
function closeCelebration() {
  $('#celebration-dialog').close();
  $('#parent-dialog').close();
  $('#clock').scrollIntoView({ block: 'center', behavior: 'instant' });
}
$('#celebration-close').addEventListener('click', closeCelebration);
$('#celebration-continue').addEventListener('click', () => {
  if (celebration && celebration.index + 1 < celebration.moves.length) {
    celebration.index++; renderCelebration(); replayCelebration();
  } else closeCelebration();
});
$('#celebration-replay').addEventListener('click', replayCelebration);
$('#celebration-dialog').addEventListener('close', () => { $('#celebration-dialog').classList.remove('playing'); speech.stop(); });
function completeMission(id) {
  settle(state);
  const mission = state.missions.find(x => x.id === id);
  if (!mission) return;
  if (missionDone(state, id)) { saveAndRender(); toast('오늘 보상은 이미 받았어요! 내일 또 도전하자 ✦'); return; }
  const before = earnedMissionMinutes(state);
  const applied = adjust(state, mission.minutes, `${mission.title} 완료`, Date.now(), id);
  saveAndRender();
  if (applied > 0) celebrate(mission, applied, before, earnedMissionMinutes(state));
  else toast('오늘 시간볼이 가득 찼어요! (최대 240분)');
}
function confirmMission(id) {
  settle(state);
  const mission = state.missions.find(x => x.id === id);
  if (!mission) return;
  if (missionDone(state, id)) { saveAndRender(); toast('오늘 보상은 이미 받았어요! 내일 또 도전하자 ✦'); return; }
  confirmingMissionId = id;
  $('#mission-confirm-name').textContent = `${questTitle(mission)} · +${mission.minutes}분`;
  $('#mission-confirm-reward').textContent = `확인하고 ${mission.minutes}분 받기`;
  showDialog('#mission-confirm-dialog');
  autoSpeak(`${questTitle(mission)}. 퀘스트를 마쳤나요? 부모님이 확인하면 ${mission.minutes}분을 받을 수 있어요.`);
}
$('#mission-confirm-reward').addEventListener('click', () => {
  const id = confirmingMissionId;
  confirmingMissionId = null;
  $('#mission-confirm-dialog').close();
  if (id) completeMission(id);
});
function saveAndRender() { persist(); render(); }
function renderClock() {
  const seconds = remainingSeconds(state);
  $('#clock').textContent = [Math.floor(seconds / 3600), Math.floor(seconds / 60) % 60, seconds % 60].map(x => String(x).padStart(2, '0')).join(':');
  $('#clock').setAttribute('aria-label', `남은 시간 ${Math.floor(seconds / 60)}분 ${seconds % 60}초`);
  $('#timer-message').textContent = seconds === 0 ? '모험 끝! 이제 쉬러 가자 ⭐' : state.startedAt !== null ? '연우의 즐거운 시간! 약속도 지켜요.' : '준비됐어, 연우? 시작을 눌러 봐!';
  $('#toggle-timer').textContent = state.startedAt !== null ? 'Ⅱ 잠깐 멈춤' : '▶ 보기 시작';
  $('#toggle-timer').disabled = seconds === 0;
}
function render() {
  renderClock();
  const total = totalMinutes(state), bonus = total - state.baseMinutes;
  $('#total-time').textContent = readable(total);
  $('#budget-detail').textContent = `기본 ${state.baseMinutes}분 ${bonus >= 0 ? '+' : '−'} 오늘 보상·차감 ${Math.abs(bonus)}분`;
  const earned = earnedMissionMinutes(state);
  $('#unlock-label').textContent = earned >= PSYCHIC_THRESHOLD ? '✦ 오늘 60분 달성! 사이코키네시스 해금!' : `오늘 모은 미션 보상 ${earned} / ${PSYCHIC_THRESHOLD}분`;
  $('#unlock-progress').value = Math.min(earned, PSYCHIC_THRESHOLD);
  $('#mission-list').replaceChildren();
  $('#parent-missions').replaceChildren();
  for (const mission of state.missions) {
    const done = missionDone(state, mission.id);
    const row = el('button', 'mission');
    row.type = 'button';
    row.setAttribute('aria-label', `${mission.title}, ${done ? '오늘 완료됨' : `보상 ${mission.minutes}분, 완료 확인하기`}`);
    row.addEventListener('click', () => confirmMission(mission.id));
    const badge = el('div', 'badge'), image = el('img'); image.src = 'assets/masterball.svg'; image.alt = ''; badge.append(image);
    const copy = el('div', 'mission-copy'); copy.append(el('div', 'mission-title', questTitle(mission)), el('div', 'mission-subtitle', done ? '오늘 퀘스트 성공! ✦' : `${MOVES[missionMove(mission)].name} · 눌러서 완료 확인 ›`));
    row.append(badge, copy, el('span', 'reward-pill', done ? '✓ 완료' : `+${mission.minutes}분`));
    const item = el('div', 'mission-item');
    const listen = el('button', 'mission-listen', '🔊 미션 듣기');
    listen.type = 'button'; listen.setAttribute('aria-label', `${mission.title} 미션 소리로 듣기`);
    listen.addEventListener('click', () => speech.speak(`${questTitle(mission)}. 완료하면 ${mission.minutes}분을 받아요.`));
    item.append(row, listen); $('#mission-list').append(item);

    const parentRow = el('div', 'parent-mission'), top = el('div', 'parent-mission-top');
    top.append(el('strong', '', mission.title), el('span', '', `+${mission.minutes}분`));
    const actions = el('div', 'parent-mission-actions');
    const complete = el('button', 'secondary', done ? '✓ 오늘 완료' : '완료 확인 · 보상'); complete.disabled = done;
    complete.addEventListener('click', () => completeMission(mission.id));
    const edit = el('button', 'quiet', '수정'); edit.setAttribute('aria-label', `${mission.title} 수정`);
    edit.addEventListener('click', () => openEditor(mission));
    actions.append(complete, edit); parentRow.append(top, actions); $('#parent-missions').append(parentRow);
  }
  if (!state.missions.length) $('#mission-list').append(el('p', 'empty', '부모님과 첫 미션을 만들어 보세요.'));
  $('#history-list').replaceChildren();
  for (const entry of state.entries.slice(0, 30)) {
    const row = el('div', 'history-row'), copy = el('div', 'entry-copy');
    const time = el('time', '', new Intl.DateTimeFormat('ko-KR', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(entry.date));
    time.dateTime = new Date(entry.date).toISOString(); copy.append(el('strong', '', entry.reason), time);
    row.append(el('span', 'history-icon', entry.minutes > 0 ? '✦' : '−'), copy, el('span', `amount${entry.minutes < 0 ? ' negative' : ''}`, `${entry.minutes > 0 ? '+' : ''}${entry.minutes}분`));
    $('#history-list').append(row);
  }
  if (!state.entries.length) $('#history-list').append(el('p', 'empty', '아직 기록이 없어요. 첫 번째 미션에 도전해 볼까?'));
}
function openParent(add = false) {
  $('#base-minutes').value = state.baseMinutes;
  pendingNewMission = add;
  showDialog('#parent-dialog');
  if (pendingNewMission) { pendingNewMission = false; openEditor(); }
}
function openEditor(mission = null) {
  editingId = mission?.id ?? null;
  $('#editor-title').textContent = mission ? '미션 수정' : '새 미션 추가';
  $('#mission-name').value = mission?.title ?? '';
  $('#mission-minutes').value = mission?.minutes ?? 30;
  $('#mission-move').value = mission ? missionMove(mission) : 'confusion';
  $('#delete-mission').hidden = !mission;
  showDialog('#editor-dialog');
}
$('#parent-open').addEventListener('click', () => openParent());
$('#mission-add-shortcut').addEventListener('click', () => openParent(true));
$('#add-mission').addEventListener('click', () => openEditor());
document.querySelectorAll('[data-close]').forEach(button => button.addEventListener('click', () => $(`#${button.dataset.close}`).close()));
$('#minute-presets').addEventListener('click', event => {
  const button = event.target.closest('[data-minutes]');
  if (button) $('#mission-minutes').value = button.dataset.minutes;
});
$('#mission-form').addEventListener('submit', event => {
  event.preventDefault();
  const title = $('#mission-name').value.trim(), minutes = Number($('#mission-minutes').value);
  if (!title || title.length > 60 || !Number.isInteger(minutes) || minutes < 1 || minutes > 120) { toast('이름과 1~120분 사이의 시간을 입력해 주세요.'); return; }
  const current = state.missions.find(x => x.id === editingId);
  const move = $('#mission-move').value;
  if (current) { current.title = title; current.minutes = minutes; current.move = move; }
  else state.missions.push({ id: crypto.randomUUID(), title, minutes, move });
  saveAndRender(); $('#editor-dialog').close(); toast('미션을 저장했어요!');
});
$('#delete-mission').addEventListener('click', () => {
  if (!confirm('이 미션을 삭제할까요? 이미 받은 보상과 기록은 유지돼요.')) return;
  state.missions = state.missions.filter(x => x.id !== editingId);
  saveAndRender(); $('#editor-dialog').close(); toast('미션을 삭제했어요.');
});
$('#toggle-timer').addEventListener('click', () => {
  settle(state);
  if (state.startedAt === null) start(state); else pause(state);
  saveAndRender();
});
$('#stop-timer').addEventListener('click', () => { settle(state); pause(state); saveAndRender(); toast('잘 봤어, 연우! 남은 시간은 보관했어요.'); });
$('#save-base').addEventListener('click', () => {
  const minutes = Number($('#base-minutes').value);
  if (!Number.isInteger(minutes) || minutes < 0 || minutes > 180 || $('#base-minutes').value === '') { toast('기본 시간은 0~180분으로 입력해 주세요.'); return; }
  settle(state); state.baseMinutes = minutes; settle(state); saveAndRender(); toast('기본 시간을 저장했어요.');
});
for (const [selector, sign] of [['#reward-custom', 1], ['#deduct-custom', -1]]) {
  $(selector).addEventListener('click', () => {
    const reason = $('#adjust-reason').value.trim(), minutes = Number($('#adjust-minutes').value);
    if (!reason || !Number.isInteger(minutes) || minutes < 1 || minutes > 120) { toast('이유와 1~120분 사이의 시간을 입력해 주세요.'); return; }
    const applied = adjust(state, sign * minutes, reason); saveAndRender();
    $('#adjust-reason').value = ''; toast(applied ? `${applied > 0 ? '+' : ''}${applied}분 반영했어요.` : '더 조절할 수 없는 시간이에요.');
  });
}
function tick() {
  const previousDay = state.day, wasRunning = state.startedAt !== null;
  settle(state);
  if (state.day !== previousDay || wasRunning !== (state.startedAt !== null)) {
    saveAndRender();
    if (wasRunning && state.day === previousDay) toast('시간이 끝났어요! TV 전원도 꺼 주세요.');
  } else renderClock();
}
document.addEventListener('visibilitychange', () => { tick(); persist(); if (document.hidden) speech.stop(); });
window.addEventListener('pagehide', persist);
setInterval(tick, 500);
settle(state); saveAndRender();
if (!storageAvailable) toast('저장된 기록을 읽지 못했어요. 기존 기록을 덮어쓰지 않고 임시 체험으로 열었어요.');
collection.render();
setupTrainer({ notify: toast });
setupHangulQuiz({ getState: () => { settle(state); return state; }, confirmMission, notify: toast, speech, collection, saveSettings: persist });
