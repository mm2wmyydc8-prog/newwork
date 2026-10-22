import test from 'node:test';
import assert from 'node:assert/strict';
import {initialState} from '../docs/model.js';
import {POKEMON,REGIONS,evolutionDifficulty,explorationPool} from '../docs/collection.js';
test('evolution encounters require the matching minimum difficulty in every region',()=>{
 const state=initialState();
 for(const region of Object.keys(REGIONS)){
  const easy=explorationPool(state,'easy',region),medium=explorationPool(state,'medium',region),hard=explorationPool(state,'hard',region);
  assert.ok(easy.length>0);
  assert.ok(easy.every(p=>evolutionDifficulty(p)==='easy'));
  assert.ok(medium.every(p=>evolutionDifficulty(p)!=='hard'));
  assert.ok(easy.every(p=>medium.some(q=>q.id===p.id)));
  assert.ok(medium.every(p=>hard.some(q=>q.id===p.id)));
 }
 const forest=level=>explorationPool(state,level,'forest').map(p=>p.id);
 assert.ok(!forest('easy').includes('raticate'));
 assert.ok(forest('medium').includes('raticate'));
 const fire=level=>explorationPool(state,level,'volcano').map(p=>p.id);
 assert.ok(fire('easy').includes('charmander'));
 assert.ok(!fire('easy').includes('charmeleon'));
 assert.ok(fire('medium').includes('charmeleon'));
 assert.ok(!fire('medium').includes('charizard'));
 // Rare final evolutions retain the existing progress requirement.
 const advanced=initialState();explorationPool(advanced,'easy','forest');advanced.collection.total=1000;advanced.collection.byDifficulty={easy:0,medium:0,hard:1000};
 assert.ok(explorationPool(advanced,'hard','volcano').some(p=>p.id==='charizard'));
 assert.equal(evolutionDifficulty(POKEMON.find(p=>p.id==='dragonite')),'hard');
});
