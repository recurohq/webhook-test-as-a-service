import { NextRequest } from 'next/server';
import { checkAuth, authJson } from '@/lib/auth';
import { getDb } from '@/lib/db';

export const runtime = 'nodejs';

export async function GET() {
  if (!(await checkAuth())) return authJson();
  const db = getDb();
  const rows = db.prepare('SELECT key, value FROM settings').all() as { key: string; value: string }[];
  const settings: Record<string, string> = {};
  for (const row of rows) settings[row.key] = row.value;
  return Response.json({ settings });
}

export async function PUT(req: NextRequest) {
  if (!(await checkAuth())) return authJson();
  const body = await req.json();
  const db = getDb();
  const stmt = db.prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value');
  for (const [key, value] of Object.entries(body)) {
    stmt.run(key, value as string);
  }
  return Response.json({ ok: true });
}
