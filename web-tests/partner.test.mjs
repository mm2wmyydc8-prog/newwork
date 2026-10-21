import test from 'node:test';
import assert from 'node:assert/strict';
import { initialState, validateState } from '../docs/model.js';
import { POKEMON, enableAdventure } from '../docs/collection.js';
import { PARTNER_MOVESETS } from '../docs/partner-moves.js';
import { availablePartners, getPartner, selectPartner, missionPartnerSlot, partnerCelebrationSlots, revealedPartnerSlots } from '../docs/partner.js';

test('species have four named moves except single-move Abra and Ditto', () => {
 const effects=new Set(['normal','wind','poison','rock','leaf','shadowball','fire','water','electric','psychic','ice','aurasphere','confusion']);
 for(const pokemon of POKEMON) {
  const moves=PARTNER_MOVESETS[pokemon.id];
  assert.equal(moves.length,['abra','ditto'].includes(pokemon.id)?1:4,pokemon.id);
  assert.equal(new Set(moves.map(m=>m.id)).size,moves.length,pokemon.id);
  assert.ok(moves.every(m=>m.name && effects.has(m.effect)));
 }
 assert.deepEqual(PARTNER_MOVESETS.ditto.map(m=>m.id),['transform']);
 assert.equal(PARTNER_MOVESETS.charizard[0].name,'화염방사');
 assert.equal(PARTNER_MOVESETS.pikachu[3].name,'10만볼트');
});
test('only default Mewtwo and caught friends are selectable, and selection survives save/reload', () => {
 const state=initialState();enableAdventure(state);
 assert.deepEqual(availablePartners(state).map(p=>p.id),['mewtwo']);
 assert.equal(selectPartner(state,'charizard'),false);
 state.collection.owned.push('charizard','pikachu');state.collection.shiny.push('pikachu');state.collection.total=25;
 assert.equal(selectPartner(state,'pikachu',true),true);
 assert.ok(validateState(state));
 const restored=JSON.parse(JSON.stringify(state));
 assert.equal(getPartner(restored).name,'피카츄');
 assert.equal(getPartner(restored).shiny,true);
 assert.equal(getPartner(restored).image,'assets/shiny/pikachu.png');
 assert.equal(selectPartner(state,'charizard',true),false);
});
test('Mega partner requires both capture and Mewtwonite, invalid selections safely fall back', () => {
 const state=initialState();enableAdventure(state);
 state.collection.owned.push('mewtwo-mega-x');
 assert.equal(selectPartner(state,'mewtwo-mega-x'),false);
 state.collection.total=100;
 assert.equal(selectPartner(state,'mewtwo-mega-x'),true);
 delete state.collection;
 assert.equal(getPartner(state).id,'mewtwo');
});
test('mission assignments cover four slots; 60 minutes adds a fourth-slot celebration without duplication', () => {
 const state=initialState();
 state.missions.push({id:'custom',title:'정리',minutes:10});
 assert.equal(missionPartnerSlot(state,state.missions[3]),3);
 assert.equal(missionPartnerSlot(state,{id:'reading',move:'confusion'}),0);
 assert.equal(missionPartnerSlot(state,{id:'hangul',move:'psychic'}),3);
 assert.deepEqual(partnerCelebrationSlots(state,state.missions[1],30,60),[1,3]);
 assert.deepEqual(partnerCelebrationSlots(state,state.missions[3],50,60),[3]);
});

test('move names stay hidden until confirmed quests; daily reset hides them again', () => {
 const state=initialState();
 assert.deepEqual([...revealedPartnerSlots(state)],[]);
 state.entries.push({day:state.day,minutes:30,missionId:null});
 assert.deepEqual([...revealedPartnerSlots(state)],[]);
 state.entries.push({day:state.day,minutes:30,missionId:'hangul'});
 assert.deepEqual([...revealedPartnerSlots(state)],[0]);
 state.entries.push({day:state.day,minutes:30,missionId:'bookclub'});
 assert.deepEqual([...revealedPartnerSlots(state)],[0,1,3]);
 state.day='2099-01-01';
 assert.deepEqual([...revealedPartnerSlots(state)],[]);
});
