import { initialState, validateState, settle, totalMinutes, remainingSeconds, start, pause, adjust, missionDone } from './model.js';

const $ = selector => document.querySelector(selector);
const key = 'yeonwoo-pocket-web-v1';
let state = initialState(), editingId = null, pendingNewMission = false, storageAvailable = true;
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
function showDialog(id) { if (!$(id).open) $(id).showModal(); }
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
  $('#mission-list').replaceChildren();
  $('#parent-missions').replaceChildren();
  for (const mission of state.missions) {
    const done = missionDone(state, mission.id);
    const row = el('div', 'mission');
    const badge = el('div', 'badge'), image = el('img'); image.src = 'assets/masterball.svg'; image.alt = ''; badge.append(image);
    const copy = el('div', 'mission-copy'); copy.append(el('div', 'mission-title', mission.title), el('div', 'mission-subtitle', done ? '오늘 미션 성공! ✦' : '부모님과 함께 도전해요'));
    row.append(badge, copy, el('span', 'reward-pill', done ? '✓ 완료' : `+${mission.minutes}분`));
    $('#mission-list').append(row);

    const parentRow = el('div', 'parent-mission'), top = el('div', 'parent-mission-top');
    top.append(el('strong', '', mission.title), el('span', '', `+${mission.minutes}분`));
    const actions = el('div', 'parent-mission-actions');
    const complete = el('button', 'secondary', done ? '✓ 오늘 완료' : '완료 확인 · 보상'); complete.disabled = done;
    complete.addEventListener('click', () => {
      if (missionDone(state, mission.id)) return;
      const applied = adjust(state, mission.minutes, `${mission.title} 완료`, Date.now(), mission.id);
      saveAndRender(); toast(applied > 0 ? `연우야, 미션 성공! +${applied}분 ✨` : '오늘 시간볼이 가득 찼어요! (최대 240분)');
    });
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
  if (current) { current.title = title; current.minutes = minutes; }
  else state.missions.push({ id: crypto.randomUUID(), title, minutes });
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
document.addEventListener('visibilitychange', () => { tick(); persist(); });
window.addEventListener('pagehide', persist);
setInterval(tick, 500);
settle(state); saveAndRender();
if (!storageAvailable) toast('저장된 기록을 읽지 못했어요. 기존 기록을 덮어쓰지 않고 임시 체험으로 열었어요.');
