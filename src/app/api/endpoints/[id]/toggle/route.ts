import { NextRequest } from 'next/server';
import { checkAuth, authJson } from '@/lib/auth';
import { getDb } from '@/lib/db';

export const runtime = 'nodejs';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await checkAuth())) return authJson();
  const { id } = await params;
  const { enabled } = await req.json();
  const db = getDb();
  db.prepare("UPDATE endpoints SET enabled = ?, updated_at = datetime('now') WHERE id = ?").run(enabled ? 1 : 0, id);
  return Response.json({ ok: true });
}
