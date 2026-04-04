# Discounts and taxes

## Taxes (business)

- **Tax** records have a **name**, **rate** (percentage), **type** (string label e.g. GST), optional description, `isActive`.
- Applied at **order line** level via **`OrderLine.taxId`**; when an **invoice** is generated, tax amounts are computed from the linked tax’s **rate** and stored on **invoice lines** ([`invoice.service.js`](../../server/src/services/invoice.service.js)).

## Taxes (API)

[`server/src/routes/taxes.routes.js`](../../server/src/routes/taxes.routes.js)

| Method | Path | AuthZ |
|--------|------|-------|
| GET | `/api/taxes` | `authenticate` (any logged-in user can list) |
| GET | `/api/taxes/:id` | `authenticate` |
| POST | `/api/taxes` | **`admin` only** + validate |
| PUT | `/api/taxes/:id` | **`admin` only** + validate |
| DELETE | `/api/taxes/:id` | **`admin` only** |

Controller: [`server/src/controllers/taxes.controller.js`](../../server/src/controllers/taxes.controller.js).

## Taxes (client)

[`client/src/pages/TaxesPage.jsx`](../../client/src/pages/TaxesPage.jsx), [`TaxForm.jsx`](../../client/src/components/taxes/TaxForm.jsx), [`TaxList.jsx`](../../client/src/components/taxes/TaxList.jsx), [`client/src/api/taxes.api.js`](../../client/src/api/taxes.api.js).

## Discounts (business)

- **Types**: `fixed` or `percentage` (enum `DiscountType`).
- **Commercial rules**: `minPurchase`, `minQuantity`, `startDate`/`endDate`, optional **`limitUsage`** with **`currentUsage`** (increment paths depend on business rules—line selection may not auto-increment usage in all flows; confirm in controller if you extend).
- **Applies to** products/subscriptions via join tables:
  - **`DiscountProduct`** (many-to-many)
  - **`DiscountSubscription`** (many-to-many)
- **Invoice behavior**: line-level discount on generated invoices comes from **`OrderLine.discountId`** and the linked **`Discount`** row at generation time. Join tables model **eligibility**; **enforcement** of “only if product X” may still be operational (manual line picking) unless you add validation in `addOrderLine` / `generateInvoice`.

## Discounts (API)

[`server/src/routes/discounts.routes.js`](../../server/src/routes/discounts.routes.js)

| Method | Path | AuthZ |
|--------|------|-------|
| GET | `/api/discounts` | `admin`, `internal_user` |
| GET | `/api/discounts/:id` | same |
| POST | `/api/discounts` | **`admin` only** + validate |
| PUT | `/api/discounts/:id` | **`admin` only** + validate |
| DELETE | `/api/discounts/:id` | **`admin` only** |
| POST | `/api/discounts/:id/products` | **`admin` only** — attach product |
| DELETE | `/api/discounts/:id/products/:productId` | **`admin` only** |
| POST | `/api/discounts/:id/subscriptions` | **`admin` only** — attach subscription |
| DELETE | `/api/discounts/:id/subscriptions/:subscriptionId` | **`admin` only** |

Controller: [`server/src/controllers/discounts.controller.js`](../../server/src/controllers/discounts.controller.js) — includes validation **percentage ≤ 100**.

## Discounts (client)

[`client/src/pages/DiscountsPage.jsx`](../../client/src/pages/DiscountsPage.jsx), [`DiscountForm.jsx`](../../client/src/components/discounts/DiscountForm.jsx), [`DiscountList.jsx`](../../client/src/components/discounts/DiscountList.jsx), [`client/src/api/discounts.api.js`](../../client/src/api/discounts.api.js).

## PDF alignment

Hackathon PDF: **only Admin creates discounts** — satisfied for **mutations**; **internal users can read** discount definitions (by design for operational visibility).
