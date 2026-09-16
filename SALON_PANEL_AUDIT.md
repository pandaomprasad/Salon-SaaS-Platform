# Salon Panel Security & Bug Audit Report

**Target Workspace:** `apps/salon-panel`  
**Date:** September 14, 2026  
**Auditor:** AI Systems Architect  
**Status:** Audit Completed — Fixes Pending Review  

---

## 🚨 Executive Summary

An in-depth security and architectural audit was conducted on the **Salon Panel** web application (`apps/salon-panel`). While the application features a modern UI and real backend integration for authentication, several **high-severity security vulnerabilities**, **plaintext data leaks**, and **mock fallback data inconsistencies** were identified.

---

## 🔴 1. Security Breach Possibilities & Vulnerabilities

### 1.1 Plaintext Credentials in Client-Side Bundle
- **Location:** `apps/salon-panel/lib/data.ts` (Lines 12–16)
- **Severity:** 🔴 **CRITICAL**
- **Vulnerability Details:** Hardcoded user objects (`USERS`) containing plaintext email and password combinations (`owner123`, `manager123`, `staff123`) are bundled into client-side JS output.
- **Risk:** Anyone inspecting the browser bundle or source map can steal test owner credentials.

### 1.2 JWT Tokens Stored in LocalStorage (XSS Risk)
- **Location:** `apps/salon-panel/lib/api-client.ts` (`tokenStorage` object)
- **Severity:** 🟠 **HIGH**
- **Vulnerability Details:** Access and refresh tokens are stored in `localStorage` (`salon_token` and `salon_refresh_token`). Any Cross-Site Scripting (XSS) flaw in third-party npm dependencies can read `localStorage` and exfiltrate user session tokens.
- **Remediation:** Transition token management to `HttpOnly`, `Secure`, `SameSite=Strict` cookies.

### 1.3 Missing Client-Side RBAC Guard on Sensitive Routes
- **Location:** `apps/salon-panel/app/` route handlers (`/reports`, `/services`, `/staff`, `/branch`)
- **Severity:** 🟡 **MEDIUM**
- **Vulnerability Details:** While backend API endpoints enforce role checks, client-side route navigation relies on visual hiding rather than strict Redux / Middleware route guards. A staff user can type `/reports` or `/branch` in the browser URL bar and view cached manager/owner UI state before API rejection occurs.

### 1.4 Unsanitized Rich Text Inputs / Notes
- **Location:** `apps/salon-panel/app/customers/page.tsx` & `app/bookings/page.tsx`
- **Severity:** 🟡 **MEDIUM**
- **Vulnerability Details:** Customer notes and service descriptions accept freeform HTML string inputs without sanitization (e.g. `DOMPurify`), creating potential Stored XSS vectors if malicious scripts are injected into customer notes.

---

## ⚡ 2. Functional Bugs & API Wiring Issues

### 2.1 Fallback to Mock Data Obscures Real API Failures
- **Location:** `apps/salon-panel/app/customers/page.tsx`, `services/page.tsx`, `staff/page.tsx`
- **Severity:** 🟠 **HIGH**
- **Bug Details:** When backend API calls fail (e.g., network timeout or server 500), pages silently fall back to static mock arrays (`CUSTOMERS`, `SERVICES`, `STAFF` from `lib/data.ts`). This tricks managers into editing static mock data instead of alerting them to real network/API failures.

### 2.2 Salon Owner Password Change Option Missing
- **Location:** `apps/salon-panel/app/branch/page.tsx` / Header Profile Dropdown
- **Severity:** 🟡 **MEDIUM**
- **Bug Details:** Salon owners lack a dedicated interface within the salon panel to change their account password or update operational account credentials without contacting platform superadmins.

### 2.3 Real-Time WebSocket Auth Reconnection Gap
- **Location:** `apps/salon-panel/lib/socket-client.ts`
- **Severity:** 🟡 **MEDIUM**
- **Bug Details:** When access tokens expire and are refreshed via 401 interceptor, active Socket.IO connections do not automatically update their handshake auth token, leading to silent real-time booking event dropouts until page reload.

---

## 📄 3. Summary Recommendation

Do **NOT** start fixing bugs immediately. Review the companion `SALON_PANEL_TODO.md` file for prioritized step-by-step remediation plan.
