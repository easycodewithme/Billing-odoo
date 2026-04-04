const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Clearing existing data...');
  // Delete in correct order to respect foreign keys
  await prisma.shopOrderItem.deleteMany();
  await prisma.shopOrder.deleteMany();
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

  // ═══════════════════════════════════════════
  // 1. USERS
  // ═══════════════════════════════════════════
  const adminPw = await bcrypt.hash('Admin@123', 10);
  const internalPw = await bcrypt.hash('Internal@123', 10);
  const portalPw = await bcrypt.hash('Portal@123', 10);

  const admin = await prisma.user.create({
    data: {
      fullName: 'System Admin',
      email: 'admin@example.com',
      password: adminPw,
      role: 'admin',
      phone: '+1-555-100-0001',
    },
  });

  const internal1 = await prisma.user.create({
    data: {
      fullName: 'Sarah Johnson',
      email: 'sarah@example.com',
      password: internalPw,
      role: 'internal_user',
      phone: '+1-555-100-0002',
    },
  });

  const internal2 = await prisma.user.create({
    data: {
      fullName: 'Mike Chen',
      email: 'mike@example.com',
      password: internalPw,
      role: 'internal_user',
      phone: '+1-555-100-0003',
    },
  });

  const customers = [];
  const customerData = [
    { fullName: 'John Doe', email: 'john@example.com', phone: '+1-555-200-0001' },
    { fullName: 'Jane Smith', email: 'jane@example.com', phone: '+1-555-200-0002' },
    { fullName: 'Robert Wilson', email: 'robert@example.com', phone: '+1-555-200-0003' },
    { fullName: 'Emily Davis', email: 'emily@example.com', phone: '+1-555-200-0004' },
    { fullName: 'David Brown', email: 'david@example.com', phone: '+1-555-200-0005' },
    { fullName: 'Lisa Anderson', email: 'lisa@example.com', phone: '+1-555-200-0006' },
    { fullName: 'James Taylor', email: 'james@example.com', phone: '+1-555-200-0007' },
    { fullName: 'Maria Garcia', email: 'maria@example.com', phone: '+1-555-200-0008' },
  ];

  for (const c of customerData) {
    const user = await prisma.user.create({
      data: { ...c, password: portalPw, role: 'portal_user' },
    });
    customers.push(user);
  }
  console.log(`Created ${3 + customers.length} users`);

  // ═══════════════════════════════════════════
  // 2. PRODUCTS + VARIANTS
  // ═══════════════════════════════════════════
  const product1 = await prisma.product.create({
    data: {
      name: 'CRM Pro',
      productType: 'SaaS',
      salesPrice: 99.99,
      costPrice: 30.00,
      description: 'Professional CRM with pipeline management, contact tracking, and analytics dashboard.',
      image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=600&h=400&fit=crop',
      variants: {
        create: [
          { attribute: 'Plan', value: 'Basic', extraPrice: 0 },
          { attribute: 'Plan', value: 'Professional', extraPrice: 50 },
          { attribute: 'Plan', value: 'Enterprise', extraPrice: 150 },
        ],
      },
    },
    include: { variants: true },
  });

  const product2 = await prisma.product.create({
    data: {
      name: 'Cloud Storage',
      productType: 'Infrastructure',
      salesPrice: 29.99,
      costPrice: 8.00,
      description: 'Secure cloud storage with automatic backups and file versioning.',
      image: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=600&h=400&fit=crop',
      variants: {
        create: [
          { attribute: 'Storage', value: '100GB', extraPrice: 0 },
          { attribute: 'Storage', value: '500GB', extraPrice: 20 },
          { attribute: 'Storage', value: '1TB', extraPrice: 50 },
          { attribute: 'Storage', value: '5TB', extraPrice: 120 },
        ],
      },
    },
    include: { variants: true },
  });

  const product3 = await prisma.product.create({
    data: {
      name: 'Email Marketing Suite',
      productType: 'SaaS',
      salesPrice: 49.99,
      costPrice: 12.00,
      description: 'Complete email marketing platform with automation, templates, and A/B testing.',
      image: 'https://images.unsplash.com/photo-1563986768609-322da13575f2?w=600&h=400&fit=crop',
      variants: {
        create: [
          { attribute: 'Tier', value: 'Starter', extraPrice: 0 },
          { attribute: 'Tier', value: 'Growth', extraPrice: 30 },
          { attribute: 'Tier', value: 'Scale', extraPrice: 80 },
        ],
      },
    },
    include: { variants: true },
  });

  const product4 = await prisma.product.create({
    data: {
      name: 'Analytics Dashboard',
      productType: 'SaaS',
      salesPrice: 79.99,
      costPrice: 20.00,
      description: 'Real-time analytics with custom reports, data visualization, and team sharing.',
      image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&h=400&fit=crop',
      variants: {
        create: [
          { attribute: 'Seats', value: '5 Users', extraPrice: 0 },
          { attribute: 'Seats', value: '25 Users', extraPrice: 40 },
          { attribute: 'Seats', value: 'Unlimited', extraPrice: 100 },
        ],
      },
    },
    include: { variants: true },
  });

  const product5 = await prisma.product.create({
    data: {
      name: 'Help Desk Pro',
      productType: 'SaaS',
      salesPrice: 59.99,
      costPrice: 18.00,
      description: 'Customer support ticketing system with live chat, knowledge base, and SLA tracking.',
      image: 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=600&h=400&fit=crop',
      variants: {
        create: [
          { attribute: 'Agents', value: '3 Agents', extraPrice: 0 },
          { attribute: 'Agents', value: '10 Agents', extraPrice: 35 },
          { attribute: 'Agents', value: 'Unlimited', extraPrice: 90 },
        ],
      },
    },
    include: { variants: true },
  });

  const product6 = await prisma.product.create({
    data: {
      name: 'Project Manager',
      productType: 'SaaS',
      salesPrice: 39.99,
      costPrice: 10.00,
      description: 'Project management tool with Kanban boards, Gantt charts, and time tracking.',
      image: 'https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=600&h=400&fit=crop',
    },
  });

  const products = [product1, product2, product3, product4, product5, product6];
  console.log(`Created ${products.length} products with variants`);

  // ═══════════════════════════════════════════
  // 3. TAXES
  // ═══════════════════════════════════════════
  const gst = await prisma.tax.create({
    data: { name: 'GST', rate: 18, type: 'GST', description: 'Goods and Services Tax at 18%' },
  });

  const serviceTax = await prisma.tax.create({
    data: { name: 'Service Tax', rate: 5, type: 'Service', description: 'Service Tax at 5%' },
  });

  const vat = await prisma.tax.create({
    data: { name: 'VAT', rate: 12, type: 'VAT', description: 'Value Added Tax at 12%' },
  });

  const zeroTax = await prisma.tax.create({
    data: { name: 'Tax Exempt', rate: 0, type: 'Exempt', description: 'No tax applicable' },
  });
  console.log('Created 4 tax rules');

  // ═══════════════════════════════════════════
  // 4. RECURRING PLANS
  // ═══════════════════════════════════════════
  const monthlyBasic = await prisma.recurringPlan.create({
    data: {
      name: 'Monthly Basic',
      price: 49.99,
      billingPeriod: 'monthly',
      minQuantity: 1,
      closable: true,
      pausable: true,
      renewable: true,
      autoClose: false,
    },
  });

  const monthlyPro = await prisma.recurringPlan.create({
    data: {
      name: 'Monthly Professional',
      price: 149.99,
      billingPeriod: 'monthly',
      minQuantity: 1,
      closable: true,
      pausable: true,
      renewable: true,
      autoClose: false,
    },
  });

  const yearlyStarter = await prisma.recurringPlan.create({
    data: {
      name: 'Yearly Starter',
      price: 499.99,
      billingPeriod: 'yearly',
      minQuantity: 1,
      closable: true,
      pausable: false,
      renewable: true,
      autoClose: false,
    },
  });

  const yearlyEnterprise = await prisma.recurringPlan.create({
    data: {
      name: 'Yearly Enterprise',
      price: 1499.99,
      billingPeriod: 'yearly',
      minQuantity: 1,
      closable: true,
      pausable: false,
      renewable: true,
      autoClose: false,
    },
  });

  const weeklyTrial = await prisma.recurringPlan.create({
    data: {
      name: 'Weekly Trial',
      price: 9.99,
      billingPeriod: 'weekly',
      minQuantity: 1,
      closable: true,
      pausable: false,
      renewable: false,
      autoClose: true,
    },
  });
  console.log('Created 5 recurring plans');

  // ═══════════════════════════════════════════
  // 5. DISCOUNTS
  // ═══════════════════════════════════════════
  const discount1 = await prisma.discount.create({
    data: {
      name: 'Launch Offer 10%',
      type: 'percentage',
      value: 10,
      minPurchase: 50,
      minQuantity: 1,
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-12-31'),
      limitUsage: 200,
      currentUsage: 12,
    },
  });

  const discount2 = await prisma.discount.create({
    data: {
      name: 'Flat $25 Off',
      type: 'fixed',
      value: 25,
      minPurchase: 100,
      minQuantity: 1,
      startDate: new Date('2026-03-01'),
      endDate: new Date('2026-09-30'),
      limitUsage: 50,
      currentUsage: 3,
    },
  });

  const discount3 = await prisma.discount.create({
    data: {
      name: 'Enterprise 20%',
      type: 'percentage',
      value: 20,
      minPurchase: 500,
      minQuantity: 2,
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-06-30'),
      limitUsage: 30,
      currentUsage: 8,
    },
  });

  const discount4 = await prisma.discount.create({
    data: {
      name: 'Summer Sale 15%',
      type: 'percentage',
      value: 15,
      minPurchase: 75,
      minQuantity: 1,
      startDate: new Date('2026-06-01'),
      endDate: new Date('2026-08-31'),
      limitUsage: 100,
      currentUsage: 0,
    },
  });

  // Attach discounts to products
  await prisma.discountProduct.createMany({
    data: [
      { discountId: discount1.id, productId: product1.id },
      { discountId: discount1.id, productId: product3.id },
      { discountId: discount2.id, productId: product2.id },
      { discountId: discount3.id, productId: product4.id },
      { discountId: discount3.id, productId: product5.id },
    ],
  });
  console.log('Created 4 discounts with product associations');

  // ═══════════════════════════════════════════
  // 6. QUOTATION TEMPLATES
  // ═══════════════════════════════════════════
  await prisma.quotationTemplate.create({
    data: {
      name: 'Starter Bundle',
      validityDays: 30,
      recurringPlanId: monthlyBasic.id,
      templateLines: {
        create: [
          { productId: product1.id, quantity: 1, unitPrice: 99.99 },
          { productId: product2.id, quantity: 1, unitPrice: 29.99 },
        ],
      },
    },
  });

  await prisma.quotationTemplate.create({
    data: {
      name: 'Professional Suite',
      validityDays: 45,
      recurringPlanId: monthlyPro.id,
      templateLines: {
        create: [
          { productId: product1.id, quantity: 1, unitPrice: 149.99 },
          { productId: product3.id, quantity: 1, unitPrice: 79.99 },
          { productId: product4.id, quantity: 1, unitPrice: 79.99 },
          { productId: product5.id, quantity: 1, unitPrice: 59.99 },
        ],
      },
    },
  });

  await prisma.quotationTemplate.create({
    data: {
      name: 'Enterprise All-In-One',
      validityDays: 60,
      recurringPlanId: yearlyEnterprise.id,
      templateLines: {
        create: [
          { productId: product1.id, quantity: 1, unitPrice: 249.99 },
          { productId: product2.id, quantity: 1, unitPrice: 79.99 },
          { productId: product3.id, quantity: 1, unitPrice: 129.99 },
          { productId: product4.id, quantity: 1, unitPrice: 179.99 },
          { productId: product5.id, quantity: 1, unitPrice: 149.99 },
          { productId: product6.id, quantity: 1, unitPrice: 39.99 },
        ],
      },
    },
  });
  console.log('Created 3 quotation templates');

  // ═══════════════════════════════════════════
  // 7. SUBSCRIPTIONS (various statuses)
  // ═══════════════════════════════════════════
  let subCounter = 1;
  const genSubNo = () => `SUB-2026${String(subCounter++).padStart(5, '0')}`;

  // Active subscriptions
  const sub1 = await prisma.subscription.create({
    data: {
      subscriptionNo: genSubNo(),
      customerId: customers[0].id,
      planId: monthlyPro.id,
      startDate: new Date('2026-01-15'),
      expirationDate: new Date('2027-01-15'),
      paymentTerms: 'Net 30',
      status: 'active',
      orderLines: {
        create: [
          { productId: product1.id, quantity: 1, unitPrice: 149.99, amount: 149.99, taxId: gst.id },
          { productId: product4.id, quantity: 1, unitPrice: 79.99, amount: 79.99, taxId: gst.id },
        ],
      },
    },
  });

  const sub2 = await prisma.subscription.create({
    data: {
      subscriptionNo: genSubNo(),
      customerId: customers[1].id,
      planId: yearlyEnterprise.id,
      startDate: new Date('2026-02-01'),
      expirationDate: new Date('2027-02-01'),
      paymentTerms: 'Net 30',
      status: 'active',
      orderLines: {
        create: [
          { productId: product1.id, quantity: 1, unitPrice: 249.99, amount: 249.99, taxId: gst.id },
          { productId: product2.id, quantity: 1, unitPrice: 79.99, amount: 79.99, taxId: serviceTax.id },
          { productId: product3.id, quantity: 1, unitPrice: 129.99, amount: 129.99, taxId: gst.id },
          { productId: product5.id, quantity: 1, unitPrice: 149.99, amount: 149.99, taxId: gst.id },
        ],
      },
    },
  });

  const sub3 = await prisma.subscription.create({
    data: {
      subscriptionNo: genSubNo(),
      customerId: customers[2].id,
      planId: monthlyBasic.id,
      startDate: new Date('2026-03-01'),
      expirationDate: new Date('2027-03-01'),
      paymentTerms: 'Net 15',
      status: 'active',
      orderLines: {
        create: [
          { productId: product2.id, quantity: 2, unitPrice: 29.99, amount: 59.98, taxId: serviceTax.id },
          { productId: product6.id, quantity: 1, unitPrice: 39.99, amount: 39.99 },
        ],
      },
    },
  });

  const sub4 = await prisma.subscription.create({
    data: {
      subscriptionNo: genSubNo(),
      customerId: customers[3].id,
      planId: yearlyStarter.id,
      startDate: new Date('2026-01-01'),
      expirationDate: new Date('2027-01-01'),
      paymentTerms: 'Net 30',
      status: 'active',
      orderLines: {
        create: [
          { productId: product3.id, quantity: 1, unitPrice: 49.99, amount: 49.99, taxId: vat.id },
        ],
      },
    },
  });

  // Confirmed subscription
  const sub5 = await prisma.subscription.create({
    data: {
      subscriptionNo: genSubNo(),
      customerId: customers[4].id,
      planId: monthlyPro.id,
      startDate: new Date('2026-04-01'),
      expirationDate: new Date('2027-04-01'),
      paymentTerms: 'Net 30',
      status: 'confirmed',
      orderLines: {
        create: [
          { productId: product1.id, quantity: 1, unitPrice: 99.99, amount: 99.99, taxId: gst.id },
          { productId: product5.id, quantity: 1, unitPrice: 59.99, amount: 59.99, taxId: gst.id },
        ],
      },
    },
  });

  // Draft subscriptions
  const sub6 = await prisma.subscription.create({
    data: {
      subscriptionNo: genSubNo(),
      customerId: customers[5].id,
      planId: weeklyTrial.id,
      startDate: new Date('2026-04-10'),
      paymentTerms: 'Due on Receipt',
      status: 'draft',
      orderLines: {
        create: [
          { productId: product1.id, quantity: 1, unitPrice: 99.99, amount: 99.99 },
        ],
      },
    },
  });

  const sub7 = await prisma.subscription.create({
    data: {
      subscriptionNo: genSubNo(),
      customerId: customers[6].id,
      planId: monthlyBasic.id,
      startDate: new Date('2026-04-15'),
      paymentTerms: 'Net 30',
      status: 'draft',
      orderLines: {
        create: [
          { productId: product4.id, quantity: 1, unitPrice: 79.99, amount: 79.99, taxId: gst.id },
          { productId: product6.id, quantity: 2, unitPrice: 39.99, amount: 79.98, taxId: serviceTax.id },
        ],
      },
    },
  });

  // Quotation status
  await prisma.subscription.create({
    data: {
      subscriptionNo: genSubNo(),
      customerId: customers[7].id,
      planId: yearlyEnterprise.id,
      startDate: new Date('2026-05-01'),
      expirationDate: new Date('2027-05-01'),
      paymentTerms: 'Net 60',
      status: 'quotation',
      orderLines: {
        create: [
          { productId: product1.id, quantity: 1, unitPrice: 249.99, amount: 249.99, taxId: gst.id },
          { productId: product2.id, quantity: 1, unitPrice: 79.99, amount: 79.99, taxId: gst.id },
          { productId: product4.id, quantity: 1, unitPrice: 179.99, amount: 179.99, taxId: gst.id },
        ],
      },
    },
  });

  // Paused subscription
  await prisma.subscription.create({
    data: {
      subscriptionNo: genSubNo(),
      customerId: customers[0].id,
      planId: monthlyBasic.id,
      startDate: new Date('2025-10-01'),
      expirationDate: new Date('2026-10-01'),
      paymentTerms: 'Net 30',
      status: 'paused',
      orderLines: {
        create: [
          { productId: product3.id, quantity: 1, unitPrice: 49.99, amount: 49.99, taxId: serviceTax.id },
        ],
      },
    },
  });

  // Closed subscription
  await prisma.subscription.create({
    data: {
      subscriptionNo: genSubNo(),
      customerId: customers[1].id,
      planId: weeklyTrial.id,
      startDate: new Date('2025-12-01'),
      expirationDate: new Date('2026-01-01'),
      paymentTerms: 'Due on Receipt',
      status: 'closed',
      orderLines: {
        create: [
          { productId: product6.id, quantity: 1, unitPrice: 39.99, amount: 39.99 },
        ],
      },
    },
  });

  console.log('Created 10 subscriptions (4 active, 1 confirmed, 2 draft, 1 quotation, 1 paused, 1 closed)');

  // ═══════════════════════════════════════════
  // 8. STATUS LOGS for active subscriptions
  // ═══════════════════════════════════════════
  for (const sub of [sub1, sub2, sub3, sub4]) {
    await prisma.subscriptionStatusLog.createMany({
      data: [
        { subscriptionId: sub.id, fromStatus: 'draft', toStatus: 'quotation', changedById: admin.id, reason: 'Sent to customer', createdAt: new Date('2026-01-10') },
        { subscriptionId: sub.id, fromStatus: 'quotation', toStatus: 'confirmed', changedById: admin.id, reason: 'Customer accepted', createdAt: new Date('2026-01-12') },
        { subscriptionId: sub.id, fromStatus: 'confirmed', toStatus: 'active', changedById: admin.id, reason: 'Payment received', createdAt: new Date('2026-01-15') },
      ],
    });
  }
  console.log('Created status logs');

  // ═══════════════════════════════════════════
  // 9. INVOICES (various statuses)
  // ═══════════════════════════════════════════
  let invCounter = 1;
  const genInvNo = () => `INV-2026${String(invCounter++).padStart(5, '0')}`;

  // Paid invoice for sub1
  const inv1 = await prisma.invoice.create({
    data: {
      invoiceNo: genInvNo(),
      subscriptionId: sub1.id,
      customerId: customers[0].id,
      status: 'paid',
      issuedAt: new Date('2026-01-15'),
      dueDate: new Date('2026-02-14'),
      totalAmount: 229.98,
      taxAmount: 41.40,
      discountAmount: 0,
      netAmount: 271.38,
      paidAmount: 271.38,
      outstandingAmount: 0,
      invoiceLines: {
        create: [
          { productId: product1.id, description: 'CRM Pro', quantity: 1, unitPrice: 149.99, amount: 149.99, taxId: gst.id, taxAmount: 27.00, discountAmount: 0 },
          { productId: product4.id, description: 'Analytics Dashboard', quantity: 1, unitPrice: 79.99, amount: 79.99, taxId: gst.id, taxAmount: 14.40, discountAmount: 0 },
        ],
      },
    },
  });

  // Paid invoice for sub2
  const inv2 = await prisma.invoice.create({
    data: {
      invoiceNo: genInvNo(),
      subscriptionId: sub2.id,
      customerId: customers[1].id,
      status: 'paid',
      issuedAt: new Date('2026-02-01'),
      dueDate: new Date('2026-03-03'),
      totalAmount: 609.96,
      taxAmount: 103.49,
      discountAmount: 0,
      netAmount: 713.45,
      paidAmount: 713.45,
      outstandingAmount: 0,
      invoiceLines: {
        create: [
          { productId: product1.id, description: 'CRM Pro Enterprise', quantity: 1, unitPrice: 249.99, amount: 249.99, taxId: gst.id, taxAmount: 45.00, discountAmount: 0 },
          { productId: product2.id, description: 'Cloud Storage 1TB', quantity: 1, unitPrice: 79.99, amount: 79.99, taxId: serviceTax.id, taxAmount: 4.00, discountAmount: 0 },
          { productId: product3.id, description: 'Email Marketing Growth', quantity: 1, unitPrice: 129.99, amount: 129.99, taxId: gst.id, taxAmount: 23.40, discountAmount: 0 },
          { productId: product5.id, description: 'Help Desk Unlimited', quantity: 1, unitPrice: 149.99, amount: 149.99, taxId: gst.id, taxAmount: 27.00, discountAmount: 0 },
        ],
      },
    },
  });

  // Confirmed invoice (overdue) for sub3
  const inv3 = await prisma.invoice.create({
    data: {
      invoiceNo: genInvNo(),
      subscriptionId: sub3.id,
      customerId: customers[2].id,
      status: 'confirmed',
      issuedAt: new Date('2026-03-01'),
      dueDate: new Date('2026-03-16'),
      totalAmount: 99.97,
      taxAmount: 3.00,
      discountAmount: 0,
      netAmount: 102.97,
      paidAmount: 0,
      outstandingAmount: 102.97,
      invoiceLines: {
        create: [
          { productId: product2.id, description: 'Cloud Storage 100GB x2', quantity: 2, unitPrice: 29.99, amount: 59.98, taxId: serviceTax.id, taxAmount: 3.00, discountAmount: 0 },
          { productId: product6.id, description: 'Project Manager', quantity: 1, unitPrice: 39.99, amount: 39.99, taxAmount: 0, discountAmount: 0 },
        ],
      },
    },
  });

  // Confirmed invoice (not yet due) for sub4
  const inv4 = await prisma.invoice.create({
    data: {
      invoiceNo: genInvNo(),
      subscriptionId: sub4.id,
      customerId: customers[3].id,
      status: 'confirmed',
      issuedAt: new Date('2026-04-01'),
      dueDate: new Date('2026-05-01'),
      totalAmount: 49.99,
      taxAmount: 6.00,
      discountAmount: 0,
      netAmount: 55.99,
      paidAmount: 0,
      outstandingAmount: 55.99,
      invoiceLines: {
        create: [
          { productId: product3.id, description: 'Email Marketing Starter', quantity: 1, unitPrice: 49.99, amount: 49.99, taxId: vat.id, taxAmount: 6.00, discountAmount: 0 },
        ],
      },
    },
  });

  // Partially paid invoice for sub1 (month 2)
  const inv5 = await prisma.invoice.create({
    data: {
      invoiceNo: genInvNo(),
      subscriptionId: sub1.id,
      customerId: customers[0].id,
      status: 'confirmed',
      issuedAt: new Date('2026-02-15'),
      dueDate: new Date('2026-03-17'),
      totalAmount: 229.98,
      taxAmount: 41.40,
      discountAmount: 0,
      netAmount: 271.38,
      paidAmount: 150.00,
      outstandingAmount: 121.38,
      invoiceLines: {
        create: [
          { productId: product1.id, description: 'CRM Pro', quantity: 1, unitPrice: 149.99, amount: 149.99, taxId: gst.id, taxAmount: 27.00, discountAmount: 0 },
          { productId: product4.id, description: 'Analytics Dashboard', quantity: 1, unitPrice: 79.99, amount: 79.99, taxId: gst.id, taxAmount: 14.40, discountAmount: 0 },
        ],
      },
    },
  });

  // Draft invoice
  await prisma.invoice.create({
    data: {
      invoiceNo: genInvNo(),
      subscriptionId: sub5.id,
      customerId: customers[4].id,
      status: 'draft',
      totalAmount: 159.98,
      taxAmount: 28.80,
      discountAmount: 0,
      netAmount: 188.78,
      paidAmount: 0,
      outstandingAmount: 188.78,
      invoiceLines: {
        create: [
          { productId: product1.id, description: 'CRM Pro', quantity: 1, unitPrice: 99.99, amount: 99.99, taxId: gst.id, taxAmount: 18.00, discountAmount: 0 },
          { productId: product5.id, description: 'Help Desk 3 Agents', quantity: 1, unitPrice: 59.99, amount: 59.99, taxId: gst.id, taxAmount: 10.80, discountAmount: 0 },
        ],
      },
    },
  });

  // Cancelled invoice
  await prisma.invoice.create({
    data: {
      invoiceNo: genInvNo(),
      subscriptionId: sub2.id,
      customerId: customers[1].id,
      status: 'cancelled',
      issuedAt: new Date('2026-03-01'),
      totalAmount: 609.96,
      taxAmount: 103.49,
      discountAmount: 0,
      netAmount: 713.45,
      paidAmount: 0,
      outstandingAmount: 0,
      notes: 'Cancelled - duplicate invoice',
    },
  });

  console.log('Created 7 invoices (2 paid, 2 confirmed, 1 partially paid, 1 draft, 1 cancelled)');

  // ═══════════════════════════════════════════
  // 10. PAYMENTS
  // ═══════════════════════════════════════════
  await prisma.payment.create({
    data: {
      invoiceId: inv1.id,
      method: 'stripe',
      amount: 271.38,
      status: 'completed',
      paymentDate: new Date('2026-01-20'),
      reference: 'Stripe: pi_3abc123',
      stripePaymentIntentId: 'pi_3abc123',
    },
  });

  await prisma.payment.create({
    data: {
      invoiceId: inv2.id,
      method: 'bank_transfer',
      amount: 713.45,
      status: 'completed',
      paymentDate: new Date('2026-02-10'),
      reference: 'Wire transfer REF-20260210-001',
    },
  });

  await prisma.payment.create({
    data: {
      invoiceId: inv5.id,
      method: 'cash',
      amount: 150.00,
      status: 'completed',
      paymentDate: new Date('2026-03-01'),
      reference: 'Partial payment - cash',
    },
  });

  // A failed payment attempt
  await prisma.payment.create({
    data: {
      invoiceId: inv3.id,
      method: 'stripe',
      amount: 102.97,
      status: 'failed',
      paymentDate: new Date('2026-03-20'),
      reference: 'Stripe: pi_failed456',
      stripePaymentIntentId: 'pi_failed456',
      notes: 'Card declined',
    },
  });
  console.log('Created 4 payments (3 completed, 1 failed)');

  // ═══════════════════════════════════════════
  // 11. ATTACH DISCOUNTS TO SUBSCRIPTIONS
  // ═══════════════════════════════════════════
  await prisma.discountSubscription.createMany({
    data: [
      { discountId: discount1.id, subscriptionId: sub1.id },
      { discountId: discount3.id, subscriptionId: sub2.id },
      { discountId: discount2.id, subscriptionId: sub3.id },
    ],
  });
  console.log('Attached discounts to subscriptions');

  console.log('\n=== SEED COMPLETE ===');
  console.log('Login credentials:');
  console.log('  Admin:    admin@example.com / Admin@123');
  console.log('  Internal: sarah@example.com / Internal@123');
  console.log('  Internal: mike@example.com  / Internal@123');
  console.log('  Customer: john@example.com  / Portal@123');
  console.log('  (+ 7 more portal users)');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
