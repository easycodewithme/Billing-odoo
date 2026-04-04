# Catalog: products and recurring plans

## Products (business)

- Each **product** has name, optional type, **sales price**, **cost price**, description, optional image, `isActive`.
- **Variants** add attribute/value pairs (e.g. “Plan / Enterprise”) and an **extra price** on top of the base product (interpretation in UI/order entry: unit price is often chosen explicitly on the order line; variants are available for selection).

## Products (API)

File: [`server/src/routes/products.routes.js`](../../server/src/routes/products.routes.js).

| Method | Path | AuthZ | Notes |
|--------|------|-------|------|
| GET | `/api/products` | `authenticate` | Paginated list; filters in controller if any |
| GET | `/api/products/:id` | `authenticate` | Includes variants |
| POST | `/api/products` | `admin`, `internal_user` + `validate(createSchema)` | Create |
| PUT | `/api/products/:id` | `admin`, `internal_user` + `validate(updateSchema)` | Update |
| DELETE | `/api/products/:id` | **`admin` only** | Delete |
| POST | `/api/products/:id/variants` | `admin`, `internal_user` + `validate(variantSchema)` | Add variant |
| PUT | `/api/products/:id/variants/:variantId` | same | Update variant |
| DELETE | `/api/products/:id/variants/:variantId` | same | Remove variant |

Controller: [`server/src/controllers/products.controller.js`](../../server/src/controllers/products.controller.js).  
Validator: [`server/src/validators/product.validator.js`](../../server/src/validators/product.validator.js).

## Products (client)

- [`client/src/pages/ProductsPage.jsx`](../../client/src/pages/ProductsPage.jsx) — list + create/edit flows.
- [`client/src/components/products/ProductForm.jsx`](../../client/src/components/products/ProductForm.jsx), [`ProductList.jsx`](../../client/src/components/products/ProductList.jsx), [`VariantManager.jsx`](../../client/src/components/products/VariantManager.jsx).
- API: [`client/src/api/products.api.js`](../../client/src/api/products.api.js).

## Recurring plans (business)

Plans define **recurring billing** for subscriptions:

- **Fields**: name, **price**, **billing period** (`daily` | `weekly` | `monthly` | `yearly`), minimum quantity, optional start/end dates, flags **autoClose**, **closable**, **pausable**, **renewable**, `isActive`.
- **Subscription status transitions** consult **`pausable`** and **`closable`** when moving **active → paused** or **active → closed** ([`subscription.service.js`](../../server/src/services/subscription.service.js)).

## Recurring plans (API)

File: [`server/src/routes/plans.routes.js`](../../server/src/routes/plans.routes.js).

| Method | Path | AuthZ |
|--------|------|-------|
| GET | `/api/plans` | `authenticate` |
| GET | `/api/plans/:id` | `authenticate` |
| POST | `/api/plans` | `admin`, `internal_user` + validate |
| PUT | `/api/plans/:id` | `admin`, `internal_user` + validate |
| DELETE | `/api/plans/:id` | **`admin` only** |

Controller: [`server/src/controllers/plans.controller.js`](../../server/src/controllers/plans.controller.js).

## Recurring plans (client)

- [`client/src/pages/PlansPage.jsx`](../../client/src/pages/PlansPage.jsx), [`PlanForm.jsx`](../../client/src/components/plans/PlanForm.jsx), [`PlanList.jsx`](../../client/src/components/plans/PlanList.jsx).
- API: [`client/src/api/plans.api.js`](../../client/src/api/plans.api.js).

## How catalog connects to subscriptions

- **Subscription** references **`planId`** (required) for billing semantics and status rules.
- **Order lines** reference **`productId`** and optional **`variantId`** for what is being sold on that subscription.

## Demo data

[`server/prisma/seed.js`](../../server/prisma/seed.js) creates sample products with variants and monthly/yearly plans.
