const prisma = require('../utils/prisma');
const { success, error, paginated } = require('../utils/apiResponse');
const { getPagination } = require('../utils/pagination');
const { logAction } = require('../services/audit.service');
const subscriptionService = require('../services/subscription.service');

/**
 * GET /subscriptions
 * List subscriptions with pagination and filters.
 */
const getAll = async (req, res) => {
  try {
    const { skip, take, page, limit } = getPagination(req.query);
    const { status, customerId, startDate_gte, startDate_lte } = req.query;

    const where = {};

    // Portal users can only see their own subscriptions
    if (req.user.role === 'portal_user') {
      where.customerId = req.user.id;
    }

    if (status) {
      where.status = status;
    }

    if (customerId) {
      where.customerId = customerId;
    }

    if (startDate_gte || startDate_lte) {
      where.startDate = {};
      if (startDate_gte) {
        where.startDate.gte = new Date(startDate_gte);
      }
      if (startDate_lte) {
        where.startDate.lte = new Date(startDate_lte);
      }
    }

    const [subscriptions, total] = await Promise.all([
      prisma.subscription.findMany({
        where,
        skip,
        take,
        include: {
          customer: { select: { fullName: true, email: true } },
          plan: { select: { name: true, billingPeriod: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.subscription.count({ where }),
    ]);

    return paginated(res, subscriptions, total, page, limit);
  } catch (err) {
    console.error('Get all subscriptions error:', err);
    return error(res, 'Failed to fetch subscriptions');
  }
};

/**
 * GET /subscriptions/:id
 * Get a single subscription with full details.
 */
const getById = async (req, res) => {
  try {
    const { id } = req.params;

    const subscription = await prisma.subscription.findUnique({
      where: { id },
      include: {
        customer: true,
        plan: true,
        orderLines: {
          include: {
            product: true,
            variant: true,
            tax: true,
          },
        },
        invoices: true,
        statusLogs: {
          include: {
            changedBy: { select: { fullName: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!subscription) {
      return error(res, 'Subscription not found', 404);
    }

    if (req.user.role === 'portal_user' && subscription.customerId !== req.user.id) {
      return error(res, 'Not authorized', 403);
    }

    return success(res, subscription);
  } catch (err) {
    console.error('Get subscription by ID error:', err);
    return error(res, 'Failed to fetch subscription');
  }
};

/**
 * POST /subscriptions
 * Create a new subscription.
 */
const create = async (req, res) => {
  try {
    const subscription = await subscriptionService.createSubscription(req.body);

    await logAction(
      'Subscription',
      subscription.id,
      'create',
      null,
      subscription,
      req.user.id
    );

    return success(res, subscription, 'Subscription created successfully', 201);
  } catch (err) {
    console.error('Create subscription error:', err);
    const statusCode = err.message.includes('not found') ? 404
      : err.message.includes('date') || err.message.includes('required') ? 400
      : 500;
    return error(res, err.message || 'Failed to create subscription', statusCode);
  }
};

/**
 * PUT /subscriptions/:id
 * Update a subscription (only if draft or quotation).
 */
const update = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await prisma.subscription.findUnique({ where: { id } });

    if (!existing) {
      return error(res, 'Subscription not found', 404);
    }

    if (!['draft', 'quotation'].includes(existing.status)) {
      return error(res, 'Subscription can only be updated in draft or quotation status', 400);
    }

    // Convert date strings from frontend to proper Date objects
    if (req.body.startDate && typeof req.body.startDate === 'string') {
      req.body.startDate = new Date(req.body.startDate);
    }
    if (req.body.expirationDate && typeof req.body.expirationDate === 'string') {
      req.body.expirationDate = new Date(req.body.expirationDate);
    }

    if (req.body.startDate && req.body.expirationDate && req.body.expirationDate <= req.body.startDate) {
      return error(res, 'Expiration date must be after start date', 400);
    }

    const updated = await prisma.subscription.update({
      where: { id },
      data: req.body,
      include: {
        customer: { select: { fullName: true, email: true } },
        plan: { select: { name: true, billingPeriod: true } },
      },
    });

    await logAction(
      'Subscription',
      id,
      'update',
      existing,
      updated,
      req.user.id
    );

    return success(res, updated, 'Subscription updated successfully');
  } catch (err) {
    console.error('Update subscription error:', err);
    return error(res, err.message || 'Failed to update subscription');
  }
};

/**
 * PATCH /subscriptions/:id/status
 * Transition subscription status.
 */
const updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status: newStatus, reason } = req.body;

    const updated = await subscriptionService.transitionStatus(
      id,
      newStatus,
      req.user.id,
      reason
    );

    return success(res, updated, `Subscription status changed to '${newStatus}'`);
  } catch (err) {
    console.error('Update subscription status error:', err);
    const statusCode = err.message.includes('not found') ? 404 : 400;
    return error(res, err.message, statusCode);
  }
};

/**
 * POST /subscriptions/:id/apply-template
 * Apply a subscription template to create order lines.
 */
const applyTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const { templateId } = req.body;

    if (!templateId) {
      return error(res, 'Template ID is required', 400);
    }

    const updated = await subscriptionService.applyTemplate(id, templateId);

    await logAction(
      'Subscription',
      id,
      'update',
      null,
      { templateId },
      req.user.id
    );

    return success(res, updated, 'Template applied successfully');
  } catch (err) {
    console.error('Apply template error:', err);
    const statusCode = err.message.includes('not found') ? 404 : 400;
    return error(res, err.message, statusCode);
  }
};

/**
 * POST /subscriptions/:id/order-lines
 * Add an order line to a subscription.
 */
const addOrderLine = async (req, res) => {
  try {
    const { id } = req.params;
    const { productId, variantId, quantity, unitPrice, taxId, discountId } = req.body;

    const subscription = await prisma.subscription.findUnique({ where: { id } });
    if (!subscription) {
      return error(res, 'Subscription not found', 404);
    }

    const amount = quantity * unitPrice;

    const orderLine = await prisma.orderLine.create({
      data: {
        subscriptionId: id,
        productId,
        variantId: variantId || null,
        quantity,
        unitPrice,
        amount,
        taxId: taxId || null,
        discountId: discountId || null,
      },
      include: {
        product: true,
        variant: true,
        tax: true,
      },
    });

    await logAction(
      'OrderLine',
      orderLine.id,
      'create',
      null,
      orderLine,
      req.user.id
    );

    return success(res, orderLine, 'Order line added successfully', 201);
  } catch (err) {
    console.error('Add order line error:', err);
    return error(res, err.message || 'Failed to add order line');
  }
};

/**
 * PUT /subscriptions/:id/order-lines/:lineId
 * Update an order line on a subscription.
 */
const updateOrderLine = async (req, res) => {
  try {
    const { id, lineId } = req.params;
    const { productId, variantId, quantity, unitPrice, taxId, discountId } = req.body;

    const existing = await prisma.orderLine.findFirst({
      where: { id: lineId, subscriptionId: id },
    });

    if (!existing) {
      return error(res, 'Order line not found', 404);
    }

    const amount = quantity * unitPrice;

    const updated = await prisma.orderLine.update({
      where: { id: lineId },
      data: {
        productId,
        variantId: variantId || null,
        quantity,
        unitPrice,
        amount,
        taxId: taxId || null,
        discountId: discountId || null,
      },
      include: {
        product: true,
        variant: true,
        tax: true,
      },
    });

    await logAction(
      'OrderLine',
      lineId,
      'update',
      existing,
      updated,
      req.user.id
    );

    return success(res, updated, 'Order line updated successfully');
  } catch (err) {
    console.error('Update order line error:', err);
    return error(res, err.message || 'Failed to update order line');
  }
};

/**
 * DELETE /subscriptions/:id/order-lines/:lineId
 * Remove an order line from a subscription.
 */
const removeOrderLine = async (req, res) => {
  try {
    const { id, lineId } = req.params;

    const existing = await prisma.orderLine.findFirst({
      where: { id: lineId, subscriptionId: id },
    });

    if (!existing) {
      return error(res, 'Order line not found', 404);
    }

    await prisma.orderLine.delete({ where: { id: lineId } });

    await logAction(
      'OrderLine',
      lineId,
      'delete',
      existing,
      null,
      req.user.id
    );

    return success(res, null, 'Order line removed successfully');
  } catch (err) {
    console.error('Remove order line error:', err);
    return error(res, err.message || 'Failed to remove order line');
  }
};

const renew = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await subscriptionService.renewSubscription(id, req.user.id);
    return success(res, updated, 'Subscription renewed successfully');
  } catch (err) {
    console.error('Renew subscription error:', err);
    const statusCode = err.message.includes('not found') ? 404 : 400;
    return error(res, err.message, statusCode);
  }
};

module.exports = {
  getAll,
  getById,
  create,
  update,
  updateStatus,
  applyTemplate,
  addOrderLine,
  updateOrderLine,
  removeOrderLine,
  renew,
};
