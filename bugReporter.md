# Bug Reporter — Salon SaaS Platform

Audit date: 2026-08-18 · App: `apps/customer-app` (React Native/Expo) + `salon-api` (Express/Mongo)

Status legend: `PENDING` · `FIXED` · `DEFERRED`

---

## 🔴 Critical

| # | Bug | Location | Status |
|---|-----|----------|--------|
| 1 | `calculateDistance` imported but never exported → Home tab crashes / Metro bundle error | `components/InteractiveMapModal.jsx:17,78` ↔ `services/locationService.js` | ✅ FIXED (haversine added) |

## 🟠 Major

| # | Bug | Location | Status |
|---|-----|----------|--------|
| 2 | Cancel booking is a silent no-op (prop mismatch `appointment`/`onSuccess` vs `booking`/`onConfirm`) | `screen/BookingsScreen.jsx:323` ↔ `components/CancelBookingModal.jsx:22` | ✅ FIXED (wired `booking`/`onConfirm` → `cancelAppointment`) |
| 3 | Reschedule never loads slots / never submits (same prop mismatch) | `screen/BookingsScreen.jsx:314` ↔ `components/RescheduleModal.jsx:16` | ✅ FIXED (wired `booking`/`onConfirm` → `rescheduleAppointment`) |
| 4 | Multi-service selection truncated to first service on booking submit | `navigation/AppNavigator.jsx:172` → `screen/BookingScreen.jsx:130` | ✅ FIXED (client) — `selectedServices` now forwarded through `AppNavigator` + login redirect; backend still books single `serviceId` (schema limitation, see note) |
| 5 | All appointment cards show ₹0.00 (reads `totalAmount`/`price`, backend stores `pricePaid`) | `screen/BookingsScreen.jsx:462` ↔ `salon-api/.../appointment.model.js:115` | ✅ FIXED (reads `pricePaid`) |
| 6 | Salon reviews are fabricated (hardcoded `DUMMY_REVIEWS`, fake 4.9/142) and salon-page review submit is local-only | `components/ReviewsSection.jsx:29` + `screen/SalonDetailScreen.jsx` | ✅ FIXED — real reviews fetched (`getBranchReviews`/`getSalonReviews`), real avg/count, empty state, fake Write-Review modal removed (no backend endpoint; verified reviews only via `POST /appointments/:id/review`) |
| 7 | "Call Salon" always dials hardcoded `9876543210` (backend field is `contactPhone`) | `screen/SalonDetailScreen.jsx:105`, `components/AppointmentDetailModal.jsx:315` | ✅ FIXED (`contactPhone` chain) |
| 8 | UTC date via `toISOString().split("T")[0]` → "No available slots" between 00:00–05:30 IST | `screen/BookingScreen.jsx:28`, `components/SlotPicker.jsx:14`, `components/RescheduleModal.jsx:17` | ✅ FIXED (`toLocalDateStr()` helper in `apiClient.js`) |
| 9 | Category chips send category as `search` (name-only filter) → "No studios found" | `screen/ExploreScreen.jsx:291`, `screen/AllSalonsScreen.jsx:57` | ✅ FIXED — new `category` filter in backend `browseSalons` (service-category → salon IDs), chips send `category` param |
| 10 | Quick Rebook navigates to `salons[0]` instead of the appointment's salon | `screen/homeScreen.jsx:167` | ✅ FIXED (resolves by `salonId` from loaded salons) |

## 🟡 Minor

| # | Bug | Location | Status |
|---|-----|----------|--------|
| 11 | Cancellation reason dropped (app sends `reason`, backend reads `note`) | `services/appointmentService.js:24` ↔ `salon-api/.../appointment.controller.js:576` | ✅ FIXED (sends `note`) |
| 12 | Google sign-in can fire duplicate login requests (unstable `loginWithGoogle` in effect deps) | `components/GoogleSignInModal.jsx:111` ↔ `context/AuthContext.jsx` | ✅ FIXED (stable `useCallback` + direct press trigger) |
| 13 | Edit Profile "Save Changes" is a fake `setTimeout`, phone hardcoded | `screen/EditProfileScreen.jsx:27` | ✅ FIXED (calls `authService.updateProfile` + `updateUser`) |
| 14 | Guest stepper has no effect (`guestCount` never sent) | `screen/BookingScreen.jsx:41,132` | ✅ FIXED (`guests` passed & validated by backend) |
| 15 | Dark mode: module-level `StyleSheet.create` freezes `C.*` tokens at import (light) — ~20 files never update in dark mode | `AppNavigator.jsx:266` pattern + screens/components | ✅ FIXED (`useTheme` hook + dynamic `theme` token state) |
| 16 | Hardcoded `<StatusBar style="light"/>` in App.js; dead `src/navigationn/` folder | `App.js:17`, `src/navigationn/` | ✅ FIXED (dynamic `<StatusBar>` in `AppNavigator.jsx`) |

---

## Changelog

- **#1 FIXED** — Added `calculateDistance(lat1,lng1,lat2,lng2)` (haversine, km) to `services/locationService.js`.
- **#2 FIXED** — `BookingsScreen` now passes `booking`/`onConfirm` to `CancelBookingModal`; cancel calls `appointmentService.cancelAppointment` and refreshes.
- **#3 FIXED** — `BookingsScreen` now passes `booking`/`onConfirm` to `RescheduleModal`; reschedule calls `appointmentService.rescheduleAppointment` and refreshes.
- **#4 FIXED (client)** — `AppNavigator` forwards `selectedServices` to `BookingScreen`; `BookingScreen` login redirect includes `selectedServices`. NOTE: backend `bookAppointment` + `appointment.model.js` still support a single `serviceId` — true multi-service booking is a backend limitation (deferred).
- **#5 FIXED** — `BookingsScreen` price now reads `pricePaid` (falls back to `totalAmount`/`price`).
- **#11 FIXED** — `cancelAppointment` sends `note` (backend reads `note`, stores in `cancellation.reason`).
- **#12 FIXED** — Stabilized `loginWithGoogle` with `useCallback` and decoupled Google OAuth trigger from effect re-render loop.
- **#13 FIXED** — `EditProfileScreen` calls `authService.updateProfile({ name, phone })` and updates session state cleanly.
- **#14 FIXED** — `BookingScreen` sends `guests: guestCount` and backend validates `guestCount`.
- **#15 FIXED** — Components use `useTheme` / dynamic tokens, preventing static color freezing.
- **#16 FIXED** — `AppNavigator` renders dynamic `<StatusBar barStyle={theme.statusBar}>` and dead `navigationn/` directory removed.