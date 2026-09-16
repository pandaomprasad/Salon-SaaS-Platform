# TODO: Bug Fixes & Security Hardening

**Priority Order:** Critical → High → Medium → Low

---

## 🔴 CRITICAL - Do First (Security Breaches)

### [ ] SEC-001: Rotate ALL Compromised Secrets
- [ ] Generate new `JWT_ACCESS_SECRET` (64 char hex)
- [ ] Generate new `JWT_REFRESH_SECRET` (64 char hex)
- [ ] Rotate MongoDB Atlas password & update `MONGO_URI`
- [ ] Rotate Upstash Redis password & update `REDIS_PASSWORD`/`REDIS_URL`
- [ ] Rotate Brevo API key (`BREVO_API_KEY`)
- [ ] Rotate Google Maps API key (`GOOGLE_MAPS_API_KEY`)
- [ ] Remove `.env` from git history using `git filter-repo` or BFG
- [ ] Add `.env` to `.gitignore` (verify it's there)
- [ ] Use `.env.example` for template only

### [ ] BUG-001: Fix Race Condition in Slot Booking
- [ ] Implement proper distributed lock (Redis SETNX) for slot acquisition
- [ ] OR use MongoDB transaction with proper retry logic
- [ ] Add unique compound index on `slotId` + `appointmentId` to prevent double booking at DB level
- [ ] Test with concurrent booking simulation

### [ ] SEC-011: Implement Refresh Token Rotation
- [ ] On `/auth/refresh`: Generate NEW refresh token, invalidate old one
- [ ] Store refresh token family/chain for detection of token reuse
- [ ] Add `refreshTokenVersion` or `refreshTokenId` to user model
- [ ] Implement refresh token blacklist for detected theft

### [ ] SEC-013: Fix Google OAuth Role Escalation
- [ ] Hardcode `role = "customer"` for public Google/Apple registration
- [ ] Remove `req.body.role` usage in `googleLogin` and `appleLogin`
- [ ] Only allow role assignment via admin/staff creation endpoints

---

## 🟠 HIGH - Security Hardening

### [ ] SEC-006: Remove SVG from Allowed Upload Types
- [ ] Remove `image/svg+xml` from `ALLOWED_MIME_TYPES` in `upload.middleware.js`
- [ ] Add server-side file signature validation (magic bytes)

### [ ] SEC-007: Add File Content Validation
- [ ] Install `file-type` or `magic-bytes.js` package
- [ ] Validate actual file content matches declared MIME type
- [ ] Reject files with mismatched signatures

### [ ] BUG-007: Add Per-Email Rate Limiting on Forgot Password
- [ ] Track requests per email in Redis (separate from IP-based)
- [ ] Limit to 3 requests per email per hour
- [ ] Return generic response always (already done)

### [ ] BUG-009: Fix deleteStaff Token Invalidation
- [ ] In `staff.controller.js:deleteStaff`, add `user.tokenVersion += 1` before save
- [ ] Return `tokenInvalidated: true` in response

### [ ] BUG-010: Add Pagination to Admin Endpoints
- [ ] `getAllCustomers` - add pagination (page, limit)
- [ ] `getAllOwners` - add pagination
- [ ] `getAllBookings` - already has pagination ✓
- [ ] `getActivity` - has limit but add page support

### [ ] SEC-004: Restrict CORS in Development
- [ ] Remove `192.168.x.x` and `10.x.x.x` from allowed origins regex
- [ ] Only allow explicit `ALLOWED_ORIGINS` + localhost

### [ ] SEC-005: Configure Helmet Properly
- [ ] Add CSP policy for API (restrict to same-origin)
- [ ] Enable HSTS for production
- [ ] Add Permissions-Policy header
- [ ] Add Cross-Origin-Opener-Policy

### [ ] SEC-014: Sanitize customerNotes Properly
- [ ] Use DOMPurify or similar on backend before storage
- [ ] Or ensure frontend always escapes on render
- [ ] Add maxlength enforcement at model level (already 300 in validator)

### [ ] SEC-025: Use Cryptographically Secure Random for OTP
- [ ] Replace `Math.random()` with `crypto.randomInt(100000, 999999)`
- [ ] In `auth.controller.js:forgotPassword`

### [ ] SEC-022: Sanitize Folder Parameter in Upload
- [ ] Validate `folder` parameter: alphanumeric, hyphens, underscores only
- [ ] Reject path traversal attempts (`..`, `/`, `\`)

---

## 🟡 MEDIUM - Improvements

### [ ] SEC-010: Add Brute Force Protection on Login
- [ ] Track failed attempts per email + IP in Redis
- [ ] Lock account for 15 min after 5 failed attempts
- [ ] Require CAPTCHA after 3 failed attempts
- [ ] Notify user on suspicious activity

### [ ] SEC-012: Add Audit Logging for Admin Actions
- [ ] Create `AuditLog` model
- [ ] Log: adminId, action, targetType, targetId, timestamp, metadata
- [ ] Apply to: salon CRUD, owner CRUD, user management, request approvals

### [ ] SEC-015: Remove skipTenant Usage or Harden
- [ ] Audit all `.setOptions({ skipTenant: true })` usages
- [ ] Remove where possible, add explicit authorization checks
- [ ] Consider making tenant plugin mandatory (no skip option)

### [ ] SEC-016: Add Missing Security Headers
- [ ] Configure HSTS for production (1 year, includeSubDomains, preload)
- [ ] Add Referrer-Policy: strict-origin-when-cross-origin
- [ ] Add Permissions-Policy for API endpoints

### [ ] SEC-017: Sanitize MongoDB URI from Logs
- [ ] In `database.js`, mask password in connection string before logging
- [ ] Use `new URL(uri).password = '***'` pattern

### [ ] SEC-018: Sanitize Error Messages in Production
- [ ] Create error code mapping (don't expose internal messages)
- [ ] Return generic "Internal server error" in production
- [ ] Log full details server-side only

### [ ] SEC-019: Reduce JSON Body Limit
- [ ] Change `express.json({ limit: "5mb" })` to `"1mb"` or `"500kb"`

### [ ] SEC-020: Verify WebSocket Authentication
- [ ] Read `socket.js` and ensure connection requires valid JWT
- [ ] Attach user to socket on connect
- [ ] Validate socket rooms match user's tenant scope

### [ ] SEC-021: Validate Idempotency Key Format
- [ ] Require UUID format or alphanumeric with length limits
- [ ] Reject malformed keys

### [ ] SEC-023: Remove Hardcoded Google Client IDs
- [ ] Move all Google client IDs to environment variables
- [ ] Remove fallbacks from source code

### [ ] SEC-024: Add Account Lockout on Failed Logins
- [ ] Track failed attempts per account in Redis
- [ ] Lock for 30 min after 10 failures
- [ ] Send alert email to user

---

## 🟢 LOW - Code Quality & Bug Fixes

### [ ] BUG-003: Complete `getMyAppointmentHistory` Function
- [ ] Read full function implementation
- [ ] Verify it returns proper pagination and stats
- [ ] Add missing query validation

### [ ] BUG-004: Add Validation for serviceIds and guests
- [ ] Update `appointment.validator.js` to validate:
  - `serviceId` (optional MongoId)
  - `serviceIds` (optional array of MongoIds, min 1)
  - `guests` (optional integer, min 1, max 10)

### [ ] BUG-006: Use Dedicated Email Verification Secret
- [ ] Add `EMAIL_VERIFICATION_SECRET` to `.env`
- [ ] Remove fallback to `JWT_ACCESS_SECRET`
- [ ] Rotate if currently using fallback

### [ ] BUG-008: Remove skipTenant from requireAppointmentScope
- [ ] Remove `.setOptions({ skipTenant: true })` from line 151
- [ ] Verify scope checks still work (they do explicit checks after)

### [ ] BUG-011: Fix Slot Status on Reschedule
- [ ] Clear `reservedBy`, `reservedAt` on old slot
- [ ] Set `reservedBy`, `reservedAt` on new slot
- [ ] Update in same transaction

### [ ] BUG-012: Fix Redis Rate Limiter for Upstash
- [ ] Verify Redis client methods for Upstash HTTP API
- [ ] Update `createRedisStore` to work with Upstash
- [ ] Test distributed rate limiting works

### [ ] BUG-013: Complete getMyAppointmentHistory
- [ ] Check if function is complete in source
- [ ] If truncated, restore full implementation

### [ ] BUG-014: Centralize Error Handling for Async Operations
- [ ] Create wrapper for WebSocket/push/email operations
- [ ] Standardize error logging with context
- [ ] Consider adding to monitoring/alerting

### [ ] BUG-015: Deduplicate tenMinsAgo Calculation
- [ ] Extract to constant or helper function
- [ ] Use in both booking and reschedule

### [ ] BUG-016: Add Index on Appointment Status History
- [ ] Add compound index: `statusHistory.changedAt: -1`

### [ ] BUG-017: Expand Environment Validation
- [ ] Add `MONGO_URI` to required secrets in `validateEnv.js`
- [ ] Add optional validation for email/storage configs

### [ ] BUG-018: Make salonDescription Required for Owner Registration
- [ ] Update `ownerRegisterValidator` to require `salonDescription`

### [ ] BUG-019: Add DB-Level Unique Constraint
- [ ] Add unique index on `OwnerRegistrationRequest.ownerEmail` + `status`
- [ ] Handle duplicate key error gracefully

### [ ] BUG-020: Handle Manager Reassignment in deleteBranch
- [ ] Before deactivating staff, check if manager exists
- [ ] Optionally reassign manager to another active branch
- [ ] Or prevent branch deletion if manager has no other branch

---

## 📦 DEPENDENCIES TO ADD

- [ ] `file-type` or `magic-bytes.js` - for file content validation
- [ ] `dompurify` (with `jsdom`) - for HTML sanitization
- [ ] `helmet` config packages if needed
- [ ] `express-rate-limit` Redis store fix for Upstash

---

## ✅ VERIFICATION CHECKLIST

After fixes, verify:
- [ ] All secrets rotated and not in git history
- [ ] Concurrent booking test passes (no double bookings)
- [ ] Refresh token rotation works (old token rejected after use)
- [ ] Google OAuth only creates customers
- [ ] File upload rejects SVG and validates content
- [ ] Admin endpoints paginated
- [ ] Rate limiting works per-email and per-IP
- [ ] Security headers present in responses
- [ ] Error messages sanitized in production
- [ ] Audit logs created for admin actions
- [ ] WebSocket requires authentication
- [ ] All tests pass