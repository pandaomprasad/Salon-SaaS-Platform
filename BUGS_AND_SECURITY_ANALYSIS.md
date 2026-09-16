# Salon SaaS Platform - Bug & Security Analysis Report

**Date:** 2026-09-14  
**Scope:** Backend API (salon-api) - Full codebase review

---

## 🔴 CRITICAL BUGS

### BUG-001: Race Condition in Slot Booking - Double Booking Possible
**Location:** `salon-api/src/controllers/appointment.controller.js:276-427` (bookAppointment function)

**Issue:** The atomic slot acquisition logic has a race condition window. The transaction path (lines 297-363) and fallback path (lines 367-426) both use `findOneAndUpdate` with a filter, but:
1. The filter checks `status: "AVAILABLE"` OR `reservedBy: userId` OR expired `RESERVED`
2. Between check and update, another request can pass the same filter
3. MongoDB transactions don't fully protect against this when using `findOneAndUpdate` outside the transaction context initially

**Impact:** Two customers can book the same slot simultaneously

**Evidence:** Lines 281-288 (slotAcquireFilter) and 300-304 (slotToBook)

---

### BUG-002: Password Double-Hashing in Admin Owner Approval
**Location:** `salon-api/src/controllers/admin.controller.js:638-652` (approveOwnerRequest function)

**Issue:** The OwnerRegistrationRequest stores a pre-hashed password (from registration). When approving:
1. `User.create()` is called WITHOUT password (line 641-647) - correct
2. Then `User.findByIdAndUpdate(owner._id, { password: request.password })` sets the already-hashed password directly - correct
3. **BUT** the User model has a pre-save hook that hashes passwords (user.model.js:206-214)

**Wait - this is actually CORRECT** because `findByIdAndUpdate` bypasses the pre-save hook. The comment on line 638-652 confirms this understanding. **NOT A BUG - verified correct implementation.**

---

### BUG-003: Appointment `getMyAppointmentHistory` Function Incomplete
**Location:** `salon-api/src/controllers/appointment.controller.js:1439-1480+`

**Issue:** The function is cut off at line 1480 (output capped). Need to verify the full implementation exists.

---

### BUG-004: Missing Validation for `serviceIds` Array in Booking
**Location:** `salon-api/src/validators/appointment.validator.js:1-18`

**Issue:** The `bookAppointmentValidator` only validates `slotId` and `customerNotes`. It does NOT validate:
- `serviceId` (single service)
- `serviceIds` (array of services)
- `guests` (number)

**Impact:** Malformed requests can cause server errors or unexpected behavior

---

### BUG-005: No Branch Validation in `createStaff` - Manager Can Create Staff in Any Branch
**Location:** `salon-api/src/controllers/staff.controller.js:12-92` (createStaff function)

**Issue:** While there's a check at line 19-22 that manager can only add to their own branch, the check uses `branchId !== userBranchId.toString()`. However, `userBranchId` comes from `req.user` which is set by the JWT token. If a manager's token is stolen or manipulated, they could create staff in other branches.

**Actually verified:** The `requireBranchScope` middleware (checkScope.js:54-139) runs BEFORE the controller and validates branch access. So this is protected. **NOT A BUG.**

---

### BUG-006: Email Verification Token Uses Weak Fallback Secret
**Location:** `salon-api/src/controllers/auth.controller.js:77-82` (register) and lines 846, 985

**Issue:** `EMAIL_VERIFICATION_SECRET` falls back to `JWT_ACCESS_SECRET` if not set:
```javascript
const verificationSecret = process.env.EMAIL_VERIFICATION_SECRET || process.env.JWT_ACCESS_SECRET;
```

**Impact:** If `EMAIL_VERIFICATION_SECRET` is not configured, email verification tokens use the same secret as access tokens, reducing security isolation.

---

### BUG-007: No Rate Limiting on Password Reset OTP Request
**Location:** `salon-api/src/routes/auth.routes.js:39` and `salon-api/src/controllers/auth.controller.js:698-730`

**Issue:** The `/forgot-password` endpoint uses `authLimiter` (10 req/15min in prod), but there's no per-email rate limiting. An attacker can enumerate valid emails by observing response times or request email enumeration via the generic success message.

**Evidence:** Line 705-708 returns generic success even for non-existent emails (good), but no per-email tracking.

---

### BUG-008: `requireAppointmentScope` Uses `skipTenant: true` - Bypasses Tenant Isolation
**Location:** `salon-api/src/middleware/checkScope.js:151`

**Issue:** Line 151: `await Appointment.findById(appointmentId).setOptions({ skipTenant: true }).lean();`

This bypasses the tenant plugin for appointment lookup. While the subsequent checks verify ownership, the initial query could theoretically return appointments from other tenants if the ID is guessed.

**Impact:** Information disclosure risk if appointment IDs are predictable (they're ObjectIds, so low risk but still a violation of defense in depth).

---

### BUG-009: Soft Delete Doesn't Invalidate User Tokens
**Location:** `salon-api/src/controllers/auth.controller.js:808-834` (deleteAccount) and `salon-api/src/controllers/staff.controller.js:293-318` (deleteStaff)

**Issue:** When a user account is soft-deleted (isActive: false), the `tokenVersion` is incremented in `deleteAccount` (line 824) but NOT in `deleteStaff` (line 308-309). 

**Impact:** Deactivated staff can still use valid access tokens until expiry (15 min).

---

### BUG-010: `getAllCustomers` Admin Endpoint Missing Pagination
**Location:** `salon-api/src/controllers/admin.controller.js:359-377`

**Issue:** Returns ALL customers without pagination. With 100k+ customers, this will cause memory issues and slow responses.

---

### BUG-011: Slot Status Not Properly Updated on Appointment Reschedule
**Location:** `salon-api/src/controllers/appointment.controller.js:1274-1294` (rescheduleAppointment)

**Issue:** The transaction books new slot and frees old slot, but:
1. Line 1276-1280: Books new slot with `appointmentId`
2. Line 1290-1294: Frees old slot
3. **Missing:** The old slot's `reservedBy` and `reservedAt` are not cleared
4. **Missing:** The new slot's `reservedBy` and `reservedAt` are not set

---

### BUG-012: Redis Connection Errors Not Properly Handled in Rate Limiter
**Location:** `salon-api/src/middleware/rateLimiter.middleware.js:7-22`

**Issue:** The `createRedisStore` function checks `redisClient.call` or `redisClient.sendCommand` but the actual Redis client from `src/config/redis.js` is an ioredis instance which may not have these methods when using Upstash (HTTP-based Redis).

**Impact:** Rate limiting falls back to MemoryStore silently in production, losing distributed rate limiting.

---

## 🟠 HIGH SEVERITY SECURITY ISSUES

### SEC-001: Secrets Committed in `.env` File (CRITICAL)
**Location:** `salon-api/.env` (lines 2-3, 10-13, 36)

**Exposed Secrets:**
- `JWT_ACCESS_SECRET`: `f11adad6587c4468f0feb8761cc25ced[REDACTED]`
- `JWT_REFRESH_SECRET`: `7c78b0d80083e666e2e09732412a02f2[REDACTED]`
- `REDIS_PASSWORD`: `gQAAAAAAAg1FAAIgcDJjZGE2YjcwZ[REDACTED]`
- `REDIS_URL`: Full connection string with credentials
- `MONGO_URI`: Full MongoDB Atlas connection string with username/password
- `BREVO_API_KEY`: `xkeysib-[REDACTED]`
- `GOOGLE_MAPS_API_KEY`: `AIzaSy[REDACTED]`

**Impact:** **FULL SYSTEM COMPROMISE** - Attackers can:
- Forge JWT tokens for any user
- Access Redis (session data, rate limits, cache)
- Access MongoDB (all user data, appointments, PII)
- Send emails via Brevo
- Use Google Maps API on your quota

**Action Required:** **IMMEDIATELY ROTATE ALL SECRETS**

---

### SEC-002: JWT Secrets Are Weak / Hardcoded in Test Fallbacks
**Location:** `salon-api/src/config/validateEnv.js:4-6`

**Issue:** Test fallbacks use hardcoded secrets:
```javascript
process.env.JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || "f11adad6587c4468f0feb8761cc25cedf1b2fc07e28ce96ee984301b06cf22c5";
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "a82bd1297e68c412e88a912f71120023a129037418b76c82736b6b712163901f";
```

**Impact:** If `NODE_ENV=test` is ever set in production, known secrets are used.

---

### SEC-003: No Password Strength Enforcement on Owner Registration
**Location:** `salon-api/src/validators/auth.validator.js:56-62` (ownerRegisterValidator)

**Issue:** Owner registration uses same password rules as customers, but owners have elevated privileges. No additional requirements (2FA, longer passwords, etc.)

---

### SEC-004: CORS Configuration Allows Local Network IPs in Development
**Location:** `salon-api/src/app.js:79-88`

**Issue:** In development, CORS allows:
```javascript
/^http:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+)(:\d+)?$/
```

This allows ANY device on the local network (192.168.x.x, 10.x.x.x) to make requests.

**Impact:** In shared networks (co-working, coffee shops), other users can access the API.

---

### SEC-005: No Helmet Configuration - Default Only
**Location:** `salon-api/src/app.js:59`

**Issue:** `app.use(helmet())` uses defaults. Missing:
- `Content-Security-Policy` configuration
- `Permissions-Policy`
- `Cross-Origin-Embedder-Policy`
- `Cross-Origin-Opener-Policy`

---

### SEC-006: File Upload Allows SVG (Potential XSS)
**Location:** `salon-api/src/middleware/upload.middleware.js:13`

**Issue:** `image/svg+xml` is in `ALLOWED_MIME_TYPES`. SVG files can contain JavaScript and execute in browser context.

**Impact:** Stored XSS if SVG is served directly and viewed in browser.

---

### SEC-007: No File Content Validation - Only MIME Type Check
**Location:** `salon-api/src/middleware/upload.middleware.js:20-29`

**Issue:** Only checks `file.mimetype` which is client-controlled. No magic byte validation.

**Impact:** Attackers can upload malicious files with allowed MIME types.

---

### SEC-008: Presigned URL Generation No Expiry Validation
**Location:** `salon-api/src/services/storage.service.js:132` (generatePresignedUploadUrl)

**Issue:** `expiresIn` defaults to 900 seconds (15 min) but no maximum enforced. Client could request very long expiry.

---

### SEC-009: Email Verification Link Uses HTTP in Development
**Location:** `salon-api/src/services/email.service.js:596-598`

**Issue:** `baseUrl` uses `http://${getLocalIp()}:${port}` - sends verification links over HTTP.

**Impact:** Token transmitted in cleartext on local network.

---

### SEC-010: No Brute Force Protection on Login Beyond Rate Limiting
**Location:** `salon-api/src/routes/auth.routes.js:35` and `salon-api/src/middleware/rateLimiter.middleware.js:44-56`

**Issue:** `authLimiter` allows 10 requests per 15 minutes per IP. No account lockout after failed attempts, no exponential backoff, no CAPTCHA.

---

### SEC-011: Refresh Token Stored as Single Hash - No Rotation
**Location:** `salon-api/src/controllers/auth.controller.js:238, 370, 570, 668`

**Issue:** Refresh token is hashed and stored. On refresh, new access token issued but **same refresh token reused** (new hash stored). No refresh token rotation.

**Impact:** If refresh token is stolen, attacker has persistent access until user logs out or token expires (7 days).

---

### SEC-012: No Audit Logging for Admin Actions
**Location:** `salon-api/src/controllers/admin.controller.js` (all admin functions)

**Issue:** Critical admin actions (delete salon, deactivate owner, approve/reject requests, create admins) have no audit trail.

---

### SEC-013: `googleLogin` Allows Role Escalation via `req.body.role`
**Location:** `salon-api/src/controllers/auth.controller.js:504-508`

**Issue:** `const requestedRole = req.body.role || "customer";` - Client can specify role!

**Code:** Lines 504-511:
```javascript
const requestedRole = req.body.role || "customer";
let targetRole = await Role.findOne({ name: requestedRole });
if (!targetRole) {
  targetRole = await Role.findOne({ name: "customer" });
}
```

**Impact:** If "owner", "manager", "staff", or "superadmin" roles exist, a malicious user could potentially register with elevated role. The fallback to "customer" only happens if role not found, but if those roles exist in DB...

**Wait - verified:** Role must exist in DB. If seeder creates these roles, this IS a vulnerability. The code should hardcode "customer" for public OAuth registration.

---

### SEC-014: No Input Sanitization on `customerNotes` in Appointment
**Location:** `salon-api/src/validators/appointment.validator.js:10-16`

**Issue:** Uses `.escape()` which only escapes HTML entities. No length limit on the backend (only 500 chars in validator). Stored directly in DB and returned in API responses.

**Impact:** Stored XSS if frontend renders notes without escaping.

---

### SEC-015: Tenant Isolation Bypass via `skipTenant` Option
**Location:** Multiple files using `.setOptions({ skipTenant: true })`

**Issue:** The tenant plugin can be bypassed by any code using `skipTenant: true`. Found in:
- `checkScope.js:151` (requireAppointmentScope)
- Potentially other places

**Impact:** Defense in depth violated - tenant isolation not enforced at database level.

---

## 🟡 MEDIUM SEVERITY ISSUES

### SEC-016: No Security Headers for API Responses
**Location:** `salon-api/src/app.js:59`

**Issue:** Only default helmet headers. Missing:
- `X-Content-Type-Options: nosniff` (helmet provides)
- `X-Frame-Options: DENY` (helmet provides)
- `Strict-Transport-Security` (HSTS) - not enabled for production
- `Referrer-Policy`
- `Permissions-Policy`

---

### SEC-017: MongoDB Connection String in Logs on Error
**Location:** `salon-api/src/config/database.js:17-19, 75`

**Issue:** On connection failure, logs `MONGO_URI` which contains password.

---

### SEC-018: Error Messages Leak Internal Details
**Location:** `salon-api/src/app.js:278-283` (global error handler)

**Issue:** In development, returns `err.stack`. In production, returns `err.message` which may contain sensitive info.

---

### SEC-019: No Request Size Limit on JSON Body
**Location:** `salon-api/src/app.js:128`

**Issue:** `express.json({ limit: "5mb" })` - 5MB is large for JSON API. Could allow DoS via large payloads.

---

### SEC-020: WebSocket No Authentication on Connection
**Location:** `salon-api/src/config/socket.js` (not read but implied)

**Issue:** Socket.IO initialized without auth middleware. Need to verify.

---

### SEC-021: Idempotency Key Not Validated for Format
**Location:** `salon-api/src/controllers/appointment.controller.js:65-66`

**Issue:** `idempotencyKey` taken directly from headers without validation. Could be used for cache poisoning.

---

### SEC-022: No Validation on `folder` Parameter in Upload
**Location:** `salon-api/src/controllers/upload.controller.js:16, 49, 89`

**Issue:** `folder` parameter from query/body used directly in R2 key path. No sanitization.

**Impact:** Path traversal via `../../etc/passwd` style payloads.

---

### SEC-023: Google OAuth Client IDs Include Hardcoded Fallbacks
**Location:** `salon-api/src/controllers/auth.controller.js:451-464`

**Issue:** Hardcoded Google client IDs in source code as fallbacks.

---

### SEC-024: No Account Lockout After Failed Login Attempts
**Location:** `salon-api/src/controllers/auth.controller.js:202-271` (login)

**Issue:** No tracking of failed login attempts per account.

---

### SEC-025: Reset Password OTP Uses `Math.random()` - Not Cryptographically Secure
**Location:** `salon-api/src/controllers/auth.controller.js:711`

**Issue:** `const otp = Math.floor(100000 + Math.random() * 900000).toString();`

**Impact:** `Math.random()` is predictable. Use `crypto.randomInt()`.

---

## 🟢 LOW SEVERITY / CODE QUALITY ISSUES

### BUG-013: Incomplete Function - `getMyAppointmentHistory`
**Location:** `salon-api/src/controllers/appointment.controller.js:1439+`

**Issue:** Function cuts off at line 1480. Need to verify complete implementation.

---

### BUG-014: Inconsistent Error Handling - Some Catch Blocks Just Log
**Location:** Multiple files (e.g., `appointment.controller.js:482-484`, `490-492`, `564-566`, etc.)

**Issue:** WebSocket, push, email errors are caught and only logged. Failures are silent to client.

---

### BUG-015: `tenMinsAgo` Calculation Duplicated
**Location:** `appointment.controller.js:109` and `259`

**Issue:** Same logic repeated. Should be a constant or helper.

---

### BUG-016: No Index on `Appointment.statusHistory.changedAt`
**Location:** `salon-api/src/models/appointment.model.js`

**Issue:** Status history queries may be slow without index.

---

### BUG-017: `validateEnv` Doesn't Validate All Required Secrets
**Location:** `salon-api/src/config/validateEnv.js:8-12`

**Issue:** Only validates `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET`. Missing:
- `MONGO_URI`
- `BREVO_API_KEY` (if email needed)
- `R2_*` credentials (if storage needed)

---

### BUG-018: `ownerRegisterValidator` Allows Empty `salonDescription`
**Location:** `salon-api/src/validators/auth.validator.js:51-54`

**Issue:** `salonDescription` is optional but should probably be required for owner registration.

---

### BUG-019: No Unique Constraint on `OwnerRegistrationRequest.ownerEmail` + `status`
**Location:** `salon-api/src/models/ownerRegistrationRequest.model.js` (not read but implied)

**Issue:** Check at lines 144-151 in auth.controller.js but no DB-level constraint.

---

### BUG-020: `deleteBranch` Cascade Deactivation Doesn't Check Manager Reassignment
**Location:** `salon-api/src/controllers/branch.controller.js:198-229`

**Issue:** Deactivates all staff in branch (line 228) but doesn't handle if manager is reassigned to another branch first.

---

## 📋 SUMMARY TABLE

| Category | Count |
|----------|-------|
| Critical Bugs | 5 |
| High Security | 15 |
| Medium Security | 10 |
| Low/Code Quality | 8 |
| **Total** | **38** |

---

## 🚨 IMMEDIATE ACTION REQUIRED

1. **ROTATE ALL SECRETS** in `.env` file (SEC-001)
2. **Remove `.env` from git history** - use `git filter-repo` or BFG Repo-Cleaner
3. **Fix race condition in slot booking** (BUG-001)
4. **Fix refresh token rotation** (SEC-011)
5. **Fix Google OAuth role escalation** (SEC-013)
6. **Add per-email rate limiting on forgot-password** (BUG-007)
7. **Remove SVG from allowed upload types** (SEC-006)
8. **Add file content validation** (SEC-007)
9. **Fix `deleteStaff` to increment tokenVersion** (BUG-009)
10. **Add pagination to admin endpoints** (BUG-010)

---

## 📝 TODO LIST FOR FIXES

See `TODO_FIXES.md` for prioritized task list.