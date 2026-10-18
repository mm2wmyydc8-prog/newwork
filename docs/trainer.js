const PHOTO_KEY = 'yeonwoo-trainer-face-v1';
export function setupTrainer({ notify }) {
  const $ = selector => document.querySelector(selector);
  let photo = null, draft = null;
  try {
    const value = JSON.parse(localStorage.getItem(PHOTO_KEY));
    if (value && /^data:image\/jpeg;base64,/.test(value.url) && value.url.length < 500_000 &&
        Number.isFinite(value.x) && Number.isFinite(value.y) && value.zoom >= 1 && value.zoom <= 3) photo = value;
  } catch { /* The rest of the app remains usable if photo storage is unavailable. */ }
  function paint(selector, value) {
    document.querySelectorAll(selector).forEach(container => {
      const image = container.querySelector('.trainer-photo');
      image.hidden = !value;
      if (value) {
        image.src = value.url;
        image.style.transform = `translate(${value.x}%,${value.y}%) scale(${value.zoom})`;
      } else image.removeAttribute('src');
    });
  }
  function preview() {
    if (!draft) return;
    draft.x = Number($('#face-x').value); draft.y = Number($('#face-y').value); draft.zoom = Number($('#face-zoom').value);
    paint('#trainer-preview .trainer-face', draft);
  }
  $('#trainer-upload').addEventListener('change', async event => {
    const file = event.target.files[0]; event.target.value = '';
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 15 * 1024 * 1024) {
      notify('15MB 이하의 JPG·PNG·WebP 사진을 골라주세요. HEIC 사진은 JPG로 저장해 주세요.'); return;
    }
    const url = URL.createObjectURL(file);
    try {
      const image = new Image(); image.src = url; await image.decode();
      const canvas = document.createElement('canvas');
      const ratio = Math.min(1, 600 / Math.max(image.naturalWidth, image.naturalHeight));
      canvas.width = Math.max(1, Math.round(image.naturalWidth * ratio));
      canvas.height = Math.max(1, Math.round(image.naturalHeight * ratio));
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('No canvas');
      ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, canvas.width, canvas.height); ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
      draft = { url: canvas.toDataURL('image/jpeg', 0.85), x: 0, y: 0, zoom: 1 };
      $('#face-x').value = 0; $('#face-y').value = 0; $('#face-zoom').value = 1;
      paint('#trainer-preview .trainer-face', draft); $('#trainer-dialog').showModal();
    } catch { notify('사진을 읽지 못했어요. 다른 JPG나 PNG 사진을 골라주세요.'); }
    finally { URL.revokeObjectURL(url); }
  });
  ['#face-x', '#face-y', '#face-zoom'].forEach(selector => $(selector).addEventListener('input', preview));
  $('#trainer-save').addEventListener('click', () => {
    if (!draft) return;
    try {
      localStorage.setItem(PHOTO_KEY, JSON.stringify(draft)); photo = { ...draft };
      paint('.trainer-face[data-saved]', photo); $('#trainer-dialog').close(); notify('연우의 트레이너 얼굴을 저장했어요!');
    } catch { notify('사진을 저장할 공간이 없어요. 기존 얼굴은 그대로 유지돼요.'); }
  });
  $('#trainer-remove').addEventListener('click', () => {
    if (!confirm('저장된 얼굴 사진을 지우고 기본 캐릭터로 돌아갈까요?')) return;
    try { localStorage.removeItem(PHOTO_KEY); photo = null; paint('.trainer-face[data-saved]', null); notify('저장된 사진을 지웠어요.'); }
    catch { notify('사진을 지우지 못했어요. 브라우저 저장 설정을 확인해 주세요.'); }
  });
  paint('.trainer-face[data-saved]', photo);
}
