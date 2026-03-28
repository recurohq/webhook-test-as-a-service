import { NextRequest } from 'next/server';
import { checkAuth, authJson } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { newId } from '@/lib/ulid';
import { BASE_URL, DEFAULT_RESPONSE_HEADERS, DEFAULT_RESPONSE_BODY } from '@/lib/constants';

export const runtime = 'nodejs';

export async function GET() {
  if (!(await checkAuth())) return authJson();
  const db = getDb();
  const endpoints = db.prepare(`
    SELECT e.*, COALESCE(r.cnt, 0) as request_count_24h
    FROM endpoints e
    LEFT JOIN (SELECT endpoint_id, COUNT(*) as cnt FROM requests WHERE received_at > datetime('now', '-1 day') GROUP BY endpoint_id) r
    ON e.id = r.endpoint_id
    ORDER BY e.created_at DESC
  `).all();
  return Response.json({ endpoints, base_url: BASE_URL });
}

export async function POST(req: NextRequest) {
  if (!(await checkAuth())) return authJson();
  const body = await req.json();
  if (!body.name) return Response.json({ error: 'name is required' }, { status: 400 });
  const db = getDb();
  const id = newId();
  const now = new Date().toISOString();
  db.prepare(`INSERT INTO endpoints (id, name, description, response_code, response_headers, response_body, enabled, alert_email, alert_webhook, alert_timeout_minutes, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?)`).run(
    id, body.name, body.description || '', body.response_code || 200,
    body.response_headers || DEFAULT_RESPONSE_HEADERS,
    body.response_body || DEFAULT_RESPONSE_BODY,
    body.alert_email || '', body.alert_webhook || '', body.alert_timeout_minutes || 0,
    now, now
  );
  const endpoint = db.prepare('SELECT * FROM endpoints WHERE id = ?').get(id);
  return Response.json({ endpoint, base_url: BASE_URL }, { status: 201 });
}
