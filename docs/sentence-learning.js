import { SENTENCE_QUESTIONS } from './sentence-questions.js?v=evolution-levels';
const IDS = new Set(SENTENCE_QUESTIONS.map(q=>q.id));
export const DEFAULT_READING_SETTINGS = {stage2Correct:12,stage3Correct:12,minAccuracy:70,reviewEnabled:true};
export function mix(items,random=Math.random){const a=[...items];for(let i=a.length-1;i>0;i--){const j=Math.min(i,Math.floor(random()*(i+1)));[a[i],a[j]]=[a[j],a[i]];}return a;}
export function ensureReading(state,random=Math.random){
 if(!state.hardReading)state.hardReading={version:1,cycle:1,seen:[],order:mix([...IDS],random),lastChoices:{},stats:{},reviews:[],history:[],reviewRun:0,streak:0,settings:{...DEFAULT_READING_SETTINGS}};
 return state.hardReading;
}
export function readingStage(state){
 const d=ensureReading(state),score=stage=>{
  const stats=SENTENCE_QUESTIONS.filter(q=>q.stage===stage).map(q=>d.stats[q.id]).filter(Boolean);
  const correct=stats.reduce((n,s)=>n+s.correct,0),first=stats.reduce((n,s)=>n+s.firstTryCorrect,0);
  return {correct,accuracy:correct?first/correct*100:0};
 };
 const one=score(1),two=score(2),s=d.settings;
 if(one.correct<s.stage2Correct||one.accuracy<s.minAccuracy)return 1;
 if(two.correct<s.stage3Correct||two.accuracy<s.minAccuracy)return 2;
 return 3;
}
export function createSentenceQuiz(state,{random=Math.random,review=false}={}){
 const d=ensureReading(state,random);let ids,isReview=review;
 if(review){if(!d.settings.reviewEnabled)return null;ids=mix(d.reviews,random);if(!ids.length)return null;d.reviewRun++;}
 else{
  if(d.seen.length===50){const previous=d.order;d.cycle++;d.seen=[];d.order=mix([...IDS],random);if(d.order.every((id,i)=>id===previous[i]))d.order.push(d.order.shift());}
  const fresh=d.order.filter(id=>!d.seen.includes(id)),stage=readingStage(state);
  // Weight lower stages before promotion, then mix learned stages with new ones.
  const preferred=fresh.filter(id=>SENTENCE_QUESTIONS.find(q=>q.id===id).stage<=stage);
  const selected=[];
  for(let i=0;i<5;i++){
   const eligible=preferred.filter(id=>!selected.includes(id));
   const rest=fresh.filter(id=>!selected.includes(id));
   if(!rest.length)break;
   const pool=eligible.length?eligible:rest; // Never repeat a seen item to satisfy a stage quota.
   selected.push(pool[0]);
  }
  ids=selected;
 }
 const cycle=d.cycle,run=d.reviewRun;
 const questions=ids.slice(0,5).map(id=>{
  const source=SENTENCE_QUESTIONS.find(q=>q.id===id);let options=mix(source.options,random);
  const old=d.lastChoices[id];if(old&&options.every((o,i)=>o.id===old[i]))options.push(options.shift());
  return {...source,options,choices:options.map(o=>o.id),reading:source.sentence,word:source.sentence,prompt:'문장을 읽고 알맞은 그림을 골라봐!',isReview,cycle,rewardId:isReview?`${id}:review-${run}`:`${id}:cycle-${cycle}`};
 });
 return {index:0,answered:false,selected:[],difficulty:'hard',questions,consecutiveWrong:d.streak,totalMistakes:0,captureFailed:false,isReview};
}
export function markSentenceShown(state,q){const d=ensureReading(state);if(!q.isReview&&!d.seen.includes(q.id))d.seen.push(q.id);d.lastChoices[q.id]=q.choices;}
export function noteSentenceWrong(state,quiz){
 const q=quiz.questions[quiz.index],d=ensureReading(state);
 quiz.totalMistakes++;quiz.consecutiveWrong++;d.streak=quiz.consecutiveWrong;quiz.mistakes=(quiz.mistakes??0)+1;quiz.assisted=true;
 if(!d.reviews.includes(q.id))d.reviews.push(q.id);
 const s=d.stats[q.id]??={correct:0,wrong:0,helped:0,firstTryCorrect:0};s.wrong++;
 if(quiz.consecutiveWrong>=5){quiz.captureFailed=true;quiz.answerRevealed=true;return 'reveal';}
 return quiz.consecutiveWrong===1?'hint':'detail';
}
export function recordSentenceCorrect(state,quiz,now=Date.now()){
 const q=quiz.questions[quiz.index],d=ensureReading(state),s=d.stats[q.id]??={correct:0,wrong:0,helped:0,firstTryCorrect:0};
 s.correct++;if(quiz.assisted)s.helped++;if(!(quiz.mistakes>0)&&!quiz.assisted)s.firstTryCorrect++;
 if(q.isReview)d.reviews=d.reviews.filter(id=>id!==q.id);
 d.history.push({id:q.id,cycle:q.cycle,isReview:q.isReview,helped:Boolean(quiz.assisted),wrong:quiz.mistakes??0,at:now});d.history=d.history.slice(-500);
 quiz.consecutiveWrong=0;d.streak=0;quiz.mistakes=0;quiz.answerRevealed=false;
}
export function validateReading(d){
 if(!d||!Number.isSafeInteger(d.streak)||d.streak<0||d.version!==1||!Number.isSafeInteger(d.cycle)||d.cycle<1||!Number.isSafeInteger(d.reviewRun)||d.reviewRun<0)return false;
 const list=a=>Array.isArray(a)&&a.every(id=>IDS.has(id))&&new Set(a).size===a.length;
 if(!list(d.seen)||!list(d.order)||d.order.length!==50||!list(d.reviews))return false;
 const settings=d.settings;
 if(!settings||!['stage2Correct','stage3Correct'].every(k=>Number.isInteger(settings[k])&&settings[k]>=1&&settings[k]<=100)||!Number.isInteger(settings.minAccuracy)||settings.minAccuracy<0||settings.minAccuracy>100||typeof settings.reviewEnabled!=='boolean')return false;
 if(!d.stats||typeof d.stats!=='object'||Array.isArray(d.stats)||!Object.entries(d.stats).every(([id,s])=>IDS.has(id)&&s&&['correct','wrong','helped','firstTryCorrect'].every(k=>Number.isSafeInteger(s[k])&&s[k]>=0)&&s.firstTryCorrect<=s.correct&&s.helped<=s.correct))return false;
 if(!d.lastChoices||typeof d.lastChoices!=='object'||Array.isArray(d.lastChoices)||!Object.entries(d.lastChoices).every(([id,choices])=>IDS.has(id)&&Array.isArray(choices)&&choices.length===3&&new Set(choices).size===3&&choices.every(c=>SENTENCE_QUESTIONS.find(q=>q.id===id).options.some(o=>o.id===c))))return false;
 return Array.isArray(d.history)&&d.history.length<=500&&d.history.every(h=>h&&IDS.has(h.id)&&Number.isSafeInteger(h.cycle)&&h.cycle>0&&typeof h.isReview==='boolean'&&typeof h.helped==='boolean'&&Number.isSafeInteger(h.wrong)&&h.wrong>=0&&Number.isFinite(h.at));
}
