import { checkAuth, authJson } from '@/lib/auth';
import { getDb } from '@/lib/db';

export const runtime = 'nodejs';

export async function GET() {
  if (!(await checkAuth())) return authJson();
  const db = getDb();
  const endpoints = db.prepare('SELECT name, description, response_code, response_headers, response_body, alert_email, alert_webhook, alert_timeout_minutes FROM endpoints ORDER BY created_at DESC').all();
  return new Response(JSON.stringify(endpoints, null, 2), {
    headers: { 'Content-Type': 'application/json', 'Content-Disposition': 'attachment; filename=endpoints.json' },
  });
}
