import { checkAuth, authJson } from '@/lib/auth';

export const runtime = 'nodejs';

export async function GET() {
  if (!(await checkAuth())) return authJson();
  return Response.json({ ok: true });
}
