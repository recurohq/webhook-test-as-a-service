import { getDb } from './db';
import { newId } from './ulid';
import type { WebhookRequest, ForwardingRule } from './types';

function parseForwardHeaders(req: WebhookRequest, extra?: Record<string, string>): Record<string, string> {
  let headers: Record<string, string> = {};
  try { headers = JSON.parse(req.headers); } catch {}
  delete headers['Host'];
  delete headers['host'];
  if (extra) Object.assign(headers, extra);
  return headers;
}

function forwardBody(method: string, body: string): string | undefined {
  return ['GET', 'HEAD'].includes(method) ? undefined : body || undefined;
}

export function forwardAsync(req: WebhookRequest) {
  setImmediate(() => {
    const db = getDb();
    const rules = db.prepare('SELECT id, endpoint_id, target_url FROM forwarding_rules WHERE endpoint_id = ? AND enabled = 1').all(req.endpoint_id) as ForwardingRule[];
    for (const rule of rules) {
      forwardOne(req, rule).catch((e) => console.error('Forward error:', e));
    }
  });
}

async function forwardOne(req: WebhookRequest, rule: ForwardingRule) {
  const start = Date.now();
  let statusCode = 0;
  let error = '';

  try {
    const resp = await fetch(rule.target_url, {
      method: req.method,
      headers: parseForwardHeaders(req, { 'X-Forwarded-For': req.source_ip }),
      body: forwardBody(req.method, req.body),
    });
    statusCode = resp.status;
  } catch (err: unknown) {
    error = err instanceof Error ? err.message : 'unknown error';
  }

  const latencyMs = Date.now() - start;
  getDb().prepare('INSERT INTO forwarding_logs (id, request_id, rule_id, target_url, status_code, latency_ms, error) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
    newId(), req.id, rule.id, rule.target_url, statusCode, latencyMs, error
  );
}

export async function replay(req: WebhookRequest, targetUrl: string) {
  const start = Date.now();
  try {
    const resp = await fetch(targetUrl, {
      method: req.method,
      headers: parseForwardHeaders(req),
      body: forwardBody(req.method, req.body),
    });
    const body = await resp.text();
    const respHeaders: Record<string, string> = {};
    resp.headers.forEach((v, k) => { respHeaders[k] = v; });
    return { status_code: resp.status, headers: respHeaders, body, latency_ms: Date.now() - start };
  } catch (err: unknown) {
    return { status_code: 0, headers: {}, body: '', latency_ms: Date.now() - start, error: err instanceof Error ? err.message : 'unknown error' };
  }
}
