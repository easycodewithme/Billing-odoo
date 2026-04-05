const prisma = require('../utils/prisma');
const { generateInvoice } = require('./invoice.service');

const PERIOD_DAYS = {
  daily: 1,
  weekly: 7,
  monthly: 30,
  yearly: 365,
};

/**
 * Auto-close expired subscriptions where plan.autoClose is true
 * and expirationDate has passed.
 */
const processAutoClose = async () => {
  const now = new Date();

  const expiredSubs = await prisma.subscription.findMany({
    where: {
      status: 'active',
      expirationDate: { lte: now },
      plan: { autoClose: true },
    },
    include: { plan: true },
  });

  let closed = 0;

  for (const sub of expiredSubs) {
    try {
      await prisma.$transaction([
        prisma.subscription.update({
          where: { id: sub.id },
          data: { status: 'closed' },
        }),
        prisma.subscriptionStatusLog.create({
          data: {
            subscriptionId: sub.id,
            fromStatus: 'active',
            toStatus: 'closed',
            reason: 'Auto-closed: subscription expired',
          },
        }),
      ]);
      closed++;
      console.log(`[Billing] Auto-closed expired subscription ${sub.subscriptionNo}`);
    } catch (err) {
      console.error(`[Billing] Failed to auto-close ${sub.subscriptionNo}:`, err.message);
    }
  }

  if (closed > 0) {
    console.log(`[Billing] Auto-closed ${closed} expired subscription(s).`);
  }
};

/**
 * Auto-renew recently closed subscriptions where plan.renewable is true.
 * Creates a new draft subscription cloned from the closed one.
 */
const processAutoRenew = async () => {
  const oneDayAgo = new Date();
  oneDayAgo.setDate(oneDayAgo.getDate() - 1);

  const closedRenewable = await prisma.subscription.findMany({
    where: {
      status: 'closed',
      updatedAt: { gte: oneDayAgo },
      plan: { renewable: true },
      // Only renew if no child subscription already exists
      children: { none: {} },
    },
    include: {
      plan: true,
      orderLines: true,
    },
  });

  let renewed = 0;

  for (const sub of closedRenewable) {
    try {
      const periodDays = PERIOD_DAYS[sub.plan.billingPeriod] || 30;
      const newStart = new Date();
      const newExpiration = new Date();
      newExpiration.setDate(newExpiration.getDate() + periodDays);

      const newSub = await prisma.subscription.create({
        data: {
          subscriptionNo: `SUB-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
          customerId: sub.customerId,
          planId: sub.planId,
          startDate: newStart,
          expirationDate: newExpiration,
          paymentTerms: sub.paymentTerms,
          status: 'draft',
          parentId: sub.id,
          orderLines: {
            create: sub.orderLines.map((line) => ({
              productId: line.productId,
              variantId: line.variantId,
              quantity: line.quantity,
              unitPrice: line.unitPrice,
              taxId: line.taxId,
              discountId: line.discountId,
            })),
          },
        },
      });

      renewed++;
      console.log(`[Billing] Auto-renewed ${sub.subscriptionNo} -> ${newSub.subscriptionNo}`);
    } catch (err) {
      console.error(`[Billing] Failed to auto-renew ${sub.subscriptionNo}:`, err.message);
    }
  }

  if (renewed > 0) {
    console.log(`[Billing] Auto-renewed ${renewed} subscription(s).`);
  }
};

/**
 * Check all active subscriptions and generate invoices
 * for those whose billing cycle is due.
 */
const processRecurringBilling = async () => {
  console.log(`[Billing] Running recurring billing check at ${new Date().toISOString()}`);

  const now = new Date();

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
    // Skip if plan has expired
    if (sub.plan.endDate && new Date(sub.plan.endDate) < now) {
      console.log(`[Billing] Skipping ${sub.subscriptionNo}: plan expired`);
      continue;
    }

    const periodDays = PERIOD_DAYS[sub.plan.billingPeriod] || 30;
    const lastInvoice = sub.invoices[0];
    const lastInvoiceDate = lastInvoice ? new Date(lastInvoice.createdAt) : new Date(sub.startDate);
    const nextDueDate = new Date(lastInvoiceDate);
    nextDueDate.setDate(nextDueDate.getDate() + periodDays);

    if (now >= nextDueDate) {
      // Dedup check: ensure no invoice was created today for this subscription
      const startOfDay = new Date(now);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(now);
      endOfDay.setHours(23, 59, 59, 999);

      const existingToday = await prisma.invoice.count({
        where: {
          subscriptionId: sub.id,
          createdAt: { gte: startOfDay, lte: endOfDay },
        },
      });

      if (existingToday > 0) {
        console.log(`[Billing] Skipping ${sub.subscriptionNo}: invoice already generated today`);
        continue;
      }

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

/**
 * Run the full billing cycle:
 * 1. Auto-close expired subscriptions
 * 2. Generate recurring invoices
 * 3. Auto-renew closed subscriptions
 */
const runBillingCycle = async () => {
  console.log(`[Billing] === Starting billing cycle at ${new Date().toISOString()} ===`);
  await processAutoClose();
  await processRecurringBilling();
  await processAutoRenew();
  console.log(`[Billing] === Billing cycle complete ===`);
};

module.exports = { processRecurringBilling, processAutoClose, processAutoRenew, runBillingCycle };
