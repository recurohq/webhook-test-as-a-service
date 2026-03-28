import { NextRequest } from 'next/server';
import { setSession } from '@/lib/auth';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const { password } = await req.json();
  const expected = process.env.PASSWORD || '';
  if (!expected || password !== expected) {
    return Response.json({ error: 'invalid password' }, { status: 401 });
  }
  const days = parseInt(process.env.SESSION_DAYS || '7', 10);
  await setSession(expected, days);
  return Response.json({ ok: true });
}
