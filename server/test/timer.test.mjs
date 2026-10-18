import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Timer, dateKey } from '../timer.mjs';
import { createApp } from '../app.mjs';
import { smartThings } from '../smartthings.mjs';

process.env.TZ = 'Asia/Seoul';
function fixture(t, options = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'timegarden-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  let now = Date.parse('2026-10-18T12:00:00+09:00'), calls = 0;
  const config = { file: join(dir, 'state.json'), now: () => now,
    off: async () => { calls++; if (options.fail?.()) throw new Error('offline'); } };
  return { timer: new Timer(config), config, advance: ms => { now += ms; },
    budget: (totalMinutes, baseMinutes = 30) => ({ totalMinutes, baseMinutes, day: dateKey(now) }),
    get calls() { return calls; } };
}

test('countdown expires without any app request and sends off only once', async t => {
  const f = fixture(t);
  f.timer.budget(f.budget(1)); f.timer.start();
  f.advance(59_000); assert.equal((await f.timer.tick()).remainingSeconds, 1);
  assert.equal(f.calls, 0);
  f.advance(1000); const result = await f.timer.tick();
  assert.equal(result.running, false); assert.equal(result.remainingSeconds, 0);
  assert.equal(result.shutdownStatus, 'sent'); assert.equal(f.calls, 1);
  await f.timer.tick(); assert.equal(f.calls, 1);
});
test('pause preserves remaining time; resume does not reset it', async t => {
  const f = fixture(t); f.timer.start(); f.advance(120_000);
  assert.equal(f.timer.pause().remainingSeconds, 1680);
  f.advance(300_000); assert.equal((await f.timer.tick()).remainingSeconds, 1680);
  f.timer.start(); f.advance(60_000);
  assert.equal((await f.timer.tick()).remainingSeconds, 1620);
});
test('repeated start is idempotent and a restart recovers elapsed time', async t => {
  const f = fixture(t); f.timer.budget(f.budget(1)); f.timer.start();
  f.advance(20_000); f.timer.start();
  f.advance(41_000);
  const restored = new Timer(f.config);
  assert.equal((await restored.tick()).remainingSeconds, 0);
  assert.equal(f.calls, 1);
});
test('failed off persists and retries after restart with backoff', async t => {
  let fail = true; const f = fixture(t, { fail: () => fail });
  f.timer.start(); f.timer.stop();
  assert.equal((await f.timer.tick()).shutdownStatus, 'failed');
  const restored = new Timer(f.config);
  await restored.tick(); assert.equal(f.calls, 1);
  fail = false; f.advance(5000);
  assert.equal((await restored.tick()).shutdownStatus, 'sent'); assert.equal(f.calls, 2);
});
test('budget changes retain already consumed time', async t => {
  const f = fixture(t); f.timer.start(); f.advance(600_000);
  assert.equal(f.timer.budget(f.budget(60)).remainingSeconds, 3000);
  assert.equal(f.timer.budget(f.budget(5)).running, false);
  await f.timer.tick();
  assert.equal(f.timer.budget(f.budget(30)).remainingSeconds, 1200);
});
test('midnight expires bonuses, ends viewing and switches back to baseline', async t => {
  const f = fixture(t); f.timer.budget(f.budget(90, 30)); f.timer.start();
  f.advance(12 * 3600_000);
  const result = await f.timer.tick();
  assert.equal(result.day, '2026-10-19'); assert.equal(result.remainingSeconds, 1800);
  assert.equal(result.running, false); assert.equal(f.calls, 1);
});
test('invalid budget is rejected without changing allowance', t => {
  const f = fixture(t);
  for (const total of [-1, 241, 3.5, '30', null]) assert.throws(() => f.timer.budget(f.budget(total)));
  assert.equal(f.timer.snapshot().totalSeconds, 1800);
});
test('HTTP authentication, budget, countdown, stop and integration use real routes', async t => {
  const f = fixture(t), apiKey = 'test-key-'.repeat(8);
  const { server } = createApp({ timer: f.timer, apiKey,
    integration: { status: async () => ({ connected: true, power: 'on' }) } });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise(resolve => { server.closeAllConnections(); server.close(resolve); }));
  const url = `http://127.0.0.1:${server.address().port}`;
  const send = (path, body) => fetch(url + path, { method: body ? 'POST' : 'GET',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    ...(body ? { body: JSON.stringify(body) } : {}) });
  assert.equal((await fetch(url + '/timer')).status, 401);
  assert.equal((await send('/budget', f.budget(1))).status, 200);
  assert.equal((await (await send('/timer/start', {})).json()).running, true);
  f.advance(10_000);
  assert.equal((await (await send('/timer')).json()).remainingSeconds, 50);
  assert.equal((await (await send('/timer/stop', {})).json()).shutdownStatus, 'sent');
  assert.equal(f.calls, 1);
  assert.deepEqual(await (await send('/integration')).json(), { connected: true, power: 'on' });
  assert.equal((await send('/budget', { ...f.budget(1), day: '2000-01-01' })).status, 400);
});
test('SmartThings adapter uses the switch off command and rejects failed responses', async () => {
  let captured;
  const adapter = smartThings({ token: 'test-only', deviceId: 'monitor-id', fetcher: async (url, options) => {
    captured = { url, options };
    return { ok: true, json: async () => ({ results: [{ status: 'ACCEPTED' }] }) };
  } });
  await adapter.off();
  assert.equal(captured.url, 'https://api.smartthings.com/v1/devices/monitor-id/commands');
  assert.equal(captured.options.method, 'POST');
  assert.deepEqual(JSON.parse(captured.options.body).commands[0], { component: 'main', capability: 'switch', command: 'off', arguments: [] });
  const denied = smartThings({ token: 'test-only', deviceId: 'monitor-id', fetcher: async () => ({ ok: false, status: 401 }) });
  await assert.rejects(denied.off(), /401/);
  const rejected = smartThings({ token: 'test-only', deviceId: 'monitor-id', fetcher: async () => ({ ok: true, json: async () => ({ results: [{ status: 'FAILED' }] }) }) });
  await assert.rejects(rejected.off(), /did not accept/);
});
