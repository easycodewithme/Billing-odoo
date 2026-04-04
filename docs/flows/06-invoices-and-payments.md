# Invoices and payments

## Invoices (business)

- Generated from a **subscription** that has **order lines**; lines become **invoice lines** with snapshot description and amounts.
- **Statuses**: `draft` → `confirmed` → `paid`, or `cancelled`.
- **Confirm** sets **`issuedAt`** and **`dueDate`** (implementation: **due 30 days after confirm**).
- **Cancel** only if **no payments** exist for the invoice.

## Invoice generation (server logic)

[`server/src/services/invoice.service.js`](../../server/src/services/invoice.service.js) `generateInvoice(subscriptionId)`:

1. Load subscription with order lines + related product, variant, tax, discount.
2. Fail if no order lines.
3. For each order line:
   - `lineAmount = quantity × unitPrice` (stored as line `amount` on invoice line).
   - **Tax**: if `line.tax`, `taxAmount = lineAmount × (rate / 100)`.
   - **Discount**: if `line.discount`, percentage applies to `lineAmount`; **fixed** applies raw `discount.value` (not capped to line—edge-case over-discount possible).
4. Header totals:
   - `totalAmount` = sum of line `amount`
   - `taxAmount` = sum of line tax amounts
   - `discountAmount` = sum of line discount amounts
   - **`netAmount = totalAmount + taxAmount - discountAmount`**
   - `paidAmount = 0`, `outstandingAmount = netAmount`
5. Create invoice + lines in a **transaction**; `invoiceNo` like `INV-<timestamp><random>`.

## Invoice confirm / cancel

- **`confirmInvoice`**: only from **`draft`**; sets `status: confirmed`, `issuedAt`, `dueDate`; writes **audit log**.
- **`cancelInvoice`**: loads payments; if any, error; else `status: cancelled`.

## Payment totals and paid status

[`updatePaymentTotals(invoiceId)`](../../server/src/services/invoice.service.js):

- Sums **completed** payments for the invoice.
- Sets `paidAmount`, `outstandingAmount = max(netAmount - paid, 0)`.
- If outstanding ≤ 0, sets invoice **`status: paid`**.

## Invoices (API)

[`server/src/routes/invoices.routes.js`](../../server/src/routes/invoices.routes.js)

| Method | Path | AuthZ |
|--------|------|-------|
| GET | `/api/invoices` | `authenticate` |
| GET | `/api/invoices/:id` | `authenticate` |
| POST | `/api/invoices/generate/:subscriptionId` | `admin`, `internal_user` |
| PATCH | `/api/invoices/:id/confirm` | `admin`, `internal_user` |
| PATCH | `/api/invoices/:id/cancel` | **`admin` only** |
| POST | `/api/invoices/:id/send` | `admin`, `internal_user` (placeholder: logs) |
| GET | `/api/invoices/:id/pdf` | `authenticate` (placeholder response) |

Controller: [`server/src/controllers/invoices.controller.js`](../../server/src/controllers/invoices.controller.js).

**Overdue listing**: `GET /api/invoices?overdue=true` uses `dueDate < now` and status not `paid`/`cancelled`.

## Payments (business)

- **Manual**: staff records method (`stripe` | `cash` | `bank_transfer` | `other`), amount, optional reference/notes; stored as **`completed`** immediately.
- **Stripe checkout**: `POST /api/payments/checkout/:invoiceId` returns a **placeholder** message (no real session in current code).
- **Webhook**: `POST /api/webhooks/stripe` logs payload; does not update DB yet.

## Payments (service)

[`server/src/services/payment.service.js`](../../server/src/services/payment.service.js) `recordManualPayment`:

- Validates invoice exists, not cancelled, not already fully paid.
- Creates `Payment` with `status: 'completed'`.
- Calls `invoiceService.updatePaymentTotals(invoiceId)`.
- Attempts audit log (note: action string should match Prisma `AuditAction` enum lowercase—see audit doc).

## Payments (API)

[`server/src/routes/payments.routes.js`](../../server/src/routes/payments.routes.js)

| Method | Path | AuthZ |
|--------|------|-------|
| GET | `/api/payments` | `authenticate` |
| GET | `/api/payments/:id` | `authenticate` |
| POST | `/api/payments/manual` | `admin`, `internal_user` + validate |
| POST | `/api/payments/checkout/:invoiceId` | `authenticate` (stub) |

Controller: [`server/src/controllers/payments.controller.js`](../../server/src/controllers/payments.controller.js).

## Client

- Invoices: [`InvoicesPage.jsx`](../../client/src/pages/InvoicesPage.jsx), [`InvoiceDetailPage.jsx`](../../client/src/pages/InvoiceDetailPage.jsx), [`InvoiceList.jsx`](../../client/src/components/invoices/InvoiceList.jsx), [`InvoiceDetail.jsx`](../../client/src/components/invoices/InvoiceDetail.jsx), [`client/src/api/invoices.api.js`](../../client/src/api/invoices.api.js).
- Payments: [`PaymentsPage.jsx`](../../client/src/pages/PaymentsPage.jsx), [`PaymentForm.jsx`](../../client/src/components/payments/PaymentForm.jsx), [`PaymentList.jsx`](../../client/src/components/payments/PaymentList.jsx), [`client/src/api/payments.api.js`](../../client/src/api/payments.api.js).

## Invoice status cheat sheet

| Status | Meaning |
|--------|---------|
| `draft` | Generated; can confirm |
| `confirmed` | Issued with due date; awaiting payment |
| `paid` | Payments cover `netAmount` |
| `cancelled` | Voided; no payments allowed |
