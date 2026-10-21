import test from 'node:test';
import assert from 'node:assert/strict';
import { initialState, validateState, settle } from '../docs/model.js';
import { finishCaptureAttempt, visibleEncounters, REGIONS, enableAdventure, explorationProgress, recordExploration, completeCapture, collectionProgress, pokemonRegion, hasMewtwonite, revealedPokemon, shinyDiscovered } from '../docs/collection.js';

test('each habitat requires five new successes then stages a local encounter without ownership', () => {
 for (const region of Object.keys(REGIONS)) {
  const state = initialState();
  for (let i=0;i<4;i++) assert.equal(recordExploration(state, `q${i}`, 'easy', region, () => 0).encountered, false);
  assert.equal(state.collection.pendingEncounters.length, 0);
  assert.equal(recordExploration(state, 'q4', 'easy', region, () => 0).encountered, true);
  const encounter = state.collection.pendingEncounters[0];
  assert.equal(pokemonRegion(encounter), region);
  assert.equal(collectionProgress(state).owned.length, 0);
  assert.equal(explorationProgress(state, region), 0);
  assert.ok(validateState(state));
  const restored = JSON.parse(JSON.stringify(state));
  assert.equal(completeCapture(restored, encounter.pendingId), true);
  assert.equal(completeCapture(restored, encounter.pendingId), false);
  assert.equal(collectionProgress(restored).owned.length, 1);
  assert.equal(restored.collection.pendingEncounters.length, 0);
 }
});
test('paths persist separately across interruptions/days and duplicate questions do not farm steps', () => {
 const state=initialState();
 recordExploration(state,'a','easy','forest');
 recordExploration(state,'a','easy','forest');
 recordExploration(state,'b','easy','sea');
 assert.equal(explorationProgress(state,'forest'),1);
 assert.equal(explorationProgress(state,'sea'),1);
 const restored=JSON.parse(JSON.stringify(state));
 settle(restored, Date.now()+86400_000);
 assert.equal(explorationProgress(restored,'forest'),1);
 recordExploration(restored,'a','easy','forest');
 assert.equal(explorationProgress(restored,'forest'),2);
});
test('legacy friends persist but new threshold rewards wait for successful capture', () => {
 const state=initialState();
 state.collection={total:755,day:state.day,questions:[]};
 const previous=collectionProgress(state).owned.map(p=>p.id);
 enableAdventure(state);
 assert.deepEqual(collectionProgress(state).owned.map(p=>p.id),previous);
 assert.ok(validateState(state));
});
test('25 gift is queued once and survives reload without consuming random guarantees', () => {
 const state=initialState();
 for(let i=0;i<25;i++)recordExploration(state,`q${i}`,'easy','forest',()=>0.999);
 const gifts=state.collection.pendingEncounters.filter(p=>p.shinyGift);
 assert.equal(gifts.length,1);
 assert.ok(!state.collection.shiny.includes('pikachu'));
 assert.equal(state.collection.shinyBonusAwards,0);
 const restored=JSON.parse(JSON.stringify(state));
 recordExploration(restored,'extra','easy','forest');
 assert.equal(restored.collection.pendingEncounters.filter(p=>p.shinyGift).length,1);
 completeCapture(restored,gifts[0].pendingId);
 assert.ok(restored.collection.shiny.includes('pikachu'));
 assert.ok(validateState(restored));
});
test('legendary and Mega milestones remain hidden/uncaught until appropriate thresholds and captures', () => {
 const state=initialState();
 for(let i=1;i<=140;i++) {
  recordExploration(state,`q${i}`,'hard','cave',()=>0.999);
  if(i===25)assert.ok(state.collection.pendingEncounters.some(p=>p.id==='mewtwo'));
  if(i===99)assert.equal(revealedPokemon(state).filter(p=>p.form).length,0);
  if(i===100){assert.ok(hasMewtwonite(state));assert.equal(revealedPokemon(state).filter(p=>p.form).length,2);assert.ok(!state.collection.pendingEncounters.some(p=>p.form));}
 }
 assert.equal(state.collection.pendingEncounters.filter(p=>p.id==='mewtwo-mega-x').length,1);
 assert.equal(state.collection.pendingEncounters.filter(p=>p.id==='mewtwo-mega-y').length,1);
 assert.equal(collectionProgress(state).owned.length,0);
});

test('invalid saved paths and duplicate pending encounter keys are rejected', () => {
 const state=initialState(); enableAdventure(state);
 state.collection.explorationSteps.forest=5;
 assert.equal(validateState(state),false);
 state.collection.explorationSteps.forest=0;
 state.collection.pendingEncounters=[{id:'bulbasaur',pendingId:'same',shiny:false},{id:'squirtle',pendingId:'same',shiny:false}];
 assert.equal(validateState(state),false);
});

test('shiny discovery stays secret until Pikachu introduction, with no random shiny before 25', () => {
 const state=initialState();
 for(let i=0;i<24;i++)recordExploration(state,`secret-${i}`,'medium','forest',()=>0);
 assert.equal(shinyDiscovered(state),false);
 assert.ok(!state.collection.pendingEncounters.some(p=>p.shiny));
 recordExploration(state,'secret-25','medium','forest',()=>0);
 assert.ok(state.collection.pendingEncounters.some(p=>p.shinyGift && p.id==='pikachu'));
 assert.equal(shinyDiscovered(state),false);
 state.collection.shinyIntroSeen=true;
 assert.equal(shinyDiscovered(JSON.parse(JSON.stringify(state))),true);
 assert.ok(validateState(state));
});

test('old three-region saves gain new paths without losing earlier progress or captures', () => {
 const state=initialState(); enableAdventure(state);
 state.collection.explorationSteps={forest:3,sea:2,cave:1};
 assert.ok(validateState(state));
 const restored=JSON.parse(JSON.stringify(state));
 enableAdventure(restored);
 assert.equal(restored.collection.explorationSteps.forest,3);
 for(const region of ['powerplant','haunted','ice','volcano'])assert.equal(explorationProgress(restored,region),0);
 assert.ok(validateState(restored));
});

test('older queued shinies remain saved but cannot appear before the Pikachu introduction', () => {
 const state=initialState();enableAdventure(state);
 state.collection.pendingEncounters.push({id:'bulbasaur',pendingId:'legacy-shiny',shiny:true});
 assert.equal(visibleEncounters(state).length,0);
 assert.equal(state.collection.pendingEncounters.length,1);
 state.collection.total=25;
 state.collection.pendingEncounters.push({id:'pikachu',pendingId:'gift',shiny:true,shinyGift:true});
 assert.deepEqual(visibleEncounters(state).map(p=>p.id),['pikachu']);
 state.collection.shinyIntroSeen=true;
 assert.deepEqual(visibleEncounters(state).map(p=>p.id),['pikachu','bulbasaur']);
});

test('three errors defer captures across reloads; a later successful round restores the same opportunities', () => {
 const state=initialState();
 for(let i=0;i<5;i++)recordExploration(state,`fail-${i}`,'easy','forest',()=>0);
 const id=state.collection.pendingEncounters[0].pendingId;
 assert.equal(finishCaptureAttempt(state,3),false);
 assert.equal(visibleEncounters(state).length,0);
 assert.equal(collectionProgress(state).owned.length,0);
 const restored=JSON.parse(JSON.stringify(state));assert.ok(validateState(restored));
 assert.equal(visibleEncounters(restored).length,0);
 assert.equal(restored.collection.pendingEncounters[0].pendingId,id);
 assert.equal(finishCaptureAttempt(restored,2),true);
 assert.equal(visibleEncounters(restored)[0].pendingId,id);
 assert.equal(completeCapture(restored,id),true);
 assert.equal(collectionProgress(restored).owned.length,1);
});
