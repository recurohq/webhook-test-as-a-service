export interface Endpoint {
  id: string;
  name: string;
  description: string;
  response_code: number;
  response_headers: string;
  response_body: string;
  enabled: number;
  alert_email: string;
  alert_webhook: string;
  alert_timeout_minutes: number;
  alert_fired: number;
  last_request_at: string | null;
  created_at: string;
  updated_at: string;
  request_count_24h?: number;
}

export interface WebhookRequest {
  id: string;
  endpoint_id: string;
  method: string;
  path: string;
  query_string: string;
  headers: string;
  body: string;
  content_type: string;
  source_ip: string;
  size_bytes: number;
  received_at: string;
}

export interface ForwardingRule {
  id: string;
  endpoint_id: string;
  target_url: string;
  enabled: number;
  created_at: string;
}

export interface ForwardingLog {
  id: string;
  request_id: string;
  rule_id: string;
  target_url: string;
  status_code: number;
  latency_ms: number;
  error: string;
  created_at: string;
}
