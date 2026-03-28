import { NextRequest } from 'next/server';
import { checkAuth, authJson } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { newId } from '@/lib/ulid';
import { DEFAULT_RESPONSE_HEADERS, DEFAULT_RESPONSE_BODY } from '@/lib/constants';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  if (!(await checkAuth())) return authJson();
  const data = await req.json();
  if (!Array.isArray(data)) return Response.json({ error: 'expected array' }, { status: 400 });
  const db = getDb();
  const importAll = db.transaction((endpoints: any[]) => {
    let imported = 0;
    const now = new Date().toISOString();
    for (const ep of endpoints) {
      db.prepare(`INSERT INTO endpoints (id, name, description, response_code, response_headers, response_body, enabled, alert_email, alert_webhook, alert_timeout_minutes, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?)`).run(
        newId(), ep.name || 'Imported', ep.description || '', ep.response_code || 200,
        ep.response_headers || DEFAULT_RESPONSE_HEADERS, ep.response_body || DEFAULT_RESPONSE_BODY,
        ep.alert_email || '', ep.alert_webhook || '', ep.alert_timeout_minutes || 0, now, now
      );
      imported++;
    }
    return imported;
  });
  const imported = importAll(data);
  return Response.json({ ok: true, imported });
}
