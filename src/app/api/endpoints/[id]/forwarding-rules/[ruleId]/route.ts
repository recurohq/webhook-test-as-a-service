import { NextRequest } from 'next/server';
import { checkAuth, authJson } from '@/lib/auth';
import { getDb } from '@/lib/db';

export const runtime = 'nodejs';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string; ruleId: string }> }) {
  if (!(await checkAuth())) return authJson();
  const { ruleId } = await params;
  const { target_url, enabled } = await req.json();
  const db = getDb();
  db.prepare('UPDATE forwarding_rules SET target_url = ?, enabled = ? WHERE id = ?').run(target_url, enabled ? 1 : 0, ruleId);
  return Response.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string; ruleId: string }> }) {
  if (!(await checkAuth())) return authJson();
  const { ruleId } = await params;
  const db = getDb();
  db.prepare('DELETE FROM forwarding_rules WHERE id = ?').run(ruleId);
  return Response.json({ ok: true });
}
