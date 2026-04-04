const prisma = require('../utils/prisma');
const { generateInvoice } = require('./invoice.service');

const PERIOD_DAYS = {
  daily: 1,
  weekly: 7,
  monthly: 30,
  yearly: 365,
};

/**
 * Check all active subscriptions and generate invoices
 * for those whose billing cycle is due.
 */
const processRecurringBilling = async () => {
  console.log(`[Billing] Running recurring billing check at ${new Date().toISOString()}`);

  const activeSubscriptions = await prisma.subscription.findMany({
    where: { status: 'active' },
    include: {
      plan: true,
      invoices: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: { createdAt: true },
      },
    },
  });

  let generated = 0;

  for (const sub of activeSubscriptions) {
    const periodDays = PERIOD_DAYS[sub.plan.billingPeriod] || 30;
    const lastInvoice = sub.invoices[0];
    const lastInvoiceDate = lastInvoice ? new Date(lastInvoice.createdAt) : new Date(sub.startDate);
    const nextDueDate = new Date(lastInvoiceDate);
    nextDueDate.setDate(nextDueDate.getDate() + periodDays);

    if (new Date() >= nextDueDate) {
      try {
        await generateInvoice(sub.id);
        generated++;
        console.log(`[Billing] Generated invoice for subscription ${sub.subscriptionNo}`);
      } catch (err) {
        console.error(`[Billing] Failed for ${sub.subscriptionNo}:`, err.message);
      }
    }
  }

  console.log(`[Billing] Complete. Generated ${generated} invoice(s).`);
};

module.exports = { processRecurringBilling };
