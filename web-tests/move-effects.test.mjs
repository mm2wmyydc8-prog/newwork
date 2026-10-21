import test from 'node:test';
import assert from 'node:assert/strict';
import { classifyMove } from '../docs/move-effects.js';
import { PARTNER_MOVESETS } from '../docs/partner-moves.js';

test('Arbok poison moves distinguish sting, liquid and fang actions from psychic', () => {
 const moves=PARTNER_MOVESETS.arbok;
 assert.equal(classifyMove(moves.find(m=>m.id==='poison-fang')).motion,'fang');
 assert.equal(classifyMove(moves.find(m=>m.id==='poison-sting')).motion,'needle');
 assert.equal(classifyMove(moves.find(m=>m.id==='acid')).motion,'liquid');
 assert.ok(moves.every(m=>classifyMove(m).motion!=='psychic'));
 assert.equal(classifyMove(moves[3]).color,'#b66cce');
});
test('actions take precedence over type colors and all partner moves have a usable descriptor', () => {
 assert.equal(classifyMove({id:'fire-punch',effect:'fire'}).motion,'punch');
 assert.equal(classifyMove({id:'ice-fang',effect:'ice'}).motion,'fang');
 assert.equal(classifyMove({id:'thunderbolt',effect:'electric'}).motion,'bolt');
 assert.equal(classifyMove({id:'psychic',effect:'psychic'}).motion,'psychic');
 assert.equal(classifyMove({id:'fire-blast',effect:'fire'}).symbol,'大');
 for(const moves of Object.values(PARTNER_MOVESETS)) for(const move of moves) {
  const effect=classifyMove(move);assert.ok(effect.motion);assert.match(effect.color,/^#[a-f0-9]{6}$/i);
 }
});

test('Sludge Bomb is a projectile while Acid and Sludge Wave remain liquid attacks', () => {
 assert.equal(classifyMove({id:'sludge-bomb',effect:'poison'}).motion,'ball');
 assert.equal(classifyMove({id:'sludge-bomb',effect:'poison'}).color,'#b66cce');
 for (const id of ['acid','sludge','sludge-wave']) assert.equal(classifyMove({id,effect:'poison'}).motion,'liquid');
});
