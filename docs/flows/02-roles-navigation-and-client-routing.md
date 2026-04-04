# Roles, navigation, and client routing

## Three roles (domain)

| Role | Typical use |
|------|-------------|
| `admin` | Full configuration: delete products, cancel invoices, manage discounts/taxes CRUD, create internal users, deactivate users, delete uploads. |
| `internal_user` | Day-to-day operations: create/edit subscriptions, invoices, payments, catalog (with limits—e.g. cannot delete products unless admin per routes). |
| `portal_user` | Customer / subscriber account from **public signup**. |

Enum in Prisma: [`schema.prisma`](../../server/prisma/schema.prisma) `enum Role`.

## Server authorization pattern

[`server/src/middleware/role.js`](../../server/src/middleware/role.js) exports `authorize(...roles)`:

- Requires `req.user` (so **`authenticate` must run first**).
- If `req.user.role` is not in the allowed list → **403** JSON `{ message: 'You do not have permission…' }`.

**Important**: Many **read** endpoints use only `authenticate`, not `authorize`. So any logged-in role may call them—there is **no automatic “portal sees only own rows”** filter in list controllers. See [Portal user experience](11-portal-user-experience.md).

## Route-level matrix (summary)

The following is a **practical summary**; always confirm in each `server/src/routes/*.js` file.

| Area | Typical read access | Typical write access |
|------|---------------------|----------------------|
| Auth | Public signup/login; `me` needs auth | Logout/refresh: any caller with cookie |
| Subscriptions | Any authenticated user can **GET** list/detail | **POST/PUT/PATCH/order-lines**: `admin`, `internal_user` |
| Invoices | Any authenticated **GET** | Generate/confirm/send: `admin`, `internal_user`; **cancel**: `admin` only |
| Payments | Any authenticated **GET** | **Manual** payment: `admin`, `internal_user`; checkout stub: any auth |
| Products / plans | Any authenticated **GET** | Create/update: `admin`, `internal_user`; **delete** product: `admin` |
| Quotation templates | **GET** list/detail: `admin`, `internal_user` | Create/update: same; **delete**: `admin` |
| Discounts | **GET**: `admin`, `internal_user` | **POST/PUT/DELETE** + attach routes: **`admin` only** |
| Taxes | **GET**: any authenticated | **POST/PUT/DELETE**: **`admin` only** |
| Users | **GET** list/detail: `admin`, `internal_user` | **POST** create: **`admin` only**; **PUT** profile: self or admin; activate/deactivate: **admin** |
| Reports | **`admin`, `internal_user` only** | — |
| Upload | **POST**: `admin`, `internal_user`; **DELETE** file: **admin** | — |

## Admin-only internal user creation (PDF rule)

[`server/src/controllers/users.controller.js`](../../server/src/controllers/users.controller.js) `create`:

- Route guarded with `authorize('admin')` on `POST /api/users`.
- If body sends `role`, only **`internal_user`** is accepted; stored role is forced to **`internal_user`**.

## Client routing

[`client/src/router/AppRouter.jsx`](../../client/src/router/AppRouter.jsx):

- **Public**: `/login`, `/signup`, `/reset-password`.
- **Protected** (wrapper `ProtectedRoute`): all main app routes inside `MainLayout`.
- **RoleRoute** (`roles={['admin', 'internal_user']}`): wraps only **`/users`**. So **portal users can open `/dashboard`, `/subscriptions`, etc.** in the UI—they are not hidden by the router.

[`client/src/router/ProtectedRoute.jsx`](../../client/src/router/ProtectedRoute.jsx): while `loading`, spinner; if not authenticated → redirect `/login`; else render `Outlet` (or children).

[`client/src/router/RoleRoute.jsx`](../../client/src/router/RoleRoute.jsx): if `user.role` not in list → redirect **`/dashboard`** (not 403 page).

## Sidebar (what each role *sees*)

[`client/src/components/layout/Sidebar.jsx`](../../client/src/components/layout/Sidebar.jsx):

- Nav sections: Main (Dashboard), Catalog (Products, Plans), Sales (Subscriptions, Quotation Templates), Billing (Invoices, Payments), Config (Taxes, Discounts, **Users**), Analytics (Reports).
- **Users** menu item has `adminOnly: true` → hidden unless `user.role === 'admin'`.
- **All other links are visible to every authenticated role**, including portal—even though many actions will **403** from the API for portal users.

So: **UI ≠ API permissions** for portal; staff should demo with admin/internal accounts.

## Constants on the client

[`client/src/lib/constants.js`](../../client/src/lib/constants.js): `ROLES`, human-readable labels, `SUBSCRIPTION_STATUS`, `INVOICE_STATUS`, `PAYMENT_METHODS`, `BILLING_PERIODS`, `DISCOUNT_TYPES`, badge color hints (`STATUS_COLORS`).

## Judge-ready sentence

“We enforce permissions on the **server** with **JWT identity + role middleware**; the React app provides **navigation hints** (e.g. Users for admin only) but **authorization is authoritative on the API**. Next hardening step: **row-level filters** for portal reads.”
