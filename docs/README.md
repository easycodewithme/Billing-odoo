# Subscription Management System — documentation

Regenerated for the current codebase (includes **portal self-subscribe** via the shop API).

| Doc | Topic |
|-----|--------|
| [01-architecture.md](01-architecture.md) | Stack, entrypoints, rate limits, cron, `/api` map |
| [02-data-model.md](02-data-model.md) | `shop_orders` vs `subscriptions`, key relations, JSONB |
| [03-authentication.md](03-authentication.md) | JWT cookies, `/auth/me`, refresh (stateless) |
| [04-shop-and-self-subscribe.md](04-shop-and-self-subscribe.md) | Products, cart, checkout, **`GET /shop/plans`**, **`POST /shop/subscribe`** |
| [05-subscriptions-staff-and-lifecycle.md](05-subscriptions-staff-and-lifecycle.md) | Staff CRUD, status machine, portal read isolation, renew |
| [06-invoices-payments-stripe.md](06-invoices-payments-stripe.md) | Invoices, manual pay, Stripe + webhook, shop-Stripe caveat |
| [07-ui-routing.md](07-ui-routing.md) | `MainLayout` vs `ShopLayout`, `ShopNav`, route order |
| [08-codebase-map.md](08-codebase-map.md) | Folder/file map (short) |

**One-sentence model:** Customers can **browse/buy products** (`shop_orders`) and **subscribe to recurring plans** (`POST /shop/subscribe` → `subscriptions` + optional `order_lines`); staff still manage the full ERP lifecycle (`POST /api/subscriptions`, templates, invoices, reports).
