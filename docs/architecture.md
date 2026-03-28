# Architecture Overview

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Framework | [Next.js 15](https://nextjs.org/) (App Router) | Fullstack — server-side API routes + React frontend |
| Language | TypeScript | Shared types across frontend and backend |
| Database | SQLite via [better-sqlite3](https://github.com/WiseLibs/better-sqlite3) | Persistent storage, zero-config, single file |
| Styling | [Tailwind CSS](https://tailwindcss.com/) | Utility-first CSS |
| Deployment | Docker + Docker Compose | Single-command deployment |

## Project Structure

```
src/
  app/
    layout.tsx                          Root layout (server component)
    globals.css                         Global styles + Tailwind
    login/page.tsx                      Login page

    (dashboard)/                        Auth-guarded dashboard routes
      layout.tsx                        Dashboard layout (nav, theme toggle, auth guard)
      page.tsx                          Endpoints list (home)
      endpoints/new/page.tsx            Create endpoint form
      endpoints/[id]/page.tsx           Endpoint detail + request inspector
      endpoints/[id]/edit/page.tsx      Edit endpoint form
      settings/page.tsx                 Settings (SMTP, retention, etc.)
      docs/page.tsx                     In-app API documentation

    api/                                API route handlers (Next.js Route Handlers)
      login/route.ts                    POST — password auth
      logout/route.ts                   POST — clear session
      me/route.ts                       GET — session check
      config/route.ts                   GET — base URL and app config
      settings/route.ts                 GET, PUT — app settings
      endpoints/route.ts               GET list, POST create
      endpoints/[id]/route.ts          GET, PUT, DELETE
      endpoints/[id]/toggle/route.ts   POST — enable/disable
      endpoints/[id]/requests/route.ts GET list, DELETE clear
      endpoints/[id]/requests/export/  GET — export as JSON
      endpoints/[id]/requests/[reqId]/ GET, DELETE single request
      endpoints/[id]/requests/[reqId]/replay/ POST — replay to URL
      endpoints/[id]/forwarding-rules/ GET, POST
      endpoints/[id]/forwarding-rules/[ruleId]/ DELETE
      endpoints/bulk/route.ts          POST — bulk enable/disable/delete
      endpoints/export/route.ts        GET — export all endpoints
      endpoints/import/route.ts        POST — import endpoints

    w/[id]/[[...path]]/route.ts        Webhook receiver (public, no auth)

  lib/
    db.ts               SQLite singleton + schema migrations + all queries
    auth.ts             HMAC cookie-based session auth
    background.ts       Background tasks (deadman's switch checker, retention cleanup)
    forwarder.ts        Async request forwarding to target URLs
    types.ts            Shared TypeScript types (Endpoint, WebhookRequest, etc.)
    api.ts              Client-side fetch wrapper
    format.ts           Date/time/byte formatting + curl generation
    ulid.ts             ULID generator for IDs
    constants.ts        App constants

  components/
    CopyButton.tsx      Clipboard copy with icon + feedback

  hooks/
    usePolling.ts       Auto-refresh polling hook
    useTheme.ts         Dark/light mode toggle (localStorage)

  instrumentation.ts    Next.js instrumentation — starts background tasks on boot
```

## Request Lifecycle

### Incoming webhook (public)

```
External service sends POST /w/{endpoint_id}/stripe/webhook
        │
        ▼
  Route handler: src/app/w/[id]/[[...path]]/route.ts
        │
        ├─ Look up endpoint in SQLite
        │   └─ If disabled or not found → return 410 Gone / 404
        │
        ├─ Capture request: method, path, headers, body, query, IP, timestamp
        │   └─ Store in requests table (body truncated to MAX_BODY_KB)
        │
        ├─ Update endpoint.last_request_at
        │
        ├─ If forwarding rules exist → async forward to each target URL
        │   └─ forwarder.ts: re-sends method, headers, body to target
        │
        └─ Return configured response (status code, headers, body)
```

No auth on this path. The endpoint URL is the credential — anyone with it can send requests.

### Dashboard API request

```
Browser → GET /api/endpoints/{id}/requests
        │
        ├─ Auth middleware checks HMAC session cookie
        │   └─ Invalid → 401 → frontend redirects to /login
        │
        ├─ Route handler queries SQLite
        │
        └─ Returns JSON
```

### Replay

```
User clicks "Replay" → POST /api/endpoints/{id}/requests/{reqId}/replay
        │
        ├─ Auth check
        ├─ Load original request from DB
        ├─ Send it to user-specified target URL (same method, headers, body)
        └─ Return response status + latency to the browser
```

## Authentication

Single-password auth. No users, no roles, no registration.

```
POST /api/login (password in body)
  → Compare against PASSWORD env var
  → Success: set HTTP-only cookie (HMAC-signed, expires in SESSION_DAYS)
  → Failure: 401

All /api/* routes (except /api/login):
  → Validate cookie signature
  → Invalid/missing → 401

All /w/* routes:
  → No auth check. Public by design.
```

The cookie is signed with HMAC-SHA256 using the `PASSWORD` value as the key. No JWT, no external auth provider.

## Data Model

Four tables in SQLite:

**endpoints** — each one is a unique receiving URL

| Column | Type | Notes |
|---|---|---|
| id | TEXT (ULID) | Primary key, used in the URL path |
| name | TEXT | Human-readable label |
| description | TEXT | Optional |
| response_code | INTEGER | What to return to senders (default 200) |
| response_headers | TEXT (JSON) | Response headers |
| response_body | TEXT | Response body |
| enabled | BOOLEAN | Disabled → returns 410 |
| alert_email | TEXT | For deadman's switch |
| alert_webhook | TEXT | For deadman's switch |
| alert_timeout_minutes | INTEGER | 0 = disabled |
| last_request_at | DATETIME | Updated on each incoming request |
| created_at | DATETIME | |
| updated_at | DATETIME | |

**requests** — every captured webhook

| Column | Type | Notes |
|---|---|---|
| id | TEXT (ULID) | Primary key |
| endpoint_id | TEXT | FK → endpoints (CASCADE delete) |
| method | TEXT | GET, POST, PUT, etc. |
| path | TEXT | Sub-path after endpoint ID |
| query_string | TEXT | Raw query string |
| headers | TEXT (JSON) | All request headers |
| body | TEXT | Truncated to MAX_BODY_KB |
| content_type | TEXT | Extracted for filtering |
| source_ip | TEXT | |
| size_bytes | INTEGER | |
| received_at | DATETIME | |

Indexed on `(endpoint_id, received_at DESC)`.

**forwarding_rules** — where to relay requests

| Column | Type | Notes |
|---|---|---|
| id | TEXT (ULID) | Primary key |
| endpoint_id | TEXT | FK → endpoints |
| target_url | TEXT | Destination |
| enabled | BOOLEAN | |
| created_at | DATETIME | |

**settings** — key-value store for app config

| Column | Type |
|---|---|
| key | TEXT (PK) |
| value | TEXT |

## Background Tasks

Started via `instrumentation.ts` when the Next.js server boots:

1. **Deadman's switch checker** — runs periodically, checks each endpoint with `alert_timeout_minutes > 0`. If `last_request_at` is older than the timeout, sends an alert (email and/or webhook). Fires once per silence period, resets on next incoming request.

2. **Retention cleanup** — deletes requests older than `RETENTION_DAYS`.

## Frontend

All dashboard pages are client components (`"use client"`) that call the API via `src/lib/api.ts`. No server components with data fetching — the dashboard is effectively an SPA with Next.js routing.

- **Polling:** `usePolling` hook refreshes data on an interval (5s for request inspector, 30s for endpoints list)
- **Theme:** `useTheme` hook manages dark/light mode via `localStorage` and a `.dark` class on `<html>`
- **No external component library** — plain HTML + Tailwind utility classes

In production, Next.js compiles to a standalone Node.js server (`next build` with `output: 'standalone'`). The Docker image runs `node server.js` directly.
