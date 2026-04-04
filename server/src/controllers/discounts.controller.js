const prisma = require('../utils/prisma');
const { success, error, paginated } = require('../utils/apiResponse');
const { getPagination } = require('../utils/pagination');
const { logAction } = require('../services/audit.service');

/**
 * GET /discounts
 * Paginated list with optional date range filter.
 */
const getAll = async (req, res) => {
  try {
    const { skip, take, page, limit } = getPagination(req.query);
    const { startDate, endDate } = req.query;

    const where = {};

    if (startDate) {
      where.startDate = { ...(where.startDate || {}), gte: new Date(startDate) };
    }

    if (endDate) {
      where.endDate = { ...(where.endDate || {}), lte: new Date(endDate) };
    }

    const [discounts, total] = await Promise.all([
      prisma.discount.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.discount.count({ where }),
    ]);

    return paginated(res, discounts, total, page, limit);
  } catch (err) {
    console.error('Get all discounts error:', err);
    return error(res, 'Failed to fetch discounts');
  }
};

/**
 * GET /discounts/:id
 * Single discount with related products and subscriptions.
 */
const getById = async (req, res) => {
  try {
    const { id } = req.params;

    const discount = await prisma.discount.findUnique({
      where: { id },
      include: {
        discountProducts: { include: { product: true } },
        discountSubscriptions: { include: { subscription: true } },
      },
    });

    if (!discount) {
      return error(res, 'Discount not found', 404);
    }

    return success(res, discount);
  } catch (err) {
    console.error('Get discount by ID error:', err);
    return error(res, 'Failed to fetch discount');
  }
};

/**
 * POST /discounts
 * Create a new discount. Validates percentage <= 100.
 */
const create = async (req, res) => {
  try {
    const { type, value } = req.body;

    if (type === 'percentage' && value > 100) {
      return error(res, 'Percentage discount value cannot exceed 100', 400);
    }

    const discount = await prisma.discount.create({
      data: req.body,
    });

    await logAction('Discount', discount.id, 'create', null, discount, req.user.id);

    return success(res, discount, 'Discount created successfully', 201);
  } catch (err) {
    console.error('Create discount error:', err);
    return error(res, 'Failed to create discount');
  }
};

/**
 * PUT /discounts/:id
 * Update a discount. Validates percentage <= 100.
 */
const update = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await prisma.discount.findUnique({ where: { id } });
    if (!existing) {
      return error(res, 'Discount not found', 404);
    }

    // Determine the effective type and value after update
    const effectiveType = req.body.type || existing.type;
    const effectiveValue = req.body.value !== undefined ? req.body.value : existing.value;

    if (effectiveType === 'percentage' && effectiveValue > 100) {
      return error(res, 'Percentage discount value cannot exceed 100', 400);
    }

    const discount = await prisma.discount.update({
      where: { id },
      data: req.body,
    });

    await logAction('Discount', discount.id, 'update', existing, discount, req.user.id);

    return success(res, discount, 'Discount updated successfully');
  } catch (err) {
    console.error('Update discount error:', err);
    return error(res, 'Failed to update discount');
  }
};

/**
 * DELETE /discounts/:id
 * Delete a discount.
 */
const remove = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await prisma.discount.findUnique({ where: { id } });
    if (!existing) {
      return error(res, 'Discount not found', 404);
    }

    await prisma.discount.delete({ where: { id } });

    await logAction('Discount', id, 'delete', existing, null, req.user.id);

    return success(res, null, 'Discount deleted successfully');
  } catch (err) {
    console.error('Remove discount error:', err);
    return error(res, 'Failed to delete discount');
  }
};

/**
 * POST /discounts/:id/products
 * Attach a product to a discount.
 */
const attachProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { productId } = req.body;

    if (!productId) {
      return error(res, 'productId is required', 400);
    }

    const discount = await prisma.discount.findUnique({ where: { id } });
    if (!discount) {
      return error(res, 'Discount not found', 404);
    }

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      return error(res, 'Product not found', 404);
    }

    // Check for existing link
    const existing = await prisma.discountProduct.findFirst({
      where: { discountId: id, productId },
    });

    if (existing) {
      return error(res, 'Product is already attached to this discount', 409);
    }

    const discountProduct = await prisma.discountProduct.create({
      data: { discountId: id, productId },
    });

    return success(res, discountProduct, 'Product attached to discount', 201);
  } catch (err) {
    console.error('Attach product to discount error:', err);
    return error(res, 'Failed to attach product');
  }
};

/**
 * DELETE /discounts/:id/products/:productId
 * Detach a product from a discount.
 */
const detachProduct = async (req, res) => {
  try {
    const { id, productId } = req.params;

    const link = await prisma.discountProduct.findFirst({
      where: { discountId: id, productId },
    });

    if (!link) {
      return error(res, 'Product is not attached to this discount', 404);
    }

    await prisma.discountProduct.delete({
      where: { discountId_productId: { discountId: id, productId } },
    });

    return success(res, null, 'Product detached from discount');
  } catch (err) {
    console.error('Detach product from discount error:', err);
    return error(res, 'Failed to detach product');
  }
};

/**
 * POST /discounts/:id/subscriptions
 * Attach a subscription to a discount.
 */
const attachSubscription = async (req, res) => {
  try {
    const { id } = req.params;
    const { subscriptionId } = req.body;

    if (!subscriptionId) {
      return error(res, 'subscriptionId is required', 400);
    }

    const discount = await prisma.discount.findUnique({ where: { id } });
    if (!discount) {
      return error(res, 'Discount not found', 404);
    }

    const subscription = await prisma.subscription.findUnique({ where: { id: subscriptionId } });
    if (!subscription) {
      return error(res, 'Subscription not found', 404);
    }

    // Check for existing link
    const existing = await prisma.discountSubscription.findFirst({
      where: { discountId: id, subscriptionId },
    });

    if (existing) {
      return error(res, 'Subscription is already attached to this discount', 409);
    }

    const discountSubscription = await prisma.discountSubscription.create({
      data: { discountId: id, subscriptionId },
    });

    return success(res, discountSubscription, 'Subscription attached to discount', 201);
  } catch (err) {
    console.error('Attach subscription to discount error:', err);
    return error(res, 'Failed to attach subscription');
  }
};

/**
 * DELETE /discounts/:id/subscriptions/:subscriptionId
 * Detach a subscription from a discount.
 */
const detachSubscription = async (req, res) => {
  try {
    const { id, subscriptionId } = req.params;

    const link = await prisma.discountSubscription.findFirst({
      where: { discountId: id, subscriptionId },
    });

    if (!link) {
      return error(res, 'Subscription is not attached to this discount', 404);
    }

    await prisma.discountSubscription.delete({
      where: { discountId_subscriptionId: { discountId: id, subscriptionId } },
    });

    return success(res, null, 'Subscription detached from discount');
  } catch (err) {
    console.error('Detach subscription from discount error:', err);
    return error(res, 'Failed to detach subscription');
  }
};

module.exports = {
  getAll,
  getById,
  create,
  update,
  remove,
  attachProduct,
  detachProduct,
  attachSubscription,
  detachSubscription,
};
