export function createKoreanSpeech({ scope = globalThis, getRate = () => 0.8, onError = () => {}, onStatus = () => {} } = {}) {
  const supported = 'speechSynthesis' in scope && 'SpeechSynthesisUtterance' in scope;
  const later = scope.setTimeout?.bind(scope) ?? globalThis.setTimeout.bind(globalThis);
  const clear = scope.clearTimeout?.bind(scope) ?? globalThis.clearTimeout.bind(globalThis);
  let current = null, timer = null, generation = 0, needsYield = false, queued = null;
  const reportError = message => { onStatus(message); onError(message); };
  function stop() {
    if (!supported) return;
    generation++;
    queued = null;
    if (timer !== null) clear(timer);
    timer = null;
    const previous = current;
    current = null; // Invalidate before cancel(), which can synchronously dispatch events.
    if (previous) previous.onstart = previous.onend = previous.onerror = null;
    if (previous || scope.speechSynthesis.speaking || scope.speechSynthesis.pending) {
      needsYield = true;
      scope.speechSynthesis.cancel();
    }
  }
  function speak(text, { interrupt = true, enqueue = false } = {}) {
    if (!supported) { reportError('이 브라우저는 음성 읽기를 지원하지 않아요. Safari에서 열어주세요.'); return false; }
    // Optional tile encouragement never interrupts a word, prompt, hint or manual reading.
    if (!interrupt && (current || timer !== null)) {
      if (enqueue) queued = String(text); // Keep only the latest relevant reading, never a stale backlog.
      return enqueue;
    }
    if (interrupt) stop();
    else {
      // Some engines keep speaking=true briefly after onend. Do not cancel that
      // stale native state when handing off between quiz questions.
      generation++;
      queued = null;
    }
    const token = generation;
    const utterance = new scope.SpeechSynthesisUtterance(String(text));
    utterance.lang = 'ko-KR';
    const rate = Number(getRate());
    utterance.rate = [0.65, 0.8, 1].includes(rate) ? rate : 0.8;
    const voice = scope.speechSynthesis.getVoices().find(v => v.lang.toLowerCase().replace('_', '-').startsWith('ko'));
    if (voice) utterance.voice = voice;
    utterance.onstart = () => { if (current === utterance) onStatus('음성 재생 중이에요. 소리가 안 들리면 탭 음소거와 Mac의 소리 출력 장치를 확인해 주세요.'); };
    utterance.onend = () => {
      if (current !== utterance) return;
      current = null;
      onStatus('음성 재생을 마쳤어요.');
      if (queued !== null) {
        const finishedToken = generation;
        timer = later(() => {
          timer = null;
          if (generation === finishedToken && !current && queued !== null) {
            const next = queued;
            queued = null;
            speak(next, { interrupt: false, enqueue: true });
          }
        }, 60);
      }
    };
    utterance.onerror = event => {
      if (current !== utterance) return;
      current = null;
      if (event.error === 'not-allowed') { reportError('음성을 시작하려면 화면의 🔊 듣기 버튼을 한 번 눌러주세요.'); return; }
      if (!['canceled', 'interrupted'].includes(event.error)) reportError('한국어 음성을 재생하지 못했어요. 기기 음량과 한국어 음성 설정을 확인해 주세요.');
    };
    current = utterance;
    onStatus('음성을 준비하고 있어요.');
    function start() {
      timer = null;
      if (token !== generation || current !== utterance) return false;
      needsYield = false;
      try {
        if (scope.speechSynthesis.paused) scope.speechSynthesis.resume?.();
        scope.speechSynthesis.speak(utterance);
        return true;
      } catch {
        current = null; reportError('음성을 시작하지 못했어요. 부모님 메뉴의 음성 다시 켜기를 눌러주세요.'); return false;
      }
    }
    // Apple speech engines may drop speak() calls made in the same turn as cancel().
    if (needsYield) { timer = later(start, 60); return true; }
    return start();
  }
  return { supported, speak, stop };
}
