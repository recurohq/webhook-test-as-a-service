import { NextRequest } from 'next/server';
import { checkAuth, authJson } from '@/lib/auth';
import { getDb } from '@/lib/db';

export const runtime = 'nodejs';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string; reqId: string }> }) {
  if (!(await checkAuth())) return authJson();
  const { reqId } = await params;
  const db = getDb();
  const request = db.prepare('SELECT * FROM requests WHERE id = ?').get(reqId);
  if (!request) return Response.json({ error: 'not found' }, { status: 404 });
  const forwarding_logs = db.prepare('SELECT * FROM forwarding_logs WHERE request_id = ? ORDER BY created_at').all(reqId);
  return Response.json({ request, forwarding_logs });
}
