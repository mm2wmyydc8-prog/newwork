import test from 'node:test';
import assert from 'node:assert/strict';
import { createKoreanSpeech } from '../docs/speech.js';

test('speech selects Korean voice, applies speed, and cancels previous reading', () => {
  const spoken = []; let canceled = 0;
  const korean = { lang: 'ko-KR', name: 'Korean' };
  const scope = { SpeechSynthesisUtterance: class { constructor(text) { this.text = text; } },
    speechSynthesis: { cancel() { canceled++; }, getVoices: () => [{ lang: 'en-US' }, korean], speak(value) { spoken.push(value); } } };
  const reader = createKoreanSpeech({ scope, getRate: () => 0.65 });
  assert.equal(reader.speak('나무'), true);
  assert.equal(spoken[0].lang, 'ko-KR'); assert.equal(spoken[0].rate, 0.65);
  assert.equal(spoken[0].voice, korean);
  reader.speak('바다'); assert.equal(canceled, 2); assert.equal(spoken[1].text, '바다');
  reader.stop(); assert.equal(canceled, 3);
});
test('missing voice list uses Korean language; unsupported browser reports limitation', () => {
  let utterance, error;
  const scope = { SpeechSynthesisUtterance: class {}, speechSynthesis: { cancel() {}, getVoices: () => [], speak(value) { utterance = value; } } };
  createKoreanSpeech({ scope, getRate: () => 99 }).speak('모자');
  assert.equal(utterance.lang, 'ko-KR'); assert.equal(utterance.rate, 0.8);
  const unsupported = createKoreanSpeech({ scope: {}, onError: message => { error = message; } });
  assert.equal(unsupported.speak('안녕'), false); assert.match(error, /지원하지/);
});

test('paused speech engine resumes before speaking and launch errors are reported without crashing', () => {
 const calls=[];let error;
 const scope={SpeechSynthesisUtterance:class {},speechSynthesis:{paused:true,cancel(){calls.push('cancel')},getVoices(){return []},resume(){calls.push('resume');this.paused=false},speak(){calls.push('speak')}}};
 const reader=createKoreanSpeech({scope,onError:message=>{error=message}});
 assert.equal(reader.speak('나무'),true);
 assert.deepEqual(calls,['cancel','resume','speak']);
 scope.speechSynthesis.speak=()=>{throw new Error('device busy')};
 assert.equal(reader.speak('바다'),false);
 assert.match(error,/음성 다시 켜기/);
});

test('speech start/end/error status helps distinguish engine playback from muted output', () => {
 let utterance;const statuses=[];
 const scope={SpeechSynthesisUtterance:class {},speechSynthesis:{cancel(){},getVoices(){return[]},speak(u){utterance=u}}};
 const reader=createKoreanSpeech({scope,onStatus:text=>statuses.push(text)});
 reader.speak('음성 확인');
 assert.match(statuses.at(-1),/준비/);
 utterance.onstart();assert.match(statuses.at(-1),/재생 중/);
 utterance.onend();assert.match(statuses.at(-1),/마쳤/);
 reader.speak('다시');utterance.onerror({error:'not-allowed'});assert.match(statuses.at(-1),/듣기 버튼/);
});
