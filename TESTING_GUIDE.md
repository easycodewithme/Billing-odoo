# Complete Testing Guide - Subscription Management System

> Follow these steps in order. Each section builds on the previous one.

## Prerequisites

```bash
# Terminal 1 - Database
docker compose up -d

# Terminal 2 - Backend
cd Billing-odoo/server && npm run dev

# Terminal 3 - Frontend
cd Billing-odoo/client && npm run dev

# Terminal 4 - Stripe Webhooks
stripe listen --forward-to localhost:5000/api/webhooks/stripe
```

Open http://localhost:5173 in your browser.

---

## PHASE 1: Authentication (5 min)

### 1.1 Signup (Portal User)
1. Click **"Sign up"** on the login page
2. Fill in:
   - Full Name: `Test Customer`
   - Email: `test@example.com`
   - Phone: `+1-555-999-0001`
   - Password: `Test@1234`
3. **Verify:** Password policy checklist turns green as you type
4. **Verify:** Eye icon toggles password visibility
5. Click **Sign Up**
6. **Expected:** Redirected to Dashboard

### 1.2 Logout
1. Click the **avatar** (top-right corner)
2. Click **Logout**
3. **Expected:** Redirected to login page

### 1.3 Login as Admin
1. Email: `admin@example.com`
2. Password: `Admin@123`
3. **Verify:** Eye icon works on password field
4. Click **Login**
5. **Expected:** Dashboard loads with stats, charts, and overdue invoices

### 1.4 Forgot Password
1. Logout, go to login page
2. Click **"Forgot your password?"**
3. Enter: `admin@example.com`
4. Click **Send Reset Link**
5. **Verify:** Success message shown
6. **Check:** Server console shows the reset link (or check your email if Resend is configured with a verified domain)

### 1.5 Rate Limiting
1. Try logging in with a wrong password **16 times** rapidly
2. **Expected:** After 15 attempts, get "Too many login attempts" error

### 1.6 Portal User Isolation
1. Login as `test@example.com` / `Test@1234`
2. Navigate to **Subscriptions**
3. **Expected:** Empty list (no subscriptions for this user)
4. Navigate to **Invoices**
5. **Expected:** Empty list
6. **Verify:** Cannot see other customers' data
7. Logout

---

## PHASE 2: Dashboard & Navigation (2 min)

### 2.1 Dashboard Stats
1. Login as `admin@example.com` / `Admin@123`
2. **Verify** 4 stat cards show:
   - Active Subscriptions: `4`
   - MRR: some dollar amount
   - Total Revenue: `$984.83` (approx)
   - Overdue Invoices: `1` or `2`

### 2.2 Charts
1. **Verify:** Revenue chart (area chart) shows last 12 months
2. **Verify:** Subscription pie chart shows draft/active/closed/etc segments
3. **Verify:** Overdue invoices table lists invoices with past due dates

### 2.3 Sidebar Navigation
1. **Verify** all menu items are visible:
   - Dashboard, Products, Recurring Plans, Subscriptions, Quotation Templates, Invoices, Payments, Discounts, Taxes, Users, Reports
2. Click the **hamburger icon** to collapse sidebar
3. **Verify:** Sidebar collapses to icons only
4. Click again to expand

### 2.4 Profile Page
1. Click **avatar** → **Profile**
2. **Verify:** Shows name, email, phone, role, account status, member since
3. Click **Edit Profile**, change phone number
4. Click **Save Changes**
5. **Verify:** Updated successfully

---

## PHASE 3: Products & Variants (5 min)

### 3.1 View Products
1. Navigate to **Products**
2. **Verify:** 6 seeded products visible (CRM Pro, Cloud Storage, etc.)
3. **Verify:** Search works (type "CRM")
4. **Verify:** Pagination shows correct count

### 3.2 Create Product
1. Click **Add Product**
2. Fill in:
   - Name: `API Gateway`
   - Type: `Infrastructure`
   - Sales Price: `199.99`
   - Cost Price: `50.00`
   - Description: `Enterprise API management platform`
3. Click **Save**
4. **Expected:** Product appears in the list

### 3.3 Edit Product
1. Click the **...** menu on "API Gateway" → **Edit**
2. Change Sales Price to `249.99`
3. Click **Save**
4. **Verify:** Price updated in the list

### 3.4 Add Variants
1. Click **...** on "API Gateway" → **View** (or edit)
2. In the Variants section, add:
   - Attribute: `Tier`, Value: `Basic`, Extra Price: `0`
   - Attribute: `Tier`, Value: `Pro`, Extra Price: `100`
   - Attribute: `Tier`, Value: `Enterprise`, Extra Price: `300`
3. **Verify:** All 3 variants saved

### 3.5 Delete Product
1. Click **...** on "API Gateway" → **Delete**
2. Confirm deletion
3. **Verify:** Product marked as inactive (soft delete)

---

## PHASE 4: Recurring Plans (3 min)

### 4.1 View Plans
1. Navigate to **Recurring Plans**
2. **Verify:** 5 seeded plans visible

### 4.2 Create Plan
1. Click **Add Plan**
2. Fill in:
   - Name: `Quarterly Business`
   - Price: `399.99`
   - Billing Period: `Monthly`
   - Min Quantity: `1`
   - Enable: Closable, Pausable, Renewable
   - Disable: Auto-close
3. Click **Save**
4. **Verify:** Plan appears in list

### 4.3 Edit Plan
1. Edit "Quarterly Business", change price to `349.99`
2. Save and verify

### 4.4 Delete Plan
1. Try to delete "Monthly Professional" plan
2. **Expected:** Error "Cannot delete plan with active subscriptions"
3. Delete "Quarterly Business" (no subscriptions attached)
4. **Expected:** Deleted successfully

---

## PHASE 5: Tax Management (2 min)

### 5.1 View Taxes
1. Navigate to **Taxes**
2. **Verify:** 4 seeded taxes (GST 18%, Service Tax 5%, VAT 12%, Tax Exempt 0%)

### 5.2 Create Tax
1. Click **Add Tax**
2. Name: `State Tax`, Type: `State`, Rate: `8`
3. Save
4. **Verify:** Appears in list

### 5.3 Edit Tax
1. Edit "State Tax", change rate to `7.5`
2. Save and verify

---

## PHASE 6: Discount Management (3 min)

### 6.1 View Discounts
1. Navigate to **Discounts**
2. **Verify:** 4 seeded discounts visible
3. **Verify:** Type badges show (Percentage/Fixed)

### 6.2 Create Discount (Admin Only)
1. Click **Add Discount**
2. Fill in:
   - Name: `New User Welcome`
   - Type: `Percentage`
   - Value: `15`
   - Min Purchase: `25`
   - Min Quantity: `1`
   - Start Date: today
   - End Date: 3 months from now
   - Usage Limit: `50`
3. Save
4. **Verify:** Appears with usage 0/50

### 6.3 Verify Admin-Only Rule
1. Login as `sarah@example.com` / `Internal@123` (internal user)
2. Navigate to **Discounts**
3. **Verify:** Cannot see the "Add Discount" button or cannot create one (API returns 403)
4. Logout, login back as admin

---

## PHASE 7: Quotation Templates (3 min)

### 7.1 View Templates
1. Navigate to **Quotation Templates**
2. **Verify:** 3 seeded templates (Starter Bundle, Professional Suite, Enterprise All-In-One)

### 7.2 Create Template
1. Click **Add Template**
2. Fill in:
   - Name: `Small Business Kit`
   - Validity Days: `45`
   - Recurring Plan: `Monthly Basic`
   - Add product lines:
     - CRM Pro, Qty: 1, Price: 99.99
     - Project Manager, Qty: 1, Price: 39.99
3. Save
4. **Verify:** Template created with 2 product lines

---

## PHASE 8: Subscriptions - Full Lifecycle (10 min)

### 8.1 Create Subscription
1. Navigate to **Subscriptions**
2. Click **Add Subscription**
3. Fill in:
   - Customer: `David Brown`
   - Plan: `Monthly Professional`
   - Template: `Small Business Kit` (the one we just created)
   - Start Date: today
   - Expiration Date: 1 year from now
   - Payment Terms: `Net 30`
4. Click **Create**
5. **Verify:** Subscription created with status "Draft"

### 8.2 View Subscription Detail
1. Click on the subscription to open detail page
2. **Verify:** "Back to Subscriptions" breadcrumb visible at top
3. **Verify:** Tabs: Details, Order Lines, Invoices, Status History
4. Click **Order Lines** tab
5. **Verify:** 2 order lines from the template (CRM Pro + Project Manager)

### 8.3 Add Order Line
1. In Order Lines tab, click **Add Line**
2. Product: `Cloud Storage`, Variant: `500GB`, Qty: `1`
3. Tax: `GST`
4. Save
5. **Verify:** 3 order lines now, totals updated

### 8.4 Status Transitions (Full Lifecycle)

**Draft → Quotation:**
1. Click **Send Quotation** button
2. Enter reason: `Sent to customer for review`
3. Confirm
4. **Verify:** Status changes to "Quotation"

**Quotation → Confirmed:**
1. Click **Confirm** button
2. Enter reason: `Customer accepted the quotation`
3. Confirm
4. **Verify:** Status changes to "Confirmed"

**Confirmed → Active:**
1. Click **Activate** button
2. Enter reason: `Payment terms agreed`
3. Confirm
4. **Verify:** Status changes to "Active"

**Active → Paused (if plan.pausable):**
1. Click **Pause** button
2. Enter reason: `Customer requested pause`
3. Confirm
4. **Verify:** Status changes to "Paused"

**Paused → Active (Resume):**
1. Click **Resume** button
2. Enter reason: `Customer wants to resume`
3. Confirm
4. **Verify:** Status back to "Active"

**Active → Closed:**
1. Click **Close** button
2. Enter reason: `Subscription period ended`
3. Confirm
4. **Verify:** Status changes to "Closed"

### 8.5 Status History
1. Click **Status History** tab
2. **Verify:** Timeline shows all transitions with reasons and timestamps

### 8.6 Apply Template to Existing Subscription
1. Go back to Subscriptions list
2. Create a new subscription (Draft status) for `Lisa Anderson` with `Monthly Basic` plan
3. Open it, go to Order Lines
4. Click **Apply Template** → Select "Professional Suite"
5. **Verify:** Order lines populated from template

### 8.7 Subscription Renewal
1. Find the "Closed" subscription in the list
2. Open it
3. **Verify:** "Renew" button visible (if plan is renewable)
4. Click **Renew**
5. **Verify:** Status changes back to "Active" with new dates

---

## PHASE 9: Invoices (8 min)

### 9.1 Generate Invoice
1. Navigate to **Subscriptions**
2. Open an **Active** subscription (e.g., John Doe's)
3. Go to **Invoices** tab
4. Click **Generate Invoice**
5. **Verify:** New invoice created with status "Draft"
6. **Verify:** Invoice lines match subscription order lines
7. **Verify:** Tax amounts auto-calculated

### 9.2 View Invoice Detail
1. Navigate to **Invoices**
2. Click on the newly generated invoice
3. **Verify:** "Back to Invoices" breadcrumb visible
4. **Verify:** Customer info, line items, totals all correct
5. **Verify:** Subtotal + Tax - Discount = Net Total

### 9.3 Confirm Invoice
1. Click **Confirm** button
2. **Verify:** Status changes to "Confirmed"
3. **Verify:** Issue Date set to today
4. **Verify:** Due Date set to 30 days from now

### 9.4 Download PDF
1. Click **Download PDF**
2. **Verify:** PDF file downloads with invoice number as filename
3. Open the PDF:
   - **Verify:** Header with "INVOICE" and invoice number
   - **Verify:** Customer name and email
   - **Verify:** Line items table with products, quantities, prices
   - **Verify:** Tax and discount amounts per line
   - **Verify:** Totals section (subtotal, tax, discount, net, paid, outstanding)

### 9.5 Send Invoice Email
1. Click **Send Email**
2. **Verify:** Success toast "Invoice sent to customer"
3. **Check:** If Resend is configured, customer receives email with PDF attachment
4. **Check:** If not configured, server console logs the email details

### 9.6 Cancel Invoice
1. Go to Invoices list, find a **Draft** invoice
2. Open it and click **Cancel**
3. **Verify:** Status changes to "Cancelled"
4. Try to cancel a paid invoice
5. **Expected:** Error "Cannot cancel an invoice that has payments"

### 9.7 View Overdue Invoices
1. Navigate to **Invoices**
2. Click the **Overdue** tab
3. **Verify:** Shows invoices with due date in the past and status = confirmed

---

## PHASE 10: Payments (8 min)

### 10.1 Manual Payment (Cash)
1. Open a **Confirmed** invoice with an outstanding balance
2. Click **Record Payment**
3. Fill in:
   - Method: `Cash`
   - Amount: half the outstanding amount (partial payment)
   - Reference: `Cash payment from customer`
4. Click **Record Payment**
5. **Verify:** Payment appears in Payment History
6. **Verify:** Paid amount updated
7. **Verify:** Outstanding amount decreased
8. **Verify:** Invoice status still "Confirmed" (partial payment)

### 10.2 Manual Payment (Full)
1. Click **Record Payment** again
2. Amount: remaining outstanding amount
3. Method: `Bank Transfer`
4. Reference: `Wire transfer REF-001`
5. Click **Record Payment**
6. **Verify:** Outstanding becomes $0.00
7. **Verify:** Invoice status auto-changes to "Paid"

### 10.3 Stripe Payment
1. Find another **Confirmed** invoice with outstanding balance
2. Click **Pay with Stripe**
3. **Expected:** Redirected to Stripe Checkout page
4. Use test card: `4242 4242 4242 4242`
   - Expiry: any future date (e.g., `12/30`)
   - CVC: any 3 digits (e.g., `123`)
   - Name: anything
   - Country: any
5. Click **Pay**
6. **Expected:** Redirected to success page "Payment Successful"
7. Click **View Invoice**
8. **Verify:** Payment recorded with method "Stripe"
9. **Verify:** Invoice fully paid (if amount covered outstanding)

### 10.4 Stripe Declined Card
1. Open another confirmed invoice
2. Click **Pay with Stripe**
3. Use decline test card: `4000 0000 0000 0002`
4. **Expected:** Stripe shows "Your card was declined"
5. Go back to the invoice
6. **Verify:** Payment status shows "Failed" in payment history

### 10.5 Payment List
1. Navigate to **Payments**
2. **Verify:** All payments visible (cash, bank transfer, stripe)
3. Filter by method (e.g., "Stripe")
4. **Verify:** Only Stripe payments shown

---

## PHASE 11: Users Management (3 min)

### 11.1 View Users
1. Navigate to **Users** (Admin only in sidebar)
2. **Verify:** 11 seeded users visible
3. Filter by role tabs: All, Admin, Internal, Portal

### 11.2 Create Internal User (Admin Only)
1. Click **Add User**
2. Fill in:
   - Name: `New Employee`
   - Email: `employee@example.com`
   - Role: `Internal User`
   - Password: `Employee@123`
3. Save
4. **Verify:** User created

### 11.3 Deactivate User
1. Click **...** on the new user → **Deactivate**
2. **Verify:** Status badge changes to "Inactive"

### 11.4 Activate User
1. Click **...** → **Activate**
2. **Verify:** Status badge changes to "Active"

### 11.5 Verify Internal User Access
1. Login as `sarah@example.com` / `Internal@123`
2. **Verify:** Can access Products, Plans, Subscriptions, Invoices
3. **Verify:** Cannot create discounts (Admin only)
4. Logout

---

## PHASE 12: Reports & Export (5 min)

### 12.1 Revenue Report
1. Login as Admin
2. Navigate to **Reports**
3. Click **Revenue** tab
4. **Verify:** Area chart shows monthly revenue for last 12 months
5. Click **Export CSV**
6. **Verify:** CSV file downloads with month + revenue columns

### 12.2 Subscription Report
1. Click **Subscriptions** tab
2. **Verify:** Pie chart shows subscription count by status
3. **Verify:** Bar chart shows monthly trend
4. Click **Export CSV**
5. **Verify:** CSV downloads

### 12.3 Payment Report
1. Click **Payments** tab
2. **Verify:** Total Paid and Total Outstanding cards
3. **Verify:** Pie chart shows breakdown by payment method
4. Click **Export CSV**

### 12.4 Overdue Report
1. Click **Overdue** tab
2. **Verify:** Table lists overdue invoices with days overdue
3. Click on an invoice number → navigates to invoice detail
4. Click **Export CSV**

### 12.5 Date Range Filtering
1. Set Start Date to 3 months ago
2. Set End Date to today
3. **Verify:** Charts/data update to filtered range
4. Click **Clear** to reset

---

## PHASE 13: Mobile Responsiveness (2 min)

1. Open browser DevTools (F12)
2. Toggle device toolbar (Ctrl+Shift+M)
3. Select iPhone 14 or similar mobile device
4. **Verify:**
   - Sidebar becomes a slide-out sheet (hamburger menu)
   - Tables scroll horizontally
   - Forms fit in dialogs
   - Dashboard cards stack vertically
   - Charts resize properly

---

## PHASE 14: Edge Cases (3 min)

### 14.1 Expired Discount
1. Create a discount with End Date = yesterday
2. Create a subscription with an order line using this discount
3. Generate an invoice
4. **Expected:** Discount NOT applied (date validation)

### 14.2 Exhausted Discount
1. Find the "Launch Offer 10%" discount (usage 12/200)
2. It should still be applicable since usage < limit
3. If you set limitUsage = 12 and currentUsage = 12, it should NOT apply

### 14.3 Delete Protection
1. Try deleting a product that's used in an order line
2. **Expected:** Error (foreign key constraint)
3. Try deleting a customer with active subscriptions
4. **Expected:** Error (onDelete: Restrict)

### 14.4 Invalid Status Transition
1. Open a "Draft" subscription
2. Try to activate it directly (Draft → Active)
3. **Expected:** Error "Invalid status transition"
4. Must go Draft → Quotation → Confirmed → Active

### 14.5 Non-Pausable Plan
1. Find a subscription on "Yearly Starter" plan (pausable: false)
2. Activate it through the full lifecycle
3. When Active, try to pause
4. **Expected:** Error "This plan does not support pausing"

---

## Test Accounts Quick Reference

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@example.com | Admin@123 |
| Internal | sarah@example.com | Internal@123 |
| Internal | mike@example.com | Internal@123 |
| Portal | john@example.com | Portal@123 |
| Portal | jane@example.com | Portal@123 |
| Portal | test@example.com | Test@1234 (created in Phase 1) |

## Stripe Test Cards

| Card | Result |
|------|--------|
| 4242 4242 4242 4242 | Success |
| 4000 0000 0000 0002 | Declined |
| 4000 0000 0000 3220 | 3D Secure required |
