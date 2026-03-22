# Salon Panel — Salon Management Platform

Internal management platform for Luxe Salon. Built for owners, managers, and staff to manage bookings, customers, services, schedules, and reports.

---

## Tech Stack

- [Next.js 14](https://nextjs.org) — App Router
- [TypeScript](https://www.typescriptlang.org)
- [Tailwind CSS v4](https://tailwindcss.com)
- [Lucide React](https://lucide.dev) — Icons

---

## Project Structure
```
apps/salon-panel/
│
├── app/                        # Next.js app router
│   ├── globals.css             # Global styles + Tailwind theme
│   ├── layout.tsx              # Root layout
│   └── page.tsx                # Entry point
│
├── components/
│   ├── layout/                 # AppShell, Sidebar, Header
│   ├── pages/                  # One file per page
│   └── ui/                     # Reusable primitives (Button, Card, Input, etc.)
│
├── lib/
│   ├── types.ts                # All TypeScript interfaces
│   ├── data.ts                 # Mock data (replace with API later)
│   └── utils.ts                # Formatting helpers
│
└── public/
```

---

## Getting Started

### Prerequisites

Make sure you have the following installed:

- [Node.js](https://nodejs.org) v18 or higher
- npm v9 or higher

### Installation

Navigate to the salon-panel app:
```bash
cd apps/salon-panel
```

Install dependencies:
```bash
npm install
```

### Running the Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Building for Production
```bash
npm run build
npm run start
```

---

## Demo Credentials

| Role    | Email                      | Password     |
|---------|----------------------------|--------------|
| Owner   | aria@luxesalon.com         | owner123     |
| Manager | marco@luxesalon.com        | manager123   |
| Staff   | jade@luxesalon.com         | staff123     |

---

## Role-Based Access

| Page            | Owner | Manager | Staff |
|-----------------|-------|---------|-------|
| Dashboard       | ✓     | ✓       | ✓     |
| Bookings        | ✓     | ✓       | ✓     |
| Customers       | ✓     | ✓       | ✓     |
| Services        | ✓     | ✓       | ✗     |
| Staff Schedule  | ✓     | ✓       | ✗     |
| Reports         | ✓     | ✗       | ✗     |
| Notifications   | ✓     | ✓       | ✓     |

---

## Connecting a Real Backend

All mock data lives in `lib/data.ts`. When your backend is ready:

1. Replace the exports in `lib/data.ts` with API calls
2. Update `lib/types.ts` if your API response shapes differ
3. No changes needed in components — they consume types, not raw data

---

## Monorepo Structure

This app is part of the `Salon-SaaS-Platform` monorepo:
```
Salon-SaaS-Platform/
├── apps/
│   ├── customer-app/       # Customer-facing app
│   └── salon-panel/        # This app — internal management
```