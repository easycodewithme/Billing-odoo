# Users, file uploads, and webhooks

## Users / contacts (business)

- **Users** are a single table for **staff** (`admin`, `internal_user`) and **customers** (`portal_user`).
- **Admin** creates **internal** staff via `POST /api/users` (forced role `internal_user`).
- **Profile updates**: non-admin may only **`PUT /api/users/:id`** for **their own** `id`; **admin** can update any user’s profile fields exposed in the controller (`fullName`, `phone`, `avatar`).
- **Activate / deactivate**: **admin only** (`PATCH .../activate`, `.../deactivate`).

## Users (API)

[`server/src/routes/users.routes.js`](../../server/src/routes/users.routes.js)

| Method | Path | AuthZ |
|--------|------|-------|
| GET | `/api/users` | `admin`, `internal_user` — query `role`, `search` |
| GET | `/api/users/:id` | `admin`, `internal_user` |
| POST | `/api/users` | **`admin` only** + validate (create internal user) |
| PUT | `/api/users/:id` | `authenticate` + self-or-admin rule in controller |
| PATCH | `/api/users/:id/deactivate` | **`admin` only** |
| PATCH | `/api/users/:id/activate` | **`admin` only** |

Controller: [`server/src/controllers/users.controller.js`](../../server/src/controllers/users.controller.js).

## Users (client)

- [`client/src/pages/UsersPage.jsx`](../../client/src/pages/UsersPage.jsx) — behind **`RoleRoute`** for `admin` + `internal_user` in [`AppRouter.jsx`](../../client/src/router/AppRouter.jsx).
- [`UserList.jsx`](../../client/src/components/users/UserList.jsx), [`UserForm.jsx`](../../client/src/components/users/UserForm.jsx).
- API: [`client/src/api/users.api.js`](../../client/src/api/users.api.js).

**Subscription form** loads customers with `getUsers({ role: ROLES.PORTAL })` — see [`SubscriptionForm.jsx`](../../client/src/components/subscriptions/SubscriptionForm.jsx).

## File uploads

- **Route**: [`server/src/routes/upload.routes.js`](../../server/src/routes/upload.routes.js) — `POST /api/upload/:category` with `authenticate` + `authorize('admin', 'internal_user')` + multer single field **`file`**.
- **Delete**: `DELETE /api/upload/:category/:filename` — **`admin` only**.
- Config: [`server/src/config/multer.js`](../../server/src/config/multer.js), middleware [`server/src/middleware/upload.js`](../../server/src/middleware/upload.js).
- Served URLs: app exposes **`/uploads`** static ([`app.js`](../../server/src/app.js)).

Client helper: [`client/src/components/shared/FileUpload.jsx`](../../client/src/components/shared/FileUpload.jsx), [`client/src/api/upload.api.js`](../../client/src/api/upload.api.js).

Typical use: store returned path on **`User.avatar`** or **`Product.image`** via profile/product forms.

## Stripe webhook

- **Registration in app**: raw body parser for `POST /api/webhooks/stripe` before JSON middleware ([`app.js`](../../server/src/app.js)).
- **Handler**: [`server/src/routes/webhook.routes.js`](../../server/src/routes/webhook.routes.js) — currently **logs** event type/time and returns 200; **no payment or invoice updates** yet.

Environment variables for future Stripe work are listed in [`server/.env.example`](../../server/.env.example).

## Audit logging (related)

[`server/src/services/audit.service.js`](../../server/src/services/audit.service.js) persists **`AuditLog`** rows. Prisma enum values are lowercase `create`, `update`, `delete`. Controllers should pass those strings so inserts succeed; mixed-case strings may fail insert and be swallowed by the service’s try/catch.
