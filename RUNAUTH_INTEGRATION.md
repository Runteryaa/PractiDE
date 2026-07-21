# RunAuth Integration Plan (PractiDE Client)

This document outlines the plan for modifying the **PractiDE** application to support Single Sign-On (SSO) login using the **RunAuth** identity provider.

---

## 1. Goal
Replace or augment the existing custom username/password login system in PractiDE with a standard **"Login with RunAuth"** flow.

---

## 2. Integration Architecture

PractiDE will act as an OAuth 2.0 / OpenID Connect client.

### Configuration Variables (To add to PractiDE)
- `RUNAUTH_CLIENT_ID`: `"practide"`
- `RUNAUTH_ISSUER_URL`: `"https://<runauth-domain>"`
- `RUNAUTH_CALLBACK_URL`: `"https://<practide-domain>/callback"` (or `http://localhost:3000/callback` in dev)

---

## 3. Implementation Steps

### Step 1: Add "Login with RunAuth" UI Button
In [src/app/page.tsx](file:///C:/Users/Runterya/Desktop/practde/src/app/page.tsx), update the Authentication Tab / Login Form to include a "Login with RunAuth" button:
- Clicking the button generates a random `state` (for CSRF protection, stored in `localStorage`).
- Redirects the browser to:
  ```
  https://<runauth-domain>/oauth/authorize?client_id=practide&redirect_uri=https://<practide-domain>/callback&response_type=code&state=<state_val>&scope=openid profile email
  ```

### Step 2: Create a Callback Page in Next.js
Create a new Next.js page at `src/app/callback/page.tsx`:
- This page handles the redirect from RunAuth.
- It parses the URL parameters: `code` and `state`.
- **Validation**: Verifies that the URL's `state` matches the `state` stored in `localStorage`.
- **Token Exchange**: Sends a POST request to PractiDE's backend API (`/v1/api/auth-callback`) with the `code`.
- **Session Initiation**: Once the backend validates the token, it stores the returned user details in local state / `localStorage` (`practide_user`) and redirects the user to the dashboard (`/` or list tab).

### Step 3: Update the Backend (worker.js)
Modify the API gateway [worker.js](file:///C:/Users/Runterya/Desktop/practde/worker.js):
- Add a new endpoint: `/v1/api/auth-callback` (POST).
- This endpoint exchanges the `code` for an access token by making a backend request to RunAuth's token endpoint:
  ```http
  POST https://<runauth-domain>/oauth/token
  Content-Type: application/json

  {
    "grant_type": "authorization_code",
    "code": "<auth_code>",
    "client_id": "practide",
    "client_secret": "<PRACTIDE_CLIENT_SECRET>",
    "redirect_uri": "https://<practide-domain>/callback"
  }
  ```
- Fetches user info from RunAuth's `/oauth/userinfo` using the received access token.
- Verifies the user in the Oracle database. If the user doesn't exist, automatically registers them.
- Establishes the session and returns the user payload (ID, Username) back to the frontend callback page.
- Deprecates the old local `/v1/api/login` and `/v1/api/register` endpoints, or keeps them as backup options.
