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
    variantId: line.variantId || null,
    quantity: line.quantity,
    unitPrice: line.unitPrice,
    amount: line.quantity * line.unitPrice,
    taxId: line.taxId || null,
    discountId: line.discountId || null,
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

module.exports = {
  createSubscription,
  transitionStatus,
  applyTemplate,
};
