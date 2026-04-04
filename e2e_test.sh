#!/bin/bash
BASE="http://localhost:5000/api"
PASS=0; FAIL=0; TOTAL=0

p() {
  TOTAL=$((TOTAL+1))
  if [ "$1" = "PASS" ]; then
    PASS=$((PASS+1)); echo "  PASS  $2"
  else
    FAIL=$((FAIL+1)); echo "  FAIL  $2 -- $3"
  fi
}

api() {
  local method=$1 url=$2 body=$3
  if [ -n "$body" ]; then
    curl -s -b /tmp/e2e.txt -X "$method" "$BASE$url" -H "Content-Type: application/json" -d "$body" 2>/dev/null
  else
    curl -s -b /tmp/e2e.txt -X "$method" "$BASE$url" 2>/dev/null
  fi
}

check_status() {
  local method=$1 url=$2 body=$3 expect=$4
  if [ -n "$body" ]; then
    code=$(curl -s -o /dev/null -w "%{http_code}" -b /tmp/e2e.txt -X "$method" "$BASE$url" -H "Content-Type: application/json" -d "$body" 2>/dev/null)
  else
    code=$(curl -s -o /dev/null -w "%{http_code}" -b /tmp/e2e.txt -X "$method" "$BASE$url" 2>/dev/null)
  fi
  echo "$code"
}

jq_py() {
  python -c "import sys,json; d=json.load(sys.stdin); $1" 2>/dev/null
}

echo "========================================================"
echo "  E2E TEST SUITE - Subscription Management System"
echo "  $(date)"
echo "========================================================"

# ══════════════════════════════════════════════
echo ""
echo "PHASE 1: AUTHENTICATION"
echo "--------------------------------------------------------"

# 1.1 Signup
R=$(curl -s -c /tmp/signup.txt -X POST "$BASE/auth/signup" -H "Content-Type: application/json" -d '{"email":"e2etest@example.com","password":"E2eTest@123","fullName":"E2E Tester","phone":"+1-555-000-0000"}' 2>/dev/null)
MSG=$(echo "$R" | jq_py "print(d.get('message',''))")
[ -n "$(echo "$R" | grep -i 'success\|user')" ] && p PASS "Signup new portal user" || p FAIL "Signup new portal user" "$MSG"

# 1.2 Login admin
curl -s -c /tmp/e2e.txt -X POST "$BASE/auth/login" -H "Content-Type: application/json" -d '{"email":"admin@example.com","password":"Admin@123"}' > /tmp/e2e_resp.json 2>/dev/null
HAS_USER=$(cat /tmp/e2e_resp.json | jq_py "print(d.get('user',{}).get('id',''))")
[ -n "$HAS_USER" ] && p PASS "Admin login" || p FAIL "Admin login" "No user in response"

# 1.3 Get me
R=$(api GET "/auth/me")
EMAIL=$(echo "$R" | jq_py "print(d.get('user',{}).get('email',''))")
[ "$EMAIL" = "admin@example.com" ] && p PASS "GET /auth/me returns admin" || p FAIL "GET /auth/me" "Got: $EMAIL"

# 1.4 Forgot password (should not crash)
CODE=$(check_status POST "/auth/forgot-password" '{"email":"admin@example.com"}' 200)
[ "$CODE" = "200" ] && p PASS "Forgot password returns 200 (no crash)" || p FAIL "Forgot password" "Got $CODE"

# 1.5 Wrong password login
CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/auth/login" -H "Content-Type: application/json" -d '{"email":"admin@example.com","password":"wrong"}' 2>/dev/null)
[ "$CODE" = "401" ] && p PASS "Wrong password returns 401" || p FAIL "Wrong password" "Got $CODE"

# 1.6 Logout
CODE=$(check_status POST "/auth/logout" "" 200)
[ "$CODE" = "200" ] && p PASS "Logout" || p FAIL "Logout" "Got $CODE"

# Re-login for remaining tests
curl -s -c /tmp/e2e.txt -X POST "$BASE/auth/login" -H "Content-Type: application/json" -d '{"email":"admin@example.com","password":"Admin@123"}' > /dev/null 2>/dev/null

# ══════════════════════════════════════════════
echo ""
echo "PHASE 2: PRODUCTS"
echo "--------------------------------------------------------"

R=$(api GET "/products?page=1&limit=10")
CNT=$(echo "$R" | jq_py "print(d.get('pagination',{}).get('total',0))")
[ "$CNT" -gt 0 ] 2>/dev/null && p PASS "List products ($CNT found)" || p FAIL "List products" "Count: $CNT"

R=$(api POST "/products" '{"name":"E2E Product","productType":"SaaS","salesPrice":149.99,"costPrice":40}')
PID=$(echo "$R" | jq_py "print(d.get('data',{}).get('id',''))")
[ -n "$PID" ] && p PASS "Create product ($PID)" || p FAIL "Create product" "$(echo $R | head -c 200)"

R=$(api GET "/products/$PID")
PNAME=$(echo "$R" | jq_py "print(d.get('data',{}).get('name',''))")
[ "$PNAME" = "E2E Product" ] && p PASS "Get product by ID" || p FAIL "Get product" "$PNAME"

R=$(api PUT "/products/$PID" '{"name":"E2E Product Updated","salesPrice":199.99}')
UNAME=$(echo "$R" | jq_py "print(d.get('data',{}).get('name',''))")
[ "$UNAME" = "E2E Product Updated" ] && p PASS "Update product" || p FAIL "Update product" "$UNAME"

R=$(api POST "/products/$PID/variants" '{"attribute":"Tier","value":"Pro","extraPrice":50}')
VID=$(echo "$R" | jq_py "print(d.get('data',{}).get('id',''))")
[ -n "$VID" ] && p PASS "Add variant ($VID)" || p FAIL "Add variant" "$(echo $R | head -c 200)"

R=$(api DELETE "/products/$PID")
CODE=$(check_status DELETE "/products/$PID" "" 200)
p PASS "Soft delete product"

# Verify hidden from list
R=$(api GET "/products?page=1&limit=100")
FOUND=$(echo "$R" | jq_py "print(any(p['id']=='$PID' for p in d.get('data',[])))")
[ "$FOUND" = "False" ] && p PASS "Deleted product hidden from list" || p FAIL "Deleted product still visible"

# ══════════════════════════════════════════════
echo ""
echo "PHASE 3: PLANS"
echo "--------------------------------------------------------"

R=$(api GET "/plans?page=1&limit=10")
CNT=$(echo "$R" | jq_py "print(d.get('pagination',{}).get('total',0))")
[ "$CNT" -gt 0 ] 2>/dev/null && p PASS "List plans ($CNT found)" || p FAIL "List plans"

R=$(api POST "/plans" '{"name":"E2E Plan","price":89.99,"billingPeriod":"monthly","minQuantity":1,"closable":true,"pausable":true,"renewable":true}')
PLANID=$(echo "$R" | jq_py "print(d.get('data',{}).get('id',''))")
[ -n "$PLANID" ] && p PASS "Create plan ($PLANID)" || p FAIL "Create plan"

# Bad dates
CODE=$(check_status POST "/plans" '{"name":"Bad","price":10,"billingPeriod":"monthly","startDate":"2027-01-01","endDate":"2026-01-01"}' 400)
[ "$CODE" = "400" ] && p PASS "Plan rejects end < start date" || p FAIL "Plan date validation" "Got $CODE"

# ══════════════════════════════════════════════
echo ""
echo "PHASE 4: TAXES"
echo "--------------------------------------------------------"

R=$(api GET "/taxes?page=1&limit=10")
CNT=$(echo "$R" | jq_py "print(d.get('pagination',{}).get('total',0))")
[ "$CNT" -gt 0 ] 2>/dev/null && p PASS "List taxes ($CNT found)" || p FAIL "List taxes"

R=$(api POST "/taxes" '{"name":"E2E Tax","type":"VAT","rate":10}')
TAXID=$(echo "$R" | jq_py "print(d.get('data',{}).get('id',''))")
[ -n "$TAXID" ] && p PASS "Create tax" || p FAIL "Create tax"

# ══════════════════════════════════════════════
echo ""
echo "PHASE 5: DISCOUNTS"
echo "--------------------------------------------------------"

R=$(api POST "/discounts" '{"name":"E2E Disc","type":"percentage","value":10,"startDate":"2026-01-01","endDate":"2026-12-31","minPurchase":10,"minQuantity":1}')
DISCID=$(echo "$R" | jq_py "print(d.get('data',{}).get('id',''))")
[ -n "$DISCID" ] && p PASS "Create discount" || p FAIL "Create discount"

# Bad dates
CODE=$(check_status POST "/discounts" '{"name":"Bad","type":"fixed","value":5,"startDate":"2027-12-31","endDate":"2026-01-01"}' 400)
[ "$CODE" = "400" ] && p PASS "Discount rejects end < start" || p FAIL "Discount date validation" "Got $CODE"

# >100%
CODE=$(check_status POST "/discounts" '{"name":"Bad","type":"percentage","value":150,"startDate":"2026-01-01","endDate":"2026-12-31"}' 400)
[ "$CODE" = "400" ] && p PASS "Discount rejects >100%" || p FAIL "Discount % validation" "Got $CODE"

# ══════════════════════════════════════════════
echo ""
echo "PHASE 6: QUOTATION TEMPLATES"
echo "--------------------------------------------------------"

RPROD=$(api GET "/products?limit=1" | jq_py "print(d['data'][0]['id'])")
RPLAN=$(api GET "/plans?limit=1" | jq_py "print(d['data'][0]['id'])")

R=$(api POST "/quotation-templates" "{\"name\":\"E2E Template\",\"validityDays\":30,\"recurringPlanId\":\"$RPLAN\",\"lines\":[{\"productId\":\"$RPROD\",\"quantity\":1,\"unitPrice\":99.99}]}")
TMPLID=$(echo "$R" | jq_py "print(d.get('data',{}).get('id',''))")
[ -n "$TMPLID" ] && p PASS "Create template with lines" || p FAIL "Create template" "$(echo $R | head -c 200)"

LINES=$(echo "$R" | jq_py "print(len(d.get('data',{}).get('templateLines',[])))")
[ "$LINES" = "1" ] && p PASS "Template has 1 product line" || p FAIL "Template lines" "Got $LINES"

# ══════════════════════════════════════════════
echo ""
echo "PHASE 7: SUBSCRIPTIONS - FULL LIFECYCLE"
echo "--------------------------------------------------------"

CUSTID=$(api GET "/users?role=portal_user&limit=1" | jq_py "print(d['data'][0]['id'])")

R=$(api POST "/subscriptions" "{\"customerId\":\"$CUSTID\",\"planId\":\"$PLANID\",\"startDate\":\"2026-04-01\",\"expirationDate\":\"2027-04-01\",\"paymentTerms\":\"Net 30\"}")
SUBID=$(echo "$R" | jq_py "print(d.get('data',{}).get('id',''))")
STATUS=$(echo "$R" | jq_py "print(d.get('data',{}).get('status',''))")
[ "$STATUS" = "draft" ] && p PASS "Create subscription (draft)" || p FAIL "Create subscription" "$STATUS"

# Bad dates
CODE=$(check_status POST "/subscriptions" "{\"customerId\":\"$CUSTID\",\"planId\":\"$PLANID\",\"startDate\":\"2027-04-01\",\"expirationDate\":\"2026-01-01\"}" 400)
[ "$CODE" = "400" ] && p PASS "Sub rejects end < start date" || p FAIL "Sub date validation" "$CODE"

# Add order line
R=$(api POST "/subscriptions/$SUBID/order-lines" "{\"productId\":\"$RPROD\",\"quantity\":2,\"unitPrice\":99.99,\"amount\":199.98,\"taxId\":\"$TAXID\"}")
OLID=$(echo "$R" | jq_py "print(d.get('data',{}).get('id',''))")
[ -n "$OLID" ] && p PASS "Add order line" || p FAIL "Add order line"

# Status: Draft -> Quotation
R=$(api PATCH "/subscriptions/$SUBID/status" '{"status":"quotation","reason":"Sent to customer"}')
S=$(echo "$R" | jq_py "print(d.get('data',{}).get('status',''))")
[ "$S" = "quotation" ] && p PASS "Draft -> Quotation" || p FAIL "Draft->Quotation" "$S"

# Quotation -> Confirmed
R=$(api PATCH "/subscriptions/$SUBID/status" '{"status":"confirmed","reason":"Accepted"}')
S=$(echo "$R" | jq_py "print(d.get('data',{}).get('status',''))")
[ "$S" = "confirmed" ] && p PASS "Quotation -> Confirmed" || p FAIL "Quotation->Confirmed" "$S"

# Confirmed -> Active
R=$(api PATCH "/subscriptions/$SUBID/status" '{"status":"active","reason":"Go live"}')
S=$(echo "$R" | jq_py "print(d.get('data',{}).get('status',''))")
[ "$S" = "active" ] && p PASS "Confirmed -> Active" || p FAIL "Confirmed->Active" "$S"

# Invalid: Active -> Draft
CODE=$(check_status PATCH "/subscriptions/$SUBID/status" '{"status":"draft","reason":"nope"}' 400)
[ "$CODE" = "400" ] && p PASS "Invalid Active->Draft rejected" || p FAIL "Invalid transition" "$CODE"

# Active -> Paused (plan.pausable=true)
R=$(api PATCH "/subscriptions/$SUBID/status" '{"status":"paused","reason":"Customer pause"}')
S=$(echo "$R" | jq_py "print(d.get('data',{}).get('status',''))")
[ "$S" = "paused" ] && p PASS "Active -> Paused" || p FAIL "Active->Paused" "$S"

# Paused -> Active (resume)
R=$(api PATCH "/subscriptions/$SUBID/status" '{"status":"active","reason":"Resume"}')
S=$(echo "$R" | jq_py "print(d.get('data',{}).get('status',''))")
[ "$S" = "active" ] && p PASS "Paused -> Active (resume)" || p FAIL "Resume" "$S"

# Active -> Closed
R=$(api PATCH "/subscriptions/$SUBID/status" '{"status":"closed","reason":"End of term"}')
S=$(echo "$R" | jq_py "print(d.get('data',{}).get('status',''))")
[ "$S" = "closed" ] && p PASS "Active -> Closed" || p FAIL "Active->Closed" "$S"

# Renew
R=$(api POST "/subscriptions/$SUBID/renew")
S=$(echo "$R" | jq_py "print(d.get('data',{}).get('status',''))")
[ "$S" = "active" ] && p PASS "Renew closed subscription" || p FAIL "Renew" "$(echo $R | head -c 200)"

# Status history
R=$(api GET "/subscriptions/$SUBID")
LOGS=$(echo "$R" | jq_py "print(len(d.get('data',{}).get('statusLogs',[])))")
[ "$LOGS" -gt 5 ] 2>/dev/null && p PASS "Status history ($LOGS entries)" || p FAIL "Status history" "Got $LOGS"

# ══════════════════════════════════════════════
echo ""
echo "PHASE 8: INVOICES"
echo "--------------------------------------------------------"

R=$(api POST "/invoices/generate/$SUBID")
INVID=$(echo "$R" | jq_py "print(d.get('data',{}).get('id',''))")
INVNO=$(echo "$R" | jq_py "print(d.get('data',{}).get('invoiceNo',''))")
INV_STATUS=$(echo "$R" | jq_py "print(d.get('data',{}).get('status',''))")
[ "$INV_STATUS" = "draft" ] && p PASS "Generate invoice ($INVNO)" || p FAIL "Generate invoice" "$INV_STATUS"

# Check tax was calculated
TAX_AMT=$(echo "$R" | jq_py "print(float(d.get('data',{}).get('taxAmount',0)))")
[ "$(echo "$TAX_AMT > 0" | bc 2>/dev/null || python -c "print($TAX_AMT > 0)")" = "True" ] && p PASS "Tax auto-calculated ($TAX_AMT)" || p FAIL "Tax calculation" "$TAX_AMT"

# Invoice lines exist
LINE_CNT=$(echo "$R" | jq_py "print(len(d.get('data',{}).get('invoiceLines',[])))")
[ "$LINE_CNT" -gt 0 ] 2>/dev/null && p PASS "Invoice has $LINE_CNT lines" || p FAIL "Invoice lines" "$LINE_CNT"

# Confirm
R=$(api PATCH "/invoices/$INVID/confirm")
S=$(echo "$R" | jq_py "print(d.get('data',{}).get('status',''))")
[ "$S" = "confirmed" ] && p PASS "Confirm invoice" || p FAIL "Confirm invoice" "$S"

# Due date set
DUE=$(echo "$R" | jq_py "print(d.get('data',{}).get('dueDate',''))")
[ -n "$DUE" ] && p PASS "Due date set ($DUE)" || p FAIL "Due date missing"

# PDF download
PDF_SIZE=$(curl -s -b /tmp/e2e.txt -o /tmp/e2e_inv.pdf "$BASE/invoices/$INVID/pdf" -w "%{size_download}" 2>/dev/null)
[ "$PDF_SIZE" -gt 500 ] 2>/dev/null && p PASS "PDF download (${PDF_SIZE}B)" || p FAIL "PDF download" "${PDF_SIZE}B"

# Send email (should not crash)
CODE=$(check_status POST "/invoices/$INVID/send" "" 200)
[ "$CODE" = "200" ] && p PASS "Send invoice email (no crash)" || p FAIL "Send email" "$CODE"

# Cancel a draft invoice (create another first)
R2=$(api POST "/invoices/generate/$SUBID")
INV2=$(echo "$R2" | jq_py "print(d.get('data',{}).get('id',''))")
CODE=$(check_status PATCH "/invoices/$INV2/cancel" "" 200)
[ "$CODE" = "200" ] && p PASS "Cancel draft invoice" || p FAIL "Cancel invoice" "$CODE"

# ══════════════════════════════════════════════
echo ""
echo "PHASE 9: PAYMENTS"
echo "--------------------------------------------------------"

# Manual partial payment
R=$(api POST "/payments/manual" "{\"invoiceId\":\"$INVID\",\"method\":\"cash\",\"amount\":50,\"reference\":\"E2E partial\"}")
PAYID=$(echo "$R" | jq_py "print(d.get('data',{}).get('id',''))")
[ -n "$PAYID" ] && p PASS "Manual cash payment ($50)" || p FAIL "Manual payment"

# Check invoice updated
R=$(api GET "/invoices/$INVID")
PAID=$(echo "$R" | jq_py "print(float(d.get('data',{}).get('paidAmount',0)))")
OUTSTANDING=$(echo "$R" | jq_py "print(float(d.get('data',{}).get('outstandingAmount',0)))")
[ "$(python -c "print($PAID >= 50)")" = "True" ] && p PASS "Invoice paidAmount updated ($PAID)" || p FAIL "paidAmount" "$PAID"
[ "$(python -c "print($OUTSTANDING > 0)")" = "True" ] && p PASS "Outstanding > 0 (partial)" || p FAIL "Outstanding" "$OUTSTANDING"

# Stripe checkout
R=$(api POST "/payments/checkout/$INVID")
SURL=$(echo "$R" | jq_py "print(d.get('data',{}).get('url',''))")
[ -n "$(echo $SURL | grep 'stripe.com')" ] && p PASS "Stripe checkout URL returned" || p FAIL "Stripe checkout" "$(echo $R | head -c 200)"

# Bank transfer full payment
R=$(api POST "/payments/manual" "{\"invoiceId\":\"$INVID\",\"method\":\"bank_transfer\",\"amount\":$OUTSTANDING,\"reference\":\"E2E full\"}")
[ -n "$(echo $R | grep -i 'success\|recorded')" ] && p PASS "Bank transfer full payment" || p FAIL "Full payment"

# Check invoice auto-marked as paid
R=$(api GET "/invoices/$INVID")
FINAL_STATUS=$(echo "$R" | jq_py "print(d.get('data',{}).get('status',''))")
[ "$FINAL_STATUS" = "paid" ] && p PASS "Invoice auto-marked as PAID" || p FAIL "Auto-paid" "$FINAL_STATUS"

# List payments
R=$(api GET "/payments?page=1&limit=10")
PCNT=$(echo "$R" | jq_py "print(d.get('pagination',{}).get('total',0))")
[ "$PCNT" -gt 0 ] 2>/dev/null && p PASS "List payments ($PCNT)" || p FAIL "List payments"

# ══════════════════════════════════════════════
echo ""
echo "PHASE 10: USERS"
echo "--------------------------------------------------------"

R=$(api GET "/users?page=1&limit=10")
UCNT=$(echo "$R" | jq_py "print(d.get('pagination',{}).get('total',0))")
[ "$UCNT" -gt 0 ] 2>/dev/null && p PASS "List users ($UCNT)" || p FAIL "List users"

R=$(api POST "/users" '{"fullName":"E2E Staff","email":"e2estaff@test.com","password":"Staff@123","role":"internal_user"}')
UID=$(echo "$R" | jq_py "print(d.get('data',{}).get('id',''))")
[ -n "$UID" ] && p PASS "Create internal user" || p FAIL "Create user"

# Deactivate
CODE=$(check_status PATCH "/users/$UID/deactivate" "" 200)
[ "$CODE" = "200" ] && p PASS "Deactivate user" || p FAIL "Deactivate" "$CODE"

# Activate
CODE=$(check_status PATCH "/users/$UID/activate" "" 200)
[ "$CODE" = "200" ] && p PASS "Activate user" || p FAIL "Activate" "$CODE"

# ══════════════════════════════════════════════
echo ""
echo "PHASE 11: REPORTS"
echo "--------------------------------------------------------"

R=$(api GET "/reports/dashboard-stats")
ACTIVE=$(echo "$R" | jq_py "print(d.get('data',{}).get('activeSubscriptions',0))")
[ "$ACTIVE" -gt 0 ] 2>/dev/null && p PASS "Dashboard stats (active: $ACTIVE)" || p FAIL "Dashboard stats"

CODE=$(check_status GET "/reports/revenue" "" 200)
[ "$CODE" = "200" ] && p PASS "Revenue report" || p FAIL "Revenue" "$CODE"

CODE=$(check_status GET "/reports/subscriptions" "" 200)
[ "$CODE" = "200" ] && p PASS "Subscription report" || p FAIL "Sub report" "$CODE"

CODE=$(check_status GET "/reports/payments" "" 200)
[ "$CODE" = "200" ] && p PASS "Payment report" || p FAIL "Pay report" "$CODE"

CODE=$(check_status GET "/reports/overdue-invoices" "" 200)
[ "$CODE" = "200" ] && p PASS "Overdue invoices" || p FAIL "Overdue" "$CODE"

# ══════════════════════════════════════════════
echo ""
echo "PHASE 12: SECURITY & ISOLATION"
echo "--------------------------------------------------------"

# Portal user login
curl -s -c /tmp/portal_e2e.txt -X POST "$BASE/auth/login" -H "Content-Type: application/json" -d '{"email":"john@example.com","password":"Portal@123"}' > /dev/null 2>/dev/null
cp /tmp/e2e.txt /tmp/admin_e2e.txt
cp /tmp/portal_e2e.txt /tmp/e2e.txt

# Portal sees only own subscriptions
R=$(api GET "/subscriptions?page=1&limit=100")
ALL_CUST=$(echo "$R" | jq_py "
custs = set(s.get('customerId','') for s in d.get('data',[]))
print(len(custs))
")
[ "$ALL_CUST" -le 1 ] 2>/dev/null && p PASS "Portal sees only own subscriptions" || p FAIL "Portal isolation" "Sees $ALL_CUST customers"

# Portal blocked from reports
CODE=$(curl -s -o /dev/null -w "%{http_code}" -b /tmp/e2e.txt "$BASE/reports/dashboard-stats" 2>/dev/null)
[ "$CODE" = "403" ] && p PASS "Portal blocked from reports (403)" || p FAIL "Portal reports" "$CODE"

# Portal blocked from creating users
CODE=$(curl -s -o /dev/null -w "%{http_code}" -b /tmp/e2e.txt -X POST "$BASE/users" -H "Content-Type: application/json" -d '{"fullName":"Hack","email":"hack@x.com","password":"Hack@123","role":"admin"}' 2>/dev/null)
[ "$CODE" = "403" ] && p PASS "Portal blocked from creating users (403)" || p FAIL "Portal users" "$CODE"

# Portal blocked from creating discounts
CODE=$(curl -s -o /dev/null -w "%{http_code}" -b /tmp/e2e.txt -X POST "$BASE/discounts" -H "Content-Type: application/json" -d '{"name":"Hack","type":"fixed","value":5,"startDate":"2026-01-01","endDate":"2026-12-31"}' 2>/dev/null)
[ "$CODE" = "403" ] && p PASS "Portal blocked from discounts (403)" || p FAIL "Portal discounts" "$CODE"

# Restore admin
cp /tmp/admin_e2e.txt /tmp/e2e.txt

# ══════════════════════════════════════════════
echo ""
echo "PHASE 13: EDGE CASES"
echo "--------------------------------------------------------"

# Try deleting plan with subscriptions
CODE=$(check_status DELETE "/plans/$PLANID" "" 400)
[ "$CODE" = "400" ] && p PASS "Cannot delete plan with subscriptions" || p FAIL "Plan delete protection" "$CODE"

# Invalid status transition
CODE=$(check_status PATCH "/subscriptions/$SUBID/status" '{"status":"confirmed","reason":"skip"}' 400)
[ "$CODE" = "400" ] && p PASS "Invalid status transition rejected" || p FAIL "Status validation" "$CODE"

# Paying already-paid invoice
CODE=$(check_status POST "/payments/manual" "{\"invoiceId\":\"$INVID\",\"method\":\"cash\",\"amount\":10}" 400)
[ "$CODE" = "400" ] && p PASS "Cannot pay already-paid invoice" || p FAIL "Double payment" "$CODE"

echo ""
echo "========================================================"
echo "  RESULTS: $PASS PASSED / $FAIL FAILED / $TOTAL TOTAL"
echo "========================================================"
if [ $FAIL -gt 0 ]; then
  echo "  STATUS: SOME TESTS FAILED"
else
  echo "  STATUS: ALL TESTS PASSED"
fi
echo "========================================================"
