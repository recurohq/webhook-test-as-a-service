import { NextRequest } from 'next/server';
import { checkAuth, authJson } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { BASE_URL, DEFAULT_RESPONSE_HEADERS, DEFAULT_RESPONSE_BODY, type CountRow } from '@/lib/constants';
import type { ForwardingRule } from '@/lib/types';

export const runtime = 'nodejs';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await checkAuth())) return authJson();
  const { id } = await params;
  const db = getDb();
  const endpoint = db.prepare('SELECT * FROM endpoints WHERE id = ?').get(id);
  if (!endpoint) return Response.json({ error: 'not found' }, { status: 404 });
  const counts = db.prepare("SELECT COUNT(*) as total, SUM(CASE WHEN received_at > datetime('now', '-1 day') THEN 1 ELSE 0 END) as today FROM requests WHERE endpoint_id = ?").get(id) as { total: number; today: number };
  const forwarding_rules = db.prepare('SELECT * FROM forwarding_rules WHERE endpoint_id = ? ORDER BY created_at').all(id) as ForwardingRule[];
  return Response.json({ endpoint, base_url: BASE_URL, total_requests: counts.total, today_requests: counts.today || 0, forwarding_rules });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await checkAuth())) return authJson();
  const { id } = await params;
  const body = await req.json();
  const db = getDb();
  db.prepare(`UPDATE endpoints SET name=?, description=?, response_code=?, response_headers=?, response_body=?, alert_email=?, alert_webhook=?, alert_timeout_minutes=?, updated_at=datetime('now') WHERE id=?`).run(
    body.name, body.description || '', body.response_code || 200,
    body.response_headers || DEFAULT_RESPONSE_HEADERS,
    body.response_body || DEFAULT_RESPONSE_BODY,
    body.alert_email || '', body.alert_webhook || '', body.alert_timeout_minutes || 0, id
  );
  const endpoint = db.prepare('SELECT * FROM endpoints WHERE id = ?').get(id);
  return Response.json({ endpoint });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await checkAuth())) return authJson();
  const { id } = await params;
  const db = getDb();
  db.prepare('DELETE FROM endpoints WHERE id = ?').run(id);
  return Response.json({ ok: true });
}
