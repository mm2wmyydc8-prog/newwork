import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {SENTENCE_QUESTIONS as BANK} from '../docs/sentence-questions.js';
import {sentencePicture, PICTURE_POKEMON, ILLUSTRATED_SPECIES, ILLUSTRATED_ACTIONS} from '../docs/sentence-pictures.js';
import {ensureReading,createSentenceQuiz,markSentenceShown,noteSentenceWrong,recordSentenceCorrect,readingStage} from '../docs/sentence-learning.js';
import {initialState,validateState} from '../docs/model.js';
import {quizCreditReady,chooseAnswer,nextQuestion} from '../docs/hangul.js';
import {ILLUSTRATION_ATLASES, ILLUSTRATION_FRAMES} from '../docs/reading-illustrations.js';
import {REGIONS,recordExploration,visibleEncounters,finishCaptureAttempt,completeCapture} from '../docs/collection.js';
const rng=()=>.4;
function resolve(state,quiz,q){markSentenceShown(state,q);chooseAnswer(quiz,q.answer);recordSentenceCorrect(state,quiz);nextQuestion(quiz);}

test('authored list and bank contain exactly 20/20/10 unique sentences and three distinct text-free drawings each',()=>{
 assert.equal(BANK.length,50);assert.equal(new Set(BANK.map(q=>q.sentence)).size,50);
 assert.deepEqual([1,2,3].map(s=>BANK.filter(q=>q.stage===s).length),[20,20,10]);
 const spec=readFileSync(new URL('../docs/learning/HARD_QUESTIONS.md',import.meta.url),'utf8');
 for(const q of BANK){
  assert.ok(spec.includes(q.sentence));assert.equal(q.options.filter(o=>o.id===q.answer).length,1);assert.equal(new Set(q.options.map(o=>JSON.stringify(o.scene))).size,3);
  const images=q.options.map(o=>sentencePicture(o.scene));assert.equal(new Set(images).size,3);
  for(const svg of images){assert.match(svg,/^<svg/);assert.doesNotMatch(svg,/<text|<script|foreignObject/i);
   for (const match of svg.matchAll(/href="([^"]+)"/g)) {
    assert.ok(['assets/reading/pokemon-actions.png','assets/reading/companion-actions.png','assets/reading/activity-details.png','assets/reading/remaining-actions.png','assets/reading/desk-positions.png',...Object.values(ILLUSTRATION_ATLASES).map(a=>a.file)].includes(match[1]) || PICTURE_POKEMON.some(name=>match[1]===`assets/reading/sleep/${name}.png`) || PICTURE_POKEMON.some(name=>match[1]===`assets/${name}.png`));
    assert.ok(readFileSync(new URL('../docs/'+match[1],import.meta.url)).length>0);
   }}
  assert.equal(q.hints.length,2);assert.notEqual(q.hints[0],q.hints[1]);assert.ok(q.reveal.includes(q.sentence));
 }
});
test('all 50 new problems appear once before a new shuffled cycle; position order changes even with fixed randomness',()=>{
 const state=initialState(),first=[],positions={};
 for(let round=0;round<10;round++){
  const quiz=createSentenceQuiz(state,{random:rng});
  for(const q of quiz.questions){assert.ok(!first.includes(q.id));first.push(q.id);positions[q.id]=q.choices;resolve(state,quiz,q);}
 }
 assert.equal(first.length,50);assert.equal(new Set(first).size,50);assert.ok(validateState(state));
 const quiz=createSentenceQuiz(state,{random:rng});assert.equal(ensureReading(state).cycle,2);
 for(const q of quiz.questions){assert.equal(q.cycle,2);assert.notDeepEqual(q.choices,positions[q.id]);}
 assert.ok(validateState(JSON.parse(JSON.stringify(state))));
});
test('closing a partially viewed round never repeats its displayed question but does not consume unseen ones',()=>{
 const state=initialState(),quiz=createSentenceQuiz(state,{random:rng}),seen=quiz.questions[0];markSentenceShown(state,seen);
 const next=createSentenceQuiz(state,{random:rng});assert.ok(next.questions.every(q=>q.id!==seen.id));assert.equal(state.hardReading.seen.length,1);
});
test('first rounds focus on stage one; configurable counts and first-try accuracy unlock mixed later stages',()=>{
 const state=initialState(),d=ensureReading(state,rng);assert.ok(createSentenceQuiz(state,{random:rng}).questions.every(q=>q.stage===1));
 d.settings.stage2Correct=2;d.settings.stage3Correct=2;d.settings.minAccuracy=70;
 d.stats[BANK[0].id]={correct:2,wrong:0,helped:0,firstTryCorrect:2};assert.equal(readingStage(state),2);
 d.stats[BANK[20].id]={correct:2,wrong:0,helped:0,firstTryCorrect:2};assert.equal(readingStage(state),3);
 d.settings.minAccuracy=100;d.stats[BANK[0].id].firstTryCorrect=1;assert.equal(readingStage(state),1);
});
test('help and mistakes do not remove hard credit; three consecutive errors fail capture and a correct answer resets the streak',()=>{
 const state=initialState(),quiz=createSentenceQuiz(state,{random:rng}),q=quiz.questions[0];markSentenceShown(state,q);
 assert.equal(noteSentenceWrong(state,quiz),'hint');assert.equal(noteSentenceWrong(state,quiz),'detail');assert.equal(quiz.captureFailed,false);
 quiz.assisted=true;chooseAnswer(quiz,q.answer);assert.equal(quizCreditReady(quiz),true);recordSentenceCorrect(state,quiz);assert.equal(quiz.consecutiveWrong,0);
 nextQuestion(quiz);for(let i=0;i<2;i++){noteSentenceWrong(state,quiz);assert.equal(quiz.captureFailed,false);}
 assert.equal(noteSentenceWrong(state,quiz),'reveal');assert.equal(quiz.captureFailed,true);
 chooseAnswer(quiz,quiz.questions[quiz.index].answer);recordSentenceCorrect(state,quiz);assert.equal(quiz.consecutiveWrong,0);assert.equal(quiz.captureFailed,true);
 assert.deepEqual(state.entries,[]);assert.ok(validateState(state));
});
test('wrong problems have a distinct persistent review route which does not consume the new-problem deck',()=>{
 const state=initialState(),quiz=createSentenceQuiz(state,{random:rng}),q=quiz.questions[0];markSentenceShown(state,q);noteSentenceWrong(state,quiz);
 const restored=JSON.parse(JSON.stringify(state)),review=createSentenceQuiz(restored,{review:true,random:rng});
 assert.equal(review.questions.length,1);assert.equal(review.questions[0].isReview,true);assert.equal(review.questions[0].id,q.id);
 const before=[...restored.hardReading.seen];resolve(restored,review,review.questions[0]);assert.deepEqual(restored.hardReading.seen,before);assert.deepEqual(restored.hardReading.reviews,[]);
 assert.equal(restored.hardReading.history.at(-1).isReview,true);
 restored.hardReading.settings.reviewEnabled=false;assert.equal(createSentenceQuiz(restored,{review:true}),null);
});
test('malformed learning state is rejected without rejecting old saves that have no sentence data',()=>{
 const state=initialState();assert.ok(validateState(state));ensureReading(state,rng);assert.ok(validateState(state));
 for(const mutate of [d=>d.settings.minAccuracy=101,d=>d.order.push(d.order[0]),d=>d.stats.bad={correct:1},d=>d.seen.push('unknown')]){
  const copy=JSON.parse(JSON.stringify(state));mutate(copy.hardReading);assert.equal(validateState(copy),false);
 }
});

test('closing and reopening cannot evade a four-error streak; a success resets it',()=>{
 const state=initialState(),first=createSentenceQuiz(state,{random:rng});
 markSentenceShown(state,first.questions[0]);for(let i=0;i<4;i++)noteSentenceWrong(state,first);
 const restored=JSON.parse(JSON.stringify(state));assert.ok(validateState(restored));
 const next=createSentenceQuiz(restored,{random:rng});assert.equal(next.consecutiveWrong,4);
 assert.equal(noteSentenceWrong(restored,next),'reveal');assert.equal(next.captureFailed,true);
 chooseAnswer(next,next.questions[0].answer);recordSentenceCorrect(restored,next);
 assert.equal(createSentenceQuiz(restored,{random:rng}).consecutiveWrong,0);
});

test('five correct hard sentences reach a separate capturable wild encounter in every region',()=>{
 for(const region of Object.keys(REGIONS)){
  const state=initialState(),quiz=createSentenceQuiz(state,{random:rng});
  for(const q of quiz.questions){
   markSentenceShown(state,q);chooseAnswer(quiz,q.answer);recordSentenceCorrect(state,quiz);
   assert.equal(recordExploration(state,q.rewardId,'hard',region,rng).counted,true);
   nextQuestion(quiz);
  }
  assert.equal(quiz.index,5);assert.equal(state.collection.byDifficulty.hard,5);
  const encounters=visibleEncounters(state);
  assert.equal(encounters.length,1);assert.equal(encounters[0].region,region);
  assert.deepEqual(state.collection.owned,[]);
  assert.equal(finishCaptureAttempt(state,0),true);
  assert.equal(completeCapture(state,encounters[0].pendingId),true);
  assert.equal(state.collection.owned.length,1);assert.deepEqual(state.collection.shiny,[]);
 }
});


test('Pokemon and cats use ground sleeping poses while humans keep their bed',()=>{
 for(const actor of [...PICTURE_POKEMON,'kiki','huchu']){
  const svg=sentencePicture({kind:'action',actor,action:'sleep'});
  assert.match(svg,/data-sleep-pose=/);assert.doesNotMatch(svg,/data-human-bed|rotate\(-90/);
 }
 for(const actor of ['yeonwoo','mom','dad']){
  const svg=sentencePicture({kind:'action',actor,action:'sleep'});
  assert.match(svg,/data-human-bed=/);assert.doesNotMatch(svg,/data-sleep-pose=/);
 }
});

test('all twenty-five approved species actions use distinct illustrated poses, including actions in paired sentences',()=>{
 const images=[];
 for(const actor of ILLUSTRATED_SPECIES)for(const action of ILLUSTRATED_ACTIONS){
  const svg=sentencePicture({kind:'action',actor,action});images.push(svg);
  assert.ok(svg.includes(`data-action-pose="${actor}:${action}"`));
  assert.match(svg,/(?:pokemon-actions|companion-actions)\.png/);assert.doesNotMatch(svg,/data-pokemon=|<text/);
 }
 assert.equal(new Set(images).size,25);
 const pair=sentencePicture({kind:'pair',left:'bulbasaur',leftAction:'eat',right:'squirtle',rightAction:'sleep'});
 assert.match(pair,/data-action-pose="bulbasaur:eat"/);assert.match(pair,/data-action-pose="squirtle:sleep"/);
});

test('condition questions and ball activities use illustrated scenes rather than idle sprites with props',()=>{
 for(const actor of ['charmander','squirtle'])for(const color of ['red','blue','yellow']){
  const svg=sentencePicture({kind:'color',actor,action:'water',prop:'flower',color});
  assert.ok(svg.includes(`data-illustrated-scene="${actor}:water:${color}"`));assert.doesNotMatch(svg,/data-pokemon=/);
 }
 for(const position of ['under','on','beside'])assert.ok(sentencePicture({kind:'position',actor:'eevee',reference:'tree',position}).includes(`data-illustrated-scene="eevee:tree:${position}"`));
 for(const actor of ['bulbasaur','squirtle','pikachu','eevee'])assert.match(sentencePicture({kind:'action',actor,action:'ball'}),/data-illustrated-scene=/);
 for(const color of ['red','yellow','blue'])assert.ok(sentencePicture({kind:'color',actor:'pikachu',action:'ball',prop:'ball',color}).includes(`pikachu:ball:color:${color}`));
 for(const size of ['big','medium','small'])assert.ok(sentencePicture({kind:'size',actor:'pikachu',action:'ball',prop:'ball',size}).includes(`pikachu:ball:size:${size}`));
});

test('illustration frame boundaries match each bundled atlas and never extend beyond it',()=>{
 for(const sheet of Object.values(ILLUSTRATION_ATLASES)){
  const png=readFileSync(new URL('../docs/'+sheet.file,import.meta.url));
  assert.equal(png.readUInt32BE(16),sheet.width);assert.equal(png.readUInt32BE(20),sheet.height);
  assert.equal(sheet.xRanges.length,sheet.columns);assert.equal(sheet.yRanges.length,sheet.rows);
  for(const [start,end] of sheet.xRanges)assert.ok(start>=0&&end>start&&end<=sheet.width);
  for(const [start,end] of sheet.yRanges)assert.ok(start>=0&&end>start&&end<=sheet.height);
 }
 for(const frame of Object.values(ILLUSTRATION_FRAMES)){
  const sheet=ILLUSTRATION_ATLASES[frame.atlas];assert.ok(frame.column<sheet.columns&&frame.row<sheet.rows);
 }
 // The companion sheet has nonuniform columns: equal division cuts off tails
 // and leaks neighboring characters even though the image itself is valid.
 const widths=ILLUSTRATION_ATLASES.companions.xRanges.map(([a,b])=>b-a);
 assert.ok(new Set(widths).size>1);
});

test('the Pikachu location sentence, help and pictures consistently refer to a desk',()=>{
 const q=BANK.find(q=>q.id==='sentence-39');assert.equal(q.sentence,'피카츄가 책상 아래에 있어요.');
 for(const option of q.options){assert.equal(option.scene.reference,'desk');assert.match(sentencePicture(option.scene),/data-illustrated-scene="pikachu:desk:/);assert.ok(option.description.includes('책상'));}
 for(const hint of q.hints)assert.ok(hint.includes('책상'));assert.ok(q.reveal.includes('책상'));
 for(const actor of ['charmander','squirtle'])assert.match(sentencePicture({kind:'action',actor,action:'wave'}),/remaining-actions\.png/);
 assert.match(sentencePicture({kind:'action',actor:'charmander',action:'sit'}),/remaining-actions\.png/);
});
