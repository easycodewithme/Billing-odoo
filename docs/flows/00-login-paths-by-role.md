# Login paths: admin, internal staff, and portal customer

There is **one login screen** and **one login API** for every role. **Authorization** is determined **after** login from the **`role`** field on the user record returned by the server and embedded in the JWT cookie payload.

## Shared mechanics

1. User opens **`/login`** ([`LoginPage.jsx`](../../client/src/pages/LoginPage.jsx)).
2. Form posts **`POST /api/auth/login`** with `{ email, password }` ([`auth.api.js`](../../client/src/api/auth.api.js)).
3. Server ([`auth.controller.js`](../../server/src/controllers/auth.controller.js)):
   - Looks up user by email.
   - Compares password with **bcrypt**.
   - Rejects inactive accounts (`isActive: false`) with **403**.
   - Issues **access** + **refresh** JWTs as **httpOnly cookies**.
   - Returns JSON **`user`** object **without** `password`.
4. Client **`AuthContext.login`** ([`AuthContext.jsx`](../../client/src/contexts/AuthContext.jsx)) stores `user` in React state and navigates to **`/dashboard`**.

Refresh on expiry: [`axios.js`](../../client/src/api/axios.js) calls **`POST /api/auth/refresh`** using the refresh cookie.

## Admin login

- **Account**: created by seed or manual DB/process with `role: 'admin'` (seed: `admin@example.com` / `Admin@123` in [`seed.js`](../../server/prisma/seed.js)).
- **After login**: same redirect to `/dashboard`. Sidebar shows **Users** ([`Sidebar.jsx`](../../client/src/components/layout/Sidebar.jsx) `adminOnly`).
- **API**: can call **all** routes allowed to admin (e.g. `POST /api/users`, `PATCH /api/invoices/:id/cancel`, `DELETE /api/products/:id`, discount/tax mutations, user deactivate).

## Internal user login

- **Account**: only **`admin`** can create via **`POST /api/users`** (role forced to `internal_user`). Seed: `internal@example.com` / `Internal@123`.
- **After login**: dashboard and reports work (same as admin for most operational modules).
- **Differences**: e.g. **invoice cancel** is **admin-only**; **product delete** is **admin-only**; **discount/tax writes** are **admin-only**—internal may still **read** discounts and **list** users per routes.

## Portal (customer) login

- **Account**: from **`/signup`** (`portal_user`) or seed customers (`customer1@example.com` / `Portal@123`).
- **After login**: same **`/dashboard`** route, but **report APIs** return **403** (see [Reports and dashboard](09-reports-and-dashboard.md)).
- **Operational pages** are visible in the nav; **mutations** for subscriptions/invoices/payments typically **403**. See [Portal user experience](11-portal-user-experience.md).

## Quick comparison table

| Aspect | Admin | Internal | Portal |
|--------|-------|----------|--------|
| Login endpoint | `/api/auth/login` | same | same |
| Cookie session | JWT access + refresh | same | same |
| `GET /api/auth/me` | yes | yes | yes |
| Dashboard data load | reports OK | reports OK | **403** on reports |
| Create internal user | yes | no | no |
| Create subscription | yes | yes | **no** (route guard) |

## Signup (portal only)

**`/signup`** → **`POST /api/auth/signup`** always creates **`portal_user`**. There is **no** public signup path for admin/internal (by design).

## Logout

**`POST /api/auth/logout`** clears cookies; context clears `user` and routes to **`/login`**.
