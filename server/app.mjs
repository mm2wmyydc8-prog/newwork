import { createServer } from 'node:http';
import { timingSafeEqual } from 'node:crypto';

export function createApp({ timer, apiKey, integration }) {
  if (!apiKey || Buffer.byteLength(apiKey) < 32) throw new Error('APP_API_KEY must be at least 32 bytes');
  // API calls and scheduler work share one queue, avoiding start/stop/off races.
  let queue = Promise.resolve();
  const exclusive = operation => {
    const next = queue.then(operation);
    queue = next.catch(() => {});
    return next;
  };
  const tick = () => exclusive(() => timer.tick());
  const server = createServer(async (req, res) => {
    const reply = (status, body) => {
      res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
      res.end(JSON.stringify(body));
    };
    const path = new URL(req.url, 'http://localhost').pathname;
    if (req.method === 'GET' && path === '/health') return reply(200, { ok: true });
    const supplied = Buffer.from(req.headers.authorization ?? '');
    const expected = Buffer.from(`Bearer ${apiKey}`);
    if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) {
      req.resume(); return reply(401, { error: 'Unauthorized' });
    }
    try {
      let body = {};
      if (req.method === 'POST') {
        const chunks = []; let size = 0;
        for await (const chunk of req) {
          size += chunk.length;
          if (size > 4096) throw Object.assign(new Error('Request too large'), { status: 413 });
          chunks.push(chunk);
        }
        try { body = JSON.parse(Buffer.concat(chunks).toString() || '{}'); }
        catch { throw Object.assign(new Error('Invalid JSON'), { status: 400 }); }
        if (!body || typeof body !== 'object' || Array.isArray(body)) throw Object.assign(new Error('Invalid JSON object'), { status: 400 });
      }
      const result = await exclusive(async () => {
        if (req.method === 'GET' && path === '/timer') return timer.tick();
        if (req.method === 'GET' && path === '/integration') {
          try { return await integration.status(); }
          catch { throw Object.assign(new Error('SmartThings connection failed; check server credentials and device'), { status: 502 }); }
        }
        if (req.method === 'POST') {
          if (path === '/budget') { timer.budget(body); return timer.tick(); }
          if (path === '/timer/start') return timer.start();
          if (path === '/timer/pause') return timer.pause();
          if (path === '/timer/stop') { timer.stop(); return timer.tick(); }
        }
        throw Object.assign(new Error('Not found'), { status: 404 });
      });
      reply(200, result);
    } catch (error) {
      reply(error.status ?? 500, { error: error.status ? error.message : 'Server operation failed' });
    }
  });
  server.requestTimeout = 10_000;
  server.headersTimeout = 10_000;
  return { server, tick };
}
