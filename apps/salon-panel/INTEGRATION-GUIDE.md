# Salon Panel → Salon API: Integration Guide

Step-by-step instructions to connect your **salon-panel** frontend to the **salon-api** backend.
All files are provided — copy them to the matching paths in your project.

---

## Step 1 — Install dependencies

Your project already has Redux Toolkit and React-Redux. You only need to add **axios**:

```bash
cd apps/salon-panel
npm install axios
```

That's it — no new state management libraries needed.

---

## Step 2 — Add environment variable

Create (or update) `.env.local` in your `salon-panel` root:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
```

Change the URL when deploying to production.

---

## Step 3 — Copy the files

Copy each file from the downloaded folder to the matching path in your project.
Files marked **REPLACE** overwrite your existing file. Files marked **NEW** are additions.

### 3a. Core API client (NEW)

```
lib/api-client.ts  →  salon-panel/lib/api-client.ts
```

This is the backbone — an Axios instance that:
- Attaches `Authorization: Bearer <token>` to every request
- Auto-refreshes on 401 (queues parallel requests while refreshing)
- Uses your existing `localStorage` key (`"token"`)
- Adds a `"refreshToken"` key alongside it

### 3b. TypeScript types (NEW)

```
types/api.ts  →  salon-panel/types/api.ts
```

Every backend model typed: Salon, Branch, Staff, Service, Slot, Appointment, Reports.
Also includes `paiseToINR()` and `inrToPaise()` price helpers.

### 3c. API service files (NEW — one per resource)

```
api/services/authService.ts         →  REPLACE existing
api/services/salonService.ts        →  NEW
api/services/branchService.ts       →  NEW
api/services/staffService.ts        →  NEW
api/services/serviceService.ts      →  NEW
api/services/slotService.ts         →  NEW
api/services/appointmentService.ts  →  NEW
api/services/reportService.ts       →  NEW
api/services/browseService.ts       →  NEW
```

**Important:** The new `authService.ts` replaces your existing one. It keeps the
same function name (`loginSalon`) so your login page still works, but now uses
the centralized `apiClient` instead of raw fetch/axios.

### 3d. Redux store files (REPLACE)

```
store/index.ts            →  REPLACE existing
store/slices/authSlice.ts →  REPLACE existing
```

The updated authSlice:
- Keeps your existing `loginSuccess` action (backward compatible)
- Adds `loginThunk`, `hydrateAuth`, `logoutThunk` async thunks
- Adds `isLoading`, `error`, `salon` to state
- Stores both access + refresh tokens via `tokenStorage`

### 3e. Hooks (NEW)

```
hooks/useApi.ts  →  salon-panel/hooks/useApi.ts
```

Two hooks:
- `useFetch(fetcher, deps)` — auto-fetches on mount, returns `{ data, isLoading, error, refetch }`
- `useMutation(mutator)` — returns `{ mutate, isLoading, error, reset }`

### 3f. Updated app files (REPLACE)

```
app/providers.tsx    →  REPLACE existing
app/login/page.tsx   →  REPLACE existing
```

- `providers.tsx` now auto-hydrates auth session on mount (calls `/auth/me`)
- `login/page.tsx` now stores the refresh token alongside the access token

---

## Step 4 — Verify the file structure

After copying, your project should look like this (new/changed files marked with ✦):

```
salon-panel/
├── api/
│   └── services/
│       ├── authService.ts         ✦ replaced
│       ├── salonService.ts        ✦ new
│       ├── branchService.ts       ✦ new
│       ├── staffService.ts        ✦ new
│       ├── serviceService.ts      ✦ new
│       ├── slotService.ts         ✦ new
│       ├── appointmentService.ts  ✦ new
│       ├── reportService.ts       ✦ new
│       └── browseService.ts       ✦ new
├── app/
│   ├── providers.tsx              ✦ replaced
│   ├── login/
│   │   └── page.tsx               ✦ replaced
│   ├── dashboard/
│   │   └── page.tsx
│   └── layout.tsx
├── components/
├── hooks/
│   └── useApi.ts                  ✦ new
├── lib/
│   ├── api-client.ts              ✦ new
│   ├── types.ts                   (your existing types)
│   ├── mapUser.ts                 (your existing mapper)
│   └── utils.ts                   (your existing utils)
├── store/
│   ├── index.ts                   ✦ replaced
│   └── slices/
│       └── authSlice.ts           ✦ replaced
├── types/
│   └── api.ts                     ✦ new
└── .env.local                     ✦ new
```

---

## Step 5 — Start both servers

Terminal 1 — Backend:
```bash
cd salon-api
npm run dev
# → Running on http://localhost:5000
```

Terminal 2 — Frontend:
```bash
cd apps/salon-panel
npm run dev
# → Running on http://localhost:3000
```

---

## Step 6 — Test the connection

1. Open http://localhost:3000/login
2. Enter credentials (e.g. `owner@salon.com` / `Password@123` — or your seeded creds)
3. On success, you should be redirected to `/dashboard`
4. Refresh the page — session should persist (hydrated from stored token)

---

## How to use the services in your pages

### Fetch data (read)

```tsx
"use client";

import { useFetch } from "@/hooks/useApi";
import { getBranches } from "@/api/services/branchService";
import { useAppSelector } from "@/store";

export default function BranchesPage() {
  const salon = useAppSelector((s) => s.auth.salon);
  const { data: branches, isLoading, error, refetch } = useFetch(
    () => getBranches(salon!._id),
    [salon?._id],
  );

  if (isLoading) return <p>Loading...</p>;
  if (error) return <p className="text-red-500">{error.message}</p>;

  return (
    <ul>
      {branches?.map((b) => (
        <li key={b._id}>{b.name} — {b.address.city}</li>
      ))}
    </ul>
  );
}
```

### Create / Update / Delete (mutations)

```tsx
"use client";

import { useMutation } from "@/hooks/useApi";
import { createStaff } from "@/api/services/staffService";
import type { CreateStaffPayload } from "@/types/api";

export default function AddStaffButton({ branchId }: { branchId: string }) {
  const { mutate, isLoading, error } = useMutation(
    (payload: CreateStaffPayload) => createStaff(branchId, payload),
  );

  const handleAdd = async () => {
    try {
      const newStaff = await mutate({
        name: "New Stylist",
        email: "stylist@salon.com",
        password: "Password@123",
        role: "staff",
      });
      alert(`Created: ${newStaff.name}`);
    } catch {
      // error is already in `error` state
    }
  };

  return (
    <>
      {error && <p className="text-red-500 text-xs">{error.message}</p>}
      <button onClick={handleAdd} disabled={isLoading}>
        {isLoading ? "Adding..." : "Add Staff"}
      </button>
    </>
  );
}
```

### Appointments (with idempotency)

```tsx
import { bookAppointment } from "@/api/services/appointmentService";

// The Idempotency-Key header is auto-generated
const result = await bookAppointment({
  slotId: "...",
  serviceId: "...",
  customerNotes: "First visit",
});
```

### Reports

```tsx
import { useFetch } from "@/hooks/useApi";
import { getOverview } from "@/api/services/reportService";

const { data } = useFetch(
  () => getOverview({ startDate: "2026-04-01", endDate: "2026-04-30" }),
  [],
);

// data.appointments.total, data.revenue.display, etc.
```

### Public browse (no auth)

```tsx
import { browseBranches } from "@/api/services/browseService";

const { data } = useFetch(
  () => browseBranches({ city: "Mumbai" }),
  [],
);
```

---

## Quick reference: all services

| File                    | Functions                                                                 |
|-------------------------|---------------------------------------------------------------------------|
| `authService.ts`        | `loginSalon`, `registerCustomer`, `refreshToken`, `logoutSalon`, `getMe`  |
| `salonService.ts`       | `createSalon`, `getSalons`, `getSalon`, `updateSalon`, `deleteSalon`      |
| `branchService.ts`      | `createBranch`, `getBranches`, `getBranch`, `updateBranch`, `deleteBranch` |
| `staffService.ts`       | `createStaff`, `getStaffList`, `getStaffMember`, `updateStaff`, `deleteStaff`, `getStaffPermissions`, `updateStaffPermissions` |
| `serviceService.ts`     | `createService`, `getServices`, `getService`, `updateService`, `deleteService`, `assignStaffToService` |
| `slotService.ts`        | `generateSlots`, `getSlots`, `blockCheck`, `blockBulk`, `unblockBulk`, `blockSlot`, `unblockSlot` |
| `appointmentService.ts` | `bookAppointment`, `getAppointments`, `getAppointment`, `updateAppointmentStatus`, `rescheduleAppointment`, `rateAppointment` |
| `reportService.ts`      | `getOverview`, `getPopularServices`, `getStaffPerformance`, `getDailyBookings`, `getSlotUtilization` |
| `browseService.ts`      | `browseSalons`, `browseSalonById`, `browseBranches`, `browseBranchById`, `browseBranchSlots`, `browseBranchServices` |
