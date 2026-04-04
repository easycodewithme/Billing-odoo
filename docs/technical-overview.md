# Technical overview

## Stack

| Layer | Technology |
|-------|------------|
| Client | React 19, Vite, React Router, axios (`withCredentials: true`), Tailwind/shadcn-style UI under `client/src/components/ui/` |
| Server | Express 5, `cookie-parser`, `helmet`, `morgan`, `cors`, Joi validation |
| Auth tokens | JWT access + refresh, stored in **httpOnly** cookies (`accessToken`, `refreshToken`) |
| Database | PostgreSQL via **Prisma ORM** (`server/prisma/schema.prisma`) |

This is a **custom monorepo** (`client/` + `server/`), not an Odoo module. The product mirrors Odoo-style subscription/billing modules from a requirements perspective.

## Repository layout

```
client/src/
  api/           # One module per domain; all use shared axios instance
  components/    # Feature folders (subscriptions, invoices, …) + layout + ui
  contexts/      # AuthContext
  hooks/         # useAuth
  lib/           # constants (roles, statuses), utils
  pages/         # Route-level screens
  router/        # AppRouter, ProtectedRoute, RoleRoute

server/
  prisma/        # schema.prisma, migrations, seed.js
  src/
    app.js       # Express app: middleware + route mounting
    config/      # env.js, multer
    controllers/ # HTTP handlers (thin: parse request, call Prisma or service)
    middleware/  # auth.js, role.js, validate.js, errorHandler, upload
    routes/      # Mount paths under /api/*
    services/    # Domain logic (subscription, invoice, payment, auth helpers, audit, email)
    validators/  # Joi schemas
    utils/       # prisma client, pagination, apiResponse
  server.js      # HTTP listen
```

## Request lifecycle (server)

1. **CORS** — `origin: CLIENT_URL`, `credentials: true` ([`server/src/app.js`](../server/src/app.js)).
2. **Stripe webhook** — `POST /api/webhooks/stripe` uses `express.raw({ type: 'application/json' })` **before** `express.json()` so a future signature verifier sees the raw body.
3. **JSON body** — `express.json()` for all other routes.
4. **Static files** — `GET /uploads/*` from disk.
5. **Route modules** — e.g. `app.use('/api/subscriptions', subscriptionRoutes)`.
6. **Per-route pipeline** — typically `authenticate` → optional `authorize('admin', …)` → optional `validate(schema)` → controller.
7. **Errors** — global `errorHandler` at the end of `app.js`.

## API base path

All JSON APIs are under **`/api`**. Examples:

- `POST /api/auth/login`
- `GET /api/subscriptions`
- `POST /api/invoices/generate/:subscriptionId`

The Vite dev server proxies **`/api`** to **`http://localhost:5000`** ([`client/vite.config.js`](../client/vite.config.js)), so the browser keeps calling same-origin `/api/...` while developing.

## Configuration

[`server/src/config/env.js`](../server/src/config/env.js) loads `dotenv` and exposes:

- `PORT`, `NODE_ENV`
- `DATABASE_URL`
- `JWT_SECRET`, `JWT_REFRESH_SECRET`, token expiries
- `CLIENT_URL` (CORS + password reset links)

Copy from [`server/.env.example`](../server/.env.example).

## Response shapes

- **Success (controller helper)** — `success(res, data, message, statusCode)` → `{ success: true, message, data }`.
- **Paginated** — `paginated(res, data, total, page, limit)` → `{ success: true, data, pagination: { total, page, limit, totalPages } }`.
- **Error** — `error(res, message, statusCode)` → `{ success: false, message }`.

Some **auth** endpoints (`login`, `signup`) respond with raw `{ message, user }` and set cookies, not always the same `success/data` wrapper—check [`server/src/controllers/auth.controller.js`](../server/src/controllers/auth.controller.js).

## Client HTTP client

[`client/src/api/axios.js`](../client/src/api/axios.js):

- `baseURL: '/api'`, `withCredentials: true` so cookies are sent.
- On **401**, retries once after `POST /auth/refresh` (queues concurrent requests during refresh).

## Feature → primary files (quick map)

| Feature | Server | Client |
|---------|--------|--------|
| Login / signup / me | `routes/auth.routes.js`, `controllers/auth.controller.js`, `services/auth.service.js` | `pages/LoginPage`, `SignupPage`, `contexts/AuthContext.jsx`, `api/auth.api.js` |
| Subscriptions | `routes/subscriptions.routes.js`, `controllers/subscriptions.controller.js`, `services/subscription.service.js` | `pages/SubscriptionsPage`, `SubscriptionDetailPage`, `api/subscriptions.api.js` |
| Invoices | `routes/invoices.routes.js`, `services/invoice.service.js` | `pages/InvoicesPage`, `InvoiceDetailPage`, `api/invoices.api.js` |
| Payments | `routes/payments.routes.js`, `services/payment.service.js` | `pages/PaymentsPage`, `api/payments.api.js` |
| Products / plans | `routes/products.routes.js`, `routes/plans.routes.js` | `pages/ProductsPage`, `PlansPage` |
| Templates | `routes/quotations.routes.js` (mounted as `/api/quotation-templates`) | `pages/QuotationTemplatesPage`, `api/quotations.api.js` |
| Discounts / taxes | `routes/discounts.routes.js`, `routes/taxes.routes.js` | `pages/DiscountsPage`, `TaxesPage` |
| Users | `routes/users.routes.js`, `controllers/users.controller.js` | `pages/UsersPage` (route-gated) |
| Reports | `routes/reports.routes.js`, `controllers/reports.controller.js` | `pages/DashboardPage`, `ReportsPage`, `api/reports.api.js` |
| File upload | `routes/upload.routes.js` | `components/shared/FileUpload.jsx`, `api/upload.api.js` |

## Scripts (server)

From `server/`: `npm run dev` (nodemon), `npm start`, `npx prisma migrate dev`, `npm run prisma:seed`.

Seed creates demo users and sample catalog data—see [`server/prisma/seed.js`](../server/prisma/seed.js).
