import { NextRequest } from 'next/server';
import { checkAuth, authJson } from '@/lib/auth';
import { getDb } from '@/lib/db';
import type { CountRow } from '@/lib/constants';

export const runtime = 'nodejs';

const LIST_COLUMNS = 'id, endpoint_id, method, path, content_type, source_ip, size_bytes, received_at';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await checkAuth())) return authJson();
  const { id } = await params;
  const url = req.nextUrl;
  const limit = parseInt(url.searchParams.get('limit') || '50', 10);
  const offset = parseInt(url.searchParams.get('offset') || '0', 10);
  const method = url.searchParams.get('method') || '';
  const search = url.searchParams.get('search') || '';

  const db = getDb();
  let where = 'WHERE endpoint_id = ?';
  const args: (string | number)[] = [id];
  if (method) { where += ' AND method = ?'; args.push(method); }
  if (search) { where += ' AND (body LIKE ? OR headers LIKE ? OR path LIKE ?)'; const s = `%${search}%`; args.push(s, s, s); }

  const total = (db.prepare(`SELECT COUNT(*) as c FROM requests ${where}`).get(...args) as CountRow).c;
  const requests = db.prepare(`SELECT ${LIST_COLUMNS} FROM requests ${where} ORDER BY received_at DESC LIMIT ? OFFSET ?`).all(...args, limit, offset);
  return Response.json({ requests, total });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await checkAuth())) return authJson();
  const { id } = await params;
  const db = getDb();
  db.prepare('DELETE FROM requests WHERE endpoint_id = ?').run(id);
  return Response.json({ ok: true });
}
