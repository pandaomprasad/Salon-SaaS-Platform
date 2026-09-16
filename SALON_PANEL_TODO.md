# Salon Panel Audit & Fixes - TODO List

## 🔴 PHASE 1: Critical Security Remediation (Do First)

- [ ] **Remove plaintext credentials from `apps/salon-panel/lib/data.ts`**
  - Delete `USERS` array containing `owner123`, `manager123`, `staff123`
  - Remove fallback mock login matching logic

- [ ] **Harden Session & Token Storage**
  - Transition access/refresh tokens to HttpOnly cookies or sanitize `localStorage` usage
  - Update `api-client.ts` 401 interceptor to re-authenticate active Socket.IO connections

- [ ] **Implement Strict Client-Side RBAC Route Guards**
  - Restrict `/reports` and `/branch` routes to `owner` and `manager` roles
  - Redirect unauthorized `staff` attempts back to `/dashboard` or `/schedule`

- [ ] **Add Input Sanitization**
  - Sanitize customer notes and service descriptions before rendering or submitting

---

## 🟠 PHASE 2: Core Functionality & API Wiring

- [ ] **Remove Mock Data Fallbacks**
  - Remove silent fallbacks to static mock arrays (`CUSTOMERS`, `SERVICES`, `STAFF`) on API failure
  - Display explicit error banners and retry buttons when API endpoints fail

- [ ] **Add Owner Account Password Change UI**
  - Create Account Settings modal or tab in `/branch` or Header dropdown
  - Wire `PATCH /api/v1/auth/change-password` endpoint

- [ ] **Real-Time Booking Sync Fix**
  - Re-authenticate Socket.IO handshake when access token refreshes
  - Ensure booking updates trigger instant UI updates without manual refresh

---

## 🟢 PHASE 3: Polish & Developer Experience

- [ ] Eliminate `any` types in `mapUser.ts` and `api-client.ts`
- [ ] Add loading skeletons on initial page hydration
- [ ] Run `npx tsc --noEmit` and verify 0 compilation errors
