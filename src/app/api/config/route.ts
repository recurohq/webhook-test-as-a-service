import { checkAuth, authJson } from '@/lib/auth';
import { BASE_URL } from '@/lib/constants';

export const runtime = 'nodejs';

export async function GET() {
  if (!(await checkAuth())) return authJson();
  return Response.json({ base_url: BASE_URL });
}
