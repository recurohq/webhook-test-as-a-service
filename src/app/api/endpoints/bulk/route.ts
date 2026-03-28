import { NextRequest } from 'next/server';
import { checkAuth, authJson } from '@/lib/auth';
import { getDb } from '@/lib/db';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  if (!(await checkAuth())) return authJson();
  const { ids, action } = await req.json();
  if (!['enable', 'disable', 'delete'].includes(action)) {
    return Response.json({ error: 'invalid action' }, { status: 400 });
  }
  const db = getDb();
  const run = db.transaction((ids: string[]) => {
    for (const id of ids) {
      if (action === 'enable') db.prepare("UPDATE endpoints SET enabled = 1, updated_at = datetime('now') WHERE id = ?").run(id);
      else if (action === 'disable') db.prepare("UPDATE endpoints SET enabled = 0, updated_at = datetime('now') WHERE id = ?").run(id);
      else if (action === 'delete') db.prepare('DELETE FROM endpoints WHERE id = ?').run(id);
    }
  });
  run(ids);
  return Response.json({ ok: true });
}
