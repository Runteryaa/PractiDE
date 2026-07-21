# RunAuth Integration Plan & Status (PractiDE Client)

This document outlines the architecture, integration plan, and current progress for integrating **PractiDE** with the **RunAuth** identity provider.

---

## 1. Status & Progress

- [x] **Oracle Database Schema Setup**: `runauth_users`, `runauth_sessions`, and `runauth_apps` created on Oracle Autonomous DB.
- [x] **PractiDE App Registration**: Registered `practide-app-client` in `runauth_apps` with `redirect_uri: http://localhost:3000/api/auth/callback`.
- [ ] **RunAuth OAuth Server & UI**: Pending Cloudflare Worker deployment for RunAuth.
- [ ] **PractiDE Frontend Integration**: Pending "Login with RunAuth" button & callback route.

---

## 2. Integration Architecture

PractiDE acts as an OAuth 2.0 / OpenID Connect (OIDC) client application. When a user clicks **"Login with RunAuth"**, they are redirected to the external RunAuth login portal (Google-style SSO).

### Configuration Variables in PractiDE
- `RUNAUTH_CLIENT_ID`: `"practide-app-client"`
- `RUNAUTH_CLIENT_SECRET`: `"secret_practide_123"`
- `RUNAUTH_ISSUER_URL`: `"https://<runauth-worker-domain>"`
- `RUNAUTH_CALLBACK_URL`: `"http://localhost:3000/api/auth/callback"` (or production domain)

---

## 3. Implementation Steps (PractiDE Side)

### Step 1: Add "Login with RunAuth" Button
In [src/app/page.tsx](file:///C:/Users/Runterya/Desktop/practde/src/app/page.tsx), add a prominent "Login with RunAuth" button:
- Clicking the button generates a random `state` string stored in `sessionStorage`.
- Redirects the browser to:
  ```
  https://<runauth-domain>/oauth/authorize?client_id=practide-app-client&redirect_uri=http://localhost:3000/api/auth/callback&response_type=code&state=<state_val>&scope=openid profile email
  ```

### Step 2: Add Callback Route (`src/app/api/auth/callback/route.ts` or page)
- Handles the redirect back from RunAuth containing `code` and `state`.
- Validates the `state` against stored session value to prevent CSRF.
- Sends a backend request to RunAuth `/oauth/token` to exchange `code` + `client_secret` for JWT tokens.
- Retrieves user profile from `/oauth/userinfo`.
- Sets local session cookie/token and redirects user to PractiDE dashboard.

### Step 3: API Proxy & Session Verification ([worker.js](file:///C:/Users/Runterya/Desktop/practde/worker.js))
- PractiDE's Cloudflare Worker validates incoming RunAuth JWTs or session tokens on each API request.
- Integrates user data seamlessly with PractiDE's word history and learning progress in Oracle DB.
