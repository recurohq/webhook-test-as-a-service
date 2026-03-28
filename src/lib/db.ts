import Database from 'better-sqlite3';

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!_db) {
    const dbPath = process.env.DB_PATH || '/data/webhook.db';
    _db = new Database(dbPath);
    _db.pragma('journal_mode = WAL');
    _db.pragma('busy_timeout = 5000');
    _db.pragma('foreign_keys = ON');
    migrate(_db);
  }
  return _db;
}

function migrate(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS endpoints (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      response_code INTEGER NOT NULL DEFAULT 200,
      response_headers TEXT NOT NULL DEFAULT '{"Content-Type":"application/json"}',
      response_body TEXT NOT NULL DEFAULT '{"ok":true}',
      enabled INTEGER NOT NULL DEFAULT 1,
      alert_email TEXT NOT NULL DEFAULT '',
      alert_webhook TEXT NOT NULL DEFAULT '',
      alert_timeout_minutes INTEGER NOT NULL DEFAULT 0,
      alert_fired INTEGER NOT NULL DEFAULT 0,
      last_request_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS requests (
      id TEXT PRIMARY KEY,
      endpoint_id TEXT NOT NULL REFERENCES endpoints(id) ON DELETE CASCADE,
      method TEXT NOT NULL,
      path TEXT NOT NULL DEFAULT '',
      query_string TEXT NOT NULL DEFAULT '',
      headers TEXT NOT NULL DEFAULT '{}',
      body TEXT NOT NULL DEFAULT '',
      content_type TEXT NOT NULL DEFAULT '',
      source_ip TEXT NOT NULL DEFAULT '',
      size_bytes INTEGER NOT NULL DEFAULT 0,
      received_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_requests_endpoint_received ON requests(endpoint_id, received_at DESC);
    CREATE TABLE IF NOT EXISTS forwarding_rules (
      id TEXT PRIMARY KEY,
      endpoint_id TEXT NOT NULL REFERENCES endpoints(id) ON DELETE CASCADE,
      target_url TEXT NOT NULL,
      enabled INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS forwarding_logs (
      id TEXT PRIMARY KEY,
      request_id TEXT NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
      rule_id TEXT NOT NULL,
      target_url TEXT NOT NULL,
      status_code INTEGER NOT NULL DEFAULT 0,
      latency_ms INTEGER NOT NULL DEFAULT 0,
      error TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_forwarding_logs_request ON forwarding_logs(request_id);
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL DEFAULT ''
    );
  `);
}
