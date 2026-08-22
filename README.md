# ✂️ ST CUT — Multi-Tenant Salon SaaS Platform

A modern, full-stack, multi-tenant SaaS platform built for luxury salon chains, barbershops, and spa wellness centers. The platform connects salon customers, salon managers, and platform superadmins across web and mobile experiences.

---

## 🌟 Platform Highlights & Key Features

- **📱 Customer Mobile App (React Native / Expo)**:
  - **Brahmapur Location Switcher**: Live location awareness with branch switching.
  - **Luxury Glassmorphic UI**: High-converting service selection, stylist cards, and gold brand accents.
  - **Verified Email Gate**: Secure OTP & token verification gate for customer appointment bookings.
  - **1-Tap Directions & Calling**: Native Apple / Google Maps turn-by-turn navigation launcher and direct phone dialer.
  - **Customer Ratings & Reviews**: 5-star rating breakdown bars and verified customer feedback.

- **💻 Salon Partner Panel (Next.js 14)**:
  - **Staff Shift Schedule Grid (`/schedule`)**: Visual timeline grid grouping slots by stylist (*Amit Das, Priya Mishra, Kiran Mohanty, Sneha Nayak*) with 1-tap block/unblock toggles.
  - **Cancellation Reason Modal & Slot Freeing**: Interactive manager cancellation modal with quick reason chips (*Customer requested, Stylist unavailable, Salon emergency*). Cancelling automatically resets slots back to `AVAILABLE` and clears caches instantly.
  - **Role-Based Access Control (RBAC)**: Distinct permissions for `owner`, `manager`, and `staff`.

- **🛡️ SuperAdmin Control Center (Next.js 14)**:
  - **Platform Metrics & Growth Charts**: Live overview of total salons, active branches, registered owners, staff count, and customer booking volume.
  - **Owner Approval Requests**: Review and approve new salon onboarding applications (`/approvals`).

- **⚡ Backend API & Cron Services (Node.js / Express / MongoDB / Redis / BullMQ)**:
  - **Brevo HTTP Email Dispatch**: Email verification links, Google OAuth welcome emails, booking receipts, and cancellation reason notices.
  - **Expo Push Notifications Engine**: High-priority remote push alerts sent to mobile devices on appointment status updates.
  - **Nightly Slot Cron Generator**: Runs automatically at midnight (`00:00`), generating 30 days ahead of bookable slots, while 1 AM cleanup (`01:00`) marks expired past slots as `COMPLETED`.

---

## 📂 Repository Structure

```text
Salon-SaaS-Platform/
├── salon-api/                   # Express.js REST API Backend
│   ├── src/
│   │   ├── controllers/         # Auth, Appointment, Slot, Browse, Admin controllers
│   │   ├── models/              # Mongoose schemas (User, Salon, Branch, Slot, Appointment)
│   │   ├── routes/              # Express API route declarations
│   │   └── services/            # Brevo Email, Expo Push, Redis, BullMQ services
│   ├── seed-brahmapur.js        # Automated Brahmapur location & seed data script
│   └── package.json
│
├── apps/
│   ├── customer-app/            # React Native / Expo Customer Application
│   │   ├── src/
│   │   │   ├── components/      # Glassmorphic UI components, ReviewsSection, SlotPicker
│   │   │   ├── screen/          # HomeScreen, SalonDetailScreen, BookingScreen, BookingsScreen
│   │   │   └── services/        # API client, Auth, Notification services
│   │   └── App.js
│   │
│   ├── salon-panel/             # Next.js 14 Web Portal for Salon Owners & Managers
│   │   ├── app/                 # Dashboard, Bookings, Schedule, Staff, Services pages
│   │   ├── components/          # BookingDrawer, CancellationReasonModal, BranchTopBar
│   │   └── hooks/               # useBranch hook for multi-branch state management
│   │
│   └── admin-panel/             # Next.js 14 SuperAdmin Platform Management Panel
│       └── app/                 # Platform Overview, Salons, Approvals, Growth charts
│
└── README.md
```

---

## 🚀 Quick Setup & Installation

### 1. Prerequisites
- **Node.js**: `v18.0.0` or higher
- **MongoDB**: Local URI (`mongodb://localhost:27017/salon_saas`) or Cloud Atlas Mongo URI
- **Redis**: Running on default port `6379` (for caching and BullMQ email queueing)

---

### 2. Environment Configuration

Create a `.env` file inside `salon-api/`:

```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/salon_saas
JWT_SECRET=your_jwt_secret_key_here
REDIS_URL=redis://localhost:6379

# Brevo HTTP Email Configuration
BREVO_API_KEY=your_brevo_api_key
EMAIL_FROM_NAME="ST CUT Luxury Salon"
EMAIL_FROM_ADDRESS="no-reply@stcut.com"
```

---

### 3. Database Seeding (Brahmapur Location)

Run the automated seeder script to populate database roles, superadmin, salons, branches, services, staff, and 7 days of bookable slots:

```bash
cd salon-api
node seed-brahmapur.js
```

**Default Demo Logins**:
- 🛡️ **SuperAdmin**: `admin@stcut.com` | `AdminPassword123!`
- 👑 **Salon Owner (Royal Cut)**: `royal.owner@stcut.com` | `OwnerPassword123!`
- 👔 **Branch Manager (Royal Cut)**: `royal.manager@stcut.com` | `ManagerPassword123!`

---

### 4. Running the Applications

#### ⚡ Start Backend API:
```bash
cd salon-api
npm run dev
# Running at http://localhost:5000
```

#### 📱 Start Customer Mobile App:
```bash
cd apps/customer-app
npm start
# Launches Expo Dev Tools
```

#### 💻 Start Salon Partner Panel:
```bash
cd apps/salon-panel
npm run dev
# Running at http://localhost:3001
```

#### 🛡️ Start SuperAdmin Panel:
```bash
cd apps/admin-panel
npm run dev
# Running at http://localhost:3002
```

---

## 🌐 Core API Service Endpoints

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `POST` | `/api/v1/auth/login` | User login (returns JWT token) | ❌ |
| `GET` | `/api/v1/browse/salons` | List active salons with locations | ❌ |
| `GET` | `/api/v1/browse/branches/:id/slots` | Fetch available customer slots | ❌ |
| `POST` | `/api/v1/appointments` | Book salon appointment | 🟢 Yes |
| `PATCH` | `/api/v1/appointments/:id/cancel` | Cancel appointment with reason | 🟢 Yes |
| `GET` | `/api/v1/branches/:id/slots` | Fetch staff schedule slots | 🟢 Yes |
| `PATCH` | `/api/v1/branches/:id/slots/:slotId/block` | Block staff slot for breaks | 🟢 Yes |
| `POST` | `/api/v1/customers/me/push-token` | Register Expo push token | 🟢 Yes |
| `GET` | `/api/v1/admin/stats` | SuperAdmin platform statistics | 🟢 Admin |

---

## 🔒 License & Copyright

© 2026 **ST CUT Luxury Salon SaaS Platform**. All rights reserved.
