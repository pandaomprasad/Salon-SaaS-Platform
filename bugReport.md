# 🐛 Bug Report & Authentication System Audit

**Project**: Salon SaaS Platform  
**Target App**: `apps/customer-app` & `salon-api`  
**Date**: August 21, 2026  
**Status**: Resolved & Audited  

---

## 1. Executive Summary

During testing of the **Preview Build App**, Google Sign-In failed with the following screen:
- **Error Title**: `Access blocked: Authorisation error`
- **Details**: `You can't sign in to this app because it doesn't comply with Google's OAuth 2.0 policy for keeping apps secure.`
- **Error Code**: `Error 400: invalid_request`

An audit was performed across `apps/customer-app` (React Native/Expo), `salon-api` (Express/MongoDB backend), `eas.json`, and `app.json`. The root cause was identified, fixed, and verified.

---

## 2. Root Cause Analysis & Resolution

### 🔴 Root Cause
In `apps/customer-app/src/components/GoogleSignInModal.jsx`:
1. The app was manually constructing a Google OAuth authorization URL (`https://accounts.google.com/o/oauth2/v2/auth`).
2. The URL hardcoded the **Web Application Client ID** (`EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`) with a **custom native scheme redirect URI** (`customerapp://`).
3. **Google's OAuth 2.0 Security Policy (OOB & Custom Scheme Enforcement)** explicitly blocks Web Application Client IDs from using custom URI schemes like `customerapp://`.

### 🟢 Fix Applied
1. **Refactored `GoogleSignInModal.jsx`**:
   - Replaced manual URL construction with Expo's standard `expo-auth-session/providers/google` (`Google.useAuthRequest`) hook.
   - Configured multi-platform client ID resolution:
     - **Android**: `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID` (`23232568516-744mk3m6va3up35md674td07vdqseqnh.apps.googleusercontent.com`)
     - **Web**: `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` (`23232568516-arksroglu4uhc0ogqm94uh3e6cbln9lv.apps.googleusercontent.com`)
   - Uses PKCE authorization code exchange automatically on Android to obtain and pass the verified `idToken` to `salon-api`.

2. **File Link**:
   - Modified file: [GoogleSignInModal.jsx](file:///c:/Users/Lenovo/OneDrive/Desktop/Salon-Project/Salon-SaaS-Platform/apps/customer-app/src/components/GoogleSignInModal.jsx)

---

## 3. Component & Configuration Audit Results

| Component / File | Audit Item | Status | Notes |
| :--- | :--- | :--- | :--- |
| `apps/customer-app/src/components/GoogleSignInModal.jsx` | Google OAuth Hook & Redirect URI | 🟢 **FIXED** | Uses `Google.useAuthRequest` with PKCE code exchange |
| `apps/customer-app/src/context/AuthContext.jsx` | `loginWithGoogle` method | 🟢 **VALIDATED** | Extracts `accessToken` & `user`, stores token in local storage |
| `apps/customer-app/src/services/authService.js` | API endpoint invocation | 🟢 **VALIDATED** | Correctly posts `{ idToken }` to `/auth/google` |
| `apps/customer-app/eas.json` | Preview & Production Env Vars | 🟢 **VALIDATED** | Both `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` and `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID` declared |
| `apps/customer-app/app.json` | Expo Scheme & Package Name | 🟢 **VALIDATED** | `scheme: "customerapp"`, `package: "com.omprasad.customerapp"` |
| `salon-api/src/controllers/auth.controller.js` | Backend Google Token Verification | 🟢 **VALIDATED** | Verifies `idToken` using `google-auth-library` against registered client IDs |

---

## 4. Required EAS Preview Build Step (Android SHA-1)

For Android Standalone / Preview APK builds generated via EAS:
1. Run `eas credentials` in terminal and select `Android` -> `preview` build profile to view your keystore details.
2. Copy the **SHA-1 fingerprint**.
3. Register the SHA-1 fingerprint under Android package `com.omprasad.customerapp` in your **Firebase Console** / **Google Cloud Console**.

---

## 5. Full-Phase Authentication Roadmap Progress

Referring to [full_phase_auth_todo.md](file:///C:/Users/Lenovo/.gemini/antigravity-ide/brain/ff5aad61-7468-4326-80b6-73f068d4b186/full_phase_auth_todo.md):

- [x] **Google Sign-In Integration** *(Resolved)*
- [ ] **Dual Token System (Access + Refresh Tokens)** *(Next Step)*
- [ ] **Hardware Secure Storage (`expo-secure-store`)**
- [ ] **Forgot & Reset Password Flow**
- [ ] **Apple Sign-In Integration (App Store Requirement)**
- [ ] **Email Verification**
- [ ] **Account Deletion / Delete Account Endpoint**

---

### End of Report
