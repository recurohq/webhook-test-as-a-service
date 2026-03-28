import { NextRequest } from 'next/server';
import { checkAuth, authJson } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { replay } from '@/lib/forwarder';
import type { WebhookRequest } from '@/lib/types';

export const runtime = 'nodejs';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string; reqId: string }> }) {
  if (!(await checkAuth())) return authJson();
  const { reqId } = await params;
  const { target_url } = await req.json();
  const db = getDb();
  const request = db.prepare('SELECT * FROM requests WHERE id = ?').get(reqId) as WebhookRequest | undefined;
  if (!request) return Response.json({ error: 'request not found' }, { status: 404 });
  const result = await replay(request, target_url);
  return Response.json({ result });
}
