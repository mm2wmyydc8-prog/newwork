import { readFileSync, writeFileSync, renameSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

export function dateKey(now) {
  const d = new Date(now);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// All access is serialized by the HTTP service. Persist before sending any command.
export class Timer {
  constructor({ file, off, now = Date.now }) {
    this.file = file; this.off = off; this.now = now;
    try { this.state = JSON.parse(readFileSync(file, 'utf8')); }
    catch (error) {
      if (error.code !== 'ENOENT') throw error; // Never silently discard a corrupt ledger.
      this.state = { version: 1, day: dateKey(now()), baseSeconds: 1800, budgetSeconds: 1800,
        usedSeconds: 0, running: false, startedAt: null, shutdownPending: false,
        shutdownStatus: 'idle', retryAt: 0, attempts: 0 };
      this.persist();
    }
    if (this.state.version !== 1) throw new Error('Unsupported timer state');
  }
  persist() {
    mkdirSync(dirname(this.file), { recursive: true, mode: 0o700 });
    writeFileSync(`${this.file}.tmp`, JSON.stringify(this.state), { mode: 0o600 });
    renameSync(`${this.file}.tmp`, this.file);
  }
  settle() {
    const s = this.state, now = this.now();
    if (s.day !== dateKey(now)) {
      // End the previous day's session at midnight, even across a server restart.
      if (s.running) this.requestOff();
      s.day = dateKey(now); s.usedSeconds = 0; s.budgetSeconds = s.baseSeconds;
      s.running = false; s.startedAt = null;
    } else if (s.running) {
      s.usedSeconds += Math.max(0, (now - s.startedAt) / 1000);
      s.startedAt = now;
      if (s.usedSeconds >= s.budgetSeconds) this.requestOff();
    }
    this.persist();
  }
  requestOff() {
    const s = this.state;
    s.running = false; s.startedAt = null;
    if (!s.shutdownPending) {
      s.shutdownPending = true; s.shutdownStatus = 'pending'; s.retryAt = 0; s.attempts = 0;
    }
  }
  snapshot() {
    const s = this.state;
    return { day: s.day, totalSeconds: s.budgetSeconds,
      remainingSeconds: Math.max(0, Math.ceil(s.budgetSeconds - s.usedSeconds)),
      running: s.running, shutdownStatus: s.shutdownStatus,
      warning: s.running && s.budgetSeconds - s.usedSeconds <= 300 };
  }
  budget({ baseMinutes, totalMinutes, day }) {
    this.settle();
    if (![baseMinutes, totalMinutes].every(x => Number.isInteger(x) && x >= 0 && x <= 240) || day !== this.state.day) {
      throw Object.assign(new Error('Invalid budget or date; refresh the app'), { status: 400 });
    }
    const s = this.state;
    s.baseSeconds = baseMinutes * 60; s.budgetSeconds = totalMinutes * 60;
    if (s.running && s.usedSeconds >= s.budgetSeconds) this.requestOff();
    this.persist();
    return this.snapshot();
  }
  start() {
    this.settle();
    const s = this.state;
    if (s.shutdownPending || s.usedSeconds >= s.budgetSeconds) {
      throw Object.assign(new Error('No time available or monitor shutdown is pending'), { status: 409 });
    }
    if (!s.running) { s.running = true; s.startedAt = this.now(); s.shutdownStatus = 'idle'; }
    this.persist();
    return this.snapshot();
  }
  pause() {
    this.settle();
    this.state.running = false; this.state.startedAt = null;
    this.persist();
    return this.snapshot();
  }
  stop() {
    this.settle(); this.requestOff(); this.persist();
    return this.snapshot();
  }
  async tick() {
    this.settle();
    const s = this.state;
    if (s.shutdownPending && this.now() >= s.retryAt) {
      try {
        await this.off();
        s.shutdownPending = false; s.shutdownStatus = 'sent'; s.attempts = 0;
      } catch {
        s.shutdownStatus = 'failed'; s.attempts += 1;
        s.retryAt = this.now() + Math.min(60_000, 5_000 * 2 ** Math.min(s.attempts - 1, 4));
      }
      this.persist();
    }
    return this.snapshot();
  }
}
