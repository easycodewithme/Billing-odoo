# Subscriptions and order lines

## Business concept

A **subscription** ties a **customer** (`User` with role typically `portal_user`) to a **recurring plan**, optional dates and payment terms, and a **status** that reflects the sales/lifecycle stage. **Order lines** are the line items (products, quantities, prices, optional tax/discount) that will be **invoiced**.

## Data

- **`Subscription`**: `subscriptionNo` (unique), `customerId`, `planId`, `startDate`, `expirationDate`, `paymentTerms`, `status`, `notes`.
- **`OrderLine`**: per subscription: `productId`, optional `variantId`, `quantity`, `unitPrice`, `amount`, optional `taxId`, `discountId`.

## Status state machine (server)

Implemented in [`server/src/services/subscription.service.js`](../../server/src/services/subscription.service.js).

### Allowed transitions (`ALLOWED_TRANSITIONS`)

| Current status | Allowed next statuses |
|----------------|------------------------|
| `draft` | `quotation` |
| `quotation` | `confirmed` |
| `confirmed` | `active` |
| `active` | `paused`, `closed` |
| `paused` | `active`, `closed` |

### Plan flags

When moving from **`active`**:

- **`active` → `paused`**: rejected if `!plan.pausable`.
- **`active` → `closed`**: rejected if `!plan.closable`.

### Status audit trail

`transitionStatus` runs in a transaction: updates `Subscription.status` and appends **`SubscriptionStatusLog`** (`fromStatus`, `toStatus`, `changedById`, `reason`).

### Subscription creation

`createSubscription` always sets initial **`status: 'draft'`** and generates **`subscriptionNo`** (`SUB-<timestamp><random>`).

## API

File: [`server/src/routes/subscriptions.routes.js`](../../server/src/routes/subscriptions.routes.js).

| Method | Path | AuthZ |
|--------|------|-------|
| GET | `/api/subscriptions` | `authenticate` |
| GET | `/api/subscriptions/:id` | `authenticate` |
| POST | `/api/subscriptions` | `admin`, `internal_user` + `validate(createSchema)` |
| PUT | `/api/subscriptions/:id` | `admin`, `internal_user` + `validate(updateSchema)` |
| PATCH | `/api/subscriptions/:id/status` | `admin`, `internal_user` + `validate(statusSchema)` |
| POST | `/api/subscriptions/:id/apply-template` | `admin`, `internal_user` |
| POST | `/api/subscriptions/:id/order-lines` | `admin`, `internal_user` + `validate(orderLineSchema)` |
| PUT | `/api/subscriptions/:id/order-lines/:lineId` | same |
| DELETE | `/api/subscriptions/:id/order-lines/:lineId` | same |

Controller: [`server/src/controllers/subscriptions.controller.js`](../../server/src/controllers/subscriptions.controller.js).

**Update rule**: `PUT` only allowed when existing status is **`draft` or `quotation`**.

Validators: [`server/src/validators/subscription.validator.js`](../../server/src/validators/subscription.validator.js).

## Apply template

`POST .../apply-template` body: `{ templateId }`. Service loads template with lines and **`createMany`** order lines. See caveats in [Quotation templates](04-quotation-templates.md) (schema field mismatch for tax/variant/discount on template lines).

## Order line amounts

`addOrderLine` / `updateOrderLine` set **`amount = quantity * unitPrice`** (numeric). Tax and discount affect **invoice generation**, not necessarily this stored amount (see [Invoices](06-invoices-and-payments.md)).

## Client

- List: [`SubscriptionsPage.jsx`](../../client/src/pages/SubscriptionsPage.jsx), [`SubscriptionList.jsx`](../../client/src/components/subscriptions/SubscriptionList.jsx).
- Create dialog: [`SubscriptionForm.jsx`](../../client/src/components/subscriptions/SubscriptionForm.jsx) (loads portal users via `getUsers({ role: portal })`, plans, templates).
- Detail: [`SubscriptionDetailPage.jsx`](../../client/src/pages/SubscriptionDetailPage.jsx), [`SubscriptionDetail.jsx`](../../client/src/components/subscriptions/SubscriptionDetail.jsx), [`OrderLineTable.jsx`](../../client/src/components/subscriptions/OrderLineTable.jsx), [`StatusTimeline.jsx`](../../client/src/components/subscriptions/StatusTimeline.jsx).
- API: [`client/src/api/subscriptions.api.js`](../../client/src/api/subscriptions.api.js).

## PDF vs implementation

PDF flow: **Draft → Quotation → Confirmed → Active → Closed**. Code adds **`paused`** and transitions **active ↔ paused** for subscriptions that allow it—position as an extension for “billing hold.”
