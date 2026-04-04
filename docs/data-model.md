# Data model (Prisma / PostgreSQL)

Authoritative schema: [`server/prisma/schema.prisma`](../server/prisma/schema.prisma). Prisma maps models to tables via `@@map("snake_case_table")`.

## Enums

| Enum | Values | Used for |
|------|--------|----------|
| `Role` | `admin`, `internal_user`, `portal_user` | `User.role` |
| `BillingPeriod` | `daily`, `weekly`, `monthly`, `yearly` | `RecurringPlan.billingPeriod` |
| `SubscriptionStatus` | `draft`, `quotation`, `confirmed`, `active`, `paused`, `closed` | `Subscription.status` |
| `InvoiceStatus` | `draft`, `confirmed`, `paid`, `cancelled` | `Invoice.status` |
| `PaymentMethod` | `stripe`, `cash`, `bank_transfer`, `other` | `Payment.method` |
| `PaymentStatus` | `pending`, `completed`, `failed`, `refunded` | `Payment.status` |
| `DiscountType` | `fixed`, `percentage` | `Discount.type` |
| `AuditAction` | `create`, `update`, `delete` | `AuditLog.action` (call sites should use these exact strings) |

## Core entities and relationships

### User (`users`)

- Staff or customer: **`role`** distinguishes behavior in the API and UI.
- **Auth**: `email` (unique), `password` (bcrypt hash), optional `resetToken` + `resetTokenExpiry`.
- **Relations**: `subscriptions` (as **customer**), `invoices`, `statusChanges` on subscriptions, `auditLogs`.
- **Note**: `Subscription.customerId` is required; relation uses `onDelete: SetNull` on the FK to user—deleting a user can conflict with a non-null `customerId` depending on DB constraints; be careful describing deletes to judges.

### Product (`products`) and ProductVariant (`product_variants`)

- Product: name, type, sales/cost price, description, image, `isActive`.
- Variant: `attribute`, `value`, `extraPrice`; belongs to one product; cascade delete with product.
- Linked from **OrderLine**, **InvoiceLine**, **QuotationTemplateLine**, and **DiscountProduct** (many-to-many with discount).

### RecurringPlan (`recurring_plans`)

- **Pricing**: `price`, `billingPeriod`.
- **Commercial rules**: `minQuantity`, optional `startDate` / `endDate`, flags `autoClose`, `closable`, `pausable`, `renewable`, `isActive`.
- Used by **Subscription** and **QuotationTemplate**.

### Subscription (`subscriptions`)

- **Identity**: `subscriptionNo` (unique string, generated in service).
- **Links**: `customerId` → User, `planId` → RecurringPlan.
- **Lifecycle**: `status` (see subscription flow doc).
- **Children**: `orderLines`, `invoices`, `statusLogs`, `discountSubscriptions` (many-to-many with Discount).

### OrderLine (`order_lines`)

One row per product line on a subscription:

- `productId`, optional `variantId`, `quantity`, `unitPrice`, **`amount`** (intended as qty × unit price at line level).
- Optional `taxId`, `discountId` for line-level tax/discount on invoicing.

### QuotationTemplate (`quotation_templates`) and QuotationTemplateLine (`quotation_template_lines`)

- Template: `name`, `validityDays`, `recurringPlanId`.
- Line: `templateId`, `productId`, `quantity`, `unitPrice` only (no variant/tax/discount columns in schema).

### Invoice (`invoices`) and InvoiceLine (`invoice_lines`)

- Invoice: `invoiceNo`, `subscriptionId`, `customerId`, `status`, monetary aggregates (`totalAmount`, `taxAmount`, `discountAmount`, `netAmount`, `paidAmount`, `outstandingAmount`), `issuedAt`, `dueDate`.
- Line: mirrors order line concept with frozen `description`, per-line `taxAmount`, `discountAmount`, `amount`.

### Payment (`payments`)

- `invoiceId`, `method`, `amount`, `paymentDate`, `status`, optional Stripe ids, `reference`, `notes`.
- **Manual payments** in code use `status: 'completed'` immediately.

### Tax (`taxes`)

- `name`, `rate` (percentage number), `type` (string), `isActive`.

### Discount (`discounts`)

- `type`, `value`, `minPurchase`, `minQuantity`, date range, `limitUsage`, `currentUsage`, `isActive`.
- **DiscountProduct** / **DiscountSubscription** join tables scope which products/subscriptions a discount can apply to; **line-level** application on invoices still comes from **OrderLine.discountId** when generating.

### SubscriptionStatusLog (`subscription_status_logs`)

- Audit trail of status changes: `fromStatus`, `toStatus`, `changedById`, `reason`, timestamp.

### AuditLog (`audit_logs`)

- Generic table/record/action with `oldValues` / `newValues` JSON; written via [`audit.service.js`](../server/src/services/audit.service.js).

## IDs in API vs client

The API returns Prisma records with **`id`** (UUID). Some React components still reference **`_id`** or **`name`** where the API returns **`fullName`**—those are frontend inconsistencies; the network payload uses `id` and `fullName`.
