const prisma = require('../utils/prisma');
const { logAction } = require('./audit.service');

/**
 * Generate a unique subscription number.
 * Format: SUB-<timestamp><random 4 digits>
 */
const generateSubscriptionNo = () => {
  const timestamp = Date.now();
  const random = Math.floor(1000 + Math.random() * 9000);
  return `SUB-${timestamp}${random}`;
};

/**
 * Allowed status transitions map.
 * Key = current status, Value = array of allowed next statuses.
 */
const ALLOWED_TRANSITIONS = {
  draft: ['quotation'],
  quotation: ['confirmed'],
  confirmed: ['active'],
  active: ['paused', 'closed'],
  paused: ['active', 'closed'],
};

/**
 * Create a new subscription with auto-generated subscriptionNo.
 * @param {object} data - Subscription data
 * @returns {Promise<object>} Created subscription
 */
const createSubscription = async (data) => {
  const subscriptionNo = generateSubscriptionNo();

  // Convert date strings from frontend to proper Date objects
  if (data.startDate && typeof data.startDate === 'string') {
    data.startDate = new Date(data.startDate);
  }
  if (data.expirationDate && typeof data.expirationDate === 'string') {
    data.expirationDate = new Date(data.expirationDate);
  }

  if (data.startDate && data.expirationDate && data.expirationDate <= data.startDate) {
    throw new Error('Expiration date must be after start date');
  }

  const subscription = await prisma.subscription.create({
    data: {
      ...data,
      subscriptionNo,
      status: 'draft',
    },
    include: {
      customer: { select: { fullName: true, email: true } },
      plan: { select: { name: true, billingPeriod: true } },
    },
  });

  return subscription;
};

/**
 * Transition the status of a subscription with validation.
 * @param {string} subscriptionId - Subscription ID
 * @param {string} newStatus - Target status
 * @param {string} userId - ID of the user performing the action
 * @param {string} reason - Reason for the transition
 * @returns {Promise<object>} Updated subscription
 */
const transitionStatus = async (subscriptionId, newStatus, userId, reason) => {
  const subscription = await prisma.subscription.findUnique({
    where: { id: subscriptionId },
    include: { plan: true },
  });

  if (!subscription) {
    throw new Error('Subscription not found');
  }

  const currentStatus = subscription.status;
  const allowed = ALLOWED_TRANSITIONS[currentStatus];

  if (!allowed || !allowed.includes(newStatus)) {
    throw new Error(`Cannot transition from '${currentStatus}' to '${newStatus}'`);
  }

  // Check plan-level restrictions for active subscriptions
  if (currentStatus === 'active' && newStatus === 'paused' && !subscription.plan.pausable) {
    throw new Error('This subscription plan does not allow pausing');
  }

  if (currentStatus === 'active' && newStatus === 'closed' && !subscription.plan.closable) {
    throw new Error('This subscription plan does not allow early closure');
  }

  const updated = await prisma.$transaction(async (tx) => {
    const updatedSubscription = await tx.subscription.update({
      where: { id: subscriptionId },
      data: { status: newStatus },
      include: {
        customer: { select: { fullName: true, email: true } },
        plan: { select: { name: true, billingPeriod: true } },
      },
    });

    await tx.subscriptionStatusLog.create({
      data: {
        subscriptionId,
        fromStatus: currentStatus,
        toStatus: newStatus,
        reason: reason || null,
        changedById: userId,
      },
    });

    return updatedSubscription;
  });

  await logAction(
    'subscriptions',
    subscriptionId,
    'update',
    { status: currentStatus },
    { status: newStatus, reason },
    userId
  );

  return updated;
};

/**
 * Apply a subscription template to a subscription, creating order lines.
 * @param {string} subscriptionId - Subscription ID
 * @param {string} templateId - Template ID
 * @returns {Promise<object>} Updated subscription with order lines
 */
const applyTemplate = async (subscriptionId, templateId) => {
  const template = await prisma.quotationTemplate.findUnique({
    where: { id: templateId },
    include: {
      templateLines: {
        include: {
          product: true,
        },
      },
    },
  });

  if (!template) {
    throw new Error('Template not found');
  }

  const subscription = await prisma.subscription.findUnique({
    where: { id: subscriptionId },
  });

  if (!subscription) {
    throw new Error('Subscription not found');
  }

  // Create order lines from template lines
  const orderLineData = template.templateLines.map((line) => ({
    subscriptionId,
    productId: line.productId,
    quantity: line.quantity,
    unitPrice: line.unitPrice,
    amount: line.quantity * line.unitPrice,
  }));

  await prisma.orderLine.createMany({
    data: orderLineData,
  });

  const updatedSubscription = await prisma.subscription.findUnique({
    where: { id: subscriptionId },
    include: {
      customer: { select: { fullName: true, email: true } },
      plan: { select: { name: true, billingPeriod: true } },
      orderLines: {
        include: {
          product: true,
          variant: true,
          tax: true,
        },
      },
    },
  });

  return updatedSubscription;
};

/**
 * Renew a closed or expired subscription.
 */
const renewSubscription = async (subscriptionId, userId) => {
  const subscription = await prisma.subscription.findUnique({
    where: { id: subscriptionId },
    include: { plan: true },
  });

  if (!subscription) throw new Error('Subscription not found');
  if (subscription.status !== 'closed') throw new Error('Only closed subscriptions can be renewed');
  if (!subscription.plan.renewable) throw new Error('This plan does not support renewal');

  const newStart = new Date();
  const newExpiration = new Date();
  const periodDays = { daily: 1, weekly: 7, monthly: 30, yearly: 365 };
  newExpiration.setDate(newExpiration.getDate() + (periodDays[subscription.plan.billingPeriod] || 30));

  const updated = await prisma.$transaction(async (tx) => {
    const renewed = await tx.subscription.update({
      where: { id: subscriptionId },
      data: {
        status: 'active',
        startDate: newStart,
        expirationDate: newExpiration,
      },
    });

    await tx.subscriptionStatusLog.create({
      data: {
        subscriptionId,
        fromStatus: 'closed',
        toStatus: 'active',
        changedById: userId,
        reason: 'Subscription renewed',
      },
    });

    return renewed;
  });

  return updated;
};

module.exports = {
  createSubscription,
  transitionStatus,
  applyTemplate,
  renewSubscription,
};
