# End-to-end flow: staff sells a subscription to a customer

This is the **primary story** the app implements: **internal or admin staff** configure catalog and subscriptions; **customers** exist as **portal users** (often created via signup or seeded). There is **no separate public checkout** that charges a card without staff steps—**Stripe checkout is a stub**.

## Preconditions

1. **Server** running with PostgreSQL and migrations applied; optional **`npm run prisma:seed`** for demo users and catalog.
2. **Client** logged in as **`admin@example.com`** or **`internal@example.com`** (seed passwords in [`seed.js`](../../server/prisma/seed.js)).
3. At least one **portal user** (customer), one **product**, one **recurring plan**.

## Flow steps (logical)

### A. Customer exists

- **Path 1**: Customer self-registers via **`/signup`** → `POST /api/auth/signup` → role **`portal_user`**.
- **Path 2**: Admin seeds or you rely on seed customers (`customer1@example.com`, etc.).

Staff **lists customers** via `GET /api/users?role=portal_user` (used by subscription form).

### B. Catalog (if not seeded)

1. **Products** (+ optional variants): Products page → `POST /api/products`, variant routes.
2. **Recurring plans**: Plans page → `POST /api/plans` with billing period and flags (`pausable`, `closable`, …).

### C. Optional: quotation template

- Quotation Templates page → `POST /api/quotation-templates` with `templateLines` (product, qty, unit price) linked to a plan.

### D. Create subscription (staff)

1. **Subscriptions** → **New Subscription** ([`SubscriptionForm.jsx`](../../client/src/components/subscriptions/SubscriptionForm.jsx)).
2. Select **customer** (portal user), **plan**, optional **template**, dates, payment terms, notes.
3. **API**: `POST /api/subscriptions` → subscription **`draft`** with generated `subscriptionNo`.
4. If template selected: `POST /api/subscriptions/:id/apply-template` with `{ templateId }` to create **order lines** from template lines.
5. Else (or in addition): on subscription detail, **add order lines** — `POST /api/subscriptions/:id/order-lines` with `productId`, `quantity`, `unitPrice`, optional `variantId`, `taxId`, `discountId`.

### E. Advance subscription status

Use **status** actions on the subscription detail UI (or `PATCH /api/subscriptions/:id/status`):

1. `draft` → `quotation`
2. `quotation` → `confirmed`
3. `confirmed` → `active`

If the plan disallows pause/close later, **`pausable` / `closable`** on the plan matter when you demo those transitions.

### F. Bill: generate and confirm invoice

1. From subscription or invoices UI: **`POST /api/invoices/generate/:subscriptionId`** — creates **`draft`** invoice + lines from current order lines; computes totals.
2. **`PATCH /api/invoices/:id/confirm`** — `confirmed`, sets **due date +30 days** from confirm time.

### G. Collect payment

- **Manual** (implemented): **`POST /api/payments/manual`** with `invoiceId`, `method`, `amount` (typically full outstanding), `reference`, `notes`.
- Service creates a **completed** payment and runs **`updatePaymentTotals`** → invoice may become **`paid`**.

### H. Verify outcome

- **Invoice detail**: status **`paid`**, `outstandingAmount` **0**.
- **Reports / dashboard** (staff): revenue, subscription counts, overdue lists update according to report definitions ([`09-reports-and-dashboard.md`](09-reports-and-dashboard.md)).

## Sequence diagram (high level)

```mermaid
sequenceDiagram
  participant Staff
  participant API
  participant DB
  Staff->>API: POST /subscriptions (draft)
  API->>DB: insert Subscription
  Staff->>API: POST order-lines OR apply-template
  API->>DB: insert OrderLines
  Staff->>API: PATCH status chain to active
  API->>DB: update Subscription + StatusLog
  Staff->>API: POST /invoices/generate/:subscriptionId
  API->>DB: insert Invoice + InvoiceLines
  Staff->>API: PATCH /invoices/:id/confirm
  API->>DB: update Invoice dates/status
  Staff->>API: POST /payments/manual
  API->>DB: insert Payment; update Invoice totals
```

## What this flow is *not* (yet)

- **Automated recurring invoice generation** (no scheduler/cron in repo).
- **Customer self-pay** via working Stripe Checkout (endpoint returns placeholder).
- **Email/PDF delivery** of invoices (send/PDF endpoints are placeholders).

Use that list when judges ask “what’s next for production?”
