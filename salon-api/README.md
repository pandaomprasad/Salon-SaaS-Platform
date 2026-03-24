# Salon API

Multi-branch Salon Management REST API built with Node.js, Express, MongoDB and Redis.

## Features
- RBAC with 4 roles: Owner, Manager, Staff, Customer
- Multi-branch salon management
- Slot-based appointment booking
- Full appointment lifecycle
- Reports and analytics

## Tech Stack
- Node.js + Express
- MongoDB + Mongoose
- Redis (permission caching)
- JWT (access + refresh tokens)

## Getting Started

### Prerequisites
- Node.js v18+
- MongoDB
- Redis (optional for dev)

### Installation
```bash
git clone https://github.com/yourusername/salon-api.git
cd salon-api
npm install
cp .env.example .env
# fill in your .env values
npm run seed
npm run dev
```

### Test Accounts (after seeding)
| Role | Email | Password |
|---|---|---|
| Owner | owner@salon.com | Password@123 |
| Manager | manager@salon.com | Password@123 |
| Staff | staff@salon.com | Password@123 |
| Customer | customer@salon.com | Password@123 |

## API Endpoints

### Auth
| Method | Endpoint | Access |
|---|---|---|
| POST | /api/v1/auth/register | Public |
| POST | /api/v1/auth/login | Public |
| POST | /api/v1/auth/refresh | Public |
| POST | /api/v1/auth/logout | Protected |
| GET | /api/v1/auth/me | Protected |

### Salons
| Method | Endpoint | Access |
|---|---|---|
| POST | /api/v1/salons | Owner |
| GET | /api/v1/salons | Owner |
| GET | /api/v1/salons/:salonId | Owner |
| PATCH | /api/v1/salons/:salonId | Owner |
| DELETE | /api/v1/salons/:salonId | Owner |

### Branches
| Method | Endpoint | Access |
|---|---|---|
| POST | /api/v1/salons/:salonId/branches | Owner |
| GET | /api/v1/salons/:salonId/branches | Owner, Manager, Staff |
| GET | /api/v1/salons/:salonId/branches/:branchId | Owner, Manager, Staff |
| PATCH | /api/v1/salons/:salonId/branches/:branchId | Owner, Manager |
| DELETE | /api/v1/salons/:salonId/branches/:branchId | Owner |

### Staff
| Method | Endpoint | Access |
|---|---|---|
| POST | /api/v1/branches/:branchId/staff | Owner, Manager |
| GET | /api/v1/branches/:branchId/staff | Owner, Manager |
| GET | /api/v1/branches/:branchId/staff/:staffId | Owner, Manager |
| PATCH | /api/v1/branches/:branchId/staff/:staffId | Owner, Manager |
| DELETE | /api/v1/branches/:branchId/staff/:staffId | Owner, Manager |

### Services
| Method | Endpoint | Access |
|---|---|---|
| POST | /api/v1/branches/:branchId/services | Owner, Manager |
| GET | /api/v1/branches/:branchId/services | All |
| GET | /api/v1/branches/:branchId/services/:serviceId | All |
| PATCH | /api/v1/branches/:branchId/services/:serviceId | Owner, Manager |
| DELETE | /api/v1/branches/:branchId/services/:serviceId | Owner, Manager |
| PATCH | /api/v1/branches/:branchId/services/:serviceId/staff | Owner, Manager |

### Slots
| Method | Endpoint | Access |
|---|---|---|
| POST | /api/v1/branches/:branchId/slots/generate | Owner, Manager |
| GET | /api/v1/branches/:branchId/slots | All |
| PATCH | /api/v1/branches/:branchId/slots/:slotId/block | Owner, Manager, Staff |
| PATCH | /api/v1/branches/:branchId/slots/:slotId/unblock | Owner, Manager |

### Appointments
| Method | Endpoint | Access |
|---|---|---|
| POST | /api/v1/appointments | Customer |
| GET | /api/v1/appointments | All |
| GET | /api/v1/appointments/:appointmentId | All |
| PATCH | /api/v1/appointments/:appointmentId/status | All |
| PATCH | /api/v1/appointments/:appointmentId/rate | Customer |

### Reports
| Method | Endpoint | Access |
|---|---|---|
| GET | /api/v1/reports/overview | Owner, Manager |
| GET | /api/v1/reports/popular-services | Owner, Manager |
| GET | /api/v1/reports/staff-performance | Owner, Manager |
| GET | /api/v1/reports/daily-bookings | Owner, Manager |
| GET | /api/v1/reports/slot-utilization | Owner, Manager |