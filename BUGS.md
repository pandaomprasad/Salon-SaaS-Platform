# BUGS & REFINEMENTS LOG

Audit of `salon-api` (and related apps) — categorized by severity.
Last reviewed: 2026-08-10 · Fixed items marked **[FIXED]**

Status legend:
- **[FIXED]** — resolved (see "Fix applied" note)
- (open) — not yet addressed

---

## CRITICAL / FIX FIRST

### 1. Reschedule email uses undefined variables — **[FIXED]**
- **File:** `salon-api/src/controllers/appointment.controller.js`
- **Lines:** ~983-984
- **Issue:** Email call passes `oldSlotDate` / `oldSlotTime`, which are never defined (declared as `oldSlotInfo.date` / `oldSlotInfo.startTime`).
- **Impact:** "Previous date/time" always renders as fallback text in reschedule emails.
- **Fix applied:** Replaced with `oldSlotInfo.date` / `oldSlotInfo.startTime`.

### 2. Client can tamper with appointment price — **[FIXED]**
- **File:** `salon-api/src/controllers/appointment.controller.js`
- **Line:** ~188
- **Issue:** `pricePaid: req.body.pricePaid ?? service.price` — the client supplies the price.
- **Impact:** A customer can book any service for any price (e.g. ₹1).
- **Fix applied:** Price now always comes from the server: `service.price ?? 0`. Client-sent `pricePaid` is ignored. (Customer-app never sent it anyway.)

### 3. Reschedule is not atomic (no transaction) — **[FIXED]**
- **File:** `salon-api/src/controllers/appointment.controller.js`
- **Lines:** ~865-885
- **Issue:** New slot is booked first, then the old slot is freed — two separate writes without a session/transaction.
- **Impact:** If the second write fails, the old slot stays `BOOKED` forever (orphan).
- **Fix applied:** Book-new-slot + free-old-slot + appointment update are all inside `session.withTransaction(...)`.

### 4. googleLogin drops the phone unique index — **[FIXED]**
- **File:** `salon-api/src/controllers/auth.controller.js`
- **Line:** ~349
- **Issue:** On a duplicate-key error, the code ran `User.collection.dropIndex("phone_1")` to make the signup succeed.
- **Impact:** Permanently removed the phone uniqueness constraint for the whole collection.
- **Fix applied:** On 11000, re-fetch the user by email (handles the create race) instead of dropping any index. The schema's sparse phone index stays intact.

### 5. Socket.io rooms are unauthenticated — **[FIXED]**
- **File:** `salon-api/src/config/socket.js` (+ `apps/salon-panel/lib/socket-client.ts`, `apps/customer-app/src/services/socketClient.js`)
- **Issue:** Any client could emit `join_customer`, `join_user`, `join_branch`, `join_salon` with arbitrary IDs.
- **Impact:** Anyone could subscribe to another customer's real-time booking/status events or a salon's appointment feed — data leak.
- **Fix applied:** Socket handshake now requires a valid access token (`auth: { token }` on both clients). Room joins are validated on the server:
  - `join_customer` / `join_user` — must match the token's userId.
  - `join_salon` — must match the token's salonId.
  - `join_branch` — own branchId, or any branch of the token's salon (verified in DB).

---

## WORKFLOW

### 6. New bookings are auto-CONFIRMED — **[FIXED]**
- **File:** `salon-api/src/controllers/appointment.controller.js`
- **Lines:** ~191, ~194
- **Issue:** `bookAppointment` created the appointment with `status: "CONFIRMED"` directly.
- **Impact:** The salon panel's Accept/Confirm flow was bypassed; no booking ever entered `PENDING`.
- **Fix applied:** New bookings are created as `PENDING`; salon owner/manager confirms via `PATCH /appointments/:id/status`.

### 7. COMPLETED → NO_SHOW leaves slot freed — **[FIXED]**
- **File:** `salon-api/src/controllers/appointment.controller.js`
- **Issue:** COMPLETED frees the slot to `AVAILABLE`; a later flip to `NO_SHOW` didn't re-block it.
- **Impact:** Slot remained bookable despite a no-show being recorded.
- **Fix applied:** Documented intended behavior in code: NO_SHOW is a post-completion correction, the time has already passed, so the slot intentionally stays AVAILABLE and the nightly cron marks past AVAILABLE slots as COMPLETED.

---

## SECURITY / PERFORMANCE

### 8. Two DB queries per authenticated request — **[FIXED]**
- **File:** `salon-api/src/middleware/authenticate.js`
- **Lines:** ~55, ~79
- **Issue:** Every API call loaded User + Role from MongoDB to verify the token.
- **Impact:** Unnecessary DB load and latency at scale.
- **Fix applied:** Role name is read from the signed JWT payload (`decoded.role`); the extra `Role.findById` query was removed. Only the user query remains (needed for revocation checks).

### 9. Public slots endpoint returns non-available slots — **[FIXED]**
- **File:** `salon-api/src/controllers/browse.controller.js`
- **Line:** ~490 (inside `getBranchSlotsPublic`)
- **Issue:** The slot query didn't filter `status: "AVAILABLE"`.
- **Impact:** BOOKED/COMPLETED slots sent to the customer app; larger payloads, cache pollution, client must filter.
- **Fix applied:** Added `status: "AVAILABLE"` to the query filter.

---

## RELIABILITY

### 10. Customer-app fetch has no timeout — **[FIXED]**
- **File:** `apps/customer-app/src/services/apiClient.js`
- **Issue:** No `AbortController`/timeout on fetch (a 15s timeout was partially added already between audits).
- **Impact:** A dead server makes requests hang until the OS kills the connection (the "Network request timed out" warnings seen earlier).
- **Fix applied:** 15s abort timeout on every request (existing) + **added one automatic retry** on network-level failures (timeout / connection refused). HTTP errors (400/401/404) are NOT retried.

### 11. updateAppointmentStatus slot update not transactional — **[FIXED]**
- **File:** `salon-api/src/controllers/appointment.controller.js`
- **Lines:** ~513-558
- **Issue:** Slot status update and `appointment.save()` were separate writes without a session.
- **Impact:** If one failed, slot and appointment statuses could drift out of sync (e.g. cancelled appointment, still-BOOKED slot).
- **Fix applied:** Slot update (both slotId and legacy staffId/date/time paths) + status history + `appointment.save()` now run inside `session.withTransaction(...)`.

### 12. Slot generation is slow/sequential — **[FIXED]**
- **File:** `salon-api/src/utils/autoSlotGenerator.js`
- **Issue:** Looped branches → staff serially (`for` loops with `await`).
- **Impact:** With many branches/staff the nightly job could run very long.
- **Fix applied:** Branches are processed in chunks of 5 with `Promise.all` (per-branch helper `generateForBranch`); insertion results are aggregated.

### 13. initial_load cache goes stale on booking — **[FIXED]**
- **File:** `salon-api/src/controllers/appointment.controller.js` (+ `browse.controller.js`)
- **Issue:** `initial_load:*` has a 300s TTL and was NOT invalidated on booking, so home-screen slot availability could be 5 minutes stale.
- **Impact:** Users could see slots that were just booked.
- **Fix applied:** On booking AND on slot-freeing (COMPLETED), only the affected city's `initial_load:<citySlug>:*` cache is invalidated — home screen stays fresh without flushing every city.

---

## NOTES

- All prices are stored in **paise** (1 INR = 100 paise).
- There is no automated test suite yet; adding integration tests for booking/status/reschedule flows is recommended.
- Tracked separately: bug 5 required client changes (`socket-client.ts`, `socketClient.js`) so the socket reconnect flow was also smoothed (`connect_error` handler added).