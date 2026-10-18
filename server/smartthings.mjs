export function smartThings({ token, deviceId, fetcher = fetch }) {
  if (!token || !deviceId) throw new Error('SmartThings credentials and device ID are required');
  const root = `https://api.smartthings.com/v1/devices/${encodeURIComponent(deviceId)}`;
  async function request(path, options = {}) {
    const response = await fetcher(root + path, {
      ...options,
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(8000),
      redirect: 'error'
    });
    if (!response.ok) {
      // Never log upstream response bodies or authorization headers.
      throw new Error(`SmartThings HTTP ${response.status}`);
    }
    return response.json();
  }
  return {
    async status() {
      const body = await request('/status');
      return { connected: true, power: body.components?.main?.switch?.switch?.value ?? 'unknown' };
    },
    async off() {
      const body = await request('/commands', {
        method: 'POST',
        body: JSON.stringify({ commands: [{ component: 'main', capability: 'switch', command: 'off', arguments: [] }] })
      });
      if (!Array.isArray(body.results) || body.results.length === 0 ||
          !body.results.every(result => ['ACCEPTED', 'COMPLETED'].includes(result.status))) {
        throw new Error('SmartThings did not accept the off command');
      }
    }
  };
}
