const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create Admin user
  const adminPassword = await bcrypt.hash('Admin@123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      fullName: 'System Admin',
      email: 'admin@example.com',
      password: adminPassword,
      role: 'admin',
      phone: '+1234567890',
    },
  });
  console.log('Admin user created:', admin.email);

  // Create Internal User
  const internalPassword = await bcrypt.hash('Internal@123', 10);
  const internalUser = await prisma.user.upsert({
    where: { email: 'internal@example.com' },
    update: {},
    create: {
      fullName: 'Internal User',
      email: 'internal@example.com',
      password: internalPassword,
      role: 'internal_user',
      phone: '+1234567891',
    },
  });
  console.log('Internal user created:', internalUser.email);

  // Create Portal Users (customers)
  const portalPassword = await bcrypt.hash('Portal@123', 10);
  const customer1 = await prisma.user.upsert({
    where: { email: 'customer1@example.com' },
    update: {},
    create: {
      fullName: 'John Doe',
      email: 'customer1@example.com',
      password: portalPassword,
      role: 'portal_user',
      phone: '+1234567892',
    },
  });

  const customer2 = await prisma.user.upsert({
    where: { email: 'customer2@example.com' },
    update: {},
    create: {
      fullName: 'Jane Smith',
      email: 'customer2@example.com',
      password: portalPassword,
      role: 'portal_user',
      phone: '+1234567893',
    },
  });
  console.log('Portal users created');

  // Create Products
  const product1 = await prisma.product.create({
    data: {
      name: 'CRM Pro',
      productType: 'service',
      salesPrice: 99.99,
      costPrice: 30.00,
      description: 'Professional CRM solution with advanced features',
      variants: {
        create: [
          { attribute: 'Plan', value: 'Basic', extraPrice: 0 },
          { attribute: 'Plan', value: 'Enterprise', extraPrice: 50 },
        ],
      },
    },
  });

  const product2 = await prisma.product.create({
    data: {
      name: 'Cloud Storage',
      productType: 'service',
      salesPrice: 29.99,
      costPrice: 10.00,
      description: '100GB cloud storage with backup',
      variants: {
        create: [
          { attribute: 'Storage', value: '100GB', extraPrice: 0 },
          { attribute: 'Storage', value: '500GB', extraPrice: 20 },
          { attribute: 'Storage', value: '1TB', extraPrice: 50 },
        ],
      },
    },
  });

  const product3 = await prisma.product.create({
    data: {
      name: 'Email Marketing Suite',
      productType: 'service',
      salesPrice: 49.99,
      costPrice: 15.00,
      description: 'Complete email marketing and automation platform',
      variants: {
        create: [
          { attribute: 'Tier', value: 'Starter', extraPrice: 0 },
          { attribute: 'Tier', value: 'Growth', extraPrice: 30 },
        ],
      },
    },
  });
  console.log('Products created with variants');

  // Create Recurring Plans
  const monthlyPlan = await prisma.recurringPlan.create({
    data: {
      name: 'Monthly Plan',
      price: 99.99,
      billingPeriod: 'monthly',
      minQuantity: 1,
      closable: true,
      pausable: true,
      renewable: true,
      autoClose: false,
    },
  });

  const yearlyPlan = await prisma.recurringPlan.create({
    data: {
      name: 'Yearly Plan',
      price: 999.99,
      billingPeriod: 'yearly',
      minQuantity: 1,
      closable: true,
      pausable: false,
      renewable: true,
      autoClose: false,
    },
  });
  console.log('Recurring plans created');

  // Create Tax Rules
  const gst = await prisma.tax.create({
    data: {
      name: 'GST',
      rate: 18,
      type: 'GST',
      description: 'Goods and Services Tax at 18%',
    },
  });

  const serviceTax = await prisma.tax.create({
    data: {
      name: 'Service Tax',
      rate: 5,
      type: 'Service Tax',
      description: 'Service Tax at 5%',
    },
  });
  console.log('Tax rules created');

  // Create Quotation Template
  await prisma.quotationTemplate.create({
    data: {
      name: 'Starter Bundle',
      validityDays: 30,
      recurringPlanId: monthlyPlan.id,
      templateLines: {
        create: [
          { productId: product1.id, quantity: 1, unitPrice: 99.99 },
          { productId: product2.id, quantity: 1, unitPrice: 29.99 },
        ],
      },
    },
  });
  console.log('Quotation template created');

  // Create a sample discount
  await prisma.discount.create({
    data: {
      name: 'Launch Offer 10%',
      type: 'percentage',
      value: 10,
      minPurchase: 50,
      minQuantity: 1,
      startDate: new Date(),
      endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
      limitUsage: 100,
      currentUsage: 0,
    },
  });
  console.log('Discount created');

  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
