import { NextRequest } from 'next/server';
import { checkAuth, authJson } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { newId } from '@/lib/ulid';
import type { CountRow } from '@/lib/constants';

export const runtime = 'nodejs';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await checkAuth())) return authJson();
  const { id } = await params;
  const db = getDb();
  const rules = db.prepare('SELECT * FROM forwarding_rules WHERE endpoint_id = ? ORDER BY created_at').all(id);
  return Response.json({ rules });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await checkAuth())) return authJson();
  const { id } = await params;
  const { target_url } = await req.json();
  const db = getDb();
  const count = (db.prepare('SELECT COUNT(*) as c FROM forwarding_rules WHERE endpoint_id = ?').get(id) as CountRow).c;
  if (count >= 5) return Response.json({ error: 'maximum of 5 forwarding rules' }, { status: 400 });
  const ruleId = newId();
  db.prepare('INSERT INTO forwarding_rules (id, endpoint_id, target_url, enabled) VALUES (?, ?, ?, 1)').run(ruleId, id, target_url);
  const rule = db.prepare('SELECT * FROM forwarding_rules WHERE id = ?').get(ruleId);
  return Response.json({ rule }, { status: 201 });
}
