# Quotation templates

## Business purpose

**Quotation templates** speed up subscription setup: they store a **name**, **validity days**, a **default recurring plan**, and **product lines** (product, quantity, unit price). Staff can **apply** a template to a subscription to bulk-create **order lines** (see [Subscriptions](05-subscriptions-and-order-lines.md)).

## Data model

- **`QuotationTemplate`**: `name`, `validityDays`, `recurringPlanId`.
- **`QuotationTemplateLine`**: `templateId`, `productId`, `quantity`, `unitPrice` only (no `variantId`, `taxId`, `discountId` in Prisma).

Schema: [`server/prisma/schema.prisma`](../../server/prisma/schema.prisma).

## API

Mounted at **`/api/quotation-templates`** in [`server/src/app.js`](../../server/src/app.js).

File: [`server/src/routes/quotations.routes.js`](../../server/src/routes/quotations.routes.js).

| Method | Path | AuthZ |
|--------|------|-------|
| GET | `/` | `authenticate` + `admin`, `internal_user` |
| GET | `/:id` | same |
| POST | `/` | same |
| PUT | `/:id` | same |
| DELETE | `/:id` | **`admin` only** |

Controller: [`server/src/controllers/quotations.controller.js`](../../server/src/controllers/quotations.controller.js).

### Create / update payload (intended)

- **Create**: `name`, `recurringPlanId`, optional `templateLines[]` with `productId`, `quantity`, `unitPrice`.

### Implementation note (schema alignment)

The controller’s **create** path uses nested `templateLines.create` with fields that must match Prisma. The **update** transaction references **`quotationTemplateId`** on lines when calling `deleteMany` / `createMany`; the Prisma model field on `QuotationTemplateLine` is **`templateId`**, not `quotationTemplateId`. If template updates fail at runtime, this naming mismatch is the first place to fix.

Similarly, **`applyTemplate`** in [`subscription.service.js`](../../server/src/services/subscription.service.js) maps `variantId`, `taxId`, `discountId` from template lines—those properties **do not exist** on `QuotationTemplateLine` in the schema. Applying a template only reliably carries **productId, quantity, unitPrice** until the schema and service are aligned.

## Client

- Page: [`client/src/pages/QuotationTemplatesPage.jsx`](../../client/src/pages/QuotationTemplatesPage.jsx).
- Components: [`TemplateForm.jsx`](../../client/src/components/quotations/TemplateForm.jsx), [`TemplateList.jsx`](../../client/src/components/quotations/TemplateList.jsx).
- API: [`client/src/api/quotations.api.js`](../../client/src/api/quotations.api.js) — base path `/quotation-templates`.

## Subscription creation UX

[`SubscriptionForm.jsx`](../../client/src/components/subscriptions/SubscriptionForm.jsx) optionally selects a template after choosing customer + plan; on submit it:

1. `POST /api/subscriptions` with `customerId`, `planId`, dates, terms, notes.
2. If template chosen, `POST /api/subscriptions/:id/apply-template` with `{ templateId }`.

**Frontend caveat**: some selects use `_id` / `name` where API returns `id` / `fullName`—if dropdowns appear empty or submit fails, compare network JSON to component field access.
