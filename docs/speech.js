export function createKoreanSpeech({ scope = globalThis, getRate = () => 0.8, onError = () => {}, onStatus = () => {} } = {}) {
  const supported = 'speechSynthesis' in scope && 'SpeechSynthesisUtterance' in scope;
  let current = null;
  const reportError = message => { onStatus(message); onError(message); };
  function stop() {
    if (!supported) return;
    if (current) current.onerror = null;
    scope.speechSynthesis.cancel(); current = null;
  }
  function speak(text) {
    if (!supported) { reportError('이 브라우저는 음성 읽기를 지원하지 않아요. Safari에서 열어주세요.'); return false; }
    stop();
    const utterance = new scope.SpeechSynthesisUtterance(String(text));
    utterance.lang = 'ko-KR';
    const rate = Number(getRate());
    utterance.rate = [0.65, 0.8, 1].includes(rate) ? rate : 0.8;
    const voice = scope.speechSynthesis.getVoices().find(v => v.lang.toLowerCase().replace('_', '-').startsWith('ko'));
    if (voice) utterance.voice = voice;
    utterance.onstart = () => { if (current === utterance) onStatus('음성 재생 중이에요. 소리가 안 들리면 탭 음소거와 Mac의 소리 출력 장치를 확인해 주세요.'); };
    utterance.onend = () => { if (current === utterance) { current = null; onStatus('음성 재생을 마쳤어요.'); } };
    utterance.onerror = event => {
      if (current !== utterance) return;
      if (event.error === 'not-allowed') { reportError('음성을 시작하려면 화면의 🔊 듣기 버튼을 한 번 눌러주세요.'); return; }
      if (!['canceled', 'interrupted'].includes(event.error)) reportError('한국어 음성을 재생하지 못했어요. 기기 음량과 한국어 음성 설정을 확인해 주세요.');
    };
    current = utterance;
    onStatus('음성을 준비하고 있어요.');
    try {
      if (scope.speechSynthesis.paused) scope.speechSynthesis.resume?.();
      scope.speechSynthesis.speak(utterance);
      return true;
    } catch {
      current = null; reportError('음성을 시작하지 못했어요. 부모님 메뉴의 음성 다시 켜기를 눌러주세요.'); return false;
    }
  }
  return { supported, speak, stop };
}
