import test from 'node:test';
import assert from 'node:assert/strict';
import { createKoreanSpeech } from '../docs/speech.js';

function engine() {
 const spoken=[],events=[],timers=new Map();let id=0,fenced=false;
 const scope={SpeechSynthesisUtterance:class {constructor(text){this.text=text;}},
  setTimeout(fn){timers.set(++id,fn);return id;},clearTimeout(id){timers.delete(id);},
  speechSynthesis:{speaking:false,paused:false,pending:false,
   getVoices:()=>[{lang:'en-US'},{lang:'ko-KR',name:'Korean'}],
   cancel(){events.push('cancel');fenced=true;this.speaking=false;},
   resume(){events.push('resume');this.paused=false;},
   speak(u){assert.equal(fenced,false,'speak must not run in the same turn as cancel');events.push('speak');spoken.push(u);this.speaking=true;}
  }};
 return {scope,spoken,events,flush(){const work=[...timers.values()];timers.clear();fenced=false;work.forEach(fn=>fn());},timers};
}
test('Korean voice and speed; idle reads do not cancel and replacements wait for cancellation',()=>{
 const e=engine(),r=createKoreanSpeech({scope:e.scope,getRate:()=>.65});
 assert.equal(r.speak('나무'),true);assert.deepEqual(e.events,['speak']);
 assert.equal(e.spoken[0].lang,'ko-KR');assert.equal(e.spoken[0].rate,.65);assert.equal(e.spoken[0].voice.name,'Korean');
 r.speak('바다');assert.equal(e.spoken.length,1);assert.equal(e.timers.size,1);
 e.flush();assert.equal(e.spoken[1].text,'바다');r.stop();assert.equal(e.timers.size,0);
});
test('tile feedback preserves active narration and does not queue stale praise',()=>{
 const e=engine(),r=createKoreanSpeech({scope:e.scope});r.speak('가위를 순서대로 만들어 보자');
 for(let i=0;i<5;i++)assert.equal(r.speak('좋아! 다음 글자도 이어보자.',{interrupt:false}),false);
 assert.deepEqual(e.events,['speak']);assert.equal(e.timers.size,0);
 e.scope.speechSynthesis.speaking=false;e.spoken[0].onend();
 assert.equal(r.speak('다음 글자도 이어보자.',{interrupt:false}),true);assert.equal(e.spoken.length,2);
});
test('rapid manual readings replace only the latest pending speech; close cancels pending starts',()=>{
 const e=engine(),r=createKoreanSpeech({scope:e.scope});r.speak('문제');r.speak('가');r.speak('위');
 e.flush();assert.deepEqual(e.spoken.map(u=>u.text),['문제','위']);
 r.speak('읽으면 안 되는 문제');r.stop();e.flush();assert.equal(e.spoken.length,2);
 r.speak('새 문제');e.flush();assert.equal(e.spoken.at(-1).text,'새 문제');
});
test('stop followed by render narration yields; stale events cannot clear the new read',()=>{
 const e=engine(),r=createKoreanSpeech({scope:e.scope});r.speak('옛 문제');const oldEnd=e.spoken[0].onend;
 r.stop();r.speak('새 문제');assert.equal(e.spoken.length,1);e.flush();oldEnd();
 assert.equal(r.speak('중간 칭찬',{interrupt:false}),false);assert.equal(e.spoken.at(-1).text,'새 문제');
});
test('paused engine resumes and synchronous engine failure reports without crashing',()=>{
 const e=engine();e.scope.speechSynthesis.paused=true;const r=createKoreanSpeech({scope:e.scope});r.speak('나무');assert.deepEqual(e.events,['resume','speak']);
 let error;const bad=engine();bad.scope.speechSynthesis.speak=()=>{throw Error('busy');};
 assert.equal(createKoreanSpeech({scope:bad.scope,onError:t=>error=t}).speak('바다'),false);assert.match(error,/음성 다시 켜기/);
});
test('missing Korean voice and invalid rate use language fallback; unsupported browser reports',()=>{
 const e=engine();e.scope.speechSynthesis.getVoices=()=>[];createKoreanSpeech({scope:e.scope,getRate:()=>99}).speak('모자');
 assert.equal(e.spoken[0].lang,'ko-KR');assert.equal(e.spoken[0].rate,.8);
 let error;assert.equal(createKoreanSpeech({scope:{},onError:t=>error=t}).speak('안녕'),false);assert.match(error,/지원하지/);
});
test('status reports start, end, blocked speech; a terminal error allows future feedback',()=>{
 const e=engine(),statuses=[],r=createKoreanSpeech({scope:e.scope,onStatus:t=>statuses.push(t)});
 r.speak('확인');assert.match(statuses.at(-1),/준비/);e.spoken[0].onstart();assert.match(statuses.at(-1),/재생 중/);
 e.scope.speechSynthesis.speaking=false;e.spoken[0].onend();assert.match(statuses.at(-1),/마쳤/);
 r.speak('다시');e.spoken[1].onerror({error:'not-allowed'});assert.match(statuses.at(-1),/듣기 버튼/);
 e.scope.speechSynthesis.speaking=false;assert.equal(r.speak('새로',{interrupt:false}),true);
});

test('quiz queue never cancels active narration and reads only the latest next prompt',()=>{
 const e=engine(),r=createKoreanSpeech({scope:e.scope});
 r.speak('첫 문제');
 r.speak('맞았어!',{interrupt:false});
 r.speak('둘째 문제',{interrupt:false,enqueue:true});
 r.speak('셋째 문제',{interrupt:false,enqueue:true});
 assert.deepEqual(e.events,['speak']);
 e.scope.speechSynthesis.speaking=false;e.spoken[0].onend();e.flush();
 assert.deepEqual(e.spoken.map(u=>u.text),['첫 문제','셋째 문제']);
 assert.equal(e.events.includes('cancel'),false);
 r.speak('넷째 문제',{interrupt:false,enqueue:true});r.stop();e.flush();
 assert.equal(e.spoken.length,2);
});
test('five rounds of answering while speaking preserve narration with no cancellation',()=>{
 const e=engine(),r=createKoreanSpeech({scope:e.scope});r.speak('문제 1');
 for(let n=1;n<=5;n++){
  for(let tile=0;tile<4;tile++)r.speak('글자 칭찬',{interrupt:false});
  if(n<5)r.speak(`문제 ${n+1}`,{interrupt:false,enqueue:true});
  e.scope.speechSynthesis.speaking=false;e.spoken.at(-1).onend();e.flush();
 }
 assert.deepEqual(e.spoken.map(u=>u.text),['문제 1','문제 2','문제 3','문제 4','문제 5']);
 assert.equal(e.events.includes('cancel'),false);
});

test('a tile tap during the gap between utterances cannot displace the next question',()=>{
 const e=engine(),r=createKoreanSpeech({scope:e.scope});r.speak('첫 문제');
 r.speak('둘째 문제',{interrupt:false,enqueue:true});
 e.scope.speechSynthesis.speaking=false;e.spoken[0].onend();
 assert.equal(r.speak('짧은 칭찬',{interrupt:false}),false);
 e.flush();assert.equal(e.spoken.at(-1).text,'둘째 문제');
});

test('a stale native speaking flag after onend never cancels the next quiz question',()=>{
 const e=engine(),r=createKoreanSpeech({scope:e.scope});r.speak('문제 1',{interrupt:false,enqueue:true});
 r.speak('문제 2',{interrupt:false,enqueue:true});
 // Simulate WebKit reporting speaking=true for a moment after the end event.
 e.spoken[0].onend();e.flush();
 assert.deepEqual(e.spoken.map(u=>u.text),['문제 1','문제 2']);
 assert.equal(e.events.includes('cancel'),false);
});
