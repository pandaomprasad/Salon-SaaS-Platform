# 🚀 Salon SaaS Platform — Production Readiness Level-Up Plan

This document lists concrete gaps between the current codebase and true industry/production-grade standards, plus exact tasks to close each gap. It is written to be handed to an AI coding agent (e.g. Antigravity) that has access to the repo, so each item includes **what to do**, **where**, and **why**, in enough detail to be actioned without further clarification.

Work through sections in priority order. Do not skip straight to polish items (docs, a11y) before the risk items (testing, CORS, secrets).

---

## 🔴 Priority 1 — Correctness & Risk (do these first)

### 1.1 Fix the CORS wildcard
- **Problem**: `.env` example has `ALLOWED_ORIGINS=*`, but Section 8 of PROJECT_OVERVIEW.md claims strict CORS enforcement. A wildcard origin with credentials/cookies enabled is a real vulnerability.
- **Task**:
  - Find the CORS middleware setup in `salon-api/src/app.js` (or wherever `cors()` is configured).
  - Replace wildcard parsing with an explicit allow-list parsed from `ALLOWED_ORIGINS` (comma-separated), validated per environment.
  - Add three `.env.example` files (or profiles) for `development`, `staging`, `production`, each with real, restrictive origins — never `*` in production.
  - If cookies/credentials are used for auth, ensure `credentials: true` is paired with an explicit origin list (wildcard + credentials is invalid in browsers anyway, so this will surface bugs if currently broken).

### 1.2 Add tests for the highest-risk logic
- **Problem**: No automated tests exist anywhere in the repo. The riskiest code paths are the ones most likely to cause real business damage (double bookings, cross-tenant leaks).
- **Task**:
  - Set up Jest + Supertest in `salon-api` (`npm install --save-dev jest supertest mongodb-memory-server`).
  - Write tests for:
    1. **Slot booking race condition** — fire concurrent `findOneAndUpdate` booking requests at the same slot and assert only one succeeds.
    2. **`tenantPlugin` isolation** — assert that a query scoped to `salonId: A` never returns documents belonging to `salonId: B`, across `Branch`, `Service`, `Slot`, `Appointment`, `Notification`.
    3. **JWT refresh flow** — expired access token triggers refresh, refresh token rotation works, reused/expired refresh tokens are rejected.
    4. **RBAC middleware** — each role (`SUPER_ADMIN`, `SALON_OWNER`, `BRANCH_MANAGER`, `STAFF`, `CUSTOMER`) can only hit the routes it's authorized for; assert 403 on privilege escalation attempts.
  - Add an `npm test` script to `salon-api/package.json`.
  - Target: these 4 test files existing and passing is the single highest-value change in this whole plan.

### 1.3 Secrets management
- **Problem**: JWT secrets, DB URIs, Redis URLs all live in plain `.env` files with no rotation or vault strategy.
- **Task**:
  - Document (in a new `salon-api/SECRETS.md`) which values are secrets vs config.
  - Add `.env.example` (already exists, keep it) but ensure `.env` is in `.gitignore` (verify — don't assume).
  - For production, integrate one of: AWS Secrets Manager, Doppler, or Render/Railway's built-in secret store (whichever matches the deploy target already implied in `trust proxy` config). Pick Doppler if no cloud provider is already committed to, since it's fastest to wire in.
  - Rotate JWT secrets and confirm `JWT_EXPIRES_IN` / `JWT_REFRESH_EXPIRES_IN` are enforced server-side, not just trusted from client claims.

---

## 🟠 Priority 2 — CI/CD & Observability

### 2.1 GitHub Actions CI pipeline
- **Task**:
  - Add `.github/workflows/ci.yml` that, on every PR and push to `main`:
    1. Installs dependencies for `salon-api`, `apps/salon-panel`, `apps/admin-panel`, `apps/owner-landing-page`.
    2. Runs lint (`eslint`) on each.
    3. Runs `npm test` for `salon-api` (from 1.2).
    4. Runs `tsc --noEmit` for the TypeScript apps (`salon-panel`, `admin-panel`, `owner-landing-page`).
    5. Fails the build on any error.
  - Add a status badge to `PROJECT_OVERVIEW.md` once the workflow exists.

### 2.2 Error tracking
- **Task**:
  - Add Sentry (free tier) to `salon-api` and to each Next.js app via `@sentry/nextjs`.
  - Wrap the Express global error handler to report to Sentry before responding to the client.
  - Add Sentry to `apps/customer-app` via `@sentry/react-native`.
  - Confirm PII scrubbing is configured (don't leak customer phone numbers/emails into Sentry events).

### 2.3 Centralized log shipping
- **Problem**: Winston logs currently appear to go to local files/stdout only — not queryable in production.
- **Task**:
  - Configure a Winston transport to ship logs to a log aggregator (start with the free tier of Better Stack/Logtail, or CloudWatch if deploying to AWS).
  - Keep colored terminal output for local dev, switch to JSON structured logs in production (`NODE_ENV=production` branch in the Winston config).

### 2.4 Basic metrics dashboard
- **Task**:
  - Expose a `/metrics` endpoint using `prom-client` (request count, latency histogram, error rate, active DB connections).
  - Stand up a minimal Grafana Cloud free-tier dashboard or, if that's too much for now, at minimum log p50/p95/p99 latency per route using the existing `apiTiming.js` middleware data instead of just single-request `X-Response-Time` headers.

---

## 🟡 Priority 3 — API Contract & Data Integrity

### 3.1 OpenAPI / Swagger spec
- **Problem**: 4 separate frontends consume one API with no documented contract — drift risk is high.
- **Task**:
  - Install `swagger-jsdoc` + `swagger-ui-express` in `salon-api`.
  - Annotate existing route files with JSDoc OpenAPI comments, starting with the highest-traffic routes: `/salons`, `/slots`, `/appointments`, `/auth/*`.
  - Serve the generated spec at `/api-docs` in non-production environments.
  - Once complete, regenerate frontend API client types from the spec (`openapi-typescript`) instead of hand-maintained `api-client.ts` files, to eliminate drift.

### 3.2 Real migration tooling
- **Problem**: `seed-brahmapur.js` and `generate_all_slots.js` are one-off seed scripts, not a migration system — no way to safely evolve schemas against existing production data.
- **Task**:
  - Install `migrate-mongo`.
  - Convert any schema-altering changes going forward into versioned migration files under `salon-api/migrations/`.
  - Keep the existing seed scripts for local dev bootstrapping only; document this distinction clearly in `salon-api/README.md`.

---

## 🟢 Priority 4 — Scaling & Deployment

### 4.1 Containerization
- **Task**:
  - Add a `Dockerfile` to `salon-api` (multi-stage build: install → build → slim runtime image).
  - Add a root `docker-compose.yml` that spins up `salon-api` + MongoDB + Redis together for local dev, replacing the manual "start Mongo/Redis yourself" instructions in the README.
  - Add Dockerfiles for `salon-panel` and `admin-panel` (Next.js standalone output mode) if containerized deploy is the target.

### 4.2 Process scaling
- **Task**:
  - Add PM2 config (`ecosystem.config.js`) for `salon-api` with cluster mode (`instances: "max"`) as a documented option for VM-based deploys.
  - If deploying to a container platform (Railway/Render/K8s) instead, document horizontal scaling via replica count rather than PM2 clustering — pick one path and document it, don't leave both implied.

### 4.3 Document the Socket.IO real-time architecture
- **Problem**: Socket.IO is in the stack table but has zero architecture explanation — unclear if it's actually driving booking status updates or just installed.
- **Task**:
  - Audit the codebase for actual Socket.IO usage (rooms, event names, emit sites).
  - If in use: add a "Real-Time Architecture" section to `PROJECT_OVERVIEW.md` covering room strategy (e.g., one room per `branchId`), auth-on-connect (verifying JWT during the socket handshake), and reconnection/backoff handling on each client.
  - If not actually wired up yet: either implement it for the "real-time booking status notifications" feature claimed in Section 1, or remove the claim from the docs until it's real.

---

## 🔵 Priority 5 — Frontend Engineering Practices

### 5.1 Error boundaries
- **Task**: Add a top-level React Error Boundary to `salon-panel`, `admin-panel`, `owner-landing-page`, and `customer-app` so a single component crash doesn't white-screen the whole app.

### 5.2 Shared design system
- **Problem**: 4 separate frontend apps risk visual/component drift.
- **Task**: Extract shared, brand-consistent UI primitives (buttons, inputs, cards, typography scale) into a shared package (`packages/ui`) consumed by `salon-panel` and `admin-panel` at minimum (both Next.js/Tailwind — easiest to share).

### 5.3 Accessibility pass
- **Task**: Run `axe-core` (via `@axe-core/react` in dev, or CI-integrated `jest-axe`) against key pages (booking flow, salon dashboard) and fix flagged issues (missing labels, contrast, focus order).

---

## ✅ Definition of Done

This project can genuinely be called "production-grade" once:

- [ ] `ALLOWED_ORIGINS` is never `*` outside local dev
- [ ] Slot booking, tenant isolation, JWT refresh, and RBAC all have passing automated tests
- [ ] CI runs lint + tests on every PR and blocks merge on failure
- [ ] Errors are tracked centrally (Sentry) instead of only local console logs
- [ ] An OpenAPI spec exists and is the source of truth for the API contract
- [ ] Schema changes go through versioned migrations, not ad-hoc scripts
- [ ] The whole stack (API + DB + Redis) can be brought up with one `docker-compose up`
- [ ] Socket.IO's real-time role is either documented accurately or removed from claims

---

*This plan is meant to be executed top-to-bottom by priority. Section 1 alone (correctness/risk) is what most separates a portfolio project from something a real engineering team would trust in production — do not skip it in favor of the more visible items lower down (Docker, design systems, etc.).*
