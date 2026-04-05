const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// ─── Helpers ────────────────────────────────────────────────────────────────

const d = (str) => new Date(str);
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
let subSeq = 1, invSeq = 1;
const subNo = () => `SUB-2026${String(subSeq++).padStart(5, '0')}`;
const invNo = () => `INV-2026${String(invSeq++).padStart(5, '0')}`;

async function main() {
  console.log('Clearing existing data...');
  await prisma.auditLog.deleteMany();
  await prisma.subscriptionStatusLog.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.invoiceLine.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.orderLine.deleteMany();
  await prisma.discountSubscription.deleteMany();
  await prisma.discountProduct.deleteMany();
  await prisma.discount.deleteMany();
  await prisma.quotationTemplateLine.deleteMany();
  await prisma.quotationTemplate.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.product.deleteMany();
  await prisma.recurringPlan.deleteMany();
  await prisma.tax.deleteMany();
  await prisma.user.deleteMany();
  console.log('Database cleared.');

  // ═══════════════════════════════════════════════════════════════════════════
  // 1. USERS — 1 admin + 2 internal + 30 portal users = 33 total
  // ═══════════════════════════════════════════════════════════════════════════
  const adminPw = await bcrypt.hash('Admin@123', 10);
  const intPw   = await bcrypt.hash('Internal@123', 10);
  const portalPw= await bcrypt.hash('Portal@123', 10);

  const admin = await prisma.user.create({
    data: { fullName: 'System Admin', email: 'admin@example.com', password: adminPw, role: 'admin', phone: '+1-555-100-0001' },
  });
  const sarah = await prisma.user.create({
    data: { fullName: 'Sarah Johnson', email: 'sarah@example.com', password: intPw, role: 'internal_user', phone: '+1-555-100-0002' },
  });
  const mike = await prisma.user.create({
    data: { fullName: 'Mike Chen', email: 'mike@example.com', password: intPw, role: 'internal_user', phone: '+1-555-100-0003' },
  });
  const staff = [admin, sarah, mike];

  const portalNames = [
    'John Doe', 'Jane Smith', 'Robert Wilson', 'Emily Davis', 'David Brown',
    'Lisa Anderson', 'James Taylor', 'Maria Garcia', 'Chris Martinez', 'Amanda Thomas',
    'Daniel Jackson', 'Jennifer White', 'Matthew Harris', 'Sarah Clark', 'Andrew Lewis',
    'Jessica Robinson', 'Joshua Walker', 'Ashley Young', 'Ryan Hall', 'Megan Allen',
    'Kevin King', 'Stephanie Wright', 'Brandon Scott', 'Nicole Green', 'Justin Adams',
    'Rachel Baker', 'Tyler Nelson', 'Lauren Hill', 'Aaron Moore', 'Kayla Mitchell',
  ];
  const customers = [];
  for (let i = 0; i < portalNames.length; i++) {
    const name = portalNames[i];
    const email = name.toLowerCase().replace(/\s/g, '.') + '@example.com';
    const user = await prisma.user.create({
      data: { fullName: name, email, password: portalPw, role: 'portal_user', phone: `+1-555-200-${String(i + 1).padStart(4, '0')}` },
    });
    customers.push(user);
  }
  console.log(`Created ${3 + customers.length} users`);

  // ═══════════════════════════════════════════════════════════════════════════
  // 2. PRODUCTS — 8 products with variants
  // ═══════════════════════════════════════════════════════════════════════════
  const p1 = await prisma.product.create({ data: {
    name: 'CRM Pro', productType: 'SaaS', salesPrice: 99.99, costPrice: 30,
    description: 'Professional CRM with pipeline management, contact tracking, and analytics dashboard.',
    image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=600&h=400&fit=crop',
    variants: { create: [
      { attribute: 'Plan', value: 'Basic', extraPrice: 0 },
      { attribute: 'Plan', value: 'Professional', extraPrice: 50 },
      { attribute: 'Plan', value: 'Enterprise', extraPrice: 150 },
    ]},
  }, include: { variants: true }});

  const p2 = await prisma.product.create({ data: {
    name: 'Cloud Storage', productType: 'Infrastructure', salesPrice: 29.99, costPrice: 8,
    description: 'Secure cloud storage with automatic backups and file versioning.',
    image: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=600&h=400&fit=crop',
    variants: { create: [
      { attribute: 'Storage', value: '100GB', extraPrice: 0 },
      { attribute: 'Storage', value: '500GB', extraPrice: 20 },
      { attribute: 'Storage', value: '1TB', extraPrice: 50 },
      { attribute: 'Storage', value: '5TB', extraPrice: 120 },
    ]},
  }, include: { variants: true }});

  const p3 = await prisma.product.create({ data: {
    name: 'Email Marketing Suite', productType: 'SaaS', salesPrice: 49.99, costPrice: 12,
    description: 'Complete email marketing platform with automation, templates, and A/B testing.',
    image: 'https://images.unsplash.com/photo-1563986768609-322da13575f2?w=600&h=400&fit=crop',
    variants: { create: [
      { attribute: 'Tier', value: 'Starter', extraPrice: 0 },
      { attribute: 'Tier', value: 'Growth', extraPrice: 30 },
      { attribute: 'Tier', value: 'Scale', extraPrice: 80 },
    ]},
  }, include: { variants: true }});

  const p4 = await prisma.product.create({ data: {
    name: 'Analytics Dashboard', productType: 'SaaS', salesPrice: 79.99, costPrice: 20,
    description: 'Real-time analytics with custom reports, data visualization, and team sharing.',
    image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&h=400&fit=crop',
    variants: { create: [
      { attribute: 'Seats', value: '5 Users', extraPrice: 0 },
      { attribute: 'Seats', value: '25 Users', extraPrice: 40 },
      { attribute: 'Seats', value: 'Unlimited', extraPrice: 100 },
    ]},
  }, include: { variants: true }});

  const p5 = await prisma.product.create({ data: {
    name: 'Help Desk Pro', productType: 'SaaS', salesPrice: 59.99, costPrice: 18,
    description: 'Customer support ticketing system with live chat, knowledge base, and SLA tracking.',
    image: 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=600&h=400&fit=crop',
    variants: { create: [
      { attribute: 'Agents', value: '3 Agents', extraPrice: 0 },
      { attribute: 'Agents', value: '10 Agents', extraPrice: 35 },
      { attribute: 'Agents', value: 'Unlimited', extraPrice: 90 },
    ]},
  }, include: { variants: true }});

  const p6 = await prisma.product.create({ data: {
    name: 'Project Manager', productType: 'SaaS', salesPrice: 39.99, costPrice: 10,
    description: 'Project management tool with Kanban boards, Gantt charts, and time tracking.',
    image: 'https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=600&h=400&fit=crop',
  }});

  const p7 = await prisma.product.create({ data: {
    name: 'API Gateway', productType: 'Infrastructure', salesPrice: 119.99, costPrice: 35,
    description: 'Enterprise API gateway with rate limiting, authentication, and monitoring.',
    image: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=600&h=400&fit=crop',
    variants: { create: [
      { attribute: 'Requests', value: '1M/month', extraPrice: 0 },
      { attribute: 'Requests', value: '10M/month', extraPrice: 80 },
      { attribute: 'Requests', value: 'Unlimited', extraPrice: 200 },
    ]},
  }, include: { variants: true }});

  const p8 = await prisma.product.create({ data: {
    name: 'Security Suite', productType: 'Service', salesPrice: 199.99, costPrice: 60,
    description: 'Comprehensive security with vulnerability scanning, compliance reports, and pen testing.',
    image: 'https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?w=600&h=400&fit=crop',
    variants: { create: [
      { attribute: 'Level', value: 'Standard', extraPrice: 0 },
      { attribute: 'Level', value: 'Advanced', extraPrice: 100 },
      { attribute: 'Level', value: 'Enterprise', extraPrice: 300 },
    ]},
  }, include: { variants: true }});

  const products = [p1, p2, p3, p4, p5, p6, p7, p8];
  console.log(`Created ${products.length} products with variants`);

  // ═══════════════════════════════════════════════════════════════════════════
  // 3. TAXES
  // ═══════════════════════════════════════════════════════════════════════════
  const gst       = await prisma.tax.create({ data: { name: 'GST 18%', rate: 18, type: 'GST', description: 'Goods and Services Tax' }});
  const svcTax    = await prisma.tax.create({ data: { name: 'Service Tax 5%', rate: 5, type: 'Service', description: 'Service Tax' }});
  const vat       = await prisma.tax.create({ data: { name: 'VAT 12%', rate: 12, type: 'VAT', description: 'Value Added Tax' }});
  const zeroTax   = await prisma.tax.create({ data: { name: 'Tax Exempt', rate: 0, type: 'Exempt', description: 'No tax' }});
  const taxes = [gst, svcTax, vat, zeroTax];
  console.log('Created 4 taxes');

  // ═══════════════════════════════════════════════════════════════════════════
  // 4. RECURRING PLANS
  // ═══════════════════════════════════════════════════════════════════════════
  const planWeekly = await prisma.recurringPlan.create({ data: {
    name: 'Weekly Trial', price: 9.99, billingPeriod: 'weekly', minQuantity: 1,
    closable: true, pausable: false, renewable: false, autoClose: true,
  }});
  const planMonthlyBasic = await prisma.recurringPlan.create({ data: {
    name: 'Monthly Basic', price: 49.99, billingPeriod: 'monthly', minQuantity: 1,
    closable: true, pausable: true, renewable: true, autoClose: false,
  }});
  const planMonthlyPro = await prisma.recurringPlan.create({ data: {
    name: 'Monthly Professional', price: 149.99, billingPeriod: 'monthly', minQuantity: 1,
    closable: true, pausable: true, renewable: true, autoClose: false,
  }});
  const planYearlyStarter = await prisma.recurringPlan.create({ data: {
    name: 'Yearly Starter', price: 499.99, billingPeriod: 'yearly', minQuantity: 1,
    closable: true, pausable: false, renewable: true, autoClose: false,
  }});
  const planYearlyEnt = await prisma.recurringPlan.create({ data: {
    name: 'Yearly Enterprise', price: 1499.99, billingPeriod: 'yearly', minQuantity: 1,
    closable: true, pausable: false, renewable: true, autoClose: false,
  }});
  const plans = [planWeekly, planMonthlyBasic, planMonthlyPro, planYearlyStarter, planYearlyEnt];
  console.log('Created 5 plans');

  // ═══════════════════════════════════════════════════════════════════════════
  // 5. DISCOUNTS
  // ═══════════════════════════════════════════════════════════════════════════
  const disc1 = await prisma.discount.create({ data: {
    name: 'Launch Offer 10%', type: 'percentage', value: 10, minPurchase: 50, minQuantity: 1,
    startDate: d('2026-01-01'), endDate: d('2026-12-31'), limitUsage: 200, currentUsage: 42,
  }});
  const disc2 = await prisma.discount.create({ data: {
    name: 'Flat $25 Off', type: 'fixed', value: 25, minPurchase: 100, minQuantity: 1,
    startDate: d('2026-03-01'), endDate: d('2026-09-30'), limitUsage: 50, currentUsage: 18,
  }});
  const disc3 = await prisma.discount.create({ data: {
    name: 'Enterprise 20%', type: 'percentage', value: 20, minPurchase: 500, minQuantity: 2,
    startDate: d('2026-01-01'), endDate: d('2026-06-30'), limitUsage: 30, currentUsage: 12,
  }});
  const disc4 = await prisma.discount.create({ data: {
    name: 'Summer Sale 15%', type: 'percentage', value: 15, minPurchase: 75, minQuantity: 1,
    startDate: d('2026-06-01'), endDate: d('2026-08-31'), limitUsage: 100, currentUsage: 0,
  }});
  const disc5 = await prisma.discount.create({ data: {
    name: 'New Customer $10', type: 'fixed', value: 10, minPurchase: 30, minQuantity: 1,
    startDate: d('2025-06-01'), endDate: d('2026-12-31'), limitUsage: 500, currentUsage: 87,
  }});

  await prisma.discountProduct.createMany({ data: [
    { discountId: disc1.id, productId: p1.id }, { discountId: disc1.id, productId: p3.id },
    { discountId: disc2.id, productId: p2.id }, { discountId: disc2.id, productId: p7.id },
    { discountId: disc3.id, productId: p4.id }, { discountId: disc3.id, productId: p8.id },
    { discountId: disc5.id, productId: p5.id }, { discountId: disc5.id, productId: p6.id },
  ]});
  console.log('Created 5 discounts');

  // ═══════════════════════════════════════════════════════════════════════════
  // 6. QUOTATION TEMPLATES
  // ═══════════════════════════════════════════════════════════════════════════
  await prisma.quotationTemplate.create({ data: {
    name: 'Starter Bundle', validityDays: 30, recurringPlanId: planMonthlyBasic.id,
    templateLines: { create: [
      { productId: p1.id, quantity: 1, unitPrice: 49.99 },
      { productId: p2.id, quantity: 1, unitPrice: 49.99 },
    ]},
  }});
  await prisma.quotationTemplate.create({ data: {
    name: 'Professional Suite', validityDays: 45, recurringPlanId: planMonthlyPro.id,
    templateLines: { create: [
      { productId: p1.id, quantity: 1, unitPrice: 149.99 },
      { productId: p3.id, quantity: 1, unitPrice: 149.99 },
      { productId: p4.id, quantity: 1, unitPrice: 149.99 },
      { productId: p5.id, quantity: 1, unitPrice: 149.99 },
    ]},
  }});
  await prisma.quotationTemplate.create({ data: {
    name: 'Enterprise All-In-One', validityDays: 60, recurringPlanId: planYearlyEnt.id,
    templateLines: { create: [
      { productId: p1.id, quantity: 1, unitPrice: 1499.99 },
      { productId: p2.id, quantity: 1, unitPrice: 1499.99 },
      { productId: p3.id, quantity: 1, unitPrice: 1499.99 },
      { productId: p4.id, quantity: 1, unitPrice: 1499.99 },
      { productId: p5.id, quantity: 1, unitPrice: 1499.99 },
      { productId: p6.id, quantity: 1, unitPrice: 1499.99 },
    ]},
  }});
  console.log('Created 3 quotation templates');

  // ═══════════════════════════════════════════════════════════════════════════
  // 7. SUBSCRIPTIONS — 45 total across all statuses
  //    18 active, 5 confirmed, 6 draft, 5 quotation, 5 paused, 6 closed
  // ═══════════════════════════════════════════════════════════════════════════
  const allSubs = [];
  const statusLogs = [];

  // Helper to create subscription + order lines + status logs
  const createSub = async ({ cust, plan, status, startDate, expDate, products: prods, salesperson, notes }) => {
    const sp = salesperson || pick(staff);
    const orderLines = prods.map(({ product, qty, price, tax, discount }) => ({
      productId: product.id,
      quantity: qty || 1,
      unitPrice: price || Number(plan.price),
      amount: (qty || 1) * (price || Number(plan.price)),
      taxId: tax?.id || null,
      discountId: discount?.id || null,
    }));

    const sub = await prisma.subscription.create({
      data: {
        subscriptionNo: subNo(),
        customerId: cust.id,
        planId: plan.id,
        startDate: d(startDate),
        expirationDate: expDate ? d(expDate) : undefined,
        paymentTerms: pick(['Net 30', 'Net 15', 'Net 60', 'Due on Receipt']),
        status,
        salespersonId: sp.id,
        notes: notes || null,
        orderLines: { create: orderLines },
      },
    });
    allSubs.push(sub);

    // Build realistic status log chain
    const logs = [];
    const logDate = new Date(startDate);
    if (['quotation','confirmed','active','paused','closed'].includes(status)) {
      logs.push({ subscriptionId: sub.id, fromStatus: 'draft', toStatus: 'quotation', changedById: sp.id, reason: 'Sent to customer', createdAt: new Date(logDate) });
      logDate.setDate(logDate.getDate() + 2);
    }
    if (['confirmed','active','paused','closed'].includes(status)) {
      logs.push({ subscriptionId: sub.id, fromStatus: 'quotation', toStatus: 'confirmed', changedById: cust.id, reason: 'Customer accepted', createdAt: new Date(logDate) });
      logDate.setDate(logDate.getDate() + 1);
    }
    if (['active','paused','closed'].includes(status)) {
      logs.push({ subscriptionId: sub.id, fromStatus: 'confirmed', toStatus: 'active', reason: 'Payment received', createdAt: new Date(logDate) });
      logDate.setDate(logDate.getDate() + 1);
    }
    if (status === 'paused') {
      logDate.setDate(logDate.getDate() + 30);
      logs.push({ subscriptionId: sub.id, fromStatus: 'active', toStatus: 'paused', changedById: cust.id, reason: 'Customer paused subscription', createdAt: new Date(logDate) });
    }
    if (status === 'closed') {
      logDate.setDate(logDate.getDate() + 60);
      logs.push({ subscriptionId: sub.id, fromStatus: 'active', toStatus: 'closed', changedById: cust.id, reason: 'Customer cancelled', createdAt: new Date(logDate) });
    }
    if (logs.length > 0) await prisma.subscriptionStatusLog.createMany({ data: logs });

    return sub;
  };

  // ── 18 ACTIVE subscriptions (spread across last 12 months) ──
  const activeConfigs = [
    { cust: customers[0],  plan: planMonthlyPro,    startDate: '2025-05-15', expDate: '2026-05-15', products: [{ product: p1, tax: gst }, { product: p4, tax: gst }] },
    { cust: customers[1],  plan: planYearlyEnt,     startDate: '2025-06-01', expDate: '2026-06-01', products: [{ product: p1, tax: gst }, { product: p2, tax: svcTax }, { product: p3, tax: gst }, { product: p5, tax: gst }] },
    { cust: customers[2],  plan: planMonthlyBasic,   startDate: '2025-07-01', expDate: '2026-07-01', products: [{ product: p2, qty: 2, tax: svcTax }, { product: p6 }] },
    { cust: customers[3],  plan: planYearlyStarter,  startDate: '2025-08-01', expDate: '2026-08-01', products: [{ product: p3, tax: vat }] },
    { cust: customers[4],  plan: planMonthlyPro,     startDate: '2025-09-01', expDate: '2026-09-01', products: [{ product: p1, tax: gst }, { product: p5, tax: gst }] },
    { cust: customers[5],  plan: planMonthlyBasic,   startDate: '2025-10-15', expDate: '2026-10-15', products: [{ product: p6 }, { product: p2, tax: svcTax }] },
    { cust: customers[6],  plan: planYearlyEnt,      startDate: '2025-11-01', expDate: '2026-11-01', products: [{ product: p1, tax: gst }, { product: p4, tax: gst }, { product: p7, tax: gst }] },
    { cust: customers[7],  plan: planMonthlyPro,     startDate: '2025-12-01', expDate: '2026-12-01', products: [{ product: p8, tax: gst }, { product: p3, tax: gst }] },
    { cust: customers[8],  plan: planMonthlyBasic,   startDate: '2026-01-01', expDate: '2027-01-01', products: [{ product: p5, tax: svcTax }] },
    { cust: customers[9],  plan: planYearlyStarter,  startDate: '2026-01-15', expDate: '2027-01-15', products: [{ product: p4, tax: vat }, { product: p6 }] },
    { cust: customers[10], plan: planMonthlyPro,     startDate: '2026-02-01', expDate: '2027-02-01', products: [{ product: p1, tax: gst }, { product: p7, tax: gst }] },
    { cust: customers[11], plan: planMonthlyBasic,   startDate: '2026-02-15', expDate: '2027-02-15', products: [{ product: p3, tax: gst }] },
    { cust: customers[12], plan: planYearlyEnt,      startDate: '2026-03-01', expDate: '2027-03-01', products: [{ product: p1, tax: gst }, { product: p8, tax: gst }, { product: p2, tax: svcTax }] },
    { cust: customers[13], plan: planMonthlyPro,     startDate: '2026-03-10', expDate: '2027-03-10', products: [{ product: p5, tax: gst }, { product: p4, tax: gst }] },
    { cust: customers[14], plan: planMonthlyBasic,   startDate: '2026-03-15', expDate: '2027-03-15', products: [{ product: p6 }] },
    { cust: customers[15], plan: planMonthlyPro,     startDate: '2026-03-20', expDate: '2027-03-20', products: [{ product: p7, tax: gst }, { product: p1, tax: gst }] },
    { cust: customers[16], plan: planYearlyStarter,  startDate: '2026-04-01', expDate: '2027-04-01', products: [{ product: p3, tax: vat }] },
    { cust: customers[17], plan: planMonthlyBasic,   startDate: '2026-04-01', expDate: '2027-04-01', products: [{ product: p2, tax: svcTax }, { product: p5, tax: svcTax }] },
  ];
  for (const cfg of activeConfigs) await createSub({ ...cfg, status: 'active' });

  // ── 5 CONFIRMED (awaiting payment) ──
  const confirmedConfigs = [
    { cust: customers[18], plan: planMonthlyPro,    startDate: '2026-03-28', expDate: '2027-03-28', products: [{ product: p1, tax: gst }] },
    { cust: customers[19], plan: planYearlyStarter, startDate: '2026-04-01', expDate: '2027-04-01', products: [{ product: p4, tax: vat }] },
    { cust: customers[20], plan: planMonthlyBasic,  startDate: '2026-04-02', expDate: '2027-04-02', products: [{ product: p5, tax: gst }, { product: p6 }] },
    { cust: customers[21], plan: planMonthlyPro,    startDate: '2026-04-03', expDate: '2027-04-03', products: [{ product: p8, tax: gst }] },
    { cust: customers[22], plan: planYearlyEnt,     startDate: '2026-04-04', expDate: '2027-04-04', products: [{ product: p1, tax: gst }, { product: p7, tax: gst }] },
  ];
  for (const cfg of confirmedConfigs) await createSub({ ...cfg, status: 'confirmed' });

  // ── 6 DRAFT ──
  const draftConfigs = [
    { cust: customers[23], plan: planMonthlyBasic,  startDate: '2026-04-03', products: [{ product: p1 }] },
    { cust: customers[24], plan: planMonthlyPro,    startDate: '2026-04-04', products: [{ product: p3, tax: gst }] },
    { cust: customers[25], plan: planYearlyStarter, startDate: '2026-04-05', products: [{ product: p2, tax: svcTax }, { product: p6 }] },
    { cust: customers[0],  plan: planWeekly,        startDate: '2026-04-05', products: [{ product: p6 }] },
    { cust: customers[1],  plan: planMonthlyBasic,  startDate: '2026-04-05', products: [{ product: p7, tax: gst }] },
    { cust: customers[2],  plan: planMonthlyPro,    startDate: '2026-04-05', products: [{ product: p8, tax: gst }, { product: p4, tax: gst }] },
  ];
  for (const cfg of draftConfigs) await createSub({ ...cfg, status: 'draft' });

  // ── 5 QUOTATION ──
  const quotationConfigs = [
    { cust: customers[26], plan: planYearlyEnt,     startDate: '2026-04-01', expDate: '2027-04-01', products: [{ product: p1, tax: gst }, { product: p4, tax: gst }, { product: p7, tax: gst }] },
    { cust: customers[27], plan: planMonthlyPro,    startDate: '2026-04-02', expDate: '2027-04-02', products: [{ product: p5, tax: gst }] },
    { cust: customers[28], plan: planMonthlyBasic,  startDate: '2026-04-03', expDate: '2027-04-03', products: [{ product: p3, tax: vat }, { product: p6 }] },
    { cust: customers[3],  plan: planMonthlyPro,    startDate: '2026-04-04', expDate: '2027-04-04', products: [{ product: p8, tax: gst }] },
    { cust: customers[4],  plan: planYearlyStarter, startDate: '2026-04-05', expDate: '2027-04-05', products: [{ product: p2, tax: svcTax }] },
  ];
  for (const cfg of quotationConfigs) await createSub({ ...cfg, status: 'quotation' });

  // ── 5 PAUSED ──
  const pausedConfigs = [
    { cust: customers[29], plan: planMonthlyBasic,  startDate: '2025-09-01', expDate: '2026-09-01', products: [{ product: p3, tax: svcTax }] },
    { cust: customers[0],  plan: planMonthlyPro,    startDate: '2025-11-01', expDate: '2026-11-01', products: [{ product: p1, tax: gst }, { product: p4, tax: gst }] },
    { cust: customers[5],  plan: planMonthlyBasic,  startDate: '2025-12-15', expDate: '2026-12-15', products: [{ product: p5, tax: gst }] },
    { cust: customers[8],  plan: planMonthlyPro,    startDate: '2026-01-01', expDate: '2027-01-01', products: [{ product: p7, tax: gst }] },
    { cust: customers[11], plan: planMonthlyBasic,  startDate: '2026-02-01', expDate: '2027-02-01', products: [{ product: p6 }] },
  ];
  for (const cfg of pausedConfigs) await createSub({ ...cfg, status: 'paused' });

  // ── 6 CLOSED ──
  const closedConfigs = [
    { cust: customers[1],  plan: planWeekly,        startDate: '2025-06-01', expDate: '2025-06-08', products: [{ product: p6 }] },
    { cust: customers[3],  plan: planMonthlyBasic,  startDate: '2025-07-01', expDate: '2025-12-31', products: [{ product: p2, tax: svcTax }] },
    { cust: customers[6],  plan: planMonthlyPro,    startDate: '2025-08-01', expDate: '2026-01-31', products: [{ product: p1, tax: gst }, { product: p3, tax: gst }] },
    { cust: customers[9],  plan: planYearlyStarter, startDate: '2025-04-01', expDate: '2026-04-01', products: [{ product: p4, tax: vat }] },
    { cust: customers[14], plan: planMonthlyBasic,  startDate: '2025-10-01', expDate: '2026-03-01', products: [{ product: p5, tax: gst }] },
    { cust: customers[20], plan: planWeekly,        startDate: '2026-03-01', expDate: '2026-03-08', products: [{ product: p6 }] },
  ];
  for (const cfg of closedConfigs) await createSub({ ...cfg, status: 'closed' });

  console.log(`Created ${allSubs.length} subscriptions (18 active, 5 confirmed, 6 draft, 5 quotation, 5 paused, 6 closed)`);

  // ═══════════════════════════════════════════════════════════════════════════
  // 8. INVOICES — ~55 invoices across 12 months
  //    Spread: paid (30), confirmed (12), draft (5), cancelled (3), overdue (5)
  // ═══════════════════════════════════════════════════════════════════════════
  const allInvoices = [];

  const createInv = async ({ sub, cust, status, issuedAt, dueDate, lines, paidAmount }) => {
    let totalAmount = 0, taxAmount = 0, discountAmount = 0;
    const invoiceLines = lines.map(l => {
      const amt = l.qty * l.price;
      const taxAmt = l.taxRate ? amt * (l.taxRate / 100) : 0;
      const discAmt = l.discAmt || 0;
      totalAmount += amt;
      taxAmount += taxAmt;
      discountAmount += discAmt;
      return {
        productId: l.productId, description: l.desc, quantity: l.qty,
        unitPrice: l.price, amount: amt, taxId: l.taxId || null,
        taxAmount: Math.round(taxAmt * 100) / 100,
        discountAmount: Math.round(discAmt * 100) / 100,
      };
    });
    const netAmount = Math.round((totalAmount + taxAmount - discountAmount) * 100) / 100;
    const paid = paidAmount !== undefined ? paidAmount : (status === 'paid' ? netAmount : 0);
    const outstanding = Math.max(0, Math.round((netAmount - paid) * 100) / 100);

    const inv = await prisma.invoice.create({ data: {
      invoiceNo: invNo(),
      subscriptionId: sub.id,
      customerId: cust.id,
      status,
      issuedAt: issuedAt ? d(issuedAt) : (status !== 'draft' ? d(issuedAt || '2026-04-01') : undefined),
      dueDate: dueDate ? d(dueDate) : undefined,
      totalAmount: Math.round(totalAmount * 100) / 100,
      taxAmount: Math.round(taxAmount * 100) / 100,
      discountAmount: Math.round(discountAmount * 100) / 100,
      netAmount,
      paidAmount: paid,
      outstandingAmount: outstanding,
      invoiceLines: { create: invoiceLines },
    }});
    allInvoices.push(inv);
    return inv;
  };

  // We'll generate monthly paid invoices for the 12 months of revenue chart
  // Using the first 12 active subscriptions as the source
  const months = [
    { issuedAt: '2025-05-01', dueDate: '2025-05-31' },
    { issuedAt: '2025-06-01', dueDate: '2025-06-30' },
    { issuedAt: '2025-07-01', dueDate: '2025-07-31' },
    { issuedAt: '2025-08-01', dueDate: '2025-08-31' },
    { issuedAt: '2025-09-01', dueDate: '2025-09-30' },
    { issuedAt: '2025-10-01', dueDate: '2025-10-31' },
    { issuedAt: '2025-11-01', dueDate: '2025-11-30' },
    { issuedAt: '2025-12-01', dueDate: '2025-12-31' },
    { issuedAt: '2026-01-01', dueDate: '2026-01-31' },
    { issuedAt: '2026-02-01', dueDate: '2026-02-28' },
    { issuedAt: '2026-03-01', dueDate: '2026-03-31' },
    { issuedAt: '2026-04-01', dueDate: '2026-04-30' },
  ];

  // Generate 2-4 paid invoices per month to create a nice revenue trend
  const activeSubs = allSubs.filter((_, i) => i < 18); // first 18 are active
  for (let m = 0; m < months.length; m++) {
    const { issuedAt, dueDate } = months[m];
    // Number of invoices grows over time (showing business growth)
    const count = Math.min(2 + Math.floor(m / 3), activeSubs.length);
    for (let i = 0; i < count; i++) {
      const sub = activeSubs[i % activeSubs.length];
      const cust = customers[i % customers.length];
      const price = Number(plans[i % plans.length].price);
      const taxRate = [18, 5, 12, 0][i % 4];
      const taxId = [gst.id, svcTax.id, vat.id, null][i % 4];
      const prod = products[i % products.length];

      await createInv({
        sub, cust, status: 'paid', issuedAt, dueDate,
        lines: [{ productId: prod.id, desc: prod.name, qty: 1, price, taxRate, taxId }],
      });
    }
  }
  console.log(`Created ${allInvoices.length} paid invoices (12 months of revenue data)`);

  // 5 overdue confirmed invoices (dueDate in the past, not paid)
  const overdueInvs = [];
  for (let i = 0; i < 5; i++) {
    const sub = activeSubs[i];
    const cust = customers[i];
    const price = Number(plans[i % plans.length].price);
    const prod = products[i];
    const inv = await createInv({
      sub, cust, status: 'confirmed',
      issuedAt: `2026-02-${String(10 + i).padStart(2, '0')}`,
      dueDate: `2026-03-${String(10 + i).padStart(2, '0')}`,
      lines: [{ productId: prod.id, desc: prod.name, qty: 1, price, taxRate: 18, taxId: gst.id }],
    });
    overdueInvs.push(inv);
  }
  console.log('Created 5 overdue invoices');

  // 7 confirmed invoices (not yet due)
  for (let i = 0; i < 7; i++) {
    const sub = activeSubs[8 + i];
    const cust = customers[8 + i];
    const price = Number(plans[i % plans.length].price);
    const prod = products[i % products.length];
    await createInv({
      sub, cust, status: 'confirmed',
      issuedAt: '2026-04-01',
      dueDate: '2026-05-01',
      lines: [{ productId: prod.id, desc: prod.name, qty: 1, price, taxRate: 5, taxId: svcTax.id }],
    });
  }
  console.log('Created 7 confirmed invoices (not yet due)');

  // 5 draft invoices
  for (let i = 0; i < 5; i++) {
    const sub = activeSubs[13 + i];
    const cust = customers[13 + i];
    const price = Number(plans[i % plans.length].price);
    const prod = products[i % products.length];
    await createInv({
      sub, cust, status: 'draft',
      issuedAt: null, dueDate: null,
      lines: [{ productId: prod.id, desc: prod.name, qty: 1, price, taxRate: 18, taxId: gst.id }],
    });
  }
  console.log('Created 5 draft invoices');

  // 3 cancelled invoices
  for (let i = 0; i < 3; i++) {
    const closedSub = allSubs[39 + i]; // closed subs
    const cust = customers[i + 1];
    const prod = products[i];
    await createInv({
      sub: closedSub, cust, status: 'cancelled',
      issuedAt: '2025-12-01', dueDate: '2025-12-31',
      lines: [{ productId: prod.id, desc: `${prod.name} (cancelled)`, qty: 1, price: 49.99, taxRate: 0 }],
    });
  }
  console.log('Created 3 cancelled invoices');

  // 2 partially paid invoices
  for (let i = 0; i < 2; i++) {
    const sub = activeSubs[i];
    const cust = customers[i];
    const price = Number(planMonthlyPro.price);
    const prod = products[i];
    await createInv({
      sub, cust, status: 'confirmed',
      issuedAt: '2026-03-15', dueDate: '2026-04-14',
      lines: [{ productId: prod.id, desc: prod.name, qty: 1, price, taxRate: 18, taxId: gst.id }],
      paidAmount: Math.round(price * 0.5 * 100) / 100,
    });
  }
  console.log('Created 2 partially paid invoices');

  console.log(`Total invoices: ${allInvoices.length}`);

  // ═══════════════════════════════════════════════════════════════════════════
  // 9. PAYMENTS — for all paid invoices + partial + failed
  // ═══════════════════════════════════════════════════════════════════════════
  const paymentMethods = ['stripe', 'stripe', 'stripe', 'bank_transfer', 'cash', 'other'];
  let paymentCount = 0;

  for (const inv of allInvoices) {
    if (inv.status === 'paid' || Number(inv.paidAmount) > 0) {
      const method = paymentMethods[paymentCount % paymentMethods.length];
      const pDate = new Date(inv.issuedAt || inv.createdAt);
      pDate.setDate(pDate.getDate() + Math.floor(Math.random() * 14) + 1);

      await prisma.payment.create({ data: {
        invoiceId: inv.id,
        method,
        amount: Number(inv.paidAmount),
        status: 'completed',
        paymentDate: pDate,
        reference: method === 'stripe' ? `Stripe: pi_${Date.now().toString(36)}${paymentCount}` :
                   method === 'bank_transfer' ? `Wire REF-${pDate.toISOString().slice(0,10).replace(/-/g,'')}-${paymentCount}` :
                   `Payment #${paymentCount + 1}`,
        stripePaymentIntentId: method === 'stripe' ? `pi_${Date.now().toString(36)}${paymentCount}` : null,
      }});
      paymentCount++;
    }
  }

  // 5 failed payment attempts on overdue invoices
  for (let i = 0; i < overdueInvs.length; i++) {
    await prisma.payment.create({ data: {
      invoiceId: overdueInvs[i].id,
      method: 'stripe',
      amount: Number(overdueInvs[i].netAmount),
      status: 'failed',
      paymentDate: d(`2026-03-${String(15 + i).padStart(2, '0')}`),
      reference: `Stripe: pi_failed_${i}`,
      stripePaymentIntentId: `pi_failed_${i}`,
      notes: pick(['Card declined', 'Insufficient funds', 'Card expired', 'Authentication failed', 'Bank rejected']),
    }});
    paymentCount++;
  }

  // 2 refunded payments
  for (let i = 0; i < 2; i++) {
    const inv = allInvoices[i]; // first 2 paid invoices
    await prisma.payment.create({ data: {
      invoiceId: inv.id,
      method: 'stripe',
      amount: Math.round(Number(inv.paidAmount) * 0.1 * 100) / 100,
      status: 'refunded',
      paymentDate: d('2026-03-25'),
      reference: `Refund: pi_refund_${i}`,
      stripePaymentIntentId: `pi_refund_${i}`,
      notes: 'Partial refund - service credit',
    }});
    paymentCount++;
  }

  console.log(`Created ${paymentCount} payments`);

  // ═══════════════════════════════════════════════════════════════════════════
  // 10. DISCOUNT-SUBSCRIPTION LINKS
  // ═══════════════════════════════════════════════════════════════════════════
  await prisma.discountSubscription.createMany({ data: [
    { discountId: disc1.id, subscriptionId: allSubs[0].id },
    { discountId: disc1.id, subscriptionId: allSubs[2].id },
    { discountId: disc2.id, subscriptionId: allSubs[4].id },
    { discountId: disc3.id, subscriptionId: allSubs[1].id },
    { discountId: disc3.id, subscriptionId: allSubs[6].id },
    { discountId: disc5.id, subscriptionId: allSubs[8].id },
    { discountId: disc5.id, subscriptionId: allSubs[10].id },
  ]});
  console.log('Attached discounts to subscriptions');

  // ═══════════════════════════════════════════════════════════════════════════
  // SUMMARY
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('\n══════════════════════════════════════');
  console.log('        SEED COMPLETE');
  console.log('══════════════════════════════════════');
  console.log(`Users:         33 (1 admin + 2 internal + 30 portal)`);
  console.log(`Products:      8 (with variants)`);
  console.log(`Plans:         5`);
  console.log(`Taxes:         4`);
  console.log(`Discounts:     5`);
  console.log(`Templates:     3`);
  console.log(`Subscriptions: ${allSubs.length}`);
  console.log(`Invoices:      ${allInvoices.length}`);
  console.log(`Payments:      ${paymentCount}`);
  console.log('──────────────────────────────────────');
  console.log('Credentials:');
  console.log('  Admin:    admin@example.com / Admin@123');
  console.log('  Internal: sarah@example.com / Internal@123');
  console.log('  Internal: mike@example.com  / Internal@123');
  console.log('  Portal:   john.doe@example.com / Portal@123');
  console.log('  (+ 29 more portal users)');
  console.log('══════════════════════════════════════\n');
}

main()
  .catch((e) => { console.error('Seed error:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
