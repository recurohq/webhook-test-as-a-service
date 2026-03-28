import { NextRequest } from 'next/server';
import { checkAuth, authJson } from '@/lib/auth';
import { getDb } from '@/lib/db';

export const runtime = 'nodejs';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await checkAuth())) return authJson();
  const { id } = await params;
  const db = getDb();
  const requests = db.prepare('SELECT * FROM requests WHERE endpoint_id = ? ORDER BY received_at DESC LIMIT 10000').all(id);
  return new Response(JSON.stringify(requests, null, 2), {
    headers: { 'Content-Type': 'application/json', 'Content-Disposition': `attachment; filename=requests-${id}.json` },
  });
}
