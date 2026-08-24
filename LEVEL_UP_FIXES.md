# 🔧 Salon SaaS Platform — Follow-Up Fixes (Round 2)

These are gaps found after reviewing `LEVEL_UP_EXECUTION.md`. Execute in order.

---

### Fix 1: Add a real CORS automated test
- Create `salon-api/tests/cors.test.js`.
- Use Supertest against the actual Express `app`.
- Test 1: request with `Origin: http://localhost:3000` (or whatever is in `ALLOWED_ORIGINS`) → response header `Access-Control-Allow-Origin` matches that origin, status is not blocked.
- Test 2: request with `Origin: http://evil-site.com` → response must NOT include `Access-Control-Allow-Origin: http://evil-site.com` and must NOT include `*`. Assert the CORS error is triggered (either a thrown error caught by Express error handler, or missing CORS header — check which your middleware actually does, and assert that).
- Add this file to the same `npm test` run as the other 4 suites.

---

### Fix 2: Verify and report real test results
- Run `npm test` in `salon-api` and capture the actual output.
- Update `LEVEL_UP_EXECUTION.md` section 1.2 with the real numbers: total tests, passed, failed, skipped (e.g. "27 passed, 0 failed, 0 skipped").
- If any test is currently skipped/pending (`.skip`, `.todo`), list which ones and why.

---

### Fix 3: Extend the JWT test to cover queued-request replay, not just token mechanics
- Current `jwtRefresh.test.js` only tests signing/decoding/expiry of tokens — that's testing the JWT library, not your app's logic.
- Add a new test that simulates the real flow used by the frontend interceptors:
  1. Fire an API request with an expired access token → expect `401`.
  2. Confirm the client-side interceptor logic (or a server-side equivalent test if the queuing lives client-side) queues the failed request, calls `/auth/refresh`, gets a new access token, and successfully replays the original request without the user seeing an error.
  3. Add a test for the failure path too: refresh token itself is expired/invalid → both the original request and the refresh attempt should fail cleanly (e.g. force logout), not loop or hang.
- If the queuing logic lives in the frontend (`api-client.ts` / `apiClient.js`) rather than the backend, add these as frontend tests (Jest + a mocked Axios instance) in the relevant app instead, and note in the execution log where the test actually lives.

---

### Fix 4: Prove Docker/Compose actually works
- Run `docker-compose up --build` from the repo root.
- Confirm all 3 services (salon-api, MongoDB, Redis) report healthy.
- Run `curl http://localhost:6969/health` (or whatever your health check route is) from outside the containers and confirm a `200` response.
- Update `LEVEL_UP_EXECUTION.md` section 4.1 with the actual command output or a summary confirming this was run, not just written.

---

### Fix 5: Expand OpenAPI coverage to branch/staff/service routes
- Current spec only covers `/health`, `/browse/salons`, `/auth/*`, `/appointments`, `/slots`.
- Add JSDoc OpenAPI annotations for all routes under branch management, staff management, and service-catalog management — these are used by both `salon-panel` and `admin-panel`, so they carry the highest drift risk between frontend and backend.
- Regenerate the Swagger UI at `/api-docs` and confirm the new routes appear.

---

### Fix 6: Decide and act on Sentry (error tracking)
- Not present in the execution log at all — was in the original plan, appears skipped.
- If proceeding: install `@sentry/node` in `salon-api`, wrap the global Express error handler to report to Sentry, and add `@sentry/nextjs` to `salon-panel` and `admin-panel`.
- Confirm PII scrubbing config (don't send customer emails/phone numbers to Sentry).
- If intentionally deferring this, add an explicit "Deferred — not yet implemented" note in the execution log instead of leaving it silently absent.

---

### Fix 7: Decide and act on migration tooling
- Currently still using one-off seed scripts (`seed-brahmapur.js`, `generate_all_slots.js`) for schema setup, no versioned migration system.
- If proceeding: install `migrate-mongo`, create `salon-api/migrations/`, and convert the next schema change into a proper migration file instead of editing the seed script.
- If intentionally deferring, note it explicitly in the execution log.

---

### Fix 8: Decide and act on the `/metrics` endpoint
- Not present in the execution log — was in original plan.
- If proceeding: add `prom-client`, expose `/metrics` with request count, latency histogram, and error rate.
- If deferring, note it explicitly.

---

## After completing these

Update `LEVEL_UP_EXECUTION.md` so every "✅ COMPLETED" item includes real verification evidence (actual command output, test counts, or a note on where the test file lives) — not just a description of what was attempted.
