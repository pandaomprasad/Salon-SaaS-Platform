# 💇 Salon API

<div align="center">

![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-4.x-000000?style=for-the-badge&logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-7.x-DC382D?style=for-the-badge&logo=redis&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-Auth-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white)

**Production-ready multi-branch salon management REST API**

[Features](#features) • [Architecture](#architecture) • [Getting Started](#getting-started) • [API Reference](#api-reference) • [RBAC](#rbac-model)

</div>

---

## Overview

Salon API is a fully-featured backend for managing multi-branch salon businesses. It supports multiple salon organizations, each with multiple branches, each with their own staff, services, pricing, and appointment slots.

Built to handle **10,000+ bookings per day** with atomic transactions, Redis caching, automatic slot generation, and a complete RBAC system.

---

## Features

### Core
- 🏢 **Multi-tenant** — one owner, multiple salons, multiple branches
- 👥 **RBAC** — 4 roles with granular `resource:action` permissions
- 🔐 **JWT Auth** — access + refresh tokens with token versioning
- 📅 **Slot-based Booking** — pre-generated time slots per staff member
- 📋 **Appointment Lifecycle** — PENDING → CONFIRMED → IN_PROGRESS → COMPLETED
- 📊 **Reports** — revenue, popular services, staff performance, daily bookings

### Production Ready
- ⚛️ **MongoDB Transactions** — atomic booking, no data corruption
- 🔄 **Idempotency Keys** — no duplicate bookings on retries
- ⏰ **Auto Slot Generation** — nightly cron generates 30 days of slots
- 🗑️ **Cascade Soft Delete** — deactivating branch cleans up all related data
- 🔒 **Scope Injection** — automatic tenant isolation via Mongoose plugin
- 💰 **Price Validation** — enforced paise format with clear error messages
- ⚡ **Redis Caching** — permission cache, idempotency keys
- 🛡️ **Security** — Helmet, CORS, rate limiting, input validation

---

## Architecture

```
salon-api/
├── src/
│   ├── config/
│   │   ├── database.js        # MongoDB connection
│   │   ├── redis.js           # Redis connection
│   │   └── cron.js            # Scheduled jobs
│   ├── models/
│   │   ├── permission.model.js
│   │   ├── role.model.js
│   │   ├── user.model.js
│   │   ├── salon.model.js
│   │   ├── branch.model.js
│   │   ├── service.model.js
│   │   ├── slot.model.js
│   │   └── appointment.model.js
│   ├── middleware/
│   │   ├── authenticate.js    # JWT verification + tenant context
│   │   ├── checkPermission.js # resource:action RBAC check
│   │   ├── checkScope.js      # salon/branch scope guard
│   │   ├── idempotency.js     # duplicate request prevention
│   │   └── validate.js        # express-validator error handler
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── salon.controller.js
│   │   ├── branch.controller.js
│   │   ├── staff.controller.js
│   │   ├── service.controller.js
│   │   ├── slot.controller.js
│   │   ├── appointment.controller.js
│   │   ├── browse.controller.js
│   │   └── report.controller.js
│   ├── routes/
│   ├── validators/
│   └── utils/
│       ├── AppError.js
│       ├── logger.js
│       ├── token.js
│       ├── permissionCache.js
│       ├── priceHelper.js
│       ├── slotGenerator.js
│       ├── autoSlotGenerator.js
│       ├── tenantContext.js
│       └── tenantPlugin.js
└── app.js
```

---

## RBAC Model

### Roles

| Role | Scope | Description |
|---|---|---|
| `owner` | All salons they own | Full control over their salon organization |
| `manager` | Single branch | Manages one branch — staff, services, slots, appointments |
| `staff` | Single branch | Views their schedule, updates appointment progress |
| `customer` | None | Books and manages their own appointments |

### Permissions

Format: `resource:action`

| Resource | Actions | Who |
|---|---|---|
| `salon` | create, read, update, delete | owner |
| `branch` | create, read, update, delete | owner, manager (read/update) |
| `staff` | create, read, update, delete | owner, manager |
| `manager` | create, read, update, delete | owner |
| `service` | create, read, update, delete | owner, manager |
| `slot` | create, read, update, delete | owner, manager, staff (read) |
| `appointment` | create, read, update, delete | all roles |
| `report` | read | owner, manager |

### User-Level Overrides

Individual users can have extra or denied permissions on top of their role:

```json
{
  "extraPermissions": ["report:read"],
  "deniedPermissions": ["staff:delete"]
}
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB Atlas (or local replica set)
- Redis (optional for development)

### Installation

```bash
# clone the repo
git clone https://github.com/yourusername/salon-api.git
cd salon-api

# install dependencies
npm install

# copy environment file
cp .env.example .env
```

### Environment Variables

```env
# Server
PORT=5000
NODE_ENV=development

# MongoDB — Atlas recommended (transactions require replica set)
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/salon-api

# JWT
JWT_ACCESS_SECRET=your_super_secret_access_key
JWT_REFRESH_SECRET=your_super_secret_refresh_key
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d

# Redis
REDIS_ENABLED=true
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100

# Pricing — ALL prices in paise (1 INR = 100 paise)
# Send 50000 for ₹500, not 500
```

### Seed Database

```bash
npm run seed
```

Creates roles, permissions, and test accounts:

| Role | Email | Password |
|---|---|---|
| Owner | owner@salon.com | Password@123 |
| Manager | manager@salon.com | Password@123 |
| Staff | staff@salon.com | Password@123 |
| Customer | customer@salon.com | Password@123 |

### Run

```bash
# development
npm run dev

# production
npm start
```

---

## API Reference

### Base URL
```
http://localhost:5000/api/v1
```

### Authentication

All protected routes require:
```
Authorization: Bearer <accessToken>
```

Booking also requires:
```
Idempotency-Key: <uuid-v4>
```

---

### Auth Routes

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/auth/register` | Public | Register as customer |
| POST | `/auth/login` | Public | Login — returns access + refresh token |
| POST | `/auth/refresh` | Public | Refresh access token |
| POST | `/auth/logout` | Protected | Invalidate refresh token |
| GET | `/auth/me` | Protected | Get current user profile |

#### Login Response
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "...",
      "name": "Test Owner",
      "email": "owner@salon.com",
      "role": "owner",
      "salonId": "...",
      "branchId": null
    },
    "accessToken": "eyJ...",
    "refreshToken": "eyJ..."
  }
}
```

---

### Public Browse Routes (No Auth)

| Method | Endpoint | Description |
|---|---|---|
| GET | `/browse/salons` | Browse all salons |
| GET | `/browse/salons?search=glamour` | Search by name |
| GET | `/browse/salons/:salonId` | Single salon + branches |
| GET | `/browse/branches` | Browse all branches |
| GET | `/browse/branches?city=Mumbai` | Filter by city |
| GET | `/browse/branches?category=hair` | Filter by service category |
| GET | `/browse/branches?date=2026-04-01` | Filter by availability |
| GET | `/browse/branches/:branchId` | Single branch + services |
| GET | `/browse/branches/:branchId/slots?date=YYYY-MM-DD` | Available slots grouped by staff |
| GET | `/browse/branches/:branchId/services` | Branch services |

---

### Salon Routes

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/salons` | Owner | Create salon |
| GET | `/salons` | Owner | Get my salons |
| GET | `/salons/:salonId` | Owner | Get single salon |
| PATCH | `/salons/:salonId` | Owner | Update salon |
| DELETE | `/salons/:salonId` | Owner | Soft delete salon |

---

### Branch Routes

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/salons/:salonId/branches` | Owner | Create branch |
| GET | `/salons/:salonId/branches` | Owner, Manager, Staff | List branches |
| GET | `/salons/:salonId/branches/:branchId` | Owner, Manager, Staff | Get branch |
| PATCH | `/salons/:salonId/branches/:branchId` | Owner, Manager | Update branch |
| DELETE | `/salons/:salonId/branches/:branchId` | Owner | Soft delete + cascade |

#### Delete Branch — Cascade
Deactivating a branch automatically:
- Deactivates all services
- Blocks all available slots
- Deactivates all staff and managers
- Blocks if active appointments exist

---

### Staff Routes

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/branches/:branchId/staff` | Owner, Manager | Add staff/manager |
| GET | `/branches/:branchId/staff` | Owner, Manager | List staff |
| GET | `/branches/:branchId/staff/:staffId` | Owner, Manager | Get staff member |
| PATCH | `/branches/:branchId/staff/:staffId` | Owner, Manager | Update staff |
| DELETE | `/branches/:branchId/staff/:staffId` | Owner, Manager | Deactivate staff |
| GET | `/branches/:branchId/staff/:staffId/permissions` | Owner | View permissions |
| PATCH | `/branches/:branchId/staff/:staffId/permissions` | Owner | Update permissions |

#### Update Permissions
```json
{
  "extraPermissions": ["report:read"],
  "deniedPermissions": ["staff:delete"]
}
```

---

### Service Routes

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/branches/:branchId/services` | Owner, Manager | Create service |
| GET | `/branches/:branchId/services` | All | List services |
| GET | `/branches/:branchId/services/:serviceId` | All | Get service |
| PATCH | `/branches/:branchId/services/:serviceId` | Owner, Manager | Update service |
| DELETE | `/branches/:branchId/services/:serviceId` | Owner, Manager | Soft delete |
| PATCH | `/branches/:branchId/services/:serviceId/staff` | Owner, Manager | Assign eligible staff |

#### Price Format
All prices in **paise** (1 INR = 100 paise):
```json
{
  "price": 50000
}
```
`50000 paise = ₹500`

---

### Slot Routes

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/branches/:branchId/slots/generate` | Owner, Manager | Generate slots for date range |
| GET | `/branches/:branchId/slots?date=YYYY-MM-DD` | All | View slots |
| POST | `/branches/:branchId/slots/block-check` | Owner, Manager | Preview block impact |
| POST | `/branches/:branchId/slots/block-bulk` | Owner, Manager | Block slots in bulk |
| POST | `/branches/:branchId/slots/unblock-bulk` | Owner, Manager | Unblock slots |
| PATCH | `/branches/:branchId/slots/:slotId/block` | Owner, Manager, Staff | Block single slot |
| PATCH | `/branches/:branchId/slots/:slotId/unblock` | Owner, Manager | Unblock single slot |

#### Generate Slots
```json
{
  "staffId": "...",
  "startDate": "2026-04-01",
  "endDate": "2026-04-30"
}
```

#### Block Bulk — Step 1: Check impact
```json
{
  "staffId": "...",
  "date": "2026-04-05"
}
```

Response shows affected slots and booked appointments with reassignment options.

#### Block Bulk — Step 2: Confirm
```json
{
  "staffId": "...",
  "date": "2026-04-05",
  "reason": "Sick leave",
  "bookedSlotAction": "cancel"
}
```

Or reassign booked appointments:
```json
{
  "staffId": "...",
  "date": "2026-04-05",
  "reason": "Emergency leave",
  "bookedSlotAction": "reassign",
  "reassignStaffId": "..."
}
```

---

### Appointment Routes

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/appointments` | Customer | Book appointment |
| GET | `/appointments` | All | List appointments (role-filtered) |
| GET | `/appointments/:appointmentId` | All | Get appointment |
| PATCH | `/appointments/:appointmentId/status` | All | Update status |
| PATCH | `/appointments/:appointmentId/reschedule` | Customer, Manager | Reschedule |
| PATCH | `/appointments/:appointmentId/rate` | Customer | Rate completed appointment |

#### Booking — requires Idempotency-Key header
```
POST /api/v1/appointments
Authorization: Bearer <customerToken>
Idempotency-Key: 123e4567-e89b-4d3c-a456-426614174000
Content-Type: application/json

{
  "slotId": "...",
  "serviceId": "...",
  "customerNotes": "Optional notes"
}
```

#### Appointment Lifecycle

```
PENDING → CONFIRMED → IN_PROGRESS → COMPLETED
                   ↘ CANCELLED
                                  ↘ NO_SHOW
```

| Status | Who can trigger |
|---|---|
| PENDING | Created on booking |
| CONFIRMED | Manager, Owner |
| IN_PROGRESS | Staff |
| COMPLETED | Staff |
| CANCELLED | Customer (PENDING/CONFIRMED only), Manager, Owner |
| NO_SHOW | Manager, Owner |

#### Reschedule
```json
{
  "newSlotId": "...",
  "reason": "Something came up"
}
```

Manager can also change service and staff:
```json
{
  "newSlotId": "...",
  "newServiceId": "...",
  "reason": "Customer requested service change"
}
```

---

### Report Routes

| Method | Endpoint | Access | Query Params |
|---|---|---|---|
| GET | `/reports/overview` | Owner, Manager | `startDate`, `endDate` |
| GET | `/reports/popular-services` | Owner, Manager | `startDate`, `endDate`, `limit` |
| GET | `/reports/staff-performance` | Owner, Manager | `startDate`, `endDate` |
| GET | `/reports/daily-bookings` | Owner, Manager | `startDate`, `endDate` |
| GET | `/reports/slot-utilization` | Owner, Manager | `date` |

#### Overview Response
```json
{
  "period": { "startDate": "2026-04-01", "endDate": "2026-04-30" },
  "appointments": {
    "total": 450,
    "completed": 380,
    "cancelled": 30,
    "pending": 20,
    "confirmed": 15,
    "noShow": 5,
    "completionRate": "84.4%"
  },
  "revenue": {
    "total": 19000000,
    "display": "₹1,90,000.00"
  }
}
```

---

## Automated Jobs

| Job | Schedule | Description |
|---|---|---|
| Slot generation | Every night 12:00 AM | Generates slots for next 30 days for all active staff |
| Slot cleanup | Every night 1:00 AM | Marks past available slots as COMPLETED |

---

## Security

| Feature | Implementation |
|---|---|
| Password hashing | bcryptjs — 12 salt rounds |
| JWT signing | RS256 with separate access/refresh secrets |
| Token invalidation | tokenVersion field — increment to revoke all tokens |
| Rate limiting | 100 requests per 15 minutes per IP |
| Input validation | express-validator on all routes |
| Security headers | Helmet.js |
| Tenant isolation | Automatic scope injection via Mongoose plugin |
| Idempotency | Redis-backed duplicate request prevention |

---

## Error Responses

All errors follow this format:
```json
{
  "success": false,
  "message": "Error description"
}
```

Validation errors:
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    { "field": "email", "message": "Must be a valid email" },
    { "field": "price", "message": "Price must be in paise" }
  ]
}
```

### HTTP Status Codes

| Code | Meaning |
|---|---|
| 200 | Success |
| 201 | Created |
| 400 | Bad request / validation error |
| 401 | Unauthorized — invalid or expired token |
| 403 | Forbidden — valid token but no permission |
| 404 | Resource not found |
| 500 | Internal server error |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js 18+ |
| Framework | Express.js 4.x |
| Database | MongoDB Atlas + Mongoose |
| Cache | Redis + ioredis |
| Auth | JWT (jsonwebtoken) |
| Validation | express-validator |
| Scheduling | node-cron |
| Logging | Winston + Morgan |
| Security | Helmet, CORS, bcryptjs |

---

## License

MIT