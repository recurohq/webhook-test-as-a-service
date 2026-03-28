import { NextRequest } from 'next/server';
import { getDb } from '@/lib/db';
import { newId } from '@/lib/ulid';
import { forwardAsync } from '@/lib/forwarder';
import { MAX_BODY_BYTES } from '@/lib/constants';
import type { WebhookRequest } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function handleWebhook(req: NextRequest, { params }: { params: Promise<{ id: string; path?: string[] }> }) {
  const { id, path: pathParts } = await params;
  const subPath = pathParts?.join('/') || '';

  const db = getDb();
  const endpoint = db.prepare('SELECT enabled, response_code, response_headers, response_body FROM endpoints WHERE id = ?').get(id) as { enabled: number; response_code: number; response_headers: string; response_body: string } | undefined;
  if (!endpoint) return Response.json({ error: 'endpoint not found' }, { status: 404 });
  if (!endpoint.enabled) return Response.json({ error: 'endpoint disabled' }, { status: 410 });

  let bodyText = '';
  try { bodyText = await req.text(); } catch {}
  if (bodyText.length > MAX_BODY_BYTES) bodyText = bodyText.slice(0, MAX_BODY_BYTES);

  const headers: Record<string, string> = {};
  req.headers.forEach((v, k) => { headers[k] = v; });

  const reqId = newId();
  const now = new Date().toISOString();
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || '0.0.0.0';
  const qs = req.nextUrl.search.replace(/^\?/, '');

  const webhookReq: WebhookRequest = {
    id: reqId, endpoint_id: id, method: req.method, path: subPath,
    query_string: qs, headers: JSON.stringify(headers), body: bodyText,
    content_type: req.headers.get('content-type') || '', source_ip: ip,
    size_bytes: bodyText.length, received_at: now,
  };

  const insertAndUpdate = db.transaction(() => {
    db.prepare('INSERT INTO requests (id, endpoint_id, method, path, query_string, headers, body, content_type, source_ip, size_bytes, received_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').run(
      webhookReq.id, webhookReq.endpoint_id, webhookReq.method, webhookReq.path, webhookReq.query_string,
      webhookReq.headers, webhookReq.body, webhookReq.content_type, webhookReq.source_ip, webhookReq.size_bytes, webhookReq.received_at
    );
    db.prepare("UPDATE endpoints SET last_request_at = ?, alert_fired = CASE WHEN alert_fired = 1 THEN 0 ELSE alert_fired END, updated_at = datetime('now') WHERE id = ?").run(now, id);
  });
  insertAndUpdate();

  forwardAsync(webhookReq);

  let respHeaders: Record<string, string> = {};
  try { respHeaders = JSON.parse(endpoint.response_headers); } catch {}
  return new Response(endpoint.response_body, { status: endpoint.response_code, headers: respHeaders });
}

export const GET = handleWebhook;
export const POST = handleWebhook;
export const PUT = handleWebhook;
export const PATCH = handleWebhook;
export const DELETE = handleWebhook;
export const HEAD = handleWebhook;
export const OPTIONS = handleWebhook;
