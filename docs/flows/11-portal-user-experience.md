# Portal user experience (customer role)

## How someone becomes `portal_user`

- **`POST /api/auth/signup`** with name, email, password, optional phone → account created with **`role: portal_user`** ([`auth.controller.js`](../../server/src/controllers/auth.controller.js)).
- After signup, the client stores cookies and **`AuthContext`** sets `user`, then navigates to **`/dashboard`**.

## What the portal user sees in the UI

Routing: [`AppRouter.jsx`](../../client/src/router/AppRouter.jsx) — any **authenticated** user (including portal) enters **`MainLayout`** and can navigate to:

- Dashboard, Products, Plans, Subscriptions, Quotation Templates, Invoices, Payments, Taxes, Discounts, Reports
- **Users** nav item is **hidden** unless `role === 'admin'` ([`Sidebar.jsx`](../../client/src/components/layout/Sidebar.jsx))

So **portal users still see operational pages** in the sidebar; the app does **not** switch to a reduced “customer portal” layout.

## What the portal user can do in practice (API reality)

### Likely to succeed

- **Read self**: `GET /api/auth/me`
- **List taxes**: `GET /api/taxes` (any authenticated)
- **Read catalog**: `GET /api/products`, `GET /api/plans` (any authenticated)

### Often **403** for mutations

Examples (see route files for exact rules):

- **Create subscription**, **change status**, **order lines**: `admin` / `internal_user` only.
- **Generate / confirm invoice**, **record manual payment**: staff only.
- **Create/edit discounts**: **admin** only for writes; internal can read.
- **Create/edit taxes**: **admin** only for writes.

So if a portal user clicks **“New Subscription”** on [`SubscriptionsPage.jsx`](../../client/src/pages/SubscriptionsPage.jsx), the **POST** fails with **403** unless your deployment changed routes.

### Reads without row-level security

Many **GET** endpoints (subscriptions, invoices, payments) require only **`authenticate`**. That means a **portal user could list other customers’ subscriptions/invoices** if they use the SPA or call the API—**there is no `where: { customerId: req.user.id }` filter** in those list controllers today.

**Judge-safe explanation**: “We authenticated every request; **role middleware** protects writes and sensitive modules. **Tenant isolation** for portal reads would be the next security layer.”

## Dashboard for portal

[`DashboardPage.jsx`](../../client/src/pages/DashboardPage.jsx) always loads **report** endpoints. Those routes allow only **`admin`** and **`internal_user`**, so portal users get **403** and an error toast—**not** a tailored customer dashboard.

## Mental model

Treat **`portal_user`** today as **“customer identity in the same database and app shell”**, not a fully separated **self-service billing portal**. The **happy-path demo** is **staff-driven** ([end-to-end staff flow](10-end-to-end-staff-customer-flow.md)).

## If you want to describe the “customer subscription buy” story

Be precise:

1. **Customer** registers (portal account).
2. **Sales staff** (internal/admin) **creates the subscription** and order lines **on behalf of** the customer.
3. **Invoicing and payment** are staff-operated (manual payment recording) in the current implementation.

That matches the code paths; avoid implying a finished **self-checkout** unless Stripe is fully wired.
