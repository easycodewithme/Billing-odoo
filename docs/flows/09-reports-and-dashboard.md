# Reports and dashboard

## Access control

All report endpoints require **`authenticate`** + **`authorize('admin', 'internal_user')`**.

File: [`server/src/routes/reports.routes.js`](../../server/src/routes/reports.routes.js).

**Portal users** receive **403** if they call these APIs directly.

## Endpoints and logic

Controller: [`server/src/controllers/reports.controller.js`](../../server/src/controllers/reports.controller.js).

### `GET /api/reports/dashboard-stats`

Returns (among others):

- `totalSubscriptions`, `activeSubscriptions` (status `active`)
- `totalCustomers` — count of users with `role: portal_user`
- `totalRevenue` — sum of **`netAmount`** on invoices with `status: paid`
- `overdueInvoicesCount` — invoices with `dueDate < now` and status not in `paid`, `cancelled`
- **`mrr`** — computed from **active** subscriptions: for each, take `plan.price` and normalize by `plan.billingPeriod` to a monthly figure.

**MRR implementation detail**: the `switch` includes branches like `quarterly` and `annual`, but Prisma `BillingPeriod` is **`daily` | `weekly` | `monthly` | `yearly`**. **`yearly`** is handled via a branch that checks `'yearly'` and `'annual'`. **`daily`** falls through to **`default`**, which adds **`price`** once (same as unknown period)—if you demo MRR, call out that **daily/weekly** handling should match product intent.

### `GET /api/reports/revenue`

- Loads **completed** payments in the last **12 months**.
- Groups sums by **calendar month** of `paymentDate`.
- Returns 12 data points (last 12 months rolling).

So this chart is **cash-in by payment date**, not accrued invoice revenue.

### `GET /api/reports/subscriptions`

- **`byStatus`**: `groupBy` subscription `status` counts.
- **`trend`**: new subscriptions per month over last 12 months by `createdAt`.

### `GET /api/reports/payments`

- `totalPaid` — sum of **`paidAmount`** across all invoices (aggregate).
- `totalOutstanding` — sum of **`outstandingAmount`** for invoices not `paid` or `cancelled`.
- `byMethod` — `groupBy` payment `method` for **completed** payments.

### `GET /api/reports/overdue-invoices`

- Lists invoices with `dueDate < now` and **`status: confirmed`** (specifically confirmed, not all non-paid).

## Client: dashboard

[`client/src/pages/DashboardPage.jsx`](../../client/src/pages/DashboardPage.jsx) fetches in parallel:

- `getDashboardStats`, `getRevenueReport`, `getSubscriptionReport`, `getOverdueInvoices`

from [`client/src/api/reports.api.js`](../../client/src/api/reports.api.js).

**UX note**: the dashboard runs for **every** authenticated role; **portal** users will hit **403** on these calls and see the generic “Failed to load dashboard data” toast—only staff accounts get a populated dashboard unless you add role checks on the client.

## Client: reports page

[`client/src/pages/ReportsPage.jsx`](../../client/src/pages/ReportsPage.jsx) — additional analytics views using the same API module.

Supporting components: [`client/src/components/dashboard/`](../../client/src/components/dashboard/) (`StatsCard`, `RevenueChart`, `SubscriptionChart`, `OverdueInvoices`).
