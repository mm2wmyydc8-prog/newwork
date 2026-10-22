import test from 'node:test';
import assert from 'node:assert/strict';
import {SENTENCE_QUESTIONS} from '../docs/sentence-questions.js';
import {sentencePicture} from '../docs/sentence-pictures.js';
import {illustrationKey,ILLUSTRATION_FRAMES} from '../docs/reading-illustrations.js';
const family=['mom','dad','yeonwoo','huchu','kiki'];
test('all family, cat and box choices use complete illustrations including distractors and paired actions',()=>{
 for(const q of SENTENCE_QUESTIONS)for(const {scene} of q.options){
  if(scene.kind==='pair'){
   for(const [actor,action] of [[scene.left,scene.leftAction],[scene.right,scene.rightAction]])if(family.includes(actor)){
    assert.ok(ILLUSTRATION_FRAMES[illustrationKey({kind:'action',actor,action})],`${q.id} ${actor}:${action}`);
    assert.ok(sentencePicture(scene).includes(`data-action-pose="${actor}:${action}"`));
   }
  }else if(family.includes(scene.actor)||(scene.kind==='give'&&(family.includes(scene.giver)||family.includes(scene.receiver)))||scene.prop==='box'||scene.reference==='box'){
   assert.ok(ILLUSTRATION_FRAMES[illustrationKey(scene)],`${q.id}: ${JSON.stringify(scene)}`);
   assert.match(sentencePicture(scene),/data-illustrated-scene=/);
   assert.doesNotMatch(sentencePicture(scene),/data-pokemon=/);
  }
 }
});
test('conditional choices have different frames and giving scenes preserve object and giver direction',()=>{
 for(const q of SENTENCE_QUESTIONS){
  const keys=q.options.map(o=>illustrationKey(o.scene));
  if(keys.every(k=>ILLUSTRATION_FRAMES[k])){
   assert.equal(new Set(keys).size,3,q.id);
   assert.equal(new Set(keys.map(k=>JSON.stringify(ILLUSTRATION_FRAMES[k]))).size,3,q.id);
  }
 }
 const a={kind:'give',giver:'mom',receiver:'yeonwoo',prop:'book'};
 assert.notEqual(illustrationKey(a),illustrationKey({...a,giver:'yeonwoo',receiver:'mom'}));
 assert.notEqual(illustrationKey(a),illustrationKey({...a,prop:'apple'}));
});

test('every choice in all fifty sentence questions has a complete illustrated scene or illustrated pair',()=>{
 for(const q of SENTENCE_QUESTIONS)for(const {scene} of q.options){
  if(scene.kind==='pair'){
   for(const [actor,action] of [[scene.left,scene.leftAction],[scene.right,scene.rightAction]])
    assert.ok(ILLUSTRATION_FRAMES[illustrationKey({kind:'action',actor,action})],`${q.id}: ${actor}:${action}`);
  }else assert.ok(ILLUSTRATION_FRAMES[illustrationKey(scene)],`${q.id}: ${JSON.stringify(scene)}`);
  assert.doesNotMatch(sentencePicture(scene),/data-pokemon=/,q.id);
 }
});
