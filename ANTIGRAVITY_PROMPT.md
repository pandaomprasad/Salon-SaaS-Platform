# Antigravity Prompt — Salon Panel Audit & Fixes

You are working in the `salon-panel` repository (monorepo path: `apps/salon-panel`). Execute the remediation plan below **task by task, in the exact order given**. Do not batch tasks together and do not skip ahead.

## Working rules

1. **Explore before editing.** For each task, first locate and read every relevant file, then state a short plan (files to touch + approach) before writing code.
2. **One task = one commit-sized change.** After finishing a task, run `npx tsc --noEmit` and the lint script, report the result, then stop and report status before starting the next task.
3. **Do not invent APIs.** If an endpoint, type, or util does not exist in the codebase, say so and propose options instead of inventing behavior.
4. **No new dependencies** without asking first, except where a task explicitly calls for one.
5. **Preserve existing UI/UX and styling conventions.** Match the file structure, naming, and component patterns already in the repo.
6. **No stubs or TODO comments left behind.** Every change must be complete and working.
7. If a task is already done or does not apply, say so explicitly with evidence (file + line) instead of making a change.

---

# PHASE 1 — Critical Security Remediation

## Task 1.1 — Remove plaintext credentials from `apps/salon-panel/lib/data.ts`

- Delete the `USERS` array containing the hardcoded credentials (`owner123`, `manager123`, `staff123`) and any related password constants.
- Remove the fallback mock-login matching logic wherever it is used (auth context/provider, login page, `login()` helper, etc.).
- Login must go **only** through the real backend auth endpoint. If the API fails, surface a real error to the user — never fall back to local credentials.
- Grep the whole repo for `owner123`, `manager123`, `staff123`, `USERS`, `mockLogin` and confirm zero remaining references.

**Acceptance:** repo-wide search returns no hardcoded credentials; login works only via the API; failed login shows an error message.

## Task 1.2 — Harden session & token storage

- Audit where access and refresh tokens are currently written and read (`localStorage`, `sessionStorage`, context, `api-client.ts`).
- Preferred: move tokens to **HttpOnly, Secure, SameSite cookies** set by the backend, with the client sending `credentials: 'include'`.
  - If the backend does not currently support cookie-based auth, **do not fake it**. Instead: (a) report exactly what backend change is required, and (b) implement the fallback below.
- Fallback if cookies are not possible: keep the access token in memory only, keep only the refresh token in `localStorage`, clear all token keys on logout and on 401, and remove any token logging.
- Update the 401 interceptor in `api-client.ts` so that after a successful token refresh it:
  - retries the original request once, and
  - **re-authenticates the active Socket.IO connection** with the new token (see Task 2.3) instead of leaving a stale socket.
- Ensure a failed refresh clears session state and redirects to `/login`.

**Acceptance:** no token is readable from `localStorage` in the preferred path; 401 → refresh → retry works; socket is re-authenticated after refresh; logout fully clears session.

## Task 1.3 — Implement strict client-side RBAC route guards

- Restrict `/reports` and `/branch` to roles `owner` and `manager` only.
- Any `staff` user attempting those routes is redirected to `/dashboard` (or `/schedule` if `/dashboard` is not staff-accessible).
- Implement this centrally (route-guard component, layout-level check, or middleware) rather than scattering checks inside each page.
- Also hide the corresponding nav/sidebar links for roles that cannot access them — but keep the route guard as the source of truth.
- Handle the loading state: do not flash protected content before the role is resolved.

**Acceptance:** a `staff` session cannot reach `/reports` or `/branch` by direct URL entry; no protected content flashes during hydration; nav reflects role.

## Task 1.4 — Add input sanitization

- Sanitize customer notes and service descriptions **before rendering and before submitting**.
- Find every place these fields are rendered, especially any `dangerouslySetInnerHTML` usage, and eliminate or sanitize it.
- Add a shared sanitize utility (e.g. `lib/sanitize.ts`) and use it consistently; propose `dompurify`/`isomorphic-dompurify` if a library is needed and wait for approval.
- Add length limits and trim on the relevant form inputs.

**Acceptance:** injected markup/script in notes or descriptions renders as inert text; no unsanitized `dangerouslySetInnerHTML` remains.

---

# PHASE 2 — Core Functionality & API Wiring

## Task 2.1 — Remove mock data fallbacks

- Find every silent fallback to static mock arrays (`CUSTOMERS`, `SERVICES`, `STAFF`) on API failure and remove it.
- Replace each with explicit UI states: **loading**, **error**, **empty**, **success**.
- The error state must show a clear banner/message plus a **Retry** button that re-invokes the fetch.
- Delete now-unused mock arrays from `lib/data.ts` (keep only anything genuinely used for tests/storybook, and say which you kept and why).

**Acceptance:** with the API down, each affected page shows an error banner and a working retry — never stale mock rows.

## Task 2.2 — Add owner account password change UI

- Add an **Account Settings** surface: a modal or tab in `/branch`, or an entry in the Header dropdown (pick one, follow existing patterns, and justify the choice briefly).
- Form fields: current password, new password, confirm new password.
- Client-side validation: required fields, new ≠ current, confirm matches, minimum strength/length matching backend rules.
- Wire it to `PATCH /api/v1/auth/change-password` through the existing `api-client`.
- Handle states: submitting, success toast/message, and mapped server errors (e.g. wrong current password).
- Confirm whether the backend invalidates sessions on password change; if it does, handle the forced re-login flow.

**Acceptance:** an owner can change their password end-to-end; validation and server errors both display correctly.

## Task 2.3 — Real-time booking sync fix

- Locate the Socket.IO client setup and the booking-related event handlers.
- Re-authenticate the Socket.IO handshake whenever the access token refreshes: update `auth`/`extraHeaders` with the new token and reconnect (or emit the app's re-auth event) rather than keeping a socket authenticated with an expired token.
- Ensure booking create/update/cancel events update the UI/cache immediately, with no manual refresh required.
- Verify no duplicate listeners are registered on reconnect (clean up in the effect teardown).
- Confirm the socket disconnects on logout.

**Acceptance:** after a token refresh, socket events still arrive; a booking change in one client appears in another without refresh; no duplicated event handlers after reconnects.

---

# PHASE 3 — Polish & Developer Experience

## Task 3.1 — Eliminate `any` types

- Remove every `any` in `mapUser.ts` and `api-client.ts` and replace with precise types/generics.
- Define shared response/entity types in the existing types location; make `api-client` generic over the response shape.
- Do not use `as unknown as T` to paper over mismatches — model the real shape.

## Task 3.2 — Add loading skeletons on initial page hydration

- Add skeleton components for the main data-driven pages (dashboard, schedule, customers, services, reports, branch).
- Match layout dimensions so there is no layout shift when real data arrives.
- Reuse a shared `Skeleton` primitive if one exists; otherwise create one.

## Task 3.3 — Final verification

- Run `npx tsc --noEmit` and confirm **0 errors**.
- Run lint and build; fix anything introduced by these changes.
- Produce a final summary: what changed per task, files touched, anything deferred, and any backend changes required (especially for cookie-based auth and password-change session handling).

---

## Final output format

After each task, report:

```
Task <id>: <title>
Status: Done / Blocked / Not applicable
Files changed: <list>
What I did: <2–4 bullets>
tsc --noEmit: <pass/fail>
Notes / follow-ups: <anything the human must decide>
```

Then wait for my go-ahead before continuing to the next task.
