# Admin Panel Security & Bug Audit Report

**Date:** 2026-09-14  
**Project:** Salon SaaS Platform - Admin Panel  
**Auditor:** opencode AI  

---

## Executive Summary

The admin panel has **critical security vulnerabilities** and **functional bugs** that prevent it from working as a real administrative interface. The frontend is entirely mock-based with no actual API integration, authentication is client-side only with hardcoded credentials, and several pages have copy-paste bugs.

---

## 🔴 CRITICAL SECURITY VULNERABILITIES

### 1. Client-Side Only Authentication (CWE-287)
**File:** `apps/admin-panel/components/pages/LoginPage.tsx:20-33`  
**File:** `apps/admin-panel/lib/data.ts:8-12`  

- Authentication happens entirely in-browser against a hardcoded `ADMIN_USERS` array
- Passwords stored in plain text: `admin123`, `sara456`, `dev789`
- No API call to backend for verification
- Anyone can bypass login by setting `isAuthenticated: true` in Redux store or localStorage
- **Impact:** Complete authentication bypass, unauthorized admin access

### 2. Plain Text Credentials in Source Code (CWE-798)
**File:** `apps/admin-panel/lib/data.ts:8-12`  
```typescript
export const ADMIN_USERS: AdminUser[] = [
  { id: 'a1', name: 'Rohan Mehta', email: 'rohan@salonhq.com', password: 'admin123', initials: 'RM' },
  { id: 'a2', name: 'Sara Iyer',   email: 'sara@salonhq.com',  password: 'sara456',  initials: 'SI' },
  { id: 'a3', name: 'Dev Kapoor',  email: 'dev@salonhq.com',   password: 'dev789',   initials: 'DK' },
]
```
- Weak passwords (`admin123`, `sara456`, `dev789`)
- Credentials bundled in production JavaScript
- Demo credentials displayed on login page for anyone to see

### 3. No Server-Side Authorization Enforcement on Frontend Actions
**Files:** All page components (`SalonsPage.tsx`, `AdminsPage.tsx`, `AnnouncementsPage.tsx`, etc.)  
- All mutating operations (create, update, delete) only update local React state
- No API calls to backend endpoints
- Backend has proper RBAC (`admin.routes.js:8-13`) but frontend never uses it
- **Impact:** Frontend appears functional but persists nothing

### 4. Tokens Stored in localStorage (CWE-922)
**File:** `apps/admin-panel/lib/api-client.ts:5-22`  
- Access and refresh tokens stored in `localStorage`
- Vulnerable to XSS attacks
- No HttpOnly cookie option implemented
- No token refresh logic on 401 - just clears tokens and redirects

### 5. JWT Role Trust Without Re-verification
**File:** `salon-api/src/middleware/authenticate.js:78`  
- Role name extracted from JWT payload (`decoded.role`) without DB re-verification
- If JWT secret is compromised, attacker can forge `superadmin` role
- Comment acknowledges this: "role name comes from the JWT payload (signed at login), so we avoid a second DB query"

### 6. No Rate Limiting on Admin Endpoints
**File:** `salon-api/src/routes/admin.routes.js`  
- All admin endpoints lack rate limiting
- Brute force, enumeration, and DoS possible

### 7. No CSRF Protection
- No CSRF tokens on mutating endpoints
- State-changing operations vulnerable to CSRF

### 8. Password in Request Body (CWE-521)
**File:** `salon-api/src/controllers/admin.controller.js:103, 123, 277, 293`  
- `createSalon`, `createOwner`, `approveOwnerRequest` accept plaintext passwords in request body
- While bcrypt hashes them, transmission over non-HTTPS would expose credentials

### 9. Owner Registration Request Stores Plaintext Password
**File:** `salon-api/src/controllers/auth.controller.js:163-171`  
- `registerOwner` stores submitted password in `OwnerRegistrationRequest` model
- Need to verify if model hashes it (not checked in audit)

### 10. Google/Apple OAuth Role Parameter Manipulation
**File:** `salon-api/src/controllers/auth.controller.js:504-508`  
- `requestedRole` taken from `req.body.role` with default "customer"
- Could be manipulated to request elevated roles if validation missing

---

## 🟠 HIGH SEVERITY BUGS

### 11. BookingsPage Shows Customers Data (Copy-Paste Bug)
**File:** `apps/admin-panel/components/pages/BookingsPage.tsx:15`  
```typescript
export default function CustomersPage() {  // <-- WRONG NAME
```
- Component named `CustomersPage` but file is `BookingsPage.tsx`
- Uses `CUSTOMERS` data instead of `BOOKINGS` data
- Imports `CUSTOMERS` from `@/lib/data` but not `BOOKINGS`
- **Impact:** Bookings page displays customer table instead of bookings

### 12. Dashboard Uses Only Static Mock Data
**File:** `apps/admin-panel/components/pages/DashboardPage.tsx:3-4`  
- Imports `SALONS`, `BOOKINGS`, `CUSTOMERS`, `STAFF`, `PLANS` from `@/lib/data`
- No API calls to fetch real-time data
- Hardcoded date: `"Sunday, 22 March 2026"` (line 61)
- **Impact:** Dashboard shows stale/fake data

### 13. SalonsPage - No API Integration for Any Action
**File:** `apps/admin-panel/components/pages/SalonsPage.tsx`  
- `toggleStatus()` only updates local state (lines 51-62)
- "Add Salon" modal submits nothing (lines 251-284)
- No calls to `/api/v1/admin/salons` endpoints
- **Impact:** Salon management is non-functional

### 14. AdminsPage - No API Integration, Stores Passwords in State
**File:** `apps/admin-panel/components/pages/AdminsPage.tsx:20-38`  
- `handleAdd()` creates admin in local state with plaintext password
- No API call to backend
- Password stored in Redux state and potentially localStorage via persist

### 15. AnnouncementsPage - No API Integration
**File:** `apps/admin-panel/components/pages/AnnouncementsPage.tsx:44-58`  
- `handleSend()` only updates local state
- No call to banner/admin announcement endpoints

### 16. authSlice hydrateAuth Calls Non-Existent /auth/me for Admin
**File:** `apps/admin-panel/store/slices/authSlice.ts:25-40`  
- Calls `apiClient.get("/auth/me")` expecting `superadmin` role
- But admin panel login never gets real tokens from backend
- The `/auth/me` endpoint returns salon-panel user data, not admin panel user

### 17. api-client.ts No Token Refresh on 401
**File:** `apps/admin-panel/lib/api-client.ts:65-68`  
```typescript
if (error.response?.status === 401) {
  tokenStorage.clearTokens();
  if (typeof window !== "undefined") window.location.href = "/login";
}
```
- Immediately clears tokens and redirects instead of attempting refresh
- Causes logout loops if access token expires but refresh token valid

---

## 🟡 MEDIUM SEVERITY BUGS

### 18. SalonsPage Status Toggle Doesn't Handle 'suspended'
**File:** `apps/admin-panel/components/pages/SalonsPage.tsx:54`  
```typescript
const next: SalonStatus = s.status === 'active' ? 'inactive' : 'active'
```
- Only toggles between `active` ↔ `inactive`
- `suspended` status never reachable via UI
- Backend supports `deactivatedByAdmin` flag separately

### 19. Inconsistent Status Values Between Frontend/Backend
- Frontend: `'active' | 'inactive' | 'suspended'`
- Backend: `isActive: boolean` + `deactivatedByAdmin: boolean` + `adminDeactivationReason`
- Mapping logic missing

### 20. No Input Validation/Sanitization in Forms
**Files:** All page components with forms  
- Announcement title/message, salon name, owner details, admin credentials
- Direct use in state without sanitization
- Potential XSS if data rendered unsafely (though React auto-escapes)

### 21. Hardcoded Demo Credentials Visible in Login UI
**File:** `apps/admin-panel/components/pages/LoginPage.tsx:89-107`  
- All admin emails and passwords displayed as clickable buttons
- Anyone accessing login page sees full credentials

### 22. No Pagination on Data Tables
**Files:** `SalonsPage.tsx`, `CustomersPage.tsx`, `StaffPage.tsx`  
- All data loaded at once in state
- Will break with large datasets

### 23. Salon Creation Modal Missing Required Fields
**File:** `apps/admin-panel/components/pages/SalonsPage.tsx:258-274`  
- Missing: `ownerPassword` field (required by backend `createSalon`)
- Backend requires `ownerPassword` (line 103 in admin.controller.js)

### 24. No Error Boundaries or Error Handling in UI
- API errors would crash components
- No user-friendly error display

---

## 🟢 LOW SEVERITY / CODE QUALITY

### 25. Duplicate Code: CustomersPage and BookingsPage
**Files:** `CustomersPage.tsx` vs `BookingsPage.tsx`  
- `BookingsPage.tsx` is exact copy of `CustomersPage.tsx` with wrong component name

### 26. Unused Imports
**File:** `BookingsPage.tsx:4` imports `CUSTOMERS` but should import `BOOKINGS`

### 27. TypeScript `any` Usage
**File:** `api-client.ts:30, 42` - `(config as any)._startTime`

### 28. Console Logging in Production Code
**File:** `api-client.ts:48-50, 61-63` - Logs every API request duration

### 29. Inconsistent Date Handling
- Some dates as ISO strings, some as formatted strings
- No centralized date utility for API serialization

### 30. Missing Loading States on Mutations
- Buttons don't show loading during async operations
- No optimistic updates with rollback on failure

---

## 📋 BACKEND ISSUES (Admin Controller)

### 31. createSalon - No Transaction for Owner+Salon Creation
**File:** `salon-api/src/controllers/admin.controller.js:101-148`  
- Creates owner, then salon, then links them
- If salon creation fails, owner orphaned
- Should use MongoDB transaction

### 32. approveOwnerRequest - Double Hash Bypass
**File:** `salon-api/src/controllers/admin.controller.js:640-654`  
```javascript
// Creates user WITHOUT password, then uses findByIdAndUpdate to set hashed password
const owner = await User.create({ ... })  // password not passed
await User.findByIdAndUpdate(owner._id, { password: request.password }) // bypasses pre-save hook
```
- Clever but fragile - relies on `request.password` being pre-hashed
- If request.password not hashed, stores plaintext

### 33. deleteSalon - Soft Delete Doesn't Deactivate Users
**File:** `salon-api/src/controllers/admin.controller.js:220-250`  
- Deactivates salon and branches
- Doesn't deactivate owner/staff users
- They can still log in but have no active salon

### 34. getAllCustomers - No Pagination
**File:** `salon-api/src/controllers/admin.controller.js:362-377`  
- Returns all customers without pagination
- Will cause memory issues at scale

### 35. getActivity - Inefficient Query Pattern
**File:** `salon-api/src/controllers/admin.controller.js:454-527`  
- Fetches appointments, users, salons separately then merges in memory
- No database-level sorting/limiting on combined result
- N+1 potential with populates

---

## 📊 SUMMARY TABLE

| Severity | Count | Category |
|----------|-------|----------|
| 🔴 Critical | 10 | Security |
| 🟠 High | 7 | Functional Bugs |
| 🟡 Medium | 7 | Functional Bugs |
| 🟢 Low | 5 | Code Quality |

**Total Issues Found: 29**

---

## 🎯 IMMEDIATE ACTION REQUIRED

1. **Implement real authentication flow** - Connect LoginPage to backend `/auth/login`
2. **Remove hardcoded credentials** from `data.ts` and `LoginPage.tsx`
3. **Wire all pages to API endpoints** - Replace local state mutations with API calls
4. **Fix BookingsPage** - Use actual bookings data and correct component name
5. **Add token refresh logic** in api-client interceptor
6. **Implement HttpOnly cookies** for token storage
7. **Add rate limiting** to admin routes
8. **Add CSRF protection**

---

## 📝 RECOMMENDED ARCHITECTURE CHANGES

1. **Backend-for-Frontend (BFF) pattern** - Admin panel should have its own auth endpoints returning admin-specific tokens
2. **Server-side rendering for auth pages** - Login page should not expose credentials in bundle
3. **React Query / SWR** - For server state management instead of local useState
4. **Zod validation** - Schema validation on all forms before API calls
5. **Error boundary + toast notifications** - Global error handling