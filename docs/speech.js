export function createKoreanSpeech({ scope = globalThis, getRate = () => 0.8, onError = () => {} } = {}) {
  const supported = 'speechSynthesis' in scope && 'SpeechSynthesisUtterance' in scope;
  let current = null;
  function stop() {
    if (!supported) return;
    if (current) current.onerror = null;
    scope.speechSynthesis.cancel(); current = null;
  }
  function speak(text) {
    if (!supported) { onError('이 브라우저는 음성 읽기를 지원하지 않아요. Safari에서 열어주세요.'); return false; }
    stop();
    const utterance = new scope.SpeechSynthesisUtterance(String(text));
    utterance.lang = 'ko-KR';
    const rate = Number(getRate());
    utterance.rate = [0.65, 0.8, 1].includes(rate) ? rate : 0.8;
    const voice = scope.speechSynthesis.getVoices().find(v => v.lang.toLowerCase().replace('_', '-').startsWith('ko'));
    if (voice) utterance.voice = voice;
    utterance.onerror = event => {
      if (!['canceled', 'interrupted'].includes(event.error)) onError('한국어 음성을 재생하지 못했어요. 기기 음량과 한국어 음성 설정을 확인해 주세요.');
    };
    current = utterance;
    scope.speechSynthesis.speak(utterance);
    return true;
  }
  return { supported, speak, stop };
}
