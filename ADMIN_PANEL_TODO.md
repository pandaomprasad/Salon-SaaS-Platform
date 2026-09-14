# Admin Panel Fixes - TODO List

## 🔴 PHASE 1: Critical Security Fixes (Do First)

### Authentication & Authorization
- [ ] **Remove hardcoded ADMIN_USERS from `apps/admin-panel/lib/data.ts`**
  - Delete lines 8-12 containing plaintext passwords
  - Remove demo credentials display from `LoginPage.tsx` (lines 89-107)

- [ ] **Implement real login flow in `LoginPage.tsx`**
  - Call `POST /api/v1/auth/login` with email/password
  - Store returned access/refresh tokens via `tokenStorage.setTokens()`
  - Dispatch `loginSuccess` with user data from response
  - Remove client-side `ADMIN_USERS.find()` logic

- [ ] **Fix `authSlice.ts` hydrateAuth**
  - Verify `/auth/me` returns correct admin user structure
  - Or create dedicated `/admin/me` endpoint
  - Handle token refresh on 401 before redirecting to login

- [ ] **Switch to HttpOnly cookies for token storage**
  - Modify backend to set HttpOnly, Secure, SameSite=Strict cookies
  - Update `api-client.ts` to not use localStorage for tokens
  - Remove `tokenStorage` object entirely

- [ ] **Add rate limiting to admin routes**
  - Apply `express-rate-limit` to `/api/v1/admin/*` routes
  - Stricter limits on mutating endpoints (POST/PATCH/DELETE)

- [ ] **Add CSRF protection**
  - Implement CSRF tokens for all mutating admin endpoints
  - Double-submit cookie pattern or synchronized token pattern

### Frontend Security
- [ ] **Add input validation/sanitization on all forms**
  - Use Zod schemas for: salon creation, announcement creation, admin creation
  - Sanitize HTML in announcement messages (DOMPurify)

- [ ] **Remove console logging from production api-client**
  - Remove or gate request duration logs behind `NODE_ENV === 'development'`

---

## 🟠 PHASE 2: Core Functionality - Wire Pages to API

### DashboardPage
- [ ] Create `useDashboardStats` hook calling `GET /api/v1/admin/stats`
- [ ] Create `useGrowthStats` hook calling `GET /api/v1/admin/growth`
- [ ] Create `useRecentActivity` hook calling `GET /api/v1/admin/activity`
- [ ] Replace static `SALONS`, `BOOKINGS`, `CUSTOMERS`, `STAFF`, `PLANS` imports with fetched data
- [ ] Add loading skeletons and error states
- [ ] Make date dynamic: `new Date().toLocaleDateString()`

### SalonsPage
- [ ] Create `useSalons` hook calling `GET /api/v1/admin/salons`
- [ ] Create `useCreateSalon` mutation calling `POST /api/v1/admin/salons`
  - Add `ownerPassword` field to modal form
  - Validate required fields before submit
- [ ] Create `useUpdateSalon` mutation calling `PATCH /api/v1/admin/salons/:salonId`
  - Wire "Disable/Enable" button to this mutation
  - Map frontend status (`active`/`inactive`/`suspended`) to backend (`isActive` + `deactivatedByAdmin`)
- [ ] Create `useDeleteSalon` mutation calling `DELETE /api/v1/admin/salons/:salonId`
- [ ] Add pagination support (backend needs to support it first)
- [ ] Add optimistic updates with rollback on error

### AdminsPage
- [ ] Create backend endpoint `POST /api/v1/admin/admins` (currently missing)
- [ ] Create backend endpoint `DELETE /api/v1/admin/admins/:id` (currently missing)
- [ ] Create `useAdmins` hook calling `GET /api/v1/admin/admins`
- [ ] Create `useCreateAdmin` mutation
  - Hash password on backend, never send plaintext from frontend
- [ ] Create `useDeleteAdmin` mutation
- [ ] Remove local state management, use server state

### AnnouncementsPage
- [ ] Verify banner endpoints: `GET/POST/PUT/DELETE /api/v1/admin/banners`
- [ ] Create `useAnnouncements` hook
- [ ] Create `useCreateAnnouncement` mutation
- [ ] Create `useUpdateAnnouncement` / `useDeleteAnnouncement` mutations
- [ ] Remove local state management

### CustomersPage
- [ ] Create `useCustomers` hook calling `GET /api/v1/admin/customers`
- [ ] Add pagination (backend needs `page`, `limit` params)
- [ ] Add search/filter params to API call

### StaffPage
- [ ] Create `useStaff` hook calling `GET /api/v1/admin/salons/:salonId/staff` (or new endpoint for all staff)
- [ ] Backend may need new endpoint for platform-wide staff listing
- [ ] Add pagination

### BookingsPage (CRITICAL BUG FIX)
- [ ] **Rename component from `CustomersPage` to `BookingsPage`**
- [ ] Import `BOOKINGS` type and create `useBookings` hook
- [ ] Call `GET /api/v1/admin/bookings` (new backend endpoint needed)
- [ ] Build booking table with correct columns: Customer, Salon, Staff, Service, Date, Time, Duration, Price, Status
- [ ] Add status filter (confirmed/pending/completed/cancelled)
- [ ] Add date range filter

### ReportsPage
- [ ] Create `useReports` hook calling `GET /api/v1/admin/reports` (new endpoint needed)
- [ ] Or compose from existing: stats, growth, salon list
- [ ] Add date range picker for report period

---

## 🟡 PHASE 3: Backend Enhancements

### New Endpoints Needed
- [ ] `POST /api/v1/admin/admins` - Create superadmin (restricted to existing superadmin)
- [ ] `DELETE /api/v1/admin/admins/:id` - Delete superadmin
- [ ] `GET /api/v1/admin/admins` - List superadmins
- [ ] `GET /api/v1/admin/bookings` - Platform-wide bookings with filters
- [ ] `GET /api/v1/admin/reports` - Aggregated analytics
- [ ] `GET /api/v1/admin/me` - Admin-specific profile (separate from `/auth/me`)

### Existing Endpoint Fixes
- [ ] Add pagination to `GET /api/v1/admin/customers`
- [ ] Add pagination to `GET /api/v1/admin/salons`
- [ ] Add transaction to `createSalon` (owner + salon atomic)
- [ ] In `deleteSalon`: also deactivate associated owner/staff users
- [ ] In `approveOwnerRequest`: verify `request.password` is hashed before storing
- [ ] Optimize `getActivity` with aggregation pipeline

### Security Hardening
- [ ] Validate JWT secrets are strong (min 32 chars) on startup
- [ ] Re-verify role from DB on sensitive admin actions (not just JWT)
- [ ] Add audit logging for all admin mutations
- [ ] Implement IP allowlist for admin panel access (optional)

---

## 🟢 PHASE 4: Polish & UX

### UI/UX Improvements
- [ ] Add loading states to all buttons during mutations
- [ ] Add toast notifications (success/error) using react-hot-toast or similar
- [ ] Add error boundaries to catch render errors
- [ ] Add confirmation dialogs for destructive actions (delete salon, delete admin)
- [ ] Implement optimistic updates with TanStack Query / SWR
- [ ] Add keyboard navigation and ARIA attributes for accessibility

### Code Quality
- [ ] Replace `any` types in `api-client.ts` with proper types
- [ ] Create shared TypeScript types for API responses
- [ ] Add ESLint rules for security (no-eval, no-implied-eval, etc.)
- [ ] Add unit tests for auth flow and critical mutations
- [ ] Add integration tests for admin endpoints

### Developer Experience
- [ ] Create `.env.example` for admin panel
- [ ] Document API contracts with OpenAPI/Swagger
- [ ] Add Storybook for UI components
- [ ] Set up CI/CD with lint, typecheck, test

---

## 📦 DEPENDENCIES TO ADD

```bash
# Frontend
npm install @tanstack/react-query react-hot-toast zod @hookform/resolvers react-hook-form
npm install -D @types/react-dom @testing-library/react jest

# Backend
npm install express-rate-limit csurf helmet
npm install -D @types/csurf
```

---

## 🎯 ACCEPTANCE CRITERIA PER PHASE

### Phase 1 Complete When:
- [ ] Login works against real backend
- [ ] No plaintext credentials in codebase
- [ ] Tokens in HttpOnly cookies
- [ ] Rate limiting active on all admin routes
- [ ] CSRF protection on mutating endpoints

### Phase 2 Complete When:
- [ ] All 8 pages fetch real data from API
- [ ] All mutations (create/update/delete) persist to backend
- [ ] BookingsPage shows actual bookings data
- [ ] Loading/error states on all async operations
- [ ] Pagination works on data tables

### Phase 3 Complete When:
- [ ] All new backend endpoints implemented and tested
- [ ] Existing endpoints hardened (transactions, cascade deactivation)
- [ ] Audit logging captures all admin actions
- [ ] OpenAPI docs generated

### Phase 4 Complete When:
- [ ] Zero TypeScript `any` in production code
- [ ] Test coverage > 80% for critical paths
- [ ] Accessibility audit passes (WCAG AA)
- [ ] Performance: dashboard loads < 2s on 3G

---

## 🔗 RELATED FILES TO MODIFY

### Frontend (apps/admin-panel/)
```
components/pages/
  ├── LoginPage.tsx           # Complete rewrite
  ├── DashboardPage.tsx       # Add data fetching hooks
  ├── SalonsPage.tsx          # Add mutations + API calls
  ├── AdminsPage.tsx          # Add mutations + API calls
  ├── AnnouncementsPage.tsx   # Add mutations + API calls
  ├── CustomersPage.tsx       # Add pagination + API
  ├── StaffPage.tsx           # Add API + pagination
  ├── BookingsPage.tsx        # COMPLETE REWRITE (was CustomersPage copy)
  └── ReportsPage.tsx         # Add API integration

lib/
  ├── api-client.ts           # Add token refresh, remove localStorage
  ├── hooks/                  # NEW: create custom hooks folder
  │   ├── useAuth.ts
  │   ├── useSalons.ts
  │   ├── useAdmins.ts
  │   ├── useAnnouncements.ts
  │   ├── useCustomers.ts
  │   ├── useStaff.ts
  │   ├── useBookings.ts
  │   └── useReports.ts
  └── validations/            # NEW: Zod schemas
      ├── salon.ts
      ├── admin.ts
      └── announcement.ts

store/slices/
  └── authSlice.ts            # Fix hydrateAuth, add login thunk
```

### Backend (salon-api/src/)
```
controllers/
  └── admin.controller.js     # Add transactions, fix approveOwnerRequest, add new endpoints

routes/
  └── admin.routes.js         # Add new routes, add rate limiting, CSRF

middleware/
  ├── authenticate.js         # Add DB role re-verification for sensitive actions
  ├── rateLimiter.js          # NEW: express-rate-limit config
  └── csrf.js                 # NEW: CSRF protection

models/
  └── OwnerRegistrationRequest.model.js  # Verify password hashing
```

---

## ⚠️ BLOCKERS & DEPENDENCIES

1. **Backend endpoints must exist before frontend hooks work** - Coordinate BE/FE work
2. **Auth system redesign affects both panels** - Salon panel also uses same auth middleware
3. **Database migrations needed** for new admin fields (if any)
4. **Environment variables** for JWT secrets, cookie settings, rate limit config
5. **CI/CD pipeline** must pass before deploying security fixes

---

## 📅 SUGGESTED TIMELINE

| Week | Focus |
|------|-------|
| 1 | Phase 1: Critical security (auth, tokens, rate limiting) |
| 2 | Phase 2: Dashboard, Salons, Admins pages |
| 3 | Phase 2: Announcements, Customers, Staff, Bookings, Reports |
| 4 | Phase 3: Backend endpoints, optimization, hardening |
| 5 | Phase 4: Polish, tests, accessibility, docs |

---

**Note:** This TODO assumes the backend API structure stays compatible. Some endpoints (like `/api/v1/admin/bookings`, `/api/v1/admin/admins`) need to be created. Coordinate with backend team before starting Phase 2.