# Subscription Management System - Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a full-stack Subscription Management System with admin/internal portal and customer portal, covering products, recurring plans, subscriptions lifecycle, invoicing, payments (Stripe), discounts, taxes, users, and reporting.

**Architecture:** Monorepo with `server/` (Node.js + Express + Prisma + PostgreSQL) and `client/` (React + Vite + TailwindCSS + shadcn/ui). JWT auth with role-based access (Admin, Internal, Portal). REST API with separate route groups for admin and portal. Glassmorphism design system with navy/green palette.

**Tech Stack:** React 18 + Vite, TailwindCSS + shadcn/ui, React Router v6, Zustand (state), React Hook Form + Zod (forms), Recharts (reporting), Node.js + Express.js, Prisma ORM, PostgreSQL, JWT (access + refresh tokens), Stripe (payments), Nodemailer (email), Lucide React (icons).

**Design System:**
- Style: Glassmorphism (frosted glass, backdrop blur, layered depth)
- Colors: Primary `#1E3A5F` (navy), Secondary `#2563EB` (blue), Accent `#059669` (green), Background `#F8FAFC`, Destructive `#DC2626`
- Typography: Fira Sans (body) + Fira Code (data/numbers)
- Icons: Lucide React (consistent stroke weight, no emojis)
- Effects: Backdrop blur 10-20px, subtle borders `rgba(255,255,255,0.2)`, 8px spacing rhythm

---

## Hackathon Priority Order

**Phase 1 (Hours 0-3): Foundation** - Tasks 1-3
**Phase 2 (Hours 3-8): Core Backend** - Tasks 4-8
**Phase 3 (Hours 8-14): Admin Frontend** - Tasks 9-14
**Phase 4 (Hours 14-19): Customer Portal** - Tasks 15-18
**Phase 5 (Hours 19-22): Payments & Invoicing** - Tasks 19-20
**Phase 6 (Hours 22-24): Reports & Polish** - Tasks 21-22

---

## File Structure

```
d:\Backup-billing\
├── server/
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.ts
│   └── src/
│       ├── index.ts                    # Express app entry
│       ├── config/
│       │   └── env.ts                  # Environment config
│       ├── middleware/
│       │   ├── auth.ts                 # JWT verification + role guard
│       │   ├── validate.ts             # Zod validation middleware
│       │   └── errorHandler.ts         # Global error handler
│       ├── routes/
│       │   ├── auth.routes.ts          # Login, signup, reset password
│       │   ├── product.routes.ts       # Products CRUD
│       │   ├── plan.routes.ts          # Recurring plans CRUD
│       │   ├── subscription.routes.ts  # Subscriptions lifecycle
│       │   ├── invoice.routes.ts       # Invoice management
│       │   ├── payment.routes.ts       # Payment + Stripe
│       │   ├── discount.routes.ts      # Discount rules (admin only)
│       │   ├── tax.routes.ts           # Tax configuration
│       │   ├── user.routes.ts          # Users/contacts management
│       │   ├── report.routes.ts        # Reporting endpoints
│       │   └── portal.routes.ts        # Customer portal APIs
│       ├── controllers/
│       │   ├── auth.controller.ts
│       │   ├── product.controller.ts
│       │   ├── plan.controller.ts
│       │   ├── subscription.controller.ts
│       │   ├── invoice.controller.ts
│       │   ├── payment.controller.ts
│       │   ├── discount.controller.ts
│       │   ├── tax.controller.ts
│       │   ├── user.controller.ts
│       │   ├── report.controller.ts
│       │   └── portal.controller.ts
│       ├── services/
│       │   ├── auth.service.ts         # JWT token generation, password hashing
│       │   ├── subscription.service.ts # Lifecycle logic, renew, upsell
│       │   ├── invoice.service.ts      # Invoice generation + calculations
│       │   ├── payment.service.ts      # Stripe integration
│       │   ├── discount.service.ts     # Discount application logic
│       │   └── email.service.ts        # Nodemailer setup
│       ├── validators/
│       │   ├── auth.validator.ts
│       │   ├── product.validator.ts
│       │   ├── plan.validator.ts
│       │   ├── subscription.validator.ts
│       │   ├── invoice.validator.ts
│       │   ├── discount.validator.ts
│       │   └── tax.validator.ts
│       └── utils/
│           ├── generateNumber.ts       # Auto-generate SO/INV numbers
│           └── calculations.ts         # Tax, discount, total calculations
├── client/
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── tailwind.config.ts
│   ├── index.html
│   ├── components.json                 # shadcn/ui config
│   └── src/
│       ├── main.tsx
│       ├── App.tsx                     # Router setup
│       ├── index.css                   # Tailwind + design tokens
│       ├── lib/
│       │   ├── api.ts                  # Axios instance + interceptors
│       │   └── utils.ts               # cn() helper
│       ├── stores/
│       │   ├── authStore.ts            # Zustand auth state
│       │   └── cartStore.ts            # Zustand cart state (portal)
│       ├── hooks/
│       │   └── useAuth.ts             # Auth hook
│       ├── components/
│       │   ├── ui/                     # shadcn/ui components
│       │   ├── layout/
│       │   │   ├── AdminLayout.tsx     # Sidebar + topbar (admin/internal)
│       │   │   ├── PortalLayout.tsx    # Navbar + footer (customer portal)
│       │   │   ├── Sidebar.tsx
│       │   │   └── Topbar.tsx
│       │   ├── shared/
│       │   │   ├── DataTable.tsx       # Reusable table with search/sort
│       │   │   ├── FormField.tsx       # Reusable form field wrapper
│       │   │   ├── StatusBadge.tsx     # Status flow badges
│       │   │   ├── ConfirmDialog.tsx   # Destructive action confirmation
│       │   │   └── EmptyState.tsx      # Empty state placeholder
│       │   └── features/
│       │       ├── SubscriptionStatusFlow.tsx  # Visual status stepper
│       │       └── OrderLineEditor.tsx         # Editable order lines table
│       ├── pages/
│       │   ├── auth/
│       │   │   ├── LoginPage.tsx
│       │   │   ├── SignupPage.tsx
│       │   │   └── ResetPasswordPage.tsx
│       │   ├── admin/
│       │   │   ├── DashboardPage.tsx
│       │   │   ├── products/
│       │   │   │   ├── ProductListPage.tsx
│       │   │   │   └── ProductFormPage.tsx
│       │   │   ├── plans/
│       │   │   │   ├── PlanListPage.tsx
│       │   │   │   └── PlanFormPage.tsx
│       │   │   ├── subscriptions/
│       │   │   │   ├── SubscriptionListPage.tsx
│       │   │   │   └── SubscriptionFormPage.tsx
│       │   │   ├── invoices/
│       │   │   │   ├── InvoiceListPage.tsx
│       │   │   │   └── InvoiceFormPage.tsx
│       │   │   ├── payments/
│       │   │   │   └── PaymentListPage.tsx
│       │   │   ├── discounts/
│       │   │   │   ├── DiscountListPage.tsx
│       │   │   │   └── DiscountFormPage.tsx
│       │   │   ├── taxes/
│       │   │   │   ├── TaxListPage.tsx
│       │   │   │   └── TaxFormPage.tsx
│       │   │   ├── users/
│       │   │   │   ├── UserListPage.tsx
│       │   │   │   └── UserFormPage.tsx
│       │   │   ├── config/
│       │   │   │   ├── VariantListPage.tsx
│       │   │   │   ├── VariantFormPage.tsx
│       │   │   │   ├── QuotationTemplateListPage.tsx
│       │   │   │   └── QuotationTemplateFormPage.tsx
│       │   │   └── reports/
│       │   │       └── ReportsPage.tsx
│       │   └── portal/
│       │       ├── HomePage.tsx
│       │       ├── ShopPage.tsx
│       │       ├── ProductDetailPage.tsx
│       │       ├── CartPage.tsx
│       │       ├── CheckoutPage.tsx
│       │       ├── OrderSuccessPage.tsx
│       │       ├── MyOrdersPage.tsx
│       │       ├── OrderDetailPage.tsx
│       │       └── ProfilePage.tsx
│       └── types/
│           └── index.ts               # Shared TypeScript types
├── docker-compose.yml                  # PostgreSQL container
└── package.json                        # Root workspace scripts
```

---

## Task 1: Project Scaffolding & Docker Setup

**Files:**
- Create: `docker-compose.yml`
- Create: `package.json` (root)
- Create: `server/package.json`
- Create: `server/tsconfig.json`
- Create: `server/.env`
- Create: `client/package.json` (via Vite)

- [ ] **Step 1: Create docker-compose.yml for PostgreSQL**

```yaml
# d:\Backup-billing\docker-compose.yml
version: '3.8'
services:
  db:
    image: postgres:16-alpine
    container_name: subscription_db
    restart: unless-stopped
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: subscription_db
    ports:
      - '5432:5432'
    volumes:
      - pgdata:/var/lib/postgresql/data

volumes:
  pgdata:
```

- [ ] **Step 2: Start PostgreSQL**

Run: `docker-compose up -d`
Expected: PostgreSQL running on port 5432

- [ ] **Step 3: Create root package.json with workspace scripts**

```json
{
  "name": "subscription-management-system",
  "private": true,
  "scripts": {
    "dev": "concurrently \"npm run dev:server\" \"npm run dev:client\"",
    "dev:server": "cd server && npm run dev",
    "dev:client": "cd client && npm run dev",
    "db:push": "cd server && npx prisma db push",
    "db:seed": "cd server && npx prisma db seed",
    "db:studio": "cd server && npx prisma studio"
  },
  "devDependencies": {
    "concurrently": "^8.2.2"
  }
}
```

Run: `npm install`

- [ ] **Step 4: Scaffold server**

```bash
cd server
npm init -y
npm install express cors dotenv bcryptjs jsonwebtoken @prisma/client zod stripe nodemailer
npm install -D typescript ts-node-dev @types/node @types/express @types/cors @types/bcryptjs @types/jsonwebtoken @types/nodemailer prisma
npx tsc --init
```

```json
// server/tsconfig.json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*", "prisma/**/*"]
}
```

Add to `server/package.json` scripts:
```json
{
  "scripts": {
    "dev": "ts-node-dev --respawn --transpile-only src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js"
  },
  "prisma": {
    "seed": "ts-node-dev prisma/seed.ts"
  }
}
```

- [ ] **Step 5: Create server .env**

```env
# server/.env
PORT=5000
NODE_ENV=development
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/subscription_db
JWT_SECRET=sub-mgmt-jwt-secret-key-dev-2026-04
JWT_REFRESH_SECRET=sub-mgmt-refresh-secret-key-dev-2026-04
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d
STRIPE_SECRET_KEY=sk_test_YOUR_KEY_HERE
STRIPE_WEBHOOK_SECRET=whsec_YOUR_KEY_HERE
STRIPE_SUCCESS_URL=http://localhost:5173/payments/success
STRIPE_CANCEL_URL=http://localhost:5173/payments/cancel
SMTP_USER=your@gmail.com
SMTP_PASS=your_app_password
SMTP_FROM_NAME=Subscription Manager
CLIENT_URL=http://localhost:5173
```

- [ ] **Step 6: Scaffold client with Vite**

```bash
npm create vite@latest client -- --template react-ts
cd client
npm install
npm install react-router-dom zustand @tanstack/react-query axios react-hook-form @hookform/resolvers zod recharts lucide-react clsx tailwind-merge
npm install -D tailwindcss @tailwindcss/vite
```

- [ ] **Step 7: Commit**

```bash
git init
git add docker-compose.yml package.json server/package.json server/tsconfig.json server/.env.example client/
git commit -m "chore: scaffold monorepo with server (Express+Prisma) and client (React+Vite)"
```

---

## Task 2: Prisma Schema - Complete Database Models

**Files:**
- Create: `server/prisma/schema.prisma`

- [ ] **Step 1: Write the complete Prisma schema**

```prisma
// server/prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum UserRole {
  ADMIN
  INTERNAL
  PORTAL
}

enum SubscriptionStatus {
  DRAFT
  QUOTATION_SENT
  CONFIRMED
  ACTIVE
  PAUSED
  CLOSED
}

enum InvoiceStatus {
  DRAFT
  CONFIRMED
  PAID
  CANCELLED
}

enum DiscountType {
  FIXED
  PERCENTAGE
}

enum TaxComputation {
  PERCENTAGE
  FIXED
}

enum BillingPeriod {
  DAILY
  WEEKLY
  MONTHLY
  YEARLY
}

enum PaymentMethod {
  ONLINE
  CASH
}

model User {
  id            String    @id @default(uuid())
  name          String
  email         String    @unique
  password      String
  phone         String?
  address       String?
  role          UserRole  @default(PORTAL)
  isActive      Boolean   @default(true)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  // Relations
  contacts      Contact[]
  subscriptions Subscription[]
  invoices      Invoice[]
  payments      Payment[]

  @@map("users")
}

model Contact {
  id            String    @id @default(uuid())
  name          String
  email         String
  phone         String?
  address       String?
  userId        String
  user          User      @relation(fields: [userId], references: [id])
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  subscriptions Subscription[]

  @@map("contacts")
}

model Product {
  id            String    @id @default(uuid())
  name          String
  productType   String    @default("SERVICE")  // SERVICE or GOODS
  salesPrice    Float
  costPrice     Float
  description   String?
  image         String?
  isActive      Boolean   @default(true)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  // Relations
  variants      ProductVariant[]
  recurringPrices ProductRecurringPrice[]
  orderLines    OrderLine[]
  discountProducts DiscountProduct[]
  quotationLines QuotationTemplateLine[]

  @@map("products")
}

model ProductVariant {
  id            String    @id @default(uuid())
  productId     String
  product       Product   @relation(fields: [productId], references: [id], onDelete: Cascade)
  attribute     String    // e.g., "Brand"
  value         String    // e.g., "Odoo"
  extraPrice    Float     @default(0)
  createdAt     DateTime  @default(now())

  @@map("product_variants")
}

model ProductRecurringPrice {
  id            String    @id @default(uuid())
  productId     String
  product       Product   @relation(fields: [productId], references: [id], onDelete: Cascade)
  planId        String
  plan          RecurringPlan @relation(fields: [planId], references: [id])
  price         Float
  createdAt     DateTime  @default(now())

  @@map("product_recurring_prices")
}

model RecurringPlan {
  id            String        @id @default(uuid())
  name          String
  price         Float
  billingPeriod BillingPeriod
  billingInterval Int          @default(1)  // e.g., 1 month, 6 months
  minQuantity   Int           @default(1)
  startDate     DateTime?
  endDate       DateTime?
  autoClose     Boolean       @default(false)
  autoCloseDays Int?
  closable      Boolean       @default(true)
  pausable      Boolean       @default(false)
  renewable     Boolean       @default(true)
  isActive      Boolean       @default(true)
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt

  // Relations
  productPrices ProductRecurringPrice[]
  subscriptions Subscription[]
  quotationTemplates QuotationTemplate[]

  @@map("recurring_plans")
}

model Attribute {
  id            String    @id @default(uuid())
  name          String    @unique  // e.g., "Brand", "Size"
  values        AttributeValue[]
  createdAt     DateTime  @default(now())

  @@map("attributes")
}

model AttributeValue {
  id            String    @id @default(uuid())
  attributeId   String
  attribute     Attribute @relation(fields: [attributeId], references: [id], onDelete: Cascade)
  value         String    // e.g., "Odoo", "Large"
  extraPrice    Float     @default(0)
  createdAt     DateTime  @default(now())

  @@map("attribute_values")
}

model QuotationTemplate {
  id              String    @id @default(uuid())
  name            String
  validityDays    Int       @default(30)
  recurringPlanId String?
  recurringPlan   RecurringPlan? @relation(fields: [recurringPlanId], references: [id])
  lastForever     Boolean   @default(false)
  endAfterDays    Int?
  description     String?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  // Relations
  lines           QuotationTemplateLine[]
  subscriptions   Subscription[]

  @@map("quotation_templates")
}

model QuotationTemplateLine {
  id              String    @id @default(uuid())
  templateId      String
  template        QuotationTemplate @relation(fields: [templateId], references: [id], onDelete: Cascade)
  productId       String
  product         Product   @relation(fields: [productId], references: [id])
  quantity        Float     @default(1)
  description     String?
  createdAt       DateTime  @default(now())

  @@map("quotation_template_lines")
}

model Subscription {
  id                String             @id @default(uuid())
  number            String             @unique  // Auto: SO001, SO002...
  customerId        String
  customer          User               @relation(fields: [customerId], references: [id])
  contactId         String?
  contact           Contact?           @relation(fields: [contactId], references: [id])
  planId            String
  plan              RecurringPlan      @relation(fields: [planId], references: [id])
  templateId        String?
  template          QuotationTemplate? @relation(fields: [templateId], references: [id])
  salespersonId     String?
  status            SubscriptionStatus @default(DRAFT)
  startDate         DateTime?
  expirationDate    DateTime?
  quotationDate     DateTime?
  nextInvoiceDate   DateTime?
  paymentTermDays   Int                @default(30)
  earlyDiscountPercent Float?
  earlyDiscountDays Int?
  untaxedAmount     Float              @default(0)
  taxAmount         Float              @default(0)
  totalAmount       Float              @default(0)
  notes             String?
  parentId          String?            // For renew/upsell linking
  parent            Subscription?      @relation("SubscriptionHistory", fields: [parentId], references: [id])
  children          Subscription[]     @relation("SubscriptionHistory")
  createdAt         DateTime           @default(now())
  updatedAt         DateTime           @updatedAt

  // Relations
  orderLines        OrderLine[]
  invoices          Invoice[]

  @@map("subscriptions")
}

model OrderLine {
  id              String    @id @default(uuid())
  subscriptionId  String
  subscription    Subscription @relation(fields: [subscriptionId], references: [id], onDelete: Cascade)
  productId       String
  product         Product   @relation(fields: [productId], references: [id])
  description     String?
  quantity        Float     @default(1)
  unitPrice       Float
  discountPercent Float     @default(0)
  taxId           String?
  tax             Tax?      @relation(fields: [taxId], references: [id])
  subtotal        Float     @default(0)
  taxAmount       Float     @default(0)
  total           Float     @default(0)
  createdAt       DateTime  @default(now())

  @@map("order_lines")
}

model Invoice {
  id              String        @id @default(uuid())
  number          String        @unique  // Auto: INV/001, INV/002...
  subscriptionId  String
  subscription    Subscription  @relation(fields: [subscriptionId], references: [id])
  customerId      String
  customer        User          @relation(fields: [customerId], references: [id])
  status          InvoiceStatus @default(DRAFT)
  invoiceDate     DateTime      @default(now())
  dueDate         DateTime
  untaxedAmount   Float         @default(0)
  taxAmount       Float         @default(0)
  totalAmount     Float         @default(0)
  amountPaid      Float         @default(0)
  amountDue       Float         @default(0)
  notes           String?
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt

  // Relations
  invoiceLines    InvoiceLine[]
  payments        Payment[]

  @@map("invoices")
}

model InvoiceLine {
  id              String    @id @default(uuid())
  invoiceId       String
  invoice         Invoice   @relation(fields: [invoiceId], references: [id], onDelete: Cascade)
  description     String
  quantity        Float     @default(1)
  unitPrice       Float
  discountPercent Float     @default(0)
  taxId           String?
  tax             Tax?      @relation(fields: [taxId], references: [id])
  subtotal        Float     @default(0)
  taxAmount       Float     @default(0)
  total           Float     @default(0)
  createdAt       DateTime  @default(now())

  @@map("invoice_lines")
}

model Payment {
  id              String        @id @default(uuid())
  invoiceId       String
  invoice         Invoice       @relation(fields: [invoiceId], references: [id])
  customerId      String
  customer        User          @relation(fields: [customerId], references: [id])
  method          PaymentMethod @default(ONLINE)
  amount          Float
  paymentDate     DateTime      @default(now())
  stripeSessionId String?
  stripePaymentId String?
  notes           String?
  createdAt       DateTime      @default(now())

  @@map("payments")
}

model Tax {
  id              String         @id @default(uuid())
  name            String         // e.g., "GST 18%"
  computation     TaxComputation @default(PERCENTAGE)
  amount          Float          // 18 for 18%, or fixed amount
  isActive        Boolean        @default(true)
  createdAt       DateTime       @default(now())
  updatedAt       DateTime       @updatedAt

  orderLines      OrderLine[]
  invoiceLines    InvoiceLine[]

  @@map("taxes")
}

model Discount {
  id              String       @id @default(uuid())
  name            String
  type            DiscountType @default(PERCENTAGE)
  value           Float        // 10 for 10%, or fixed amount
  code            String?      @unique
  minPurchase     Float?
  minQuantity     Int?
  startDate       DateTime
  endDate         DateTime
  limitUsage      Boolean      @default(false)
  maxUsage        Int?
  currentUsage    Int          @default(0)
  isActive        Boolean      @default(true)
  createdAt       DateTime     @default(now())
  updatedAt       DateTime     @updatedAt

  // Relations
  products        DiscountProduct[]

  @@map("discounts")
}

model DiscountProduct {
  id          String   @id @default(uuid())
  discountId  String
  discount    Discount @relation(fields: [discountId], references: [id], onDelete: Cascade)
  productId   String
  product     Product  @relation(fields: [productId], references: [id])

  @@unique([discountId, productId])
  @@map("discount_products")
}
```

- [ ] **Step 2: Push schema to database**

Run: `cd server && npx prisma db push`
Expected: "Your database is now in sync with your Prisma schema."

- [ ] **Step 3: Generate Prisma client**

Run: `npx prisma generate`
Expected: "Generated Prisma Client"

- [ ] **Step 4: Commit**

```bash
git add server/prisma/schema.prisma
git commit -m "feat: add complete Prisma schema with all 16 models"
```

---

## Task 3: Seed Data + Server Bootstrap

**Files:**
- Create: `server/prisma/seed.ts`
- Create: `server/src/index.ts`
- Create: `server/src/config/env.ts`
- Create: `server/src/middleware/errorHandler.ts`

- [ ] **Step 1: Create env config**

```typescript
// server/src/config/env.ts
import dotenv from 'dotenv';
dotenv.config();

export const env = {
  port: parseInt(process.env.PORT || '5000'),
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL!,
  jwtSecret: process.env.JWT_SECRET!,
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET!,
  jwtAccessExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
  jwtRefreshExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
  stripeSecretKey: process.env.STRIPE_SECRET_KEY || '',
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
  stripeSuccessUrl: process.env.STRIPE_SUCCESS_URL || '',
  stripeCancelUrl: process.env.STRIPE_CANCEL_URL || '',
  smtpUser: process.env.SMTP_USER || '',
  smtpPass: process.env.SMTP_PASS || '',
  smtpFromName: process.env.SMTP_FROM_NAME || 'Subscription Manager',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
};
```

- [ ] **Step 2: Create error handler middleware**

```typescript
// server/src/middleware/errorHandler.ts
import { Request, Response, NextFunction } from 'express';

export class AppError extends Error {
  statusCode: number;
  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
  }
}

export function errorHandler(err: Error, req: Request, res: Response, next: NextFunction) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ error: err.message });
  }
  console.error('Unhandled error:', err);
  return res.status(500).json({ error: 'Internal server error' });
}
```

- [ ] **Step 3: Create Express app entry**

```typescript
// server/src/index.ts
import express from 'express';
import cors from 'cors';
import { env } from './config/env';
import { errorHandler } from './middleware/errorHandler';

const app = express();

app.use(cors({ origin: env.clientUrl, credentials: true }));
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes will be added in subsequent tasks
// app.use('/api/auth', authRoutes);
// etc.

app.use(errorHandler);

app.listen(env.port, () => {
  console.log(`Server running on port ${env.port}`);
});

export default app;
```

- [ ] **Step 4: Create seed file with admin user + sample data**

```typescript
// server/prisma/seed.ts
import { PrismaClient, UserRole, BillingPeriod, TaxComputation, DiscountType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // 1. Create Admin User
  const adminPassword = await bcrypt.hash('Admin@123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@subscription.com' },
    update: {},
    create: {
      name: 'Admin User',
      email: 'admin@subscription.com',
      password: adminPassword,
      role: UserRole.ADMIN,
      phone: '9999999999',
      address: '123 Admin Street',
    },
  });

  // 2. Create Internal User
  const internalPassword = await bcrypt.hash('Internal@123', 10);
  const internal = await prisma.user.upsert({
    where: { email: 'internal@subscription.com' },
    update: {},
    create: {
      name: 'Internal User',
      email: 'internal@subscription.com',
      password: internalPassword,
      role: UserRole.INTERNAL,
    },
  });

  // 3. Create Portal User
  const portalPassword = await bcrypt.hash('Portal@123', 10);
  const portal = await prisma.user.upsert({
    where: { email: 'customer@example.com' },
    update: {},
    create: {
      name: 'John Customer',
      email: 'customer@example.com',
      password: portalPassword,
      role: UserRole.PORTAL,
      phone: '8888888888',
      address: '456 Customer Ave',
    },
  });

  // 4. Create Contact for portal user
  await prisma.contact.upsert({
    where: { id: 'seed-contact-1' },
    update: {},
    create: {
      id: 'seed-contact-1',
      name: 'John Customer',
      email: 'customer@example.com',
      phone: '8888888888',
      address: '456 Customer Ave',
      userId: portal.id,
    },
  });

  // 5. Create Taxes
  const gst18 = await prisma.tax.create({
    data: { name: 'GST 18%', computation: TaxComputation.PERCENTAGE, amount: 18 },
  });
  const gst12 = await prisma.tax.create({
    data: { name: 'GST 12%', computation: TaxComputation.PERCENTAGE, amount: 12 },
  });
  const gst5 = await prisma.tax.create({
    data: { name: 'GST 5%', computation: TaxComputation.PERCENTAGE, amount: 5 },
  });

  // 6. Create Recurring Plans
  const monthlyPlan = await prisma.recurringPlan.create({
    data: {
      name: 'Monthly Plan',
      price: 1200,
      billingPeriod: BillingPeriod.MONTHLY,
      billingInterval: 1,
      minQuantity: 1,
      closable: true,
      pausable: true,
      renewable: true,
    },
  });
  const yearlyPlan = await prisma.recurringPlan.create({
    data: {
      name: 'Yearly Plan',
      price: 10080,
      billingPeriod: BillingPeriod.YEARLY,
      billingInterval: 1,
      minQuantity: 1,
      closable: true,
      pausable: false,
      renewable: true,
      autoClose: true,
      autoCloseDays: 365,
    },
  });
  const weeklyPlan = await prisma.recurringPlan.create({
    data: {
      name: 'Weekly Plan',
      price: 400,
      billingPeriod: BillingPeriod.WEEKLY,
      billingInterval: 1,
      minQuantity: 1,
      closable: true,
      renewable: true,
    },
  });

  // 7. Create Products
  const product1 = await prisma.product.create({
    data: {
      name: 'Cloud Hosting Basic',
      productType: 'SERVICE',
      salesPrice: 1200,
      costPrice: 800,
      description: 'Basic cloud hosting plan with 10GB storage',
    },
  });
  const product2 = await prisma.product.create({
    data: {
      name: 'Cloud Hosting Pro',
      productType: 'SERVICE',
      salesPrice: 2400,
      costPrice: 1600,
      description: 'Pro cloud hosting with 50GB storage and priority support',
    },
  });
  const product3 = await prisma.product.create({
    data: {
      name: 'SSL Certificate',
      productType: 'SERVICE',
      salesPrice: 500,
      costPrice: 200,
      description: 'Annual SSL certificate for your domain',
    },
  });
  const product4 = await prisma.product.create({
    data: {
      name: 'Domain Registration',
      productType: 'GOODS',
      salesPrice: 800,
      costPrice: 400,
      description: 'One year domain registration (.com)',
    },
  });

  // 8. Create Product Variants
  await prisma.productVariant.createMany({
    data: [
      { productId: product1.id, attribute: 'Storage', value: '10GB', extraPrice: 0 },
      { productId: product1.id, attribute: 'Storage', value: '25GB', extraPrice: 300 },
      { productId: product1.id, attribute: 'Storage', value: '50GB', extraPrice: 600 },
      { productId: product2.id, attribute: 'Support', value: 'Standard', extraPrice: 0 },
      { productId: product2.id, attribute: 'Support', value: 'Priority', extraPrice: 500 },
    ],
  });

  // 9. Create Product Recurring Prices
  await prisma.productRecurringPrice.createMany({
    data: [
      { productId: product1.id, planId: monthlyPlan.id, price: 1200 },
      { productId: product1.id, planId: yearlyPlan.id, price: 10080 },
      { productId: product2.id, planId: monthlyPlan.id, price: 2400 },
      { productId: product2.id, planId: yearlyPlan.id, price: 20160 },
    ],
  });

  // 10. Create Attributes
  const brandAttr = await prisma.attribute.create({
    data: {
      name: 'Brand',
      values: {
        create: [
          { value: 'Odoo', extraPrice: 560 },
          { value: 'Standard', extraPrice: 0 },
        ],
      },
    },
  });
  const sizeAttr = await prisma.attribute.create({
    data: {
      name: 'Size',
      values: {
        create: [
          { value: 'Small', extraPrice: 0 },
          { value: 'Medium', extraPrice: 200 },
          { value: 'Large', extraPrice: 500 },
        ],
      },
    },
  });

  // 11. Create Discounts
  await prisma.discount.create({
    data: {
      name: '10% Off First Order',
      type: DiscountType.PERCENTAGE,
      value: 10,
      code: 'FIRST10',
      minPurchase: 500,
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-12-31'),
      limitUsage: true,
      maxUsage: 100,
    },
  });
  await prisma.discount.create({
    data: {
      name: 'Flat 200 Off',
      type: DiscountType.FIXED,
      value: 200,
      code: 'FLAT200',
      minPurchase: 1000,
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-12-31'),
    },
  });

  // 12. Create Quotation Template
  await prisma.quotationTemplate.create({
    data: {
      name: 'Standard Cloud Package',
      validityDays: 30,
      recurringPlanId: monthlyPlan.id,
      description: 'Standard cloud hosting monthly subscription',
      lines: {
        create: [
          { productId: product1.id, quantity: 1, description: 'Cloud Hosting Basic - Monthly' },
          { productId: product3.id, quantity: 1, description: 'SSL Certificate' },
        ],
      },
    },
  });

  console.log('Seed data created successfully!');
  console.log('Admin login: admin@subscription.com / Admin@123');
  console.log('Internal login: internal@subscription.com / Internal@123');
  console.log('Portal login: customer@example.com / Portal@123');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
```

- [ ] **Step 5: Run seed**

Run: `cd server && npx prisma db seed`
Expected: "Seed data created successfully!"

- [ ] **Step 6: Verify server starts**

Run: `cd server && npm run dev`
Expected: "Server running on port 5000"
Test: `curl http://localhost:5000/api/health` returns `{"status":"ok",...}`

- [ ] **Step 7: Commit**

```bash
git add server/
git commit -m "feat: add Express server bootstrap, env config, error handler, and seed data"
```

---

## Task 4: Auth Module (Backend)

**Files:**
- Create: `server/src/services/auth.service.ts`
- Create: `server/src/validators/auth.validator.ts`
- Create: `server/src/middleware/auth.ts`
- Create: `server/src/controllers/auth.controller.ts`
- Create: `server/src/routes/auth.routes.ts`
- Create: `server/src/services/email.service.ts`
- Modify: `server/src/index.ts`

- [ ] **Step 1: Create auth service (JWT + password)**

```typescript
// server/src/services/auth.service.ts
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { env } from '../config/env';

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateAccessToken(payload: { id: string; role: string }): string {
  return jwt.sign(payload, env.jwtSecret, { expiresIn: env.jwtAccessExpiry as any });
}

export function generateRefreshToken(payload: { id: string; role: string }): string {
  return jwt.sign(payload, env.jwtRefreshSecret, { expiresIn: env.jwtRefreshExpiry as any });
}

export function verifyAccessToken(token: string) {
  return jwt.verify(token, env.jwtSecret) as { id: string; role: string };
}

export function verifyRefreshToken(token: string) {
  return jwt.verify(token, env.jwtRefreshSecret) as { id: string; role: string };
}
```

- [ ] **Step 2: Create email service**

```typescript
// server/src/services/email.service.ts
import nodemailer from 'nodemailer';
import { env } from '../config/env';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: env.smtpUser, pass: env.smtpPass },
});

export async function sendResetPasswordEmail(to: string, resetLink: string) {
  await transporter.sendMail({
    from: `"${env.smtpFromName}" <${env.smtpUser}>`,
    to,
    subject: 'Reset Your Password',
    html: `<p>Click <a href="${resetLink}">here</a> to reset your password. This link expires in 15 minutes.</p>`,
  });
}
```

- [ ] **Step 3: Create auth validators**

```typescript
// server/src/validators/auth.validator.ts
import { z } from 'zod';

export const signupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain an uppercase letter')
    .regex(/[a-z]/, 'Password must contain a lowercase letter')
    .regex(/[!@#$%^&*(),.?":{}|<>]/, 'Password must contain a special character'),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const resetRequestSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain an uppercase letter')
    .regex(/[a-z]/, 'Password must contain a lowercase letter')
    .regex(/[!@#$%^&*(),.?":{}|<>]/, 'Password must contain a special character'),
});
```

- [ ] **Step 4: Create validation middleware**

```typescript
// server/src/middleware/validate.ts
import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const errors = result.error.errors.map((e) => ({ field: e.path.join('.'), message: e.message }));
      return res.status(400).json({ error: 'Validation failed', details: errors });
    }
    req.body = result.data;
    next();
  };
}
```

- [ ] **Step 5: Create auth middleware (JWT + role guard)**

```typescript
// server/src/middleware/auth.ts
import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../services/auth.service';
import { UserRole } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      user?: { id: string; role: string };
    }
  }
}

export function authenticate(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Access token required' });
  }
  try {
    const token = authHeader.split(' ')[1];
    req.user = verifyAccessToken(token);
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export function authorize(...roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role as UserRole)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
}
```

- [ ] **Step 6: Create auth controller**

```typescript
// server/src/controllers/auth.controller.ts
import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { hashPassword, comparePassword, generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../services/auth.service';
import { sendResetPasswordEmail } from '../services/email.service';
import { AppError } from '../middleware/errorHandler';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';

const prisma = new PrismaClient();

export async function signup(req: Request, res: Response, next: NextFunction) {
  try {
    const { name, email, password } = req.body;
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) throw new AppError('Email already exists', 409);

    const hashed = await hashPassword(password);
    const user = await prisma.user.create({
      data: { name, email, password: hashed, role: 'PORTAL' },
    });

    // Create default contact for portal user
    await prisma.contact.create({
      data: { name, email, userId: user.id },
    });

    const accessToken = generateAccessToken({ id: user.id, role: user.role });
    const refreshToken = generateRefreshToken({ id: user.id, role: user.role });

    res.status(201).json({
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      accessToken,
      refreshToken,
    });
  } catch (err) { next(err); }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new AppError('Account not exist', 404);

    const valid = await comparePassword(password, user.password);
    if (!valid) throw new AppError('Invalid password', 401);

    const accessToken = generateAccessToken({ id: user.id, role: user.role });
    const refreshToken = generateRefreshToken({ id: user.id, role: user.role });

    res.json({
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      accessToken,
      refreshToken,
    });
  } catch (err) { next(err); }
}

export async function refreshToken(req: Request, res: Response, next: NextFunction) {
  try {
    const { refreshToken: token } = req.body;
    if (!token) throw new AppError('Refresh token required', 400);

    const payload = verifyRefreshToken(token);
    const accessToken = generateAccessToken({ id: payload.id, role: payload.role });
    res.json({ accessToken });
  } catch (err) { next(err); }
}

export async function requestPasswordReset(req: Request, res: Response, next: NextFunction) {
  try {
    const { email } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    // Always return success to prevent email enumeration
    if (user) {
      const resetToken = jwt.sign({ id: user.id }, env.jwtSecret, { expiresIn: '15m' });
      const resetLink = `${env.clientUrl}/reset-password?token=${resetToken}`;
      await sendResetPasswordEmail(email, resetLink).catch(() => {});
    }
    res.json({ message: 'The password reset link has been sent to your email.' });
  } catch (err) { next(err); }
}

export async function resetPassword(req: Request, res: Response, next: NextFunction) {
  try {
    const { token, password } = req.body;
    const payload = jwt.verify(token, env.jwtSecret) as { id: string };
    const hashed = await hashPassword(password);
    await prisma.user.update({ where: { id: payload.id }, data: { password: hashed } });
    res.json({ message: 'Password reset successfully' });
  } catch {
    throw new AppError('Invalid or expired reset token', 400);
  }
}

export async function getMe(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { id: true, name: true, email: true, role: true, phone: true, address: true },
    });
    if (!user) throw new AppError('User not found', 404);
    res.json(user);
  } catch (err) { next(err); }
}
```

- [ ] **Step 7: Create auth routes**

```typescript
// server/src/routes/auth.routes.ts
import { Router } from 'express';
import { signup, login, refreshToken, requestPasswordReset, resetPassword, getMe } from '../controllers/auth.controller';
import { validate } from '../middleware/validate';
import { signupSchema, loginSchema, resetRequestSchema, resetPasswordSchema } from '../validators/auth.validator';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/signup', validate(signupSchema), signup);
router.post('/login', validate(loginSchema), login);
router.post('/refresh', refreshToken);
router.post('/reset-request', validate(resetRequestSchema), requestPasswordReset);
router.post('/reset-password', validate(resetPasswordSchema), resetPassword);
router.get('/me', authenticate, getMe);

export default router;
```

- [ ] **Step 8: Wire auth routes into index.ts**

Add to `server/src/index.ts` before error handler:
```typescript
import authRoutes from './routes/auth.routes';
app.use('/api/auth', authRoutes);
```

- [ ] **Step 9: Test auth endpoints**

Run: `curl -X POST http://localhost:5000/api/auth/login -H "Content-Type: application/json" -d '{"email":"admin@subscription.com","password":"Admin@123"}'`
Expected: JSON with user object + accessToken + refreshToken

- [ ] **Step 10: Commit**

```bash
git add server/src/
git commit -m "feat: add auth module with login, signup, reset password, JWT, and role-based access"
```

---

## Task 5: Products CRUD (Backend)

**Files:**
- Create: `server/src/validators/product.validator.ts`
- Create: `server/src/controllers/product.controller.ts`
- Create: `server/src/routes/product.routes.ts`
- Modify: `server/src/index.ts`

- [ ] **Step 1: Create product validator**

```typescript
// server/src/validators/product.validator.ts
import { z } from 'zod';

export const productSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  productType: z.enum(['SERVICE', 'GOODS']),
  salesPrice: z.number().min(0),
  costPrice: z.number().min(0),
  description: z.string().optional(),
  image: z.string().optional(),
});

export const variantSchema = z.object({
  attribute: z.string().min(1),
  value: z.string().min(1),
  extraPrice: z.number().min(0).default(0),
});
```

- [ ] **Step 2: Create product controller**

```typescript
// server/src/controllers/product.controller.ts
import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { AppError } from '../middleware/errorHandler';

const prisma = new PrismaClient();

export async function listProducts(req: Request, res: Response, next: NextFunction) {
  try {
    const { search, type } = req.query;
    const where: any = { isActive: true };
    if (search) where.name = { contains: search as string, mode: 'insensitive' };
    if (type) where.productType = type;

    const products = await prisma.product.findMany({
      where,
      include: { variants: true, recurringPrices: { include: { plan: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json(products);
  } catch (err) { next(err); }
}

export async function getProduct(req: Request, res: Response, next: NextFunction) {
  try {
    const product = await prisma.product.findUnique({
      where: { id: req.params.id },
      include: { variants: true, recurringPrices: { include: { plan: true } } },
    });
    if (!product) throw new AppError('Product not found', 404);
    res.json(product);
  } catch (err) { next(err); }
}

export async function createProduct(req: Request, res: Response, next: NextFunction) {
  try {
    const product = await prisma.product.create({ data: req.body });
    res.status(201).json(product);
  } catch (err) { next(err); }
}

export async function updateProduct(req: Request, res: Response, next: NextFunction) {
  try {
    const product = await prisma.product.update({ where: { id: req.params.id }, data: req.body });
    res.json(product);
  } catch (err) { next(err); }
}

export async function deleteProduct(req: Request, res: Response, next: NextFunction) {
  try {
    await prisma.product.update({ where: { id: req.params.id }, data: { isActive: false } });
    res.json({ message: 'Product archived' });
  } catch (err) { next(err); }
}

export async function addVariant(req: Request, res: Response, next: NextFunction) {
  try {
    const variant = await prisma.productVariant.create({
      data: { ...req.body, productId: req.params.id },
    });
    res.status(201).json(variant);
  } catch (err) { next(err); }
}

export async function deleteVariant(req: Request, res: Response, next: NextFunction) {
  try {
    await prisma.productVariant.delete({ where: { id: req.params.variantId } });
    res.json({ message: 'Variant deleted' });
  } catch (err) { next(err); }
}
```

- [ ] **Step 3: Create product routes**

```typescript
// server/src/routes/product.routes.ts
import { Router } from 'express';
import { listProducts, getProduct, createProduct, updateProduct, deleteProduct, addVariant, deleteVariant } from '../controllers/product.controller';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { productSchema, variantSchema } from '../validators/product.validator';

const router = Router();
router.use(authenticate);

router.get('/', listProducts);
router.get('/:id', getProduct);
router.post('/', authorize('ADMIN', 'INTERNAL'), validate(productSchema), createProduct);
router.put('/:id', authorize('ADMIN', 'INTERNAL'), validate(productSchema), updateProduct);
router.delete('/:id', authorize('ADMIN'), deleteProduct);
router.post('/:id/variants', authorize('ADMIN', 'INTERNAL'), validate(variantSchema), addVariant);
router.delete('/:id/variants/:variantId', authorize('ADMIN', 'INTERNAL'), deleteVariant);

export default router;
```

- [ ] **Step 4: Wire into index.ts and commit**

Add to `server/src/index.ts`:
```typescript
import productRoutes from './routes/product.routes';
app.use('/api/products', productRoutes);
```

```bash
git add server/src/
git commit -m "feat: add products CRUD with variants and role-based access"
```

---

## Task 6: Recurring Plans + Taxes + Discounts + Users (Backend)

**Files:**
- Create: `server/src/controllers/plan.controller.ts`
- Create: `server/src/routes/plan.routes.ts`
- Create: `server/src/controllers/tax.controller.ts`
- Create: `server/src/routes/tax.routes.ts`
- Create: `server/src/controllers/discount.controller.ts`
- Create: `server/src/routes/discount.routes.ts`
- Create: `server/src/controllers/user.controller.ts`
- Create: `server/src/routes/user.routes.ts`
- Create: `server/src/validators/plan.validator.ts`
- Create: `server/src/validators/tax.validator.ts`
- Create: `server/src/validators/discount.validator.ts`
- Modify: `server/src/index.ts`

- [ ] **Step 1: Create plan validator + controller + routes**

```typescript
// server/src/validators/plan.validator.ts
import { z } from 'zod';

export const planSchema = z.object({
  name: z.string().min(1),
  price: z.number().min(0),
  billingPeriod: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY']),
  billingInterval: z.number().int().min(1).default(1),
  minQuantity: z.number().int().min(1).default(1),
  startDate: z.string().datetime().optional().nullable(),
  endDate: z.string().datetime().optional().nullable(),
  autoClose: z.boolean().default(false),
  autoCloseDays: z.number().int().optional().nullable(),
  closable: z.boolean().default(true),
  pausable: z.boolean().default(false),
  renewable: z.boolean().default(true),
});
```

```typescript
// server/src/controllers/plan.controller.ts
import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { AppError } from '../middleware/errorHandler';

const prisma = new PrismaClient();

export async function listPlans(req: Request, res: Response, next: NextFunction) {
  try {
    const plans = await prisma.recurringPlan.findMany({
      where: { isActive: true },
      include: { _count: { select: { subscriptions: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json(plans);
  } catch (err) { next(err); }
}

export async function getPlan(req: Request, res: Response, next: NextFunction) {
  try {
    const plan = await prisma.recurringPlan.findUnique({
      where: { id: req.params.id },
      include: { subscriptions: { select: { id: true, number: true, status: true } } },
    });
    if (!plan) throw new AppError('Plan not found', 404);
    res.json(plan);
  } catch (err) { next(err); }
}

export async function createPlan(req: Request, res: Response, next: NextFunction) {
  try {
    const plan = await prisma.recurringPlan.create({ data: req.body });
    res.status(201).json(plan);
  } catch (err) { next(err); }
}

export async function updatePlan(req: Request, res: Response, next: NextFunction) {
  try {
    const plan = await prisma.recurringPlan.update({ where: { id: req.params.id }, data: req.body });
    res.json(plan);
  } catch (err) { next(err); }
}

export async function deletePlan(req: Request, res: Response, next: NextFunction) {
  try {
    await prisma.recurringPlan.update({ where: { id: req.params.id }, data: { isActive: false } });
    res.json({ message: 'Plan archived' });
  } catch (err) { next(err); }
}
```

```typescript
// server/src/routes/plan.routes.ts
import { Router } from 'express';
import { listPlans, getPlan, createPlan, updatePlan, deletePlan } from '../controllers/plan.controller';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { planSchema } from '../validators/plan.validator';

const router = Router();
router.use(authenticate);

router.get('/', listPlans);
router.get('/:id', getPlan);
router.post('/', authorize('ADMIN', 'INTERNAL'), validate(planSchema), createPlan);
router.put('/:id', authorize('ADMIN', 'INTERNAL'), validate(planSchema), updatePlan);
router.delete('/:id', authorize('ADMIN'), deletePlan);

export default router;
```

- [ ] **Step 2: Create tax validator + controller + routes**

```typescript
// server/src/validators/tax.validator.ts
import { z } from 'zod';

export const taxSchema = z.object({
  name: z.string().min(1),
  computation: z.enum(['PERCENTAGE', 'FIXED']),
  amount: z.number().min(0),
});
```

```typescript
// server/src/controllers/tax.controller.ts
import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function listTaxes(req: Request, res: Response, next: NextFunction) {
  try {
    const taxes = await prisma.tax.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } });
    res.json(taxes);
  } catch (err) { next(err); }
}

export async function createTax(req: Request, res: Response, next: NextFunction) {
  try {
    const tax = await prisma.tax.create({ data: req.body });
    res.status(201).json(tax);
  } catch (err) { next(err); }
}

export async function updateTax(req: Request, res: Response, next: NextFunction) {
  try {
    const tax = await prisma.tax.update({ where: { id: req.params.id }, data: req.body });
    res.json(tax);
  } catch (err) { next(err); }
}

export async function deleteTax(req: Request, res: Response, next: NextFunction) {
  try {
    await prisma.tax.update({ where: { id: req.params.id }, data: { isActive: false } });
    res.json({ message: 'Tax archived' });
  } catch (err) { next(err); }
}
```

```typescript
// server/src/routes/tax.routes.ts
import { Router } from 'express';
import { listTaxes, createTax, updateTax, deleteTax } from '../controllers/tax.controller';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { taxSchema } from '../validators/tax.validator';

const router = Router();
router.use(authenticate);

router.get('/', listTaxes);
router.post('/', authorize('ADMIN'), validate(taxSchema), createTax);
router.put('/:id', authorize('ADMIN'), validate(taxSchema), updateTax);
router.delete('/:id', authorize('ADMIN'), deleteTax);

export default router;
```

- [ ] **Step 3: Create discount validator + controller + routes**

```typescript
// server/src/validators/discount.validator.ts
import { z } from 'zod';

export const discountSchema = z.object({
  name: z.string().min(1),
  type: z.enum(['FIXED', 'PERCENTAGE']),
  value: z.number().min(0),
  code: z.string().optional().nullable(),
  minPurchase: z.number().min(0).optional().nullable(),
  minQuantity: z.number().int().min(0).optional().nullable(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  limitUsage: z.boolean().default(false),
  maxUsage: z.number().int().optional().nullable(),
  productIds: z.array(z.string()).optional(),
});
```

```typescript
// server/src/controllers/discount.controller.ts
import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { AppError } from '../middleware/errorHandler';

const prisma = new PrismaClient();

export async function listDiscounts(req: Request, res: Response, next: NextFunction) {
  try {
    const discounts = await prisma.discount.findMany({
      where: { isActive: true },
      include: { products: { include: { product: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json(discounts);
  } catch (err) { next(err); }
}

export async function createDiscount(req: Request, res: Response, next: NextFunction) {
  try {
    const { productIds, ...data } = req.body;
    const discount = await prisma.discount.create({
      data: {
        ...data,
        products: productIds?.length ? {
          create: productIds.map((pid: string) => ({ productId: pid })),
        } : undefined,
      },
      include: { products: { include: { product: true } } },
    });
    res.status(201).json(discount);
  } catch (err) { next(err); }
}

export async function updateDiscount(req: Request, res: Response, next: NextFunction) {
  try {
    const { productIds, ...data } = req.body;
    // Delete existing product links and recreate
    await prisma.discountProduct.deleteMany({ where: { discountId: req.params.id } });
    const discount = await prisma.discount.update({
      where: { id: req.params.id },
      data: {
        ...data,
        products: productIds?.length ? {
          create: productIds.map((pid: string) => ({ productId: pid })),
        } : undefined,
      },
      include: { products: { include: { product: true } } },
    });
    res.json(discount);
  } catch (err) { next(err); }
}

export async function deleteDiscount(req: Request, res: Response, next: NextFunction) {
  try {
    await prisma.discount.update({ where: { id: req.params.id }, data: { isActive: false } });
    res.json({ message: 'Discount archived' });
  } catch (err) { next(err); }
}

export async function validateDiscountCode(req: Request, res: Response, next: NextFunction) {
  try {
    const { code, totalAmount, productId } = req.body;
    const now = new Date();
    const discount = await prisma.discount.findFirst({
      where: {
        code,
        isActive: true,
        startDate: { lte: now },
        endDate: { gte: now },
      },
      include: { products: true },
    });
    if (!discount) throw new AppError('Invalid or expired discount code', 400);
    if (discount.limitUsage && discount.maxUsage && discount.currentUsage >= discount.maxUsage) {
      throw new AppError('Discount usage limit reached', 400);
    }
    if (discount.minPurchase && totalAmount < discount.minPurchase) {
      throw new AppError(`Minimum purchase of ${discount.minPurchase} required`, 400);
    }
    if (discount.products.length > 0 && productId) {
      const applicable = discount.products.some((p) => p.productId === productId);
      if (!applicable) throw new AppError('Discount not applicable for this product', 400);
    }

    let discountAmount = 0;
    if (discount.type === 'PERCENTAGE') {
      discountAmount = (totalAmount * discount.value) / 100;
    } else {
      discountAmount = discount.value;
    }

    res.json({ valid: true, discount, discountAmount });
  } catch (err) { next(err); }
}
```

```typescript
// server/src/routes/discount.routes.ts
import { Router } from 'express';
import { listDiscounts, createDiscount, updateDiscount, deleteDiscount, validateDiscountCode } from '../controllers/discount.controller';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { discountSchema } from '../validators/discount.validator';

const router = Router();
router.use(authenticate);

router.get('/', listDiscounts);
router.post('/', authorize('ADMIN'), validate(discountSchema), createDiscount);
router.put('/:id', authorize('ADMIN'), validate(discountSchema), updateDiscount);
router.delete('/:id', authorize('ADMIN'), deleteDiscount);
router.post('/validate', validateDiscountCode);

export default router;
```

- [ ] **Step 4: Create user controller + routes**

```typescript
// server/src/controllers/user.controller.ts
import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../services/auth.service';
import { AppError } from '../middleware/errorHandler';

const prisma = new PrismaClient();

export async function listUsers(req: Request, res: Response, next: NextFunction) {
  try {
    const { role, search } = req.query;
    const where: any = {};
    if (role) where.role = role;
    if (search) where.OR = [
      { name: { contains: search as string, mode: 'insensitive' } },
      { email: { contains: search as string, mode: 'insensitive' } },
    ];
    const users = await prisma.user.findMany({
      where,
      select: { id: true, name: true, email: true, role: true, phone: true, address: true, isActive: true, createdAt: true,
        _count: { select: { subscriptions: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(users);
  } catch (err) { next(err); }
}

export async function getUser(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: {
        id: true, name: true, email: true, role: true, phone: true, address: true, isActive: true, createdAt: true,
        contacts: true,
        subscriptions: { select: { id: true, number: true, status: true, totalAmount: true }, take: 10 },
        _count: { select: { subscriptions: true, invoices: true } },
      },
    });
    if (!user) throw new AppError('User not found', 404);
    res.json(user);
  } catch (err) { next(err); }
}

export async function createInternalUser(req: Request, res: Response, next: NextFunction) {
  try {
    const { name, email, password, phone, address } = req.body;
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) throw new AppError('Email already exists', 409);

    const hashed = await hashPassword(password);
    const user = await prisma.user.create({
      data: { name, email, password: hashed, role: 'INTERNAL', phone, address },
      select: { id: true, name: true, email: true, role: true },
    });
    res.status(201).json(user);
  } catch (err) { next(err); }
}

export async function updateUser(req: Request, res: Response, next: NextFunction) {
  try {
    const { name, phone, address, isActive } = req.body;
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { name, phone, address, isActive },
      select: { id: true, name: true, email: true, role: true, phone: true, address: true, isActive: true },
    });
    res.json(user);
  } catch (err) { next(err); }
}

export async function updateProfile(req: Request, res: Response, next: NextFunction) {
  try {
    const { name, phone, address } = req.body;
    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data: { name, phone, address },
      select: { id: true, name: true, email: true, role: true, phone: true, address: true },
    });
    res.json(user);
  } catch (err) { next(err); }
}

export async function changePassword(req: Request, res: Response, next: NextFunction) {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (!user) throw new AppError('User not found', 404);

    const { comparePassword: compare } = await import('../services/auth.service');
    const valid = await compare(currentPassword, user.password);
    if (!valid) throw new AppError('Current password is incorrect', 400);

    const hashed = await hashPassword(newPassword);
    await prisma.user.update({ where: { id: req.user!.id }, data: { password: hashed } });
    res.json({ message: 'Password changed successfully' });
  } catch (err) { next(err); }
}
```

```typescript
// server/src/routes/user.routes.ts
import { Router } from 'express';
import { listUsers, getUser, createInternalUser, updateUser, updateProfile, changePassword } from '../controllers/user.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();
router.use(authenticate);

router.get('/', authorize('ADMIN', 'INTERNAL'), listUsers);
router.get('/:id', authorize('ADMIN', 'INTERNAL'), getUser);
router.post('/internal', authorize('ADMIN'), createInternalUser);
router.put('/:id', authorize('ADMIN'), updateUser);
router.put('/me/profile', updateProfile);
router.put('/me/password', changePassword);

export default router;
```

- [ ] **Step 5: Wire all routes into index.ts**

```typescript
// Add to server/src/index.ts
import planRoutes from './routes/plan.routes';
import taxRoutes from './routes/tax.routes';
import discountRoutes from './routes/discount.routes';
import userRoutes from './routes/user.routes';

app.use('/api/plans', planRoutes);
app.use('/api/taxes', taxRoutes);
app.use('/api/discounts', discountRoutes);
app.use('/api/users', userRoutes);
```

- [ ] **Step 6: Commit**

```bash
git add server/src/
git commit -m "feat: add recurring plans, taxes, discounts, and users CRUD endpoints"
```

---

## Task 7: Subscriptions Lifecycle (Backend)

**Files:**
- Create: `server/src/utils/generateNumber.ts`
- Create: `server/src/utils/calculations.ts`
- Create: `server/src/services/subscription.service.ts`
- Create: `server/src/validators/subscription.validator.ts`
- Create: `server/src/controllers/subscription.controller.ts`
- Create: `server/src/routes/subscription.routes.ts`
- Modify: `server/src/index.ts`

- [ ] **Step 1: Create utility helpers**

```typescript
// server/src/utils/generateNumber.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function generateSubscriptionNumber(): Promise<string> {
  const count = await prisma.subscription.count();
  return `SO${String(count + 1).padStart(3, '0')}`;
}

export async function generateInvoiceNumber(): Promise<string> {
  const count = await prisma.invoice.count();
  return `INV/${String(count + 1).padStart(3, '0')}`;
}
```

```typescript
// server/src/utils/calculations.ts
import { TaxComputation } from '@prisma/client';

export function calculateLineTax(subtotal: number, taxComputation: TaxComputation, taxAmount: number): number {
  if (taxComputation === 'PERCENTAGE') {
    return (subtotal * taxAmount) / 100;
  }
  return taxAmount;
}

export function calculateLineTotal(
  quantity: number,
  unitPrice: number,
  discountPercent: number,
  taxComputation?: TaxComputation | null,
  taxRate?: number | null,
) {
  const subtotal = quantity * unitPrice;
  const discountAmount = (subtotal * discountPercent) / 100;
  const afterDiscount = subtotal - discountAmount;
  const taxAmount = taxComputation && taxRate ? calculateLineTax(afterDiscount, taxComputation, taxRate) : 0;
  const total = afterDiscount + taxAmount;
  return { subtotal: afterDiscount, taxAmount, total };
}
```

- [ ] **Step 2: Create subscription service**

```typescript
// server/src/services/subscription.service.ts
import { PrismaClient, SubscriptionStatus } from '@prisma/client';
import { generateSubscriptionNumber } from '../utils/generateNumber';
import { calculateLineTotal } from '../utils/calculations';
import { AppError } from '../middleware/errorHandler';

const prisma = new PrismaClient();

export async function recalculateSubscription(subscriptionId: string) {
  const lines = await prisma.orderLine.findMany({
    where: { subscriptionId },
    include: { tax: true },
  });

  let untaxedAmount = 0;
  let taxAmount = 0;

  for (const line of lines) {
    const calc = calculateLineTotal(
      line.quantity, line.unitPrice, line.discountPercent,
      line.tax?.computation, line.tax?.amount,
    );
    await prisma.orderLine.update({
      where: { id: line.id },
      data: { subtotal: calc.subtotal, taxAmount: calc.taxAmount, total: calc.total },
    });
    untaxedAmount += calc.subtotal;
    taxAmount += calc.taxAmount;
  }

  await prisma.subscription.update({
    where: { id: subscriptionId },
    data: { untaxedAmount, taxAmount, totalAmount: untaxedAmount + taxAmount },
  });
}

export async function createSubscriptionFromTemplate(
  templateId: string,
  customerId: string,
  salespersonId: string,
) {
  const template = await prisma.quotationTemplate.findUnique({
    where: { id: templateId },
    include: { lines: { include: { product: true } }, recurringPlan: true },
  });
  if (!template) throw new AppError('Template not found', 404);

  const number = await generateSubscriptionNumber();
  const now = new Date();
  const expiration = new Date(now);
  expiration.setDate(expiration.getDate() + template.validityDays);

  const subscription = await prisma.subscription.create({
    data: {
      number,
      customerId,
      planId: template.recurringPlanId!,
      templateId,
      salespersonId,
      status: 'DRAFT',
      quotationDate: now,
      expirationDate: expiration,
      orderLines: {
        create: template.lines.map((line) => ({
          productId: line.productId,
          description: line.description || line.product.name,
          quantity: line.quantity,
          unitPrice: line.product.salesPrice,
        })),
      },
    },
  });

  await recalculateSubscription(subscription.id);
  return subscription;
}

export async function transitionStatus(
  subscriptionId: string,
  newStatus: SubscriptionStatus,
) {
  const sub = await prisma.subscription.findUnique({ where: { id: subscriptionId } });
  if (!sub) throw new AppError('Subscription not found', 404);

  // Validate transitions
  const validTransitions: Record<string, string[]> = {
    DRAFT: ['QUOTATION_SENT', 'CONFIRMED'],
    QUOTATION_SENT: ['CONFIRMED', 'CLOSED'],
    CONFIRMED: ['ACTIVE', 'CLOSED'],
    ACTIVE: ['PAUSED', 'CLOSED'],
    PAUSED: ['ACTIVE', 'CLOSED'],
  };

  if (!validTransitions[sub.status]?.includes(newStatus)) {
    throw new AppError(`Cannot transition from ${sub.status} to ${newStatus}`, 400);
  }

  const updateData: any = { status: newStatus };
  if (newStatus === 'CONFIRMED') {
    updateData.startDate = updateData.startDate || new Date();
  }
  if (newStatus === 'ACTIVE') {
    updateData.startDate = updateData.startDate || new Date();
  }

  return prisma.subscription.update({ where: { id: subscriptionId }, data: updateData });
}

export async function renewSubscription(subscriptionId: string) {
  const sub = await prisma.subscription.findUnique({
    where: { id: subscriptionId },
    include: { orderLines: true, plan: true },
  });
  if (!sub) throw new AppError('Subscription not found', 404);

  const number = await generateSubscriptionNumber();
  const newSub = await prisma.subscription.create({
    data: {
      number,
      customerId: sub.customerId,
      contactId: sub.contactId,
      planId: sub.planId,
      salespersonId: sub.salespersonId,
      status: 'DRAFT',
      parentId: sub.id,
      quotationDate: new Date(),
      orderLines: {
        create: sub.orderLines.map((line) => ({
          productId: line.productId,
          description: line.description,
          quantity: line.quantity,
          unitPrice: line.unitPrice,
          discountPercent: line.discountPercent,
          taxId: line.taxId,
        })),
      },
    },
  });

  await recalculateSubscription(newSub.id);
  return newSub;
}

export async function upsellSubscription(subscriptionId: string) {
  // Same as renew but status indicates upsell opportunity
  return renewSubscription(subscriptionId);
}
```

- [ ] **Step 3: Create subscription validator**

```typescript
// server/src/validators/subscription.validator.ts
import { z } from 'zod';

export const subscriptionCreateSchema = z.object({
  customerId: z.string().uuid(),
  planId: z.string().uuid(),
  templateId: z.string().uuid().optional(),
  contactId: z.string().uuid().optional(),
  paymentTermDays: z.number().int().default(30),
  earlyDiscountPercent: z.number().optional().nullable(),
  earlyDiscountDays: z.number().int().optional().nullable(),
  expirationDate: z.string().datetime().optional(),
  notes: z.string().optional(),
});

export const orderLineSchema = z.object({
  productId: z.string().uuid(),
  description: z.string().optional(),
  quantity: z.number().min(0.01),
  unitPrice: z.number().min(0),
  discountPercent: z.number().min(0).max(100).default(0),
  taxId: z.string().uuid().optional().nullable(),
});

export const statusTransitionSchema = z.object({
  status: z.enum(['DRAFT', 'QUOTATION_SENT', 'CONFIRMED', 'ACTIVE', 'PAUSED', 'CLOSED']),
});
```

- [ ] **Step 4: Create subscription controller**

```typescript
// server/src/controllers/subscription.controller.ts
import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { AppError } from '../middleware/errorHandler';
import { generateSubscriptionNumber } from '../utils/generateNumber';
import { recalculateSubscription, transitionStatus, renewSubscription, upsellSubscription, createSubscriptionFromTemplate } from '../services/subscription.service';

const prisma = new PrismaClient();

export async function listSubscriptions(req: Request, res: Response, next: NextFunction) {
  try {
    const { status, customerId } = req.query;
    const where: any = {};
    if (status) where.status = status;
    if (customerId) where.customerId = customerId;

    const subs = await prisma.subscription.findMany({
      where,
      include: {
        customer: { select: { id: true, name: true, email: true } },
        plan: { select: { id: true, name: true, billingPeriod: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(subs);
  } catch (err) { next(err); }
}

export async function getSubscription(req: Request, res: Response, next: NextFunction) {
  try {
    const sub = await prisma.subscription.findUnique({
      where: { id: req.params.id },
      include: {
        customer: { select: { id: true, name: true, email: true, phone: true, address: true } },
        contact: true,
        plan: true,
        template: true,
        orderLines: { include: { product: true, tax: true } },
        invoices: { include: { payments: true } },
        children: { select: { id: true, number: true, status: true, createdAt: true } },
        parent: { select: { id: true, number: true } },
      },
    });
    if (!sub) throw new AppError('Subscription not found', 404);
    res.json(sub);
  } catch (err) { next(err); }
}

export async function createSubscription(req: Request, res: Response, next: NextFunction) {
  try {
    const { templateId, customerId, planId, ...rest } = req.body;

    if (templateId) {
      const sub = await createSubscriptionFromTemplate(templateId, customerId, req.user!.id);
      return res.status(201).json(sub);
    }

    const number = await generateSubscriptionNumber();
    const sub = await prisma.subscription.create({
      data: {
        number,
        customerId,
        planId,
        salespersonId: req.user!.id,
        status: 'DRAFT',
        quotationDate: new Date(),
        ...rest,
      },
    });
    res.status(201).json(sub);
  } catch (err) { next(err); }
}

export async function updateSubscription(req: Request, res: Response, next: NextFunction) {
  try {
    const sub = await prisma.subscription.findUnique({ where: { id: req.params.id } });
    if (!sub) throw new AppError('Subscription not found', 404);
    if (!['DRAFT', 'QUOTATION_SENT'].includes(sub.status)) {
      throw new AppError('Can only edit subscriptions in Draft or Quotation Sent status', 400);
    }

    const updated = await prisma.subscription.update({
      where: { id: req.params.id },
      data: req.body,
    });
    res.json(updated);
  } catch (err) { next(err); }
}

export async function addOrderLine(req: Request, res: Response, next: NextFunction) {
  try {
    const sub = await prisma.subscription.findUnique({ where: { id: req.params.id } });
    if (!sub) throw new AppError('Subscription not found', 404);
    if (!['DRAFT', 'QUOTATION_SENT'].includes(sub.status)) {
      throw new AppError('Cannot modify order lines after confirmation', 400);
    }

    await prisma.orderLine.create({
      data: { ...req.body, subscriptionId: req.params.id },
    });
    await recalculateSubscription(req.params.id);

    const updated = await prisma.subscription.findUnique({
      where: { id: req.params.id },
      include: { orderLines: { include: { product: true, tax: true } } },
    });
    res.status(201).json(updated);
  } catch (err) { next(err); }
}

export async function removeOrderLine(req: Request, res: Response, next: NextFunction) {
  try {
    await prisma.orderLine.delete({ where: { id: req.params.lineId } });
    await recalculateSubscription(req.params.id);
    res.json({ message: 'Order line removed' });
  } catch (err) { next(err); }
}

export async function changeStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const updated = await transitionStatus(req.params.id, req.body.status);
    res.json(updated);
  } catch (err) { next(err); }
}

export async function renew(req: Request, res: Response, next: NextFunction) {
  try {
    const newSub = await renewSubscription(req.params.id);
    res.status(201).json(newSub);
  } catch (err) { next(err); }
}

export async function upsell(req: Request, res: Response, next: NextFunction) {
  try {
    const newSub = await upsellSubscription(req.params.id);
    res.status(201).json(newSub);
  } catch (err) { next(err); }
}
```

- [ ] **Step 5: Create subscription routes**

```typescript
// server/src/routes/subscription.routes.ts
import { Router } from 'express';
import { listSubscriptions, getSubscription, createSubscription, updateSubscription, addOrderLine, removeOrderLine, changeStatus, renew, upsell } from '../controllers/subscription.controller';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { subscriptionCreateSchema, orderLineSchema, statusTransitionSchema } from '../validators/subscription.validator';

const router = Router();
router.use(authenticate);

router.get('/', listSubscriptions);
router.get('/:id', getSubscription);
router.post('/', authorize('ADMIN', 'INTERNAL'), validate(subscriptionCreateSchema), createSubscription);
router.put('/:id', authorize('ADMIN', 'INTERNAL'), updateSubscription);
router.post('/:id/lines', authorize('ADMIN', 'INTERNAL'), validate(orderLineSchema), addOrderLine);
router.delete('/:id/lines/:lineId', authorize('ADMIN', 'INTERNAL'), removeOrderLine);
router.patch('/:id/status', authorize('ADMIN', 'INTERNAL'), validate(statusTransitionSchema), changeStatus);
router.post('/:id/renew', authorize('ADMIN', 'INTERNAL'), renew);
router.post('/:id/upsell', authorize('ADMIN', 'INTERNAL'), upsell);

export default router;
```

- [ ] **Step 6: Wire and commit**

Add to `server/src/index.ts`:
```typescript
import subscriptionRoutes from './routes/subscription.routes';
app.use('/api/subscriptions', subscriptionRoutes);
```

```bash
git add server/src/
git commit -m "feat: add subscription lifecycle with status transitions, renew, upsell, and order lines"
```

---

## Task 8: Invoices + Payments + Portal API (Backend)

**Files:**
- Create: `server/src/services/invoice.service.ts`
- Create: `server/src/controllers/invoice.controller.ts`
- Create: `server/src/routes/invoice.routes.ts`
- Create: `server/src/services/payment.service.ts`
- Create: `server/src/controllers/payment.controller.ts`
- Create: `server/src/routes/payment.routes.ts`
- Create: `server/src/controllers/portal.controller.ts`
- Create: `server/src/routes/portal.routes.ts`
- Create: `server/src/controllers/report.controller.ts`
- Create: `server/src/routes/report.routes.ts`
- Modify: `server/src/index.ts`

- [ ] **Step 1: Create invoice service**

```typescript
// server/src/services/invoice.service.ts
import { PrismaClient } from '@prisma/client';
import { generateInvoiceNumber } from '../utils/generateNumber';
import { AppError } from '../middleware/errorHandler';

const prisma = new PrismaClient();

export async function createInvoiceFromSubscription(subscriptionId: string) {
  const sub = await prisma.subscription.findUnique({
    where: { id: subscriptionId },
    include: { orderLines: { include: { tax: true } } },
  });
  if (!sub) throw new AppError('Subscription not found', 404);
  if (!['CONFIRMED', 'ACTIVE'].includes(sub.status)) {
    throw new AppError('Subscription must be confirmed or active to create invoice', 400);
  }

  const number = await generateInvoiceNumber();
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + sub.paymentTermDays);

  const invoice = await prisma.invoice.create({
    data: {
      number,
      subscriptionId,
      customerId: sub.customerId,
      status: 'DRAFT',
      dueDate,
      untaxedAmount: sub.untaxedAmount,
      taxAmount: sub.taxAmount,
      totalAmount: sub.totalAmount,
      amountDue: sub.totalAmount,
      invoiceLines: {
        create: sub.orderLines.map((line) => ({
          description: line.description || 'Product',
          quantity: line.quantity,
          unitPrice: line.unitPrice,
          discountPercent: line.discountPercent,
          taxId: line.taxId,
          subtotal: line.subtotal,
          taxAmount: line.taxAmount,
          total: line.total,
        })),
      },
    },
    include: { invoiceLines: true },
  });

  // Transition subscription to active if confirmed
  if (sub.status === 'CONFIRMED') {
    await prisma.subscription.update({
      where: { id: subscriptionId },
      data: { status: 'ACTIVE' },
    });
  }

  return invoice;
}
```

- [ ] **Step 2: Create invoice controller**

```typescript
// server/src/controllers/invoice.controller.ts
import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { AppError } from '../middleware/errorHandler';
import { createInvoiceFromSubscription } from '../services/invoice.service';

const prisma = new PrismaClient();

export async function listInvoices(req: Request, res: Response, next: NextFunction) {
  try {
    const { status, customerId } = req.query;
    const where: any = {};
    if (status) where.status = status;
    if (customerId) where.customerId = customerId;

    const invoices = await prisma.invoice.findMany({
      where,
      include: {
        customer: { select: { id: true, name: true, email: true } },
        subscription: { select: { id: true, number: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(invoices);
  } catch (err) { next(err); }
}

export async function getInvoice(req: Request, res: Response, next: NextFunction) {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: req.params.id },
      include: {
        customer: { select: { id: true, name: true, email: true, phone: true, address: true } },
        subscription: { select: { id: true, number: true } },
        invoiceLines: { include: { tax: true } },
        payments: true,
      },
    });
    if (!invoice) throw new AppError('Invoice not found', 404);
    res.json(invoice);
  } catch (err) { next(err); }
}

export async function createInvoice(req: Request, res: Response, next: NextFunction) {
  try {
    const { subscriptionId } = req.body;
    const invoice = await createInvoiceFromSubscription(subscriptionId);
    res.status(201).json(invoice);
  } catch (err) { next(err); }
}

export async function confirmInvoice(req: Request, res: Response, next: NextFunction) {
  try {
    const invoice = await prisma.invoice.findUnique({ where: { id: req.params.id } });
    if (!invoice) throw new AppError('Invoice not found', 404);
    if (invoice.status !== 'DRAFT') throw new AppError('Only draft invoices can be confirmed', 400);

    const updated = await prisma.invoice.update({
      where: { id: req.params.id },
      data: { status: 'CONFIRMED' },
    });
    res.json(updated);
  } catch (err) { next(err); }
}

export async function cancelInvoice(req: Request, res: Response, next: NextFunction) {
  try {
    const invoice = await prisma.invoice.findUnique({ where: { id: req.params.id } });
    if (!invoice) throw new AppError('Invoice not found', 404);

    const updated = await prisma.invoice.update({
      where: { id: req.params.id },
      data: { status: 'CANCELLED' },
    });
    res.json(updated);
  } catch (err) { next(err); }
}

export async function resetToDraft(req: Request, res: Response, next: NextFunction) {
  try {
    const invoice = await prisma.invoice.findUnique({ where: { id: req.params.id } });
    if (!invoice) throw new AppError('Invoice not found', 404);
    if (invoice.status !== 'CANCELLED') throw new AppError('Only cancelled invoices can be reset to draft', 400);

    const updated = await prisma.invoice.update({
      where: { id: req.params.id },
      data: { status: 'DRAFT' },
    });
    res.json(updated);
  } catch (err) { next(err); }
}
```

```typescript
// server/src/routes/invoice.routes.ts
import { Router } from 'express';
import { listInvoices, getInvoice, createInvoice, confirmInvoice, cancelInvoice, resetToDraft } from '../controllers/invoice.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();
router.use(authenticate);

router.get('/', listInvoices);
router.get('/:id', getInvoice);
router.post('/', authorize('ADMIN', 'INTERNAL'), createInvoice);
router.patch('/:id/confirm', authorize('ADMIN', 'INTERNAL'), confirmInvoice);
router.patch('/:id/cancel', authorize('ADMIN', 'INTERNAL'), cancelInvoice);
router.patch('/:id/reset-draft', authorize('ADMIN', 'INTERNAL'), resetToDraft);

export default router;
```

- [ ] **Step 3: Create payment service + controller + routes**

```typescript
// server/src/services/payment.service.ts
import Stripe from 'stripe';
import { PrismaClient } from '@prisma/client';
import { env } from '../config/env';
import { AppError } from '../middleware/errorHandler';

const stripe = env.stripeSecretKey ? new Stripe(env.stripeSecretKey) : null;
const prisma = new PrismaClient();

export async function createStripeCheckoutSession(invoiceId: string) {
  if (!stripe) throw new AppError('Stripe not configured', 500);

  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: { customer: true, invoiceLines: true },
  });
  if (!invoice) throw new AppError('Invoice not found', 404);
  if (invoice.status !== 'CONFIRMED') throw new AppError('Invoice must be confirmed before payment', 400);

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    customer_email: invoice.customer.email,
    line_items: invoice.invoiceLines.map((line) => ({
      price_data: {
        currency: 'inr',
        product_data: { name: line.description },
        unit_amount: Math.round(line.total * 100 / line.quantity),
      },
      quantity: Math.round(line.quantity),
    })),
    mode: 'payment',
    success_url: `${env.stripeSuccessUrl}?invoice=${invoiceId}`,
    cancel_url: `${env.stripeCancelUrl}?invoice=${invoiceId}`,
    metadata: { invoiceId },
  });

  return session;
}

export async function recordPayment(invoiceId: string, method: 'ONLINE' | 'CASH', stripeSessionId?: string, stripePaymentId?: string) {
  const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } });
  if (!invoice) throw new AppError('Invoice not found', 404);

  const payment = await prisma.payment.create({
    data: {
      invoiceId,
      customerId: invoice.customerId,
      method,
      amount: invoice.amountDue,
      stripeSessionId,
      stripePaymentId,
    },
  });

  await prisma.invoice.update({
    where: { id: invoiceId },
    data: {
      amountPaid: invoice.amountPaid + invoice.amountDue,
      amountDue: 0,
      status: 'PAID',
    },
  });

  return payment;
}
```

```typescript
// server/src/controllers/payment.controller.ts
import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { createStripeCheckoutSession, recordPayment } from '../services/payment.service';

const prisma = new PrismaClient();

export async function listPayments(req: Request, res: Response, next: NextFunction) {
  try {
    const { customerId } = req.query;
    const where: any = {};
    if (customerId) where.customerId = customerId;

    const payments = await prisma.payment.findMany({
      where,
      include: {
        invoice: { select: { id: true, number: true } },
        customer: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(payments);
  } catch (err) { next(err); }
}

export async function createCheckoutSession(req: Request, res: Response, next: NextFunction) {
  try {
    const session = await createStripeCheckoutSession(req.body.invoiceId);
    res.json({ url: session.url });
  } catch (err) { next(err); }
}

export async function recordCashPayment(req: Request, res: Response, next: NextFunction) {
  try {
    const payment = await recordPayment(req.body.invoiceId, 'CASH');
    res.status(201).json(payment);
  } catch (err) { next(err); }
}

export async function handleStripeSuccess(req: Request, res: Response, next: NextFunction) {
  try {
    const { invoiceId, sessionId } = req.body;
    const payment = await recordPayment(invoiceId, 'ONLINE', sessionId);
    res.json(payment);
  } catch (err) { next(err); }
}
```

```typescript
// server/src/routes/payment.routes.ts
import { Router } from 'express';
import { listPayments, createCheckoutSession, recordCashPayment, handleStripeSuccess } from '../controllers/payment.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();
router.use(authenticate);

router.get('/', listPayments);
router.post('/checkout', createCheckoutSession);
router.post('/cash', authorize('ADMIN', 'INTERNAL'), recordCashPayment);
router.post('/stripe-success', handleStripeSuccess);

export default router;
```

- [ ] **Step 4: Create portal controller + routes (customer-facing API)**

```typescript
// server/src/controllers/portal.controller.ts
import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function getShopProducts(req: Request, res: Response, next: NextFunction) {
  try {
    const { search, type, category, minPrice, maxPrice, sortBy } = req.query;
    const where: any = { isActive: true };
    if (search) where.name = { contains: search as string, mode: 'insensitive' };
    if (type) where.productType = type;

    let orderBy: any = { createdAt: 'desc' };
    if (sortBy === 'price_asc') orderBy = { salesPrice: 'asc' };
    if (sortBy === 'price_desc') orderBy = { salesPrice: 'desc' };
    if (sortBy === 'name') orderBy = { name: 'asc' };

    const products = await prisma.product.findMany({
      where,
      include: { variants: true, recurringPrices: { include: { plan: true } } },
      orderBy,
    });
    res.json(products);
  } catch (err) { next(err); }
}

export async function getMyOrders(req: Request, res: Response, next: NextFunction) {
  try {
    const orders = await prisma.subscription.findMany({
      where: { customerId: req.user!.id },
      include: {
        plan: { select: { name: true, billingPeriod: true } },
        orderLines: { include: { product: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(orders);
  } catch (err) { next(err); }
}

export async function getMyOrder(req: Request, res: Response, next: NextFunction) {
  try {
    const order = await prisma.subscription.findFirst({
      where: { id: req.params.id, customerId: req.user!.id },
      include: {
        plan: true,
        orderLines: { include: { product: true, tax: true } },
        invoices: { include: { payments: true } },
      },
    });
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json(order);
  } catch (err) { next(err); }
}

export async function getMyInvoice(req: Request, res: Response, next: NextFunction) {
  try {
    const invoice = await prisma.invoice.findFirst({
      where: { id: req.params.id, customerId: req.user!.id },
      include: {
        invoiceLines: { include: { tax: true } },
        subscription: { select: { id: true, number: true } },
        payments: true,
      },
    });
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
    res.json(invoice);
  } catch (err) { next(err); }
}

export async function createPortalSubscription(req: Request, res: Response, next: NextFunction) {
  try {
    const { productId, planId, quantity, variantId } = req.body;
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) return res.status(404).json({ error: 'Product not found' });

    let extraPrice = 0;
    if (variantId) {
      const variant = await prisma.productVariant.findUnique({ where: { id: variantId } });
      if (variant) extraPrice = variant.extraPrice;
    }

    const { generateSubscriptionNumber } = await import('../utils/generateNumber');
    const number = await generateSubscriptionNumber();

    const sub = await prisma.subscription.create({
      data: {
        number,
        customerId: req.user!.id,
        planId,
        status: 'DRAFT',
        quotationDate: new Date(),
        orderLines: {
          create: [{
            productId,
            description: product.name,
            quantity: quantity || 1,
            unitPrice: product.salesPrice + extraPrice,
          }],
        },
      },
    });

    const { recalculateSubscription } = await import('../services/subscription.service');
    await recalculateSubscription(sub.id);

    const full = await prisma.subscription.findUnique({
      where: { id: sub.id },
      include: { orderLines: { include: { product: true } }, plan: true },
    });
    res.status(201).json(full);
  } catch (err) { next(err); }
}
```

```typescript
// server/src/routes/portal.routes.ts
import { Router } from 'express';
import { getShopProducts, getMyOrders, getMyOrder, getMyInvoice, createPortalSubscription } from '../controllers/portal.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// Public
router.get('/shop', getShopProducts);

// Authenticated portal routes
router.use(authenticate);
router.get('/orders', getMyOrders);
router.get('/orders/:id', getMyOrder);
router.get('/invoices/:id', getMyInvoice);
router.post('/subscribe', createPortalSubscription);

export default router;
```

- [ ] **Step 5: Create report controller + routes**

```typescript
// server/src/controllers/report.controller.ts
import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function getDashboardStats(req: Request, res: Response, next: NextFunction) {
  try {
    const [
      totalSubscriptions,
      activeSubscriptions,
      totalRevenue,
      totalInvoices,
      paidInvoices,
      overdueInvoices,
      totalCustomers,
      totalProducts,
    ] = await Promise.all([
      prisma.subscription.count(),
      prisma.subscription.count({ where: { status: 'ACTIVE' } }),
      prisma.payment.aggregate({ _sum: { amount: true } }),
      prisma.invoice.count(),
      prisma.invoice.count({ where: { status: 'PAID' } }),
      prisma.invoice.count({ where: { status: 'CONFIRMED', dueDate: { lt: new Date() } } }),
      prisma.user.count({ where: { role: 'PORTAL' } }),
      prisma.product.count({ where: { isActive: true } }),
    ]);

    // Monthly revenue for last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const monthlyPayments = await prisma.payment.findMany({
      where: { paymentDate: { gte: sixMonthsAgo } },
      select: { amount: true, paymentDate: true },
    });

    const monthlyRevenue: Record<string, number> = {};
    monthlyPayments.forEach((p) => {
      const key = `${p.paymentDate.getFullYear()}-${String(p.paymentDate.getMonth() + 1).padStart(2, '0')}`;
      monthlyRevenue[key] = (monthlyRevenue[key] || 0) + p.amount;
    });

    // Subscription status distribution
    const statusDistribution = await prisma.subscription.groupBy({
      by: ['status'],
      _count: { id: true },
    });

    res.json({
      totalSubscriptions,
      activeSubscriptions,
      totalRevenue: totalRevenue._sum.amount || 0,
      totalInvoices,
      paidInvoices,
      overdueInvoices,
      totalCustomers,
      totalProducts,
      monthlyRevenue: Object.entries(monthlyRevenue).map(([month, amount]) => ({ month, amount })),
      statusDistribution: statusDistribution.map((s) => ({ status: s.status, count: s._count.id })),
    });
  } catch (err) { next(err); }
}
```

```typescript
// server/src/routes/report.routes.ts
import { Router } from 'express';
import { getDashboardStats } from '../controllers/report.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();
router.use(authenticate);

router.get('/dashboard', authorize('ADMIN', 'INTERNAL'), getDashboardStats);

export default router;
```

- [ ] **Step 6: Wire all remaining routes into index.ts**

```typescript
// Add to server/src/index.ts
import invoiceRoutes from './routes/invoice.routes';
import paymentRoutes from './routes/payment.routes';
import portalRoutes from './routes/portal.routes';
import reportRoutes from './routes/report.routes';

app.use('/api/invoices', invoiceRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/portal', portalRoutes);
app.use('/api/reports', reportRoutes);
```

- [ ] **Step 7: Commit**

```bash
git add server/src/
git commit -m "feat: add invoices, payments (Stripe), portal API, and dashboard reports"
```

---

## Task 9: Frontend Setup - Tailwind, shadcn/ui, Design Tokens, Router

**Files:**
- Modify: `client/vite.config.ts`
- Create: `client/src/index.css`
- Create: `client/src/lib/utils.ts`
- Create: `client/src/lib/api.ts`
- Create: `client/src/stores/authStore.ts`
- Create: `client/src/types/index.ts`
- Create: `client/src/App.tsx`
- Create: `client/src/main.tsx`
- Create: `client/components.json`

- [ ] **Step 1: Configure Vite + Tailwind v4**

```typescript
// client/vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  server: {
    port: 5173,
    proxy: { '/api': 'http://localhost:5000' },
  },
});
```

- [ ] **Step 2: Create design tokens in CSS**

```css
/* client/src/index.css */
@import "tailwindcss";

@theme {
  --color-primary: #1E3A5F;
  --color-on-primary: #FFFFFF;
  --color-secondary: #2563EB;
  --color-accent: #059669;
  --color-background: #F8FAFC;
  --color-foreground: #0F172A;
  --color-muted: #F1F3F5;
  --color-muted-foreground: #64748B;
  --color-border: #E4E7EB;
  --color-destructive: #DC2626;
  --color-ring: #1E3A5F;
  --color-card: rgba(255, 255, 255, 0.7);
  --color-card-foreground: #0F172A;
  --font-sans: 'Fira Sans', ui-sans-serif, system-ui, sans-serif;
  --font-mono: 'Fira Code', ui-monospace, monospace;
  --radius-sm: 6px;
  --radius-md: 8px;
  --radius-lg: 12px;
}

@layer base {
  body {
    @apply bg-background text-foreground font-sans antialiased;
  }
}

/* Glassmorphism utility */
.glass {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.glass-dark {
  background: rgba(30, 58, 95, 0.8);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}
```

- [ ] **Step 3: Create utils + API client**

```typescript
// client/src/lib/utils.ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}
```

```typescript
// client/src/lib/api.ts
import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    if (err.response?.status === 401 && !err.config._retry) {
      err.config._retry = true;
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          const { data } = await axios.post('/api/auth/refresh', { refreshToken });
          localStorage.setItem('accessToken', data.accessToken);
          err.config.headers.Authorization = `Bearer ${data.accessToken}`;
          return api(err.config);
        } catch {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(err);
  },
);

export default api;
```

- [ ] **Step 4: Create auth store**

```typescript
// client/src/stores/authStore.ts
import { create } from 'zustand';
import api from '@/lib/api';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'INTERNAL' | 'PORTAL';
  phone?: string;
  address?: string;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  fetchMe: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  login: async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    set({ user: data.user });
  },
  signup: async (name, email, password) => {
    const { data } = await api.post('/auth/signup', { name, email, password });
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    set({ user: data.user });
  },
  logout: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    set({ user: null });
  },
  fetchMe: async () => {
    try {
      const { data } = await api.get('/auth/me');
      set({ user: data, isLoading: false });
    } catch {
      set({ user: null, isLoading: false });
    }
  },
}));
```

- [ ] **Step 5: Create types**

```typescript
// client/src/types/index.ts
export type UserRole = 'ADMIN' | 'INTERNAL' | 'PORTAL';
export type SubscriptionStatus = 'DRAFT' | 'QUOTATION_SENT' | 'CONFIRMED' | 'ACTIVE' | 'PAUSED' | 'CLOSED';
export type InvoiceStatus = 'DRAFT' | 'CONFIRMED' | 'PAID' | 'CANCELLED';
export type BillingPeriod = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
export type DiscountType = 'FIXED' | 'PERCENTAGE';
export type TaxComputation = 'PERCENTAGE' | 'FIXED';

export interface Product {
  id: string; name: string; productType: string; salesPrice: number; costPrice: number;
  description?: string; image?: string; isActive: boolean;
  variants: ProductVariant[]; recurringPrices: ProductRecurringPrice[];
}
export interface ProductVariant { id: string; attribute: string; value: string; extraPrice: number; }
export interface ProductRecurringPrice { id: string; price: number; plan: RecurringPlan; }
export interface RecurringPlan {
  id: string; name: string; price: number; billingPeriod: BillingPeriod; billingInterval: number;
  minQuantity: number; autoClose: boolean; closable: boolean; pausable: boolean; renewable: boolean;
}
export interface Subscription {
  id: string; number: string; status: SubscriptionStatus; customerId: string;
  customer: { id: string; name: string; email: string };
  plan: RecurringPlan; startDate?: string; expirationDate?: string;
  untaxedAmount: number; taxAmount: number; totalAmount: number;
  orderLines: OrderLine[]; invoices: Invoice[];
}
export interface OrderLine {
  id: string; productId: string; product: Product; description?: string;
  quantity: number; unitPrice: number; discountPercent: number;
  tax?: Tax; subtotal: number; taxAmount: number; total: number;
}
export interface Invoice {
  id: string; number: string; status: InvoiceStatus; invoiceDate: string; dueDate: string;
  untaxedAmount: number; taxAmount: number; totalAmount: number; amountPaid: number; amountDue: number;
  customer: { id: string; name: string; email: string };
  invoiceLines: InvoiceLine[]; payments: Payment[];
}
export interface InvoiceLine {
  id: string; description: string; quantity: number; unitPrice: number;
  discountPercent: number; subtotal: number; taxAmount: number; total: number;
}
export interface Payment {
  id: string; method: string; amount: number; paymentDate: string;
  invoice: { id: string; number: string };
}
export interface Tax { id: string; name: string; computation: TaxComputation; amount: number; }
export interface Discount {
  id: string; name: string; type: DiscountType; value: number; code?: string;
  minPurchase?: number; startDate: string; endDate: string; limitUsage: boolean; maxUsage?: number;
}
```

- [ ] **Step 6: Create App.tsx with routing**

```tsx
// client/src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';

// Auth pages
import LoginPage from '@/pages/auth/LoginPage';
import SignupPage from '@/pages/auth/SignupPage';
import ResetPasswordPage from '@/pages/auth/ResetPasswordPage';

// Admin pages
import AdminLayout from '@/components/layout/AdminLayout';
import DashboardPage from '@/pages/admin/DashboardPage';
import ProductListPage from '@/pages/admin/products/ProductListPage';
import ProductFormPage from '@/pages/admin/products/ProductFormPage';
import PlanListPage from '@/pages/admin/plans/PlanListPage';
import PlanFormPage from '@/pages/admin/plans/PlanFormPage';
import SubscriptionListPage from '@/pages/admin/subscriptions/SubscriptionListPage';
import SubscriptionFormPage from '@/pages/admin/subscriptions/SubscriptionFormPage';
import InvoiceListPage from '@/pages/admin/invoices/InvoiceListPage';
import InvoiceFormPage from '@/pages/admin/invoices/InvoiceFormPage';
import PaymentListPage from '@/pages/admin/payments/PaymentListPage';
import DiscountListPage from '@/pages/admin/discounts/DiscountListPage';
import DiscountFormPage from '@/pages/admin/discounts/DiscountFormPage';
import TaxListPage from '@/pages/admin/taxes/TaxListPage';
import TaxFormPage from '@/pages/admin/taxes/TaxFormPage';
import UserListPage from '@/pages/admin/users/UserListPage';
import UserFormPage from '@/pages/admin/users/UserFormPage';
import ReportsPage from '@/pages/admin/reports/ReportsPage';

// Portal pages
import PortalLayout from '@/components/layout/PortalLayout';
import HomePage from '@/pages/portal/HomePage';
import ShopPage from '@/pages/portal/ShopPage';
import ProductDetailPage from '@/pages/portal/ProductDetailPage';
import CartPage from '@/pages/portal/CartPage';
import CheckoutPage from '@/pages/portal/CheckoutPage';
import OrderSuccessPage from '@/pages/portal/OrderSuccessPage';
import MyOrdersPage from '@/pages/portal/MyOrdersPage';
import OrderDetailPage from '@/pages/portal/OrderDetailPage';
import ProfilePage from '@/pages/portal/ProfilePage';

function App() {
  const { user, isLoading, fetchMe } = useAuthStore();

  useEffect(() => { fetchMe(); }, [fetchMe]);

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
    </div>;
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Auth */}
        <Route path="/login" element={!user ? <LoginPage /> : <Navigate to={user.role === 'PORTAL' ? '/' : '/admin'} />} />
        <Route path="/signup" element={!user ? <SignupPage /> : <Navigate to="/" />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        {/* Admin/Internal Portal */}
        <Route path="/admin" element={user && user.role !== 'PORTAL' ? <AdminLayout /> : <Navigate to="/login" />}>
          <Route index element={<DashboardPage />} />
          <Route path="products" element={<ProductListPage />} />
          <Route path="products/new" element={<ProductFormPage />} />
          <Route path="products/:id" element={<ProductFormPage />} />
          <Route path="plans" element={<PlanListPage />} />
          <Route path="plans/new" element={<PlanFormPage />} />
          <Route path="plans/:id" element={<PlanFormPage />} />
          <Route path="subscriptions" element={<SubscriptionListPage />} />
          <Route path="subscriptions/new" element={<SubscriptionFormPage />} />
          <Route path="subscriptions/:id" element={<SubscriptionFormPage />} />
          <Route path="invoices" element={<InvoiceListPage />} />
          <Route path="invoices/:id" element={<InvoiceFormPage />} />
          <Route path="payments" element={<PaymentListPage />} />
          <Route path="discounts" element={<DiscountListPage />} />
          <Route path="discounts/new" element={<DiscountFormPage />} />
          <Route path="discounts/:id" element={<DiscountFormPage />} />
          <Route path="taxes" element={<TaxListPage />} />
          <Route path="taxes/new" element={<TaxFormPage />} />
          <Route path="taxes/:id" element={<TaxFormPage />} />
          <Route path="users" element={<UserListPage />} />
          <Route path="users/new" element={<UserFormPage />} />
          <Route path="users/:id" element={<UserFormPage />} />
          <Route path="reports" element={<ReportsPage />} />
        </Route>

        {/* Customer Portal */}
        <Route path="/" element={<PortalLayout />}>
          <Route index element={<HomePage />} />
          <Route path="shop" element={<ShopPage />} />
          <Route path="shop/:id" element={<ProductDetailPage />} />
          <Route path="cart" element={user ? <CartPage /> : <Navigate to="/login" />} />
          <Route path="checkout" element={user ? <CheckoutPage /> : <Navigate to="/login" />} />
          <Route path="orders" element={user ? <MyOrdersPage /> : <Navigate to="/login" />} />
          <Route path="orders/:id" element={user ? <OrderDetailPage /> : <Navigate to="/login" />} />
          <Route path="profile" element={user ? <ProfilePage /> : <Navigate to="/login" />} />
          <Route path="payments/success" element={<OrderSuccessPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
```

- [ ] **Step 7: Update main.tsx and index.html**

```tsx
// client/src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
```

Update `client/index.html` head to include Google Fonts:
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500;600;700&family=Fira+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet">
```

- [ ] **Step 8: Commit**

```bash
git add client/
git commit -m "feat: add frontend setup with Tailwind design tokens, auth store, API client, and complete routing"
```

---

## Task 10: Shared Components - Layout, DataTable, StatusBadge

**Files:**
- Create: `client/src/components/layout/AdminLayout.tsx`
- Create: `client/src/components/layout/Sidebar.tsx`
- Create: `client/src/components/layout/Topbar.tsx`
- Create: `client/src/components/layout/PortalLayout.tsx`
- Create: `client/src/components/shared/DataTable.tsx`
- Create: `client/src/components/shared/StatusBadge.tsx`
- Create: `client/src/components/shared/EmptyState.tsx`
- Create: `client/src/components/shared/ConfirmDialog.tsx`

**Note:** Each component should use the glassmorphism design tokens. The AdminLayout uses a sidebar with `glass-dark` class and the PortalLayout uses a navbar with `glass` class. The DataTable is a reusable table with search, sort, and pagination. StatusBadge maps subscription/invoice statuses to color-coded badges. All components use Lucide icons, never emojis.

This task is implementation-heavy. Each file is a standalone React component following the patterns:
- Semantic HTML (`<nav>`, `<main>`, `<table>`, `<button>`)
- `htmlFor` on all form labels
- `cursor-pointer` on all clickable elements
- 44px min touch targets
- Consistent 8px spacing rhythm

**Sidebar navigation items (Admin):**
```
Dashboard (LayoutDashboard icon)
Products (Package icon)
Subscriptions (RefreshCcw icon)
Recurring Plans (Calendar icon)
Invoices (FileText icon)
Payments (CreditCard icon)
Configuration dropdown:
  - Taxes (Percent icon)
  - Discounts (Tag icon)
  - Variants (Layers icon)
  - Quotation Templates (FileCheck icon)
Users/Contacts (Users icon)
Reports (BarChart3 icon)
```

**Portal navbar items:**
```
Logo | Home | Shop | My Account (dropdown: My Orders, Profile, Sign Out) | Cart (icon with count)
```

- [ ] **Step 1-8: Create all layout and shared components**

*(Each component follows the design system. Full code provided to the implementing agent. These are standard React components with Tailwind classes using the design tokens defined in Task 9.)*

- [ ] **Step 9: Commit**

```bash
git add client/src/components/
git commit -m "feat: add admin/portal layouts, sidebar, topbar, DataTable, StatusBadge, and shared components"
```

---

## Task 11: Auth Pages (Frontend)

**Files:**
- Create: `client/src/pages/auth/LoginPage.tsx`
- Create: `client/src/pages/auth/SignupPage.tsx`
- Create: `client/src/pages/auth/ResetPasswordPage.tsx`

**Design:** Centered card with glassmorphism effect, navy gradient background, Fira Sans typography. Login shows email + password fields, "forget password?" and "sign up" links. Signup shows name + email + password + re-enter password. Reset shows email field with submit.

- [ ] **Step 1-3: Implement all three auth pages with react-hook-form + zod validation**
- [ ] **Step 4: Commit**

```bash
git add client/src/pages/auth/
git commit -m "feat: add login, signup, and reset password pages with form validation"
```

---

## Task 12: Admin - Products + Plans + Taxes + Discounts + Users Pages

**Files:**
- Create all files under `client/src/pages/admin/products/`
- Create all files under `client/src/pages/admin/plans/`
- Create all files under `client/src/pages/admin/taxes/`
- Create all files under `client/src/pages/admin/discounts/`
- Create all files under `client/src/pages/admin/users/`

**Pattern for all CRUD pages:**
- **ListPage:** DataTable with search bar, "New" button, columns matching the mockup, row click navigates to form
- **FormPage:** React Hook Form with Zod validation, handles both create and edit (checks `params.id`), cancel/save/delete buttons, confirmation dialog for delete

- [ ] **Step 1-10: Implement all list and form pages**
- [ ] **Step 11: Commit**

```bash
git add client/src/pages/admin/
git commit -m "feat: add admin CRUD pages for products, plans, taxes, discounts, and users"
```

---

## Task 13: Admin - Subscription Form Page (Complex)

**Files:**
- Create: `client/src/pages/admin/subscriptions/SubscriptionListPage.tsx`
- Create: `client/src/pages/admin/subscriptions/SubscriptionFormPage.tsx`
- Create: `client/src/components/features/SubscriptionStatusFlow.tsx`
- Create: `client/src/components/features/OrderLineEditor.tsx`

**This is the most complex page. Key features from mockup:**

1. **Status flow bar** at top: Draft → Quotation Sent → Confirmed → Active → Closed
2. **Action buttons** change per status:
   - Draft: Send, Confirm
   - Quotation Sent: Confirm, Preview
   - Confirmed: Create Invoice, Cancel, Renew, Upsell
   - Active: Create Invoice, Pause, Close, Renew, Upsell
3. **Form fields:** Auto-generated number, customer search/create, quotation template dropdown, expiration, recurring plan, salesperson (defaults to logged-in user, admin can change), start date, payment method
4. **Order Lines table:** Product dropdown, quantity, unit price, discount %, tax dropdown, subtotal - editable only in Draft/Quotation Sent
5. **Totals section:** Untaxed Amount, Tax, Total (auto-calculated)
6. **History section:** Shows linked renew/upsell subscriptions

- [ ] **Step 1-6: Implement subscription list, form, status flow, and order line editor**
- [ ] **Step 7: Commit**

```bash
git add client/src/pages/admin/subscriptions/ client/src/components/features/
git commit -m "feat: add subscription management with status lifecycle, order lines, and renew/upsell"
```

---

## Task 14: Admin - Invoices + Payments + Dashboard + Reports

**Files:**
- Create: `client/src/pages/admin/invoices/InvoiceListPage.tsx`
- Create: `client/src/pages/admin/invoices/InvoiceFormPage.tsx`
- Create: `client/src/pages/admin/payments/PaymentListPage.tsx`
- Create: `client/src/pages/admin/DashboardPage.tsx`
- Create: `client/src/pages/admin/reports/ReportsPage.tsx`

**Dashboard:** 4 stat cards (Active Subscriptions, Total Revenue, Overdue Invoices, Total Customers) + Monthly Revenue bar chart (Recharts) + Subscription Status pie chart + Recent subscriptions table

**Invoice form:** Shows status flow (Draft → Confirmed → Paid), action buttons (Confirm, Cancel, Reset to Draft, Send, Pay, Print), linked subscription, invoice lines table, totals

**Reports page:** Filterable views for subscriptions, revenue, payments, overdue invoices using Recharts

- [ ] **Step 1-5: Implement dashboard, invoices, payments, and reports pages**
- [ ] **Step 6: Commit**

```bash
git add client/src/pages/admin/
git commit -m "feat: add dashboard with charts, invoice management, payments list, and reports"
```

---

## Task 15: Customer Portal - Home + Shop + Product Detail

**Files:**
- Create: `client/src/pages/portal/HomePage.tsx`
- Create: `client/src/pages/portal/ShopPage.tsx`
- Create: `client/src/pages/portal/ProductDetailPage.tsx`
- Create: `client/src/stores/cartStore.ts`

**Home page:** Hero section with company value proposition, featured products grid, pricing plans section (Monthly/6 Months/Yearly with price per month)

**Shop page:** Left sidebar with filters (Product Type, Category, Price Range), search bar, sort by dropdown, product cards grid (image placeholder, name, price, description, billing info)

**Product detail:** Large image area, product name + category, quantity selector (-/+), variant selector popup, recurring plan pricing table (Monthly/6 Months/Yearly), Add to Cart button, terms section

**Cart store (Zustand):** Manages cart items with product, variant, plan, quantity

- [ ] **Step 1-4: Implement home, shop, product detail, and cart store**
- [ ] **Step 5: Commit**

```bash
git add client/src/pages/portal/ client/src/stores/cartStore.ts
git commit -m "feat: add customer portal home, shop, product detail with cart functionality"
```

---

## Task 16: Customer Portal - Cart + Checkout + Order Success

**Files:**
- Create: `client/src/pages/portal/CartPage.tsx`
- Create: `client/src/pages/portal/CheckoutPage.tsx`
- Create: `client/src/pages/portal/OrderSuccessPage.tsx`

**Cart page:** Product list with name, price/billing, remove button. Discount code input + Apply. Subtotal/Taxes/Total. Checkout button.

**Checkout (3-step):** Step indicators (Order → Address → Payment)
- Step 1 (Order): Review order summary
- Step 2 (Address): Pre-filled from user profile, editable shipping/billing address
- Step 3 (Payment): Payment method selection (Online/Cash), pay button triggers Stripe checkout or cash recording

**Order Success:** Thank you message, order number, "Your payment has been processed", Print button, Shop button

- [ ] **Step 1-3: Implement cart, checkout flow, and success page**
- [ ] **Step 4: Commit**

```bash
git add client/src/pages/portal/
git commit -m "feat: add cart, 3-step checkout with Stripe payment, and order success page"
```

---

## Task 17: Customer Portal - My Orders + Order Detail + Profile

**Files:**
- Create: `client/src/pages/portal/MyOrdersPage.tsx`
- Create: `client/src/pages/portal/OrderDetailPage.tsx`
- Create: `client/src/pages/portal/ProfilePage.tsx`

**My Orders:** Table with Order number, Order Date, Amount, Status. Click navigates to detail.

**Order Detail:** Subscription status, plan info (name, start/end date), last invoices table (number, payment status), invoicing/shipping address, order lines table (product, quantity, unit price, tax, amount), totals. Renew/Close buttons if plan allows. Invoice link navigates to invoice page with Payment/Download buttons.

**Profile:** User details (name, email, phone, address) - editable. My Orders link. Change password section. Active subscription count with link.

- [ ] **Step 1-3: Implement my orders, order detail, and profile pages**
- [ ] **Step 4: Commit**

```bash
git add client/src/pages/portal/
git commit -m "feat: add my orders, order detail with invoice view, and user profile page"
```

---

## Task 18: Quotation Templates + Variants Config Pages

**Files:**
- Create: `client/src/pages/admin/config/QuotationTemplateListPage.tsx`
- Create: `client/src/pages/admin/config/QuotationTemplateFormPage.tsx`
- Create: `client/src/pages/admin/config/VariantListPage.tsx`
- Create: `client/src/pages/admin/config/VariantFormPage.tsx`

**Quotation Template:** Name, Validity Days, Recurring Plan dropdown, Last Forever checkbox, End After days, Description, Product Lines table (product dropdown, quantity, description). When selected during subscription creation, it pre-fills order lines.

**Variants (Attributes):** Attribute Name, Attribute Values table (value + default extra price). CRUD for attributes and their values.

- [ ] **Step 1-4: Implement quotation template and variant config pages**
- [ ] **Step 5: Commit**

```bash
git add client/src/pages/admin/config/
git commit -m "feat: add quotation templates and product variant configuration pages"
```

---

## Task 19: Integration Testing + Final Wiring

**Files:**
- Modify: `server/src/index.ts` (ensure all routes wired)
- Modify: `client/src/App.tsx` (ensure all routes wired)

- [ ] **Step 1: Verify all server routes are registered**

Run: `curl http://localhost:5000/api/health`
Test auth: `curl -X POST http://localhost:5000/api/auth/login -H "Content-Type: application/json" -d '{"email":"admin@subscription.com","password":"Admin@123"}'`

- [ ] **Step 2: Verify frontend compiles and renders**

Run: `cd client && npm run dev`
Open: `http://localhost:5173`
Expected: Login page renders with glassmorphism design

- [ ] **Step 3: Test full flow**

1. Login as admin → Dashboard loads with stats
2. Create a product → Appears in product list
3. Create a recurring plan → Appears in plan list
4. Create a subscription → Status starts as Draft
5. Add order lines → Totals calculate
6. Confirm subscription → Status moves to Confirmed
7. Create invoice → Draft invoice created
8. Confirm invoice → Status moves to Confirmed
9. Login as portal user → Shop page shows products
10. Add to cart → Checkout flow works

- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "feat: complete integration wiring and verify end-to-end flow"
```

---

## Task 20: Polish + .env.example + README

**Files:**
- Create: `server/.env.example`
- Create: `.gitignore`

- [ ] **Step 1: Create .gitignore**

```
node_modules/
dist/
.env
*.log
.DS_Store
```

- [ ] **Step 2: Create .env.example (no real secrets)**

```env
PORT=5000
NODE_ENV=development
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/subscription_db
JWT_SECRET=your-jwt-secret-here
JWT_REFRESH_SECRET=your-refresh-secret-here
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
STRIPE_SUCCESS_URL=http://localhost:5173/payments/success
STRIPE_CANCEL_URL=http://localhost:5173/payments/cancel
SMTP_USER=your@gmail.com
SMTP_PASS=your_app_password
SMTP_FROM_NAME=Subscription Manager
CLIENT_URL=http://localhost:5173
```

- [ ] **Step 3: Final commit**

```bash
git add .gitignore server/.env.example
git commit -m "chore: add .gitignore and .env.example, finalize project"
```

---

## Summary: 20 Tasks, ~55 Files

| Phase | Tasks | Hours | What Gets Built |
|-------|-------|-------|-----------------|
| Foundation | 1-3 | 0-3 | Docker, Prisma schema (16 models), seed data, Express server |
| Core Backend | 4-8 | 3-8 | Auth, Products, Plans, Taxes, Discounts, Users, Subscriptions, Invoices, Payments, Portal API, Reports API |
| Admin Frontend | 9-14 | 8-14 | Design system, layouts, auth pages, all admin CRUD pages, dashboard with charts |
| Customer Portal | 15-17 | 14-19 | Home, Shop, Product detail, Cart, Checkout (3-step), My Orders, Profile |
| Config + Polish | 18-20 | 19-24 | Quotation templates, Variants, integration testing, final polish |
