# webhook-as-a-service — Product Requirements Document

> **Version:** 1.0  
> **Date:** March 2026  
> **Status:** Draft

---

A self-hosted webhook receiver, inspector, and forwarder with a web dashboard.  
`docker compose up -d` and you have a webhook URL.

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Problem Statement](#2-problem-statement)
3. [Target Users](#3-target-users)
4. [Competitive Analysis](#4-competitive-analysis)
5. [Product Architecture](#5-product-architecture)
6. [Feature Specifications](#6-feature-specifications)
7. [README & GitHub Repository Specification](#7-readme--github-repository-specification)
8. [SEO & Distribution Strategy](#8-seo--distribution-strategy)
9. [Success Metrics](#9-success-metrics)
10. [Roadmap](#10-roadmap)

---

## 1. Executive Summary

webhook-as-a-service is a free, open-source, self-hosted tool for receiving, inspecting, debugging, and forwarding webhooks. You get a unique URL, point any service at it, and see every incoming request in a clean web dashboard — headers, body, query params, timing, everything. You can also forward webhooks to other URLs, replay them, and get notified when they stop arriving.

Think webhook.site or RequestBin, but self-hosted, persistent, with forwarding and dark mode.

This is an open-source project under the `recurohq/` GitHub org. It serves as a developer tool that complements [Recuro](https://recurohq.com) (which *sends* scheduled HTTP calls) — this tool *receives* them.

### Strategic Goals

- **Capture "webhook tester self-hosted"** and **"webhook as a service"** on GitHub and Google within 6 months
- **500+ GitHub stars** within 3 months via r/selfhosted, HN, dev.to
- **Drive awareness of Recuro** — developers who receive webhooks also need to send them on schedules
- **Ship in 4–5 weeks**

### What We're NOT Building

- No API — dashboard only
- No auth system — single password via env var
- No PostgreSQL — SQLite only
- No real-time updates — auto-refresh polling (WebSocket is future)
- No multi-user — single operator
- No paid tier — free and open-source forever

---

## 2. Problem Statement

Developers regularly need to receive and inspect webhooks during development, testing, and debugging. Current options:

| Option | Problem |
|---|---|
| webhook.site | SaaS, ephemeral, 500 req limit on free tier, can't self-host the full version |
| RequestBin (Pipedream) | Original is dead, Pipedream version requires account, not self-hostable |
| tarampampam/webhook-tester | Good but in-memory only (no persistence), no forwarding, limited UI |
| webhook.site OSS version | Requires PHP + Laravel + Redis + Pusher/Echo — heavy setup |
| ngrok + terminal | No dashboard, no persistence, not a permanent endpoint |
| Console.log in your app | No structured view, mixed with app logs, no replay |

**Gap:** No simple, self-hosted webhook tool exists that persists requests to disk, has a clean dashboard with dark mode, supports forwarding and replay, and deploys with `docker compose up -d`.

---

## 3. Target Users

### Backend Developer (debugging integrations)

Building a Stripe/GitHub/Twilio integration. Needs to see exactly what payload arrives, inspect headers, test HMAC signatures. Currently juggling ngrok + terminal + console.log. Wants a persistent URL with a dashboard showing every incoming request.

### r/selfhosted Enthusiast

Wants a permanent webhook receiver running alongside other services. Uses it to bridge services (receive webhook from GitHub → forward to n8n/Huginn). Needs Docker Compose, clean UI, persistence.

### QA / DevOps Engineer

Testing webhook integrations across environments. Needs to replay requests, compare payloads between environments, verify headers are correct. Currently copying curl commands from logs.

---

## 4. Competitive Analysis

| Feature | webhook.site (SaaS) | webhook.site (OSS) | tarampampam/webhook-tester | **Ours (v1.0)** |
|---|---|---|---|---|
| Dashboard UI | ✅ | ✅ | ✅ | ✅ |
| Dark Mode | ❌ | ❌ | ❌ | ✅ |
| Persistent Storage | Ephemeral | Redis | ❌ In-memory | ✅ **SQLite** |
| Forward to URL | ✅ (paid) | ❌ | ❌ | ✅ |
| Replay Requests | ✅ (paid) | ❌ | ❌ | ✅ |
| Custom Response | ✅ | ✅ | ✅ | ✅ |
| Request Search/Filter | ✅ | ❌ | ❌ | ✅ |
| Export Requests | ❌ | ❌ | ❌ | ✅ **JSON** |
| No-arrival Alerts | ❌ | ❌ | ❌ | ✅ **Email + Webhook** |
| `docker compose up` | N/A | ❌ (complex) | ✅ | ✅ |
| Self-Hosted | ❌ | ⚠️ (heavy) | ✅ | ✅ |
| Open Source (MIT) | ❌ | MIT (limited) | MIT | ✅ |
| Dependencies | N/A | PHP+Redis+Pusher | Go (in-memory) | **Go + SQLite (zero deps)** |
| Price | Free (limited) | Free | Free | **Free forever** |

> *The only self-hosted webhook tool with persistence, forwarding, replay, search, dark mode, and alerting — in a single `docker compose up -d`.*

---

## 5. Product Architecture

### Tech Stack

| Component | Technology | Why |
|---|---|---|
| Server | **Go** (Fiber) | Single binary, fast, handles both webhook receiving and dashboard |
| Database | **SQLite** (via `modernc.org/sqlite`) | Zero config, persistent, pure Go |
| Dashboard | **React 18 + TypeScript + Tailwind CSS** | Same stack as cron-as-a-service, shared component knowledge |
| Notifications | Email (SMTP) + generic webhook | Alert when webhooks stop arriving |
| Deployment | **Docker Compose** | One file, one command |

### How It Works

```
External service sends webhook
        ↓
Hits unique endpoint: POST http://yourserver:8080/w/{endpoint-id}/anything
        ↓
Go server captures: method, URL, headers, query params, body, source IP, timestamp
        ↓
Stored in SQLite
        ↓
If forwarding rules exist → replay request to target URL(s)
        ↓
Dashboard shows request on next poll / page load
        ↓
If no requests arrive within expected window → alert sent
```

### Core Concept: Endpoints

An **endpoint** is a unique receiving URL. Each endpoint:

- Has a unique ID (ULID) and a human-readable name
- Receives any HTTP method (GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS)
- Captures everything about every incoming request
- Has its own configurable response (status code, headers, body)
- Can have forwarding rules (send captured requests to other URLs)
- Can have a "deadman's switch" alert (notify if no request arrives within N minutes)

Users create endpoints via the dashboard. Each endpoint generates a URL like:
```
https://yourserver:8080/w/01HXY.../
```

Anything after the endpoint ID is captured as the sub-path, so services can send to:
```
https://yourserver:8080/w/01HXY.../stripe/webhook
https://yourserver:8080/w/01HXY.../github/push
```

### Deployment Model

```yaml
# docker-compose.yml
services:
  webhooks:
    build: .
    ports:
      - "8080:8080"
    volumes:
      - webhook-data:/data
    environment:
      - PASSWORD=changeme
      - TZ=UTC
      - BASE_URL=http://localhost:8080   # used for displaying endpoint URLs
      - SMTP_HOST=
      - SMTP_PORT=587
      - SMTP_USER=
      - SMTP_PASS=
      - SMTP_FROM=
    restart: unless-stopped

volumes:
  webhook-data:
```

User workflow:

1. `git clone https://github.com/recurohq/webhook-as-a-service.git`
2. `cp .env.example .env` and set `PASSWORD`
3. `docker compose up -d`
4. Open `http://localhost:8080`, create an endpoint, start receiving webhooks

### Database Schema

Four tables.

**endpoints**

| Column | Type | Notes |
|---|---|---|
| id | TEXT (ULID) | Primary key, used in URL path |
| name | TEXT | Human-readable label (e.g., "Stripe Staging") |
| description | TEXT | Optional notes |
| response_code | INTEGER | HTTP status to return to sender, default 200 |
| response_headers | TEXT (JSON) | Headers to return, default `{"Content-Type": "application/json"}` |
| response_body | TEXT | Body to return, default `{"ok": true}` |
| enabled | BOOLEAN | If false, returns 410 Gone to senders |
| alert_email | TEXT | Email for deadman alerts (optional) |
| alert_webhook | TEXT | Webhook URL for deadman alerts (optional) |
| alert_timeout_minutes | INTEGER | Alert if no request within N minutes, 0 = disabled |
| last_request_at | DATETIME | Updated on each incoming request |
| created_at | DATETIME | |
| updated_at | DATETIME | |

**requests**

| Column | Type | Notes |
|---|---|---|
| id | TEXT (ULID) | Primary key |
| endpoint_id | TEXT | Foreign key → endpoints (CASCADE delete) |
| method | TEXT | GET, POST, PUT, etc. |
| path | TEXT | Sub-path after endpoint ID |
| query_string | TEXT | Raw query string |
| headers | TEXT (JSON) | All request headers |
| body | TEXT | Request body (first 100KB) |
| content_type | TEXT | Extracted from headers for quick filtering |
| source_ip | TEXT | Client IP address |
| size_bytes | INTEGER | Body size |
| received_at | DATETIME | |

Index: `CREATE INDEX idx_requests_endpoint_received ON requests(endpoint_id, received_at DESC)`

**forwarding_rules**

| Column | Type | Notes |
|---|---|---|
| id | TEXT (ULID) | Primary key |
| endpoint_id | TEXT | Foreign key → endpoints |
| target_url | TEXT | Where to forward |
| enabled | BOOLEAN | Default true |
| created_at | DATETIME | |

**settings**

| Column | Type | Notes |
|---|---|---|
| key | TEXT | Primary key |
| value | TEXT | Stored value |

---

## 6. Feature Specifications

### F1: Login Screen

**Priority:** P0

Identical pattern to cron-as-a-service:

- Single password field + "Log in" button
- Checked against `PASSWORD` env var
- Signed HTTP-only cookie, 7-day expiry (`SESSION_DAYS` env)
- All dashboard routes require valid cookie
- If `PASSWORD` not set: show warning page
- Theme toggle visible on login page

**Important:** The webhook receiving endpoints (`/w/{id}/...`) do NOT require authentication. They must be publicly accessible so external services can send webhooks to them. Only the dashboard is password-protected.

---

### F2: Endpoints List (Home Page)

**Priority:** P0

| Element | Behavior |
|---|---|
| Endpoints table | Columns: name, endpoint URL (truncated, with copy button), request count (last 24h), last request (relative time), status dot (green = received recently, yellow = enabled but quiet, gray = disabled), enabled toggle |
| "New Endpoint" button | Top right, opens create form |
| Search | Client-side filter by name |
| Bulk actions | Select → enable / disable / delete |
| Empty state | "Create your first webhook endpoint" + quick explanation |
| Auto-refresh | 30-second polling |
| Theme toggle | Top bar |

---

### F3: Create / Edit Endpoint

**Priority:** P0

| Field | Input Type | Validation |
|---|---|---|
| Name | Text input | Required, max 100 chars (e.g., "Stripe Production") |
| Description | Textarea | Optional, max 500 chars |
| Response Status Code | Number input | 100–599, default 200 |
| Response Headers | Key-value editor | Default: Content-Type: application/json |
| Response Body | Monospace textarea | Default: `{"ok": true}` |
| Alert email | Text input | Optional, valid email |
| Alert webhook | Text input | Optional, valid URL |
| Alert timeout | Number input | Minutes, 0 = disabled, default 0 |

On create: show the generated endpoint URL prominently with a copy button and a "Test it" curl command:

```
Your endpoint URL:
https://yourserver:8080/w/01HXY.../

Test it:
curl -X POST https://yourserver:8080/w/01HXY.../ -d '{"hello":"world"}'
```

---

### F4: Endpoint Detail Page (Request Inspector)

**Priority:** P0

This is the core page — where developers spend most of their time.

**Top section — Endpoint summary:**
- Name, full URL (with copy button), description
- Stats: total requests, requests today, last request time
- Quick actions: Edit, Copy URL, Disable, Delete
- Forwarding rules list (if any) with add/remove

**Main section — Request list (left panel) + detail (right panel):**

Split-pane layout (or stacked on mobile):

**Left panel — Request list:**
- Most recent first
- Each row: method badge (colored: GET=green, POST=blue, PUT=orange, DELETE=red), sub-path (if any), content-type, size, timestamp (relative)
- Click to select → shows detail in right panel
- Filter by: method (dropdown), content-type, date range, text search (searches body + headers)
- "Clear all" button (with confirmation)

**Right panel — Request detail:**
- **Summary tab:** Method, full URL (with sub-path), source IP, timestamp, size
- **Headers tab:** Key-value table of all request headers, formatted and syntax-highlighted
- **Body tab:** Raw body with syntax highlighting (auto-detect JSON, XML, form-urlencoded). JSON is pretty-printed. Large bodies are truncated at 100KB with a note.
- **Query tab:** Parsed query parameters as key-value table
- **Actions:**
  - **Copy as curl** — generates a curl command that reproduces this exact request
  - **Replay** — re-send this request to a URL you specify (opens a small modal with URL input + "Send" button, shows the forwarded response)
  - **Export as JSON** — download this single request as a JSON file

---

### F5: Forwarding Rules

**Priority:** P0

Each endpoint can have 1–5 forwarding rules. When a request arrives:

1. Capture and store the request
2. Return the configured response to the sender
3. Asynchronously forward the request to each enabled forwarding target

Forwarding means: send the same method, headers, and body to the target URL. The `Host` header is rewritten to the target. A `X-Forwarded-For` header is added with the original sender's IP.

Forwarding failures are logged but don't affect the original response. Each forwarding attempt records: target URL, status code, latency, error (if any). Visible on the request detail page under a "Forwarding" tab.

No retries on forwarding failures in v1.0 (keep it simple).

---

### F6: Replay

**Priority:** P0

From any captured request, the user can replay it:

1. Click "Replay" on a request
2. Modal appears with: pre-filled target URL (defaults to endpoint's first forwarding rule, or blank), the request details (method, headers, body) shown as read-only
3. User can edit the target URL
4. Click "Send" → backend fires the request → shows response: status code, headers, body, latency
5. Replay result is NOT stored in the main request list (it's a one-off debug action, shown only in the modal)

---

### F7: Deadman's Switch Alerts

**Priority:** P1

For endpoints where you *expect* regular webhooks (e.g., a health check that fires every 5 minutes), the deadman's switch alerts you when webhooks *stop* arriving.

- Configured per endpoint: `alert_timeout_minutes` (e.g., 15 means "alert me if no request arrives for 15 minutes")
- Background goroutine checks every minute: for each endpoint with timeout > 0, compare `last_request_at` to now
- If gap exceeds timeout: send alert (email and/or webhook), set a "alerted" flag so you don't spam
- When a new request arrives on an alerted endpoint: send recovery notification, clear alerted flag

**Email alert:**
- Subject: `[webhook-as-a-service] No requests on "{name}" for {N} minutes`
- Body: endpoint name, URL, expected interval, last request timestamp

**Webhook alert:**
```json
{
  "event": "endpoint.silent",
  "endpoint": {
    "id": "01HXY...",
    "name": "Stripe Production",
    "url": "https://yourserver:8080/w/01HXY.../"
  },
  "last_request_at": "2026-03-20T14:30:00Z",
  "timeout_minutes": 15
}
```

---

### F8: Import / Export

**Priority:** P0

#### Export

- **Export all requests** for an endpoint as JSON (button on endpoint detail page)
- JSON array of request objects (method, path, headers, body, query, timestamp, source IP)
- **Export all endpoints** as JSON (button on endpoints list) — endpoint configs without requests, for backup/migration

#### Import

- **Import endpoints** from JSON — same format as export, creates new endpoints with same config
- No request import (requests are runtime data, not config)

---

### F9: Dark Mode

**Priority:** P0

Same implementation as cron-as-a-service:
- Toggle in top bar, visible on all pages
- System preference on first visit, `localStorage` override
- CSS custom properties, `dark` class on `<html>`

---

### F10: Settings Page

**Priority:** P1

| Setting | Description | Default |
|---|---|---|
| Default notification email | Fallback for deadman alerts | (empty) |
| Default notification webhook | Fallback for deadman alerts | (empty) |
| SMTP Host | SMTP server | From `SMTP_HOST` env |
| SMTP Port | Port | From `SMTP_PORT` env or 587 |
| SMTP User | Username | From `SMTP_USER` env |
| SMTP Password | Masked | From `SMTP_PASS` env |
| SMTP From | Sender | From `SMTP_FROM` env |
| Base URL | Public URL of this instance | From `BASE_URL` env |
| Retention days | Days to keep requests | 30 |
| Max body size | Max request body to capture (KB) | 100 |

---

## 7. README & GitHub Repository Specification

### README Structure

**1. Hero Section**
- Logo
- Tagline: **"A self-hosted webhook-as-a-service — receive, inspect, debug, and forward webhooks. `docker compose up -d` and you have a URL."**
- Badges: stars, license (MIT), build, release
- Dashboard screenshot (dark mode, split-pane request inspector view)

**2. Why This Exists**
- "webhook.site has a 500-request limit and you can't self-host the full version. RequestBin is dead. Other self-hosted options lose your data on restart or require PHP + Redis + Pusher. This gives you a persistent webhook inspector with forwarding and replay — one `docker compose up -d`, zero dependencies."

**3. Features**
- 🔗 **Unique Endpoint URLs** — create unlimited webhook receiving URLs
- 🔍 **Request Inspector** — see method, headers, body, query params, IP, and timing for every request
- 🌙 **Dark Mode** — beautiful light and dark themes
- ↗️ **Forward Webhooks** — relay incoming requests to other URLs automatically
- 🔄 **Replay Requests** — re-send any captured request to a URL of your choice
- 🎯 **Custom Responses** — configure status code, headers, and body per endpoint
- 🔔 **Deadman's Switch** — get alerted when expected webhooks stop arriving
- 📦 **Import / Export** — bulk export requests and endpoint configs as JSON
- 🔎 **Search & Filter** — find requests by method, content type, body content, or date
- 📋 **Copy as curl** — one click to reproduce any captured request
- 🐳 **Docker Compose** — `docker compose up -d` and you're running
- 💾 **SQLite** — persistent storage, survives restarts, zero config
- 🔒 **Password Protected** — dashboard locked, endpoints publicly accessible
- 📜 **MIT Licensed** — free forever

**4. Quick Start**

```bash
git clone https://github.com/recurohq/webhook-as-a-service.git
cd webhook-as-a-service
cp .env.example .env   # edit PASSWORD and BASE_URL
docker compose up -d
```

"Open http://localhost:8080, create an endpoint, and send your first webhook."

Second screenshot: request inspector showing a Stripe webhook payload.

**5. How It Works**
- Short explanation: create endpoint → get URL → point your service at it → see requests in dashboard
- Diagram or curl example:

```bash
# 1. Create an endpoint in the dashboard and get your URL
# 2. Send a test webhook:
curl -X POST http://localhost:8080/w/01HXY.../ \
  -H "Content-Type: application/json" \
  -d '{"event": "payment.completed", "amount": 2999}'
# 3. See it appear in the dashboard instantly
```

**6. Configuration**

| Variable | Default | Description |
|---|---|---|
| `PASSWORD` | (required) | Dashboard login password |
| `BASE_URL` | `http://localhost:8080` | Public URL (used for displaying endpoint URLs) |
| `TZ` | `UTC` | Server timezone |
| `SESSION_DAYS` | `7` | Login session duration |
| `SMTP_HOST` | — | SMTP server |
| `SMTP_PORT` | `587` | SMTP port |
| `SMTP_USER` | — | SMTP username |
| `SMTP_PASS` | — | SMTP password |
| `SMTP_FROM` | — | Sender email |
| `RETENTION_DAYS` | `30` | Days to keep request history |
| `MAX_BODY_KB` | `100` | Max request body size to capture |

**7. Screenshots**
- Endpoints list
- Request inspector (split pane, JSON body highlighted)
- Forwarding config
- Dark mode comparison

**8. Comparison Table**
Same as Section 4 of this PRD.

**9. Roadmap**
- [ ] WebSocket real-time updates (live request stream)
- [ ] Request diffing (compare two requests side-by-side)
- [ ] HMAC signature verification helper
- [ ] REST API for programmatic access
- [ ] PostgreSQL support
- [ ] Request auto-transformation (modify before forwarding)
- [ ] Rate limiting per endpoint

**10. Recuro**
```
---
## Built by the Recuro team

This project receives webhooks. Need to **send** them on a schedule?
[Recuro](https://recurohq.com) is a managed HTTP job scheduler — cron jobs,
delayed jobs, retries, and team dashboards.

[Try Recuro free →](https://recurohq.com) · 1,000 free requests, no credit card.
```

**11. Contributing + License**

### README SEO Requirements

- **H1:** `webhook-as-a-service`
- **First paragraph keywords:** "webhook as a service", "self-hosted", "webhook tester", "webhook inspector", "requestbin alternative", "docker compose"
- **GitHub description:** "Self-hosted webhook-as-a-service — receive, inspect, debug, and forward webhooks with a web dashboard. RequestBin alternative. docker compose up -d."
- **Topics:** `webhook`, `webhook-tester`, `webhook-as-a-service`, `webhooks`, `requestbin`, `self-hosted`, `docker`, `docker-compose`, `devops`, `debugging`, `http`

### Repository File Structure

```
webhook-as-a-service/
├── README.md
├── LICENSE                        # MIT
├── CONTRIBUTING.md
├── docker-compose.yml
├── Dockerfile
├── .env.example
├── .github/
│   ├── workflows/ci.yml
│   └── ISSUE_TEMPLATE/
│       ├── bug_report.md
│       └── feature_request.md
├── cmd/
│   └── server/main.go
├── internal/
│   ├── domain/
│   │   ├── endpoint.go
│   │   ├── request.go
│   │   └── forwarding_rule.go
│   ├── service/
│   │   ├── endpoint_service.go
│   │   ├── request_service.go
│   │   ├── forwarder.go
│   │   ├── deadman.go
│   │   └── import_export.go
│   ├── notification/
│   │   ├── email.go
│   │   └── webhook.go
│   ├── storage/
│   │   ├── sqlite.go
│   │   ├── endpoint_repo.go
│   │   ├── request_repo.go
│   │   └── migrations/
│   └── server/
│       ├── server.go
│       ├── routes.go
│       ├── handlers/
│       │   ├── login.go
│       │   ├── endpoints.go
│       │   ├── requests.go
│       │   ├── settings.go
│       │   └── receiver.go        # The webhook receiving handler (public, no auth)
│       └── middleware/
│           └── auth.go
├── web/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── LoginPage.tsx
│   │   │   ├── EndpointsListPage.tsx
│   │   │   ├── EndpointDetailPage.tsx
│   │   │   ├── EndpointFormPage.tsx
│   │   │   └── SettingsPage.tsx
│   │   ├── components/
│   │   │   ├── ui/
│   │   │   ├── RequestList.tsx
│   │   │   ├── RequestDetail.tsx
│   │   │   ├── HeadersTable.tsx
│   │   │   ├── BodyViewer.tsx       # Syntax-highlighted body (JSON/XML/text)
│   │   │   ├── CurlGenerator.tsx
│   │   │   ├── ReplayModal.tsx
│   │   │   ├── ForwardingRules.tsx
│   │   │   ├── KeyValueEditor.tsx
│   │   │   ├── MethodBadge.tsx
│   │   │   ├── StatusBadge.tsx
│   │   │   └── ThemeToggle.tsx
│   │   ├── hooks/
│   │   │   ├── useEndpoints.ts
│   │   │   ├── useRequests.ts
│   │   │   ├── usePolling.ts
│   │   │   └── useTheme.ts
│   │   ├── lib/
│   │   │   ├── api.ts
│   │   │   ├── format.ts
│   │   │   ├── syntax.ts           # Body syntax detection + highlighting
│   │   │   └── types.ts
│   │   └── styles/
│   │       └── globals.css
│   ├── package.json
│   └── vite.config.ts
├── screenshots/
└── docs/
    └── architecture.md
```

---

## 8. SEO & Distribution Strategy

### Keyword Targets

| Keyword | Intent | Target Asset |
|---|---|---|
| webhook as a service | Product discovery | GitHub repo |
| webhook tester self-hosted | Self-hosted tooling | GitHub repo |
| requestbin alternative | Competitor replacement | README |
| webhook.site alternative | Competitor replacement | README + blog |
| self-hosted webhook inspector | Feature-specific | README |
| webhook debugger docker | Deployment-specific | README quick start |
| receive webhooks locally | Dev workflow | Blog post |
| webhook forwarder self-hosted | Feature-specific | README |

### Launch Plan

#### Week 1: Ship

1. Push v1.0.0 under `github.com/recurohq/webhook-as-a-service`
2. Hacker News: "Show HN: Self-hosted webhook inspector with forwarding and replay — docker compose up -d"
3. Reddit: r/selfhosted, r/devops, r/webdev, r/golang
4. dev.to: "I Built a Self-Hosted RequestBin Because webhook.site Limits Are Annoying"
5. X thread with dark mode screenshot of a Stripe payload being inspected

#### Week 2–4: Amplify

1. PR to awesome-selfhosted
2. AlternativeTo.net (alternative to webhook.site, RequestBin, Hookdeck)
3. Blog: "webhook.site vs. RequestBin vs. webhook-as-a-service — Comparison"
4. Blog: "How to Debug Stripe Webhooks Locally with Docker"
5. Cross-link from cron-as-a-service README ("Need to receive webhooks? Try our webhook-as-a-service.")

#### Month 2–6: Sustain

- Monthly releases
- 48-hour issue response
- Blog posts targeting "debug [X] webhooks" (Stripe, GitHub, Twilio, Shopify)
- Cross-promote with cron-as-a-service community

### Cross-Promotion with cron-as-a-service

Both repos link to each other:

- **cron-as-a-service README:** "Need to receive and inspect webhooks? Try [webhook-as-a-service](https://github.com/recurohq/webhook-as-a-service)."
- **webhook-as-a-service README:** "Need to send webhooks on a schedule? Try [cron-as-a-service](https://github.com/recurohq/cron-as-a-service)."
- Both READMEs: "Built by the [Recuro](https://recurohq.com) team."

This creates a small ecosystem under `recurohq/` on GitHub, building org-level authority.

---

## 9. Success Metrics

| Metric | 3-Month Target | 6-Month Target |
|---|---|---|
| GitHub Stars | 500+ | 2,000+ |
| Google Rank: "webhook tester self-hosted" | Page 1 | Top 3 |
| GitHub Search: "webhook as a service" | #1 repo | Maintain #1 |
| Contributors | 5+ | 15+ |
| Issues Response Time | <48 hours | <24 hours |
| Recuro signups attributed to OSS | 50+ | 200+ |

---

## 10. Roadmap

### v1.0 — Full Release (Target: 4–5 weeks)

- [x] Login screen (password from env var)
- [x] Endpoints list with status, search, auto-refresh
- [x] Create / edit endpoint (name, response config, alert config)
- [x] Request inspector (split-pane: list + detail with headers/body/query tabs)
- [x] Syntax-highlighted body viewer (JSON, XML, form-urlencoded)
- [x] Copy request as curl
- [x] Forwarding rules (1–5 per endpoint, async relay)
- [x] Replay requests to arbitrary URL
- [x] Deadman's switch alerts (email + webhook)
- [x] Search and filter requests (method, content-type, body text, date)
- [x] Import / export (endpoints as JSON, requests as JSON)
- [x] Dark mode
- [x] Settings page (SMTP, retention, base URL)
- [x] Auto-cleanup (retention-based)
- [x] SQLite with auto-migration
- [x] Docker Compose deployment
- [x] README with screenshots and comparison table
- [x] CI pipeline
