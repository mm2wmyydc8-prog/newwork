import { resolve } from 'node:path';
import { Timer } from './timer.mjs';
import { smartThings } from './smartthings.mjs';
import { createApp } from './app.mjs';

process.env.TZ = process.env.TIMER_TIMEZONE || 'Asia/Seoul';
const integration = smartThings({ token: process.env.SMARTTHINGS_TOKEN, deviceId: process.env.SMARTTHINGS_DEVICE_ID });
const timer = new Timer({ file: resolve(process.env.STATE_FILE || './data/timer.json'), off: () => integration.off() });
const { server, tick } = createApp({ timer, integration, apiKey: process.env.APP_API_KEY });
// Recovery of an expired persisted timer happens before accepting new sessions.
await tick();
const interval = setInterval(() => { tick().catch(() => console.error('Timer persistence failure; inspect storage')); }, 1000);
server.listen(Number(process.env.PORT || 3000), process.env.BIND_HOST || '127.0.0.1', () => {
  console.log('TimeGarden timer service started');
});
for (const signal of ['SIGTERM', 'SIGINT']) {
  process.on(signal, () => { clearInterval(interval); server.close(); });
}
