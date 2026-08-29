# Salon SaaS Platform — Industry-Level Compliance Roadmap

This document lists the concrete gaps between the current architecture and a
production-grade / industry-standard system, with exact implementation
instructions per item. Organized by priority. Use this as a checklist —
each item should be implemented, tested, and checked off independently.

---

## Priority 0 — Correctness & Data Integrity (fix first, these cause real bugs)

### 0.1 Server-side cache invalidation on writes
**Problem:** Client cache purges on mutation, but server-side Redis /
in-memory cache has no defined invalidation strategy. A partner updating a
price or service can leave stale data being served to customers for up to
the full TTL.

**Fix:**
- Add `deleteCache(key)` and `deleteCachePattern(prefix)` to `cache.service.js`.
- On every write (POST/PUT/PATCH/DELETE) in `salon-api`, identify which
  cache keys are affected and either:
  - **Write-through** (update Redis immediately) for simple single-entity
    keys (e.g. `service:${id}`, `branch:${id}`).
  - **Invalidate** (delete key, let next read rebuild) for composite/
    aggregated keys (e.g. `salons:${city}`, `browse:${filterHash}`).
- Use Redis `SCAN` (not `KEYS`) for any pattern-based deletion to avoid
  blocking the event loop.
- Audit every existing write endpoint in `salon-api/src/controllers/` and
  confirm each one either touches Redis or explicitly documents why it
  doesn't need to (read-only side effects, etc.).

**Acceptance criteria:** No write endpoint exists that mutates MongoDB
without a corresponding cache invalidation/update call.

---

### 0.2 Multi-instance cache consistency (Redis Pub/Sub)
**Problem:** `IN_MEMORY_FALLBACK_CACHE` is per-process. Once the API runs
behind a load balancer with 2+ containers, each instance has its own
fallback cache with no cross-instance invalidation. A write on instance A
does not clear the stale in-memory copy on instance B/C.

**Fix:**
- Add a Redis Pub/Sub channel (e.g. `cache:invalidate`).
- On every cache invalidation/update event, publish the affected key(s) to
  the channel.
- Every API instance subscribes on boot and clears the matching key from
  its local `IN_MEMORY_FALLBACK_CACHE` when a message arrives.
- Implement in `cache.service.js`; initialize the subscriber in
  `database.js` or a new `cachePubSub.js` alongside `cacheWarmer.js`.

**Acceptance criteria:** A write on any instance results in all instances
serving fresh data on the next read, verified with 2+ local instances
running concurrently.

---

### 0.3 Booking concurrency / double-booking prevention
**Problem:** Slot locking is described only at a high level ("Mongo
transactions or status flags"). This is the highest-risk area of the whole
system — booking races are the classic source of double-booked
appointments.

**Fix:**
- Implement atomic slot reservation using `findOneAndUpdate` with a
  condition on current status:
  ```js
  const slot = await Slot.findOneAndUpdate(
    { _id: slotId, status: 'AVAILABLE' },
    { $set: { status: 'RESERVED', reservedBy: userId, reservedAt: new Date() } },
    { new: true }
  );
  if (!slot) return res.status(409).json({ error: 'Slot no longer available' });
  ```
- Add a reservation TTL/expiry job (or Mongo TTL index) that reverts
  `RESERVED` slots back to `AVAILABLE` if payment isn't completed within
  N minutes.
- Add **idempotency keys** on the booking creation endpoint (client sends
  an `Idempotency-Key` header; server stores/checks it) so retried
  requests from flaky mobile networks don't create duplicate appointments.
- Wrap the slot-reserve + appointment-create sequence in a MongoDB
  transaction if they span multiple collections and must be atomic
  together.

**Acceptance criteria:** Concurrent booking requests for the same slot
(load-tested with 10+ simultaneous requests) result in exactly one
CONFIRMED/PENDING appointment and the rest receive `409 Conflict`.

---

## Priority 1 — Resilience & Observability

### 1.1 Structured metrics & tracing
**Problem:** Winston gives logs but no real-time visibility into latency,
error rate, or cache hit ratio.

**Fix:**
- Add `prom-client` to expose a `/metrics` endpoint (request duration
  histograms, cache hit/miss counters, DB query duration).
- Optionally add OpenTelemetry tracing for request → DB/Redis spans.
- Track and expose: p50/p95/p99 latency per route, cache hit ratio (Layer
  1 client / Layer 2 Redis / Layer 3 DB), error rate per route.

**Acceptance criteria:** A `/metrics` endpoint exists and can be scraped
by Prometheus/Grafana or a hosted equivalent.

---

### 1.2 Downstream failure resilience
**Problem:** No defined behavior when MongoDB itself is slow/unavailable
(only Redis has a fallback).

**Fix:**
- Add connection timeouts and retry-with-backoff for Mongoose operations.
- Add a circuit breaker (e.g. `opossum`) around DB calls in high-traffic
  paths (`browseSalons`, slot lookups) so a struggling DB doesn't cascade
  into request pileup.
- Return a clear `503` with `Retry-After` when the circuit is open, rather
  than hanging requests.

**Acceptance criteria:** Killing the MongoDB connection mid-load-test
results in fast, clear `503` errors instead of request timeouts/hangs.

---

### 1.3 Rate limiting
**Problem:** No rate limiting mentioned at the API gateway layer.

**Fix:**
- Add `express-rate-limit` (or Redis-backed `rate-limit-redis` store for
  multi-instance correctness) on public-facing endpoints, especially auth
  (`/auth/login`, `/auth/refresh`) and booking endpoints.

**Acceptance criteria:** Repeated rapid requests from one client receive
`429 Too Many Requests` past the configured threshold.

---

## Priority 2 — API & Data Layer Hygiene

### 2.1 Pagination on list endpoints
**Problem:** `browseSalons` and similar list endpoints have no described
pagination — full result sets are fetched and cached, which doesn't scale
as city/salon counts grow.

**Fix:**
- Add `limit`/`cursor` or `page`/`pageSize` params to all list endpoints.
- Cache keys must include pagination params (e.g. `salons:${city}:page2`).

---

### 2.2 API versioning
**Fix:**
- Prefix all routes with `/api/v1/...` now, before any breaking change is
  needed. Retrofitting versioning later breaks existing mobile app
  installs that can't be force-updated instantly.

---

### 2.3 API documentation
**Fix:**
- Add OpenAPI/Swagger spec (`swagger-jsdoc` + `swagger-ui-express`) so the
  API surface is documented and testable without reading controller code.

---

### 2.4 Read replicas / query offloading (future scale)
**Fix (when traffic justifies it):**
- Configure MongoDB Atlas read replicas for read-heavy endpoints
  (`browseSalons`, analytics) to offload the primary write node.
- Not urgent at current scale — flag for later, don't over-build now.

---

## Priority 3 — Security Hardening

### 3.1 Secrets management
**Fix:**
- Confirm no secrets (DB URIs, JWT signing keys, Redis passwords) are
  committed to the repo. Move to environment variables injected via the
  hosting platform (Railway/AWS Secrets Manager), never `.env` in git.

### 3.2 Input validation coverage audit
**Fix:**
- Confirm `express-validator` schemas exist on every mutating endpoint,
  not just registration. Specifically audit booking, service creation, and
  branch management endpoints for injection/overflow protection.

### 3.3 RBAC enforcement audit
**Fix:**
- Confirm every route checks role (Customer/Staff/Manager/Admin/SuperAdmin)
  at the middleware level, not just in UI — a customer JWT should never be
  able to call salon-partner or admin routes even if they guess the URL.

---

## Priority 4 — Infrastructure & Delivery

### 4.1 Automated testing
**Fix:**
- Add unit tests for cache logic (`cache.service.js`) and the slot-locking
  logic in particular — this is the highest-value place for tests given
  it's the highest-risk code path.
- Add integration tests for the booking flow under concurrency (simulate
  parallel requests for the same slot).

### 4.2 CI/CD pipeline
**Fix:**
- Add GitHub Actions (or equivalent) to run lint + tests on every PR, and
  auto-deploy on merge to main, if not already present.

### 4.3 Health checks
**Fix:**
- Add `/health` and `/ready` endpoints reporting Mongo + Redis connection
  status, used by the load balancer / container orchestrator to route
  traffic only to healthy instances.

---

## Summary Table

| # | Item | Priority | Risk if skipped |
|---|------|----------|------------------|
| 0.1 | Server-side cache invalidation on write | P0 | Stale prices/availability shown to customers |
| 0.2 | Redis Pub/Sub for multi-instance cache sync | P0 | Inconsistent data across users hitting different instances |
| 0.3 | Atomic slot locking + idempotency keys | P0 | Double-booked appointments |
| 1.1 | Metrics & tracing | P1 | Blind to production issues until users complain |
| 1.2 | Circuit breaker / DB resilience | P1 | Full outage cascades from a slow DB |
| 1.3 | Rate limiting | P1 | Abuse / brute-force exposure |
| 2.1 | Pagination | P2 | Degrading performance as data grows |
| 2.2 | API versioning | P2 | Breaking changes strand old app installs |
| 2.3 | API docs | P2 | Slower onboarding/maintenance |
| 2.4 | Read replicas | P2 | Not urgent yet |
| 3.1–3.3 | Security hardening | P3 | Data breach / privilege escalation risk |
| 4.1–4.3 | Testing, CI/CD, health checks | P4 | Slower, riskier deployments |

---

**Recommended order of execution:** 0.1 → 0.3 → 0.2 → 1.2 → 1.1 → 1.3 →
everything else. Data integrity and booking correctness come before
observability; observability comes before polish.
