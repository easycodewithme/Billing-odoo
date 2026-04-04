#!/bin/bash
BASE="http://localhost:5000/api"
PASS=0
FAIL=0
ERRORS=""

test_api() {
  local method=$1 url=$2 body=$3 expect=$4 desc=$5
  if [ -n "$body" ]; then
    resp=$(curl -s -w "\n%{http_code}" -X "$method" "$BASE$url" -H "Content-Type: application/json" -b /tmp/cookies.txt -d "$body" 2>/dev/null)
  else
    resp=$(curl -s -w "\n%{http_code}" -X "$method" "$BASE$url" -b /tmp/cookies.txt 2>/dev/null)
  fi
  code=$(echo "$resp" | tail -1)
  body_resp=$(echo "$resp" | sed '$d')
  if [ "$code" = "$expect" ]; then
    echo "PASS [$code] $method $url - $desc"
    PASS=$((PASS+1))
  else
    echo "FAIL [$code exp:$expect] $method $url - $desc"
    echo "  Body: $(echo "$body_resp" | head -c 300)"
    FAIL=$((FAIL+1))
    ERRORS="${ERRORS}FAIL [$code exp:$expect] $method $url - $desc | "
  fi
  echo "$body_resp" > /tmp/last_resp.json
}

getfield() {
  python -c "import sys,json; d=json.load(open('/tmp/last_resp.json')); print(d$1)" 2>/dev/null
}

echo "============================================"
echo "API TEST SUITE"
echo "============================================"

# --- AUTH ---
echo ""
echo "--- AUTH ---"
curl -s -c /tmp/cookies.txt -X POST "$BASE/auth/login" -H "Content-Type: application/json" -d '{"email":"admin@example.com","password":"Admin@123"}' > /tmp/last_resp.json 2>/dev/null
echo "PASS [200] POST /auth/login - Admin login"
PASS=$((PASS+1))

test_api GET "/auth/me" "" 200 "Get current user"
ADMIN_ID=$(getfield "['data']['id']")
echo "  Admin ID: $ADMIN_ID"

test_api POST "/auth/forgot-password" '{"email":"admin@example.com"}' 200 "Forgot password (should not crash)"

# --- PRODUCTS ---
echo ""
echo "--- PRODUCTS ---"
test_api GET "/products?page=1&limit=10" "" 200 "List products"
PCOUNT=$(getfield "['pagination']['total']")
echo "  Products: $PCOUNT"

test_api POST "/products" '{"name":"API Gateway","productType":"Infra","salesPrice":199.99,"costPrice":50}' 201 "Create product"
PID=$(getfield "['data']['id']")

test_api GET "/products/$PID" "" 200 "Get product"
test_api PUT "/products/$PID" '{"name":"API Gateway Pro","salesPrice":249.99}' 200 "Update product"
test_api POST "/products/$PID/variants" '{"attribute":"Tier","value":"Basic","extraPrice":0}' 201 "Add variant"
test_api DELETE "/products/$PID" "" 200 "Soft delete product"

# Verify soft-deleted product is hidden
test_api GET "/products?page=1&limit=100" "" 200 "Deleted product hidden from list"
PCOUNT2=$(getfield "['pagination']['total']")
echo "  Products after delete: $PCOUNT2 (should equal $PCOUNT)"

# --- PLANS ---
echo ""
echo "--- PLANS ---"
test_api GET "/plans?page=1&limit=10" "" 200 "List plans"
test_api POST "/plans" '{"name":"Test Plan","price":99.99,"billingPeriod":"monthly","minQuantity":1,"closable":true,"pausable":true,"renewable":true}' 201 "Create plan"
PLANID=$(getfield "['data']['id']")

test_api PUT "/plans/$PLANID" '{"name":"Test Plan v2","price":109.99}' 200 "Update plan"

# Date validation
test_api POST "/plans" '{"name":"Bad Plan","price":10,"billingPeriod":"monthly","startDate":"2027-01-01","endDate":"2026-01-01"}' 400 "Plan bad dates rejected"

# --- TAXES ---
echo ""
echo "--- TAXES ---"
test_api GET "/taxes?page=1&limit=10" "" 200 "List taxes"
test_api POST "/taxes" '{"name":"Test Tax","type":"State","rate":8}' 201 "Create tax"
TAXID=$(getfield "['data']['id']")
test_api PUT "/taxes/$TAXID" '{"rate":7.5}' 200 "Update tax"

# --- DISCOUNTS ---
echo ""
echo "--- DISCOUNTS ---"
test_api GET "/discounts?page=1&limit=10" "" 200 "List discounts"
test_api POST "/discounts" '{"name":"Test Disc","type":"percentage","value":10,"startDate":"2026-01-01","endDate":"2026-12-31","minPurchase":10,"minQuantity":1}' 201 "Create discount"
DISCID=$(getfield "['data']['id']")

# Date validation
test_api POST "/discounts" '{"name":"Bad Disc","type":"fixed","value":5,"startDate":"2027-12-31","endDate":"2026-01-01"}' 400 "Discount bad dates rejected"

# Percentage validation
test_api POST "/discounts" '{"name":"Over 100","type":"percentage","value":150,"startDate":"2026-01-01","endDate":"2026-12-31"}' 400 "Discount >100% rejected"

# --- QUOTATION TEMPLATES ---
echo ""
echo "--- QUOTATION TEMPLATES ---"
test_api GET "/quotation-templates?page=1&limit=10" "" 200 "List templates"

# Get real IDs
RPROD=$(curl -s "$BASE/products?limit=1" -b /tmp/cookies.txt | python -c "import sys,json; print(json.load(sys.stdin)['data'][0]['id'])" 2>/dev/null)
RPLAN=$(curl -s "$BASE/plans?limit=1" -b /tmp/cookies.txt | python -c "import sys,json; print(json.load(sys.stdin)['data'][0]['id'])" 2>/dev/null)

test_api POST "/quotation-templates" "{\"name\":\"Test Tmpl\",\"validityDays\":30,\"recurringPlanId\":\"$RPLAN\",\"lines\":[{\"productId\":\"$RPROD\",\"quantity\":2,\"unitPrice\":99.99}]}" 201 "Create template"
TMPLID=$(getfield "['data']['id']")

# --- SUBSCRIPTIONS ---
echo ""
echo "--- SUBSCRIPTIONS ---"
test_api GET "/subscriptions?page=1&limit=10" "" 200 "List subscriptions"

CUSTID=$(curl -s "$BASE/users?role=portal_user&limit=1" -b /tmp/cookies.txt | python -c "import sys,json; print(json.load(sys.stdin)['data'][0]['id'])" 2>/dev/null)

test_api POST "/subscriptions" "{\"customerId\":\"$CUSTID\",\"planId\":\"$PLANID\",\"startDate\":\"2026-04-01\",\"expirationDate\":\"2027-04-01\",\"paymentTerms\":\"Net 30\"}" 201 "Create subscription"
SUBID=$(getfield "['data']['id']")
echo "  Sub ID: $SUBID"

# Date validation
test_api POST "/subscriptions" "{\"customerId\":\"$CUSTID\",\"planId\":\"$PLANID\",\"startDate\":\"2027-04-01\",\"expirationDate\":\"2026-01-01\"}" 400 "Sub bad dates rejected"

test_api GET "/subscriptions/$SUBID" "" 200 "Get subscription detail"

# Add order line
test_api POST "/subscriptions/$SUBID/order-lines" "{\"productId\":\"$RPROD\",\"quantity\":2,\"unitPrice\":99.99,\"amount\":199.98,\"taxId\":\"$TAXID\"}" 201 "Add order line"
OLID=$(getfield "['data']['id']")

# Status transitions
test_api PATCH "/subscriptions/$SUBID/status" '{"status":"quotation","reason":"Sent"}' 200 "Draft -> Quotation"
test_api PATCH "/subscriptions/$SUBID/status" '{"status":"confirmed","reason":"Accepted"}' 200 "Quotation -> Confirmed"
test_api PATCH "/subscriptions/$SUBID/status" '{"status":"active","reason":"Go live"}' 200 "Confirmed -> Active"

# Invalid transition
test_api PATCH "/subscriptions/$SUBID/status" '{"status":"draft","reason":"Nope"}' 400 "Invalid Active->Draft rejected"

# Pause (plan has pausable=true)
test_api PATCH "/subscriptions/$SUBID/status" '{"status":"paused","reason":"Customer request"}' 200 "Active -> Paused"
test_api PATCH "/subscriptions/$SUBID/status" '{"status":"active","reason":"Resume"}' 200 "Paused -> Active"
test_api PATCH "/subscriptions/$SUBID/status" '{"status":"closed","reason":"End"}' 200 "Active -> Closed"

# Renewal
test_api POST "/subscriptions/$SUBID/renew" "" 200 "Renew closed subscription"

# --- INVOICES ---
echo ""
echo "--- INVOICES ---"
test_api GET "/invoices?page=1&limit=10" "" 200 "List invoices"
test_api POST "/invoices/generate/$SUBID" "" 201 "Generate invoice"
INVID=$(getfield "['data']['id']")
echo "  Invoice ID: $INVID"

test_api GET "/invoices/$INVID" "" 200 "Get invoice detail"
test_api PATCH "/invoices/$INVID/confirm" "" 200 "Confirm invoice"
test_api GET "/invoices/$INVID/pdf" "" 200 "Download PDF"
test_api POST "/invoices/$INVID/send" "" 200 "Send invoice email"

# --- PAYMENTS ---
echo ""
echo "--- PAYMENTS ---"
test_api GET "/payments?page=1&limit=10" "" 200 "List payments"
test_api POST "/payments/manual" "{\"invoiceId\":\"$INVID\",\"method\":\"cash\",\"amount\":50,\"reference\":\"Partial cash\"}" 201 "Manual payment"
test_api POST "/payments/checkout/$INVID" "" 200 "Stripe checkout"
STRIPE_URL=$(getfield "['data']['url']")
echo "  Stripe URL: ${STRIPE_URL:0:60}..."

# --- USERS ---
echo ""
echo "--- USERS ---"
test_api GET "/users?page=1&limit=10" "" 200 "List users"
test_api POST "/users" '{"fullName":"Test Staff","email":"staff@test.com","password":"Staff@123","role":"internal_user"}' 201 "Create internal user"

# --- REPORTS ---
echo ""
echo "--- REPORTS ---"
test_api GET "/reports/dashboard-stats" "" 200 "Dashboard stats"
test_api GET "/reports/revenue" "" 200 "Revenue report"
test_api GET "/reports/subscriptions" "" 200 "Subscription report"
test_api GET "/reports/payments" "" 200 "Payment report"
test_api GET "/reports/overdue-invoices" "" 200 "Overdue invoices"

# --- PORTAL ISOLATION ---
echo ""
echo "--- PORTAL USER ISOLATION ---"
curl -s -c /tmp/portal_cookies.txt -X POST "$BASE/auth/login" -H "Content-Type: application/json" -d '{"email":"john@example.com","password":"Portal@123"}' > /dev/null 2>&1

# Swap to portal cookies
cp /tmp/cookies.txt /tmp/admin_cookies.txt
cp /tmp/portal_cookies.txt /tmp/cookies.txt

test_api GET "/reports/dashboard-stats" "" 403 "Portal blocked from reports"
test_api POST "/users" '{"fullName":"Hack","email":"h@x.com","password":"H@ck1234","role":"admin"}' 403 "Portal blocked from creating users"
test_api POST "/discounts" '{"name":"Hack","type":"fixed","value":5,"startDate":"2026-01-01","endDate":"2026-12-31"}' 403 "Portal blocked from creating discounts"

# Restore admin cookies
cp /tmp/admin_cookies.txt /tmp/cookies.txt

# --- CLEANUP ---
echo ""
echo "--- CLEANUP ---"
test_api DELETE "/plans/$PLANID" "" 400 "Cannot delete plan with subscriptions"
test_api DELETE "/taxes/$TAXID" "" 200 "Delete test tax"
test_api DELETE "/discounts/$DISCID" "" 200 "Delete test discount"

echo ""
echo "============================================"
echo "RESULTS: $PASS passed, $FAIL failed"
echo "============================================"
if [ $FAIL -gt 0 ]; then
  echo ""
  echo "FAILURES: $ERRORS"
fi
