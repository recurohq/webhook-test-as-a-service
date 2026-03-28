# webhook-as-a-service

Self-hosted webhook receiver, inspector, and forwarder. Point any service at it, see every request in a dashboard. Persistent, forwardable, replayable.

```bash
git clone https://github.com/recurohq/webhook-test-as-a-service.git
cd webhook-test-as-a-service
cp .env.example .env   # set a PASSWORD
docker compose up -d
```

That's it. Open `http://localhost:8080`, create an endpoint, get a URL.

[![License: MIT](https://img.shields.io/badge/license-MIT-blue?style=flat-square)](LICENSE)

<!-- TODO: screenshot -->

---

## What it does

You create an endpoint. You get a URL like `https://yourserver:8080/w/01HXY.../`. Point Stripe, GitHub, Twilio -- whatever -- at that URL. Every request is captured and shown in a split-pane inspector: headers, body, query params, source IP, timing.

You can append any path after the endpoint ID. So `https://yourserver:8080/w/01HXY.../stripe/webhook` and `https://yourserver:8080/w/01HXY.../github/push` both go to the same endpoint, with the sub-path captured.

```bash
curl -X POST http://localhost:8080/w/{endpoint_id} \
  -H 'Content-Type: application/json' \
  -d '{"event": "payment.completed", "amount": 2999}'
```

That request shows up in the dashboard immediately. JSON is pretty-printed. Headers are in a table. You can filter by method, search across requests, and page through history.

---

## Why not webhook.site or RequestBin

webhook.site caps you at 500 requests on free and you can't self-host the full version. RequestBin (Pipedream) requires an account and isn't self-hostable. The OSS webhook.site clone needs PHP + Redis + Pusher. tarampampam/webhook-tester is in-memory only -- restart and your data is gone.

This runs on SQLite. Data survives restarts. One Docker container, no external dependencies.

---

## Forwarding

You probably don't just want to *look* at webhooks -- you want to capture them while still delivering to your actual server. Add a forwarding rule to any endpoint and incoming requests get relayed to the target URL automatically.

Use cases that actually come up:

- You're debugging a Stripe integration and need to see the raw payload, but your server still needs to receive it
- You want one webhook URL that fans out to multiple services
- You're forwarding prod webhooks to a staging environment to test your handler

Forwarding is async -- it doesn't slow down the response to the sender.

---

## Replay

You fixed a bug in your webhook handler and now you need to re-send that one request from 3 hours ago. Click "Replay", enter the target URL, hit send. You see the response status and latency inline.

No more asking the third-party service to re-fire the webhook. No more crafting curl commands by hand.

---

## Deadman's switch

If you expect a webhook every 5 minutes (health check, scheduled job, monitoring ping) and it stops arriving, you want to know. Set a timeout on any endpoint -- "alert me if nothing arrives for 15 minutes" -- and get notified via email or webhook (Slack, Discord, whatever accepts a POST).

Fires once, resets when the next request arrives. Not a polling loop on your end.

---

## Copy as curl

Click "Copy curl" on any captured request. You get a complete curl command -- method, headers, body, query string -- ready to paste into a terminal or share with someone. Useful when you need a teammate to reproduce a request.

---

## Custom responses

Each endpoint returns a configurable response: status code, headers, and body. Default is `200 {"ok": true}`. Set it to whatever the sending service expects. Disabled endpoints return `410 Gone`.

---

## Configuration

All env vars, no config files:

| Variable | Default | What it does |
|---|---|---|
| `PASSWORD` | *(required)* | Dashboard login password |
| `BASE_URL` | `http://localhost:8080` | Public URL shown in the dashboard |
| `TZ` | `UTC` | Timezone |
| `SESSION_DAYS` | `7` | Login session duration |
| `SMTP_HOST` | -- | For email alerts |
| `SMTP_PORT` | `587` | |
| `SMTP_USER` | -- | |
| `SMTP_PASS` | -- | |
| `SMTP_FROM` | -- | |
| `RETENTION_DAYS` | `30` | Auto-delete requests older than this |
| `MAX_BODY_KB` | `100` | Max body size to capture per request |

---

## Screenshots

<!-- TODO: Add screenshots -->
| Light | Dark |
|---|---|
| ![List Light](screenshots/list-light.jpg) | ![List Dark](screenshots/list-dark.jpg) |
| ![Detail Light](screenshots/detail-light.jpg) | ![Detail Dark](screenshots/detail-dark.jpg) |

---

## Stack

Next.js 15, TypeScript, Tailwind CSS, SQLite (better-sqlite3), Docker. Single container, ~80MB image.

---

## Roadmap

- [ ] WebSocket live updates (no more polling)
- [ ] Request diffing (compare two requests side by side)
- [ ] HMAC signature verification
- [ ] REST API
- [ ] PostgreSQL option

---

## Also

This project receives webhooks. If you need to *send* HTTP requests on a schedule, see [cron-as-a-service](https://github.com/recurohq/cron-as-a-service).

Both built by [Recuro](https://recurohq.com).

---

## Contributing

PRs welcome. See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

[MIT](LICENSE)
