# Authentication flow

## Business behavior

- **Signup** creates a new **portal** customer account (`role: portal_user`).
- **Login** accepts email + password; inactive users (`isActive: false`) are rejected with 403.
- **Session** is stateless JWT: tokens are not stored server-side in a session table; validity is cryptographic + expiry.
- **Forgot password** always returns the same success message whether the email exists (avoids account enumeration). A **reset token** and **expiry** (1 hour) are stored on the user; a link points to `CLIENT_URL/reset-password?token=…`.
- **Reset password** accepts `token` + `newPassword`, validates token not expired, hashes password, clears token fields.

## Server routes

| Method | Path | Middleware | Handler |
|--------|------|------------|---------|
| POST | `/api/auth/signup` | `validate(signupSchema)` | `auth.controller.signup` |
| POST | `/api/auth/login` | `validate(loginSchema)` | `auth.controller.login` |
| POST | `/api/auth/logout` | — | `auth.controller.logout` (clears cookies) |
| POST | `/api/auth/refresh` | — | `auth.controller.refresh` (reads `refreshToken` cookie) |
| POST | `/api/auth/forgot-password` | `validate(forgotPasswordSchema)` | `auth.controller.forgotPassword` |
| POST | `/api/auth/reset-password` | `validate(resetPasswordSchema)` | `auth.controller.resetPassword` |
| GET | `/api/auth/me` | `authenticate` | `auth.controller.me` |

File: [`server/src/routes/auth.routes.js`](../../server/src/routes/auth.routes.js).

## Cookies and JWT

Defined in [`server/src/controllers/auth.controller.js`](../../server/src/controllers/auth.controller.js):

- **`accessToken`**: short TTL (default **15 minutes** from env `JWT_ACCESS_EXPIRY`), signed with `JWT_SECRET`, payload includes `id`, `email`, `role`.
- **`refreshToken`**: longer TTL (default **7 days**), signed with `JWT_REFRESH_SECRET`, payload `{ id }`.
- Options: `httpOnly: true`, `sameSite: 'lax'`, `secure` when `NODE_ENV === 'production'`, `path: '/'`.

Token creation/verification helpers: [`server/src/services/auth.service.js`](../../server/src/services/auth.service.js) (`hashPassword`, `comparePassword`, `generateAccessToken`, `generateRefreshToken`, `verifyToken`).

## Authenticated requests

[`server/src/middleware/auth.js`](../../server/src/middleware/auth.js):

1. Read `req.cookies.accessToken`.
2. Verify with `JWT_SECRET`.
3. Load user from DB (`id`, `fullName`, `email`, `role`, `isActive`, …).
4. Reject if missing, invalid, inactive.
5. Set `req.user` for downstream handlers.

**No Bearer header** is required by default—the app is **cookie-first**.

## Validation (password rules)

[`server/src/validators/auth.validator.js`](../../server/src/validators/auth.validator.js) enforces strong passwords (length, upper, lower, number, special character) aligned with typical hackathon PDF rules.

## Email

Password reset calls [`server/src/services/email.service.js`](../../server/src/services/email.service.js). Implementation depends on env (e.g. Resend); if not configured, behavior may log or no-op—check that file for the current project state.

## Client flow

| Step | Code |
|------|------|
| App load | [`AuthContext`](../../client/src/contexts/AuthContext.jsx) calls `getMe()` → `GET /api/auth/me`; sets `user` or null. |
| Login page | [`LoginPage`](../../client/src/pages/LoginPage.jsx) → [`LoginForm`](../../client/src/components/auth/LoginForm.jsx) → `login(email, password)` from context → `POST /api/auth/login`. |
| Signup | [`SignupPage`](../../client/src/pages/SignupPage.jsx) → `signupUser` → `POST /api/auth/signup`. |
| Logout | Context `logout()` → `POST /api/auth/logout` → clear local `user` → navigate `/login`. |
| 401 retry | [`client/src/api/axios.js`](../../client/src/api/axios.js) interceptor posts `/auth/refresh` then retries the failed request. |

Public routes in [`AppRouter`](../../client/src/router/AppRouter.jsx): `/login`, `/signup`, `/reset-password`. Everything under `ProtectedRoute` requires a resolved `user` from `getMe`/login.

## Mental model for judges

“We use **JWT in httpOnly cookies** for XSS resistance, **short access** + **long refresh**, **bcrypt** for passwords, and **Joi** on the wire. **Refresh** rotates the access cookie without storing server-side sessions.”
