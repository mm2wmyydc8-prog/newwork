import test from 'node:test';
import assert from 'node:assert/strict';
import {choreographMove,SPECIAL_MOVES} from '../docs/move-choreography.js';
import {PARTNER_MOVESETS} from '../docs/partner-moves.js';
import {initialState} from '../docs/model.js';
import {selectPartner,missionPartnerSlot,partnerCelebrationSlots,revealedPartnerSlots} from '../docs/partner.js';
import {captureAllForTesting} from '../docs/collection.js';

test('Surf carries its user, Fly leaves the screen, Body Slam squashes, and explosions remove both actors',()=>{
 assert.ok(choreographMove('surf',1.2).x>200);
 assert.ok(choreographMove('fly',.95).y < -300);
 assert.ok(choreographMove('body-slam',1.65).targetScaleY<.7);
 for(const move of ['self-destruct','explosion']){
  const a=choreographMove(move,2);assert.equal(a.opacity,0);assert.equal(a.targetOpacity,0);
 }
 assert.equal(choreographMove('submission',1.75-1e-6).rotation>1079,true);
 assert.equal(choreographMove('teleport',1.7).opacity,0);
 assert.equal(choreographMove('dig',.95).opacity,0);
});
test('requested species moves and single-move partners work for every mission slot',()=>{
 const ids=id=>PARTNER_MOVESETS[id].map(m=>m.id);
 assert.deepEqual(ids('gengar'),['dream-eater','shadow-ball','destiny-bond','hypnosis']);
 assert.deepEqual(ids('snorlax'),['rest','sleep-talk','body-slam','hyper-beam']);
 for(const id of ['psyduck','golduck'])assert.equal(PARTNER_MOVESETS[id].filter(m=>m.effect==='psychic').length>=2,true);
 assert.ok(ids('raichu').includes('million-volt'));assert.ok(ids('zapdos').includes('million-volt'));assert.ok(!ids('zapdos').includes('thunder-shock'));
 assert.ok(ids('sandslash').includes('spikes'));assert.ok(!ids('sandslash').includes('sand-tomb'));
 for(const id of ['meowth','persian'])assert.ok(ids(id).includes('pay-day'));
 const state=initialState();captureAllForTesting(state);
 for(const id of ['abra','ditto']){
  selectPartner(state,id);for(const move of ['confusion','shadowball','aurasphere','psychic'])assert.equal(missionPartnerSlot(state,{move}),0);
  assert.deepEqual(partnerCelebrationSlots(state,state.missions[1],30,60),[0]);
  state.entries=[{day:state.day,missionId:'hangul',minutes:60}];assert.deepEqual([...revealedPartnerSlots(state)],[0]);
 }
});
test('reduced motion returns stationary actors for every named choreography',()=>{
 for(const id of SPECIAL_MOVES){const a=choreographMove(id,1.5,true);assert.equal(a.x,0,id);assert.equal(a.y,0,id);assert.equal(a.targetScaleY,1,id);}
});
