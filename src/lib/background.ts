import { getDb } from './db';
import { BASE_URL } from './constants';

let deadmanInterval: ReturnType<typeof setInterval> | null = null;
let cleanupInterval: ReturnType<typeof setInterval> | null = null;

export function startDeadmanLoop() {
  if (deadmanInterval) return;
  deadmanInterval = setInterval(() => {
    try { checkDeadman(); } catch (e) { console.error('Deadman check error:', e); }
  }, 60_000);
}

export function startCleanupLoop() {
  if (cleanupInterval) return;
  cleanupInterval = setInterval(() => {
    try { cleanupOldRequests(); } catch (e) { console.error('Cleanup error:', e); }
  }, 3600_000);
}

interface DeadmanEndpoint {
  id: string;
  name: string;
  last_request_at: string;
  alert_timeout_minutes: number;
  alert_webhook: string;
}

function checkDeadman() {
  const db = getDb();
  const endpoints = db.prepare(
    'SELECT id, name, last_request_at, alert_timeout_minutes, alert_webhook FROM endpoints WHERE alert_timeout_minutes > 0 AND enabled = 1 AND alert_fired = 0 AND last_request_at IS NOT NULL'
  ).all() as DeadmanEndpoint[];
  const now = Date.now();
  const toFire: string[] = [];

  for (const ep of endpoints) {
    const lastReq = new Date(ep.last_request_at).getTime();
    if (now - lastReq <= ep.alert_timeout_minutes * 60_000) continue;

    console.log(`Deadman alert: ${ep.name} (${ep.id}) silent for ${ep.alert_timeout_minutes}m`);
    toFire.push(ep.id);

    if (ep.alert_webhook) {
      fetch(ep.alert_webhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'endpoint.silent',
          endpoint: { id: ep.id, name: ep.name, url: `${BASE_URL}/w/${ep.id}/` },
          last_request_at: ep.last_request_at,
          timeout_minutes: ep.alert_timeout_minutes,
        }),
      }).catch(e => console.error('Deadman webhook error:', e));
    }
  }

  if (toFire.length > 0) {
    const placeholders = toFire.map(() => '?').join(',');
    db.prepare(`UPDATE endpoints SET alert_fired = 1 WHERE id IN (${placeholders})`).run(...toFire);
  }
}

function cleanupOldRequests() {
  const days = parseInt(process.env.RETENTION_DAYS || '30', 10);
  const db = getDb();
  const result = db.prepare("DELETE FROM requests WHERE received_at < datetime('now', '-' || ? || ' days')").run(days);
  if (result.changes > 0) {
    console.log(`Cleaned up ${result.changes} old requests`);
  }
}
