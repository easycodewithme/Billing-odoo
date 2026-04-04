const prisma = require('../utils/prisma');
const { success, error, paginated } = require('../utils/apiResponse');
const { getPagination } = require('../utils/pagination');
const { logAction } = require('../services/audit.service');

/**
 * GET /plans
 * Paginated list with optional filter by billingPeriod.
 */
const getAll = async (req, res) => {
  try {
    const { skip, take, page, limit } = getPagination(req.query);
    const { billingPeriod } = req.query;

    const where = {};

    if (billingPeriod) {
      where.billingPeriod = billingPeriod;
    }

    const [plans, total] = await Promise.all([
      prisma.recurringPlan.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.recurringPlan.count({ where }),
    ]);

    return paginated(res, plans, total, page, limit);
  } catch (err) {
    console.error('Get all plans error:', err);
    return error(res, 'Failed to fetch plans');
  }
};

/**
 * GET /plans/:id
 */
const getById = async (req, res) => {
  try {
    const { id } = req.params;

    const plan = await prisma.recurringPlan.findUnique({ where: { id } });

    if (!plan) {
      return error(res, 'Plan not found', 404);
    }

    return success(res, plan);
  } catch (err) {
    console.error('Get plan by ID error:', err);
    return error(res, 'Failed to fetch plan');
  }
};

/**
 * POST /plans
 * Create a new recurring plan.
 */
const create = async (req, res) => {
  try {
    // Convert date strings from frontend to proper Date objects
    if (req.body.startDate) req.body.startDate = new Date(req.body.startDate);
    if (req.body.endDate) req.body.endDate = new Date(req.body.endDate);

    if (req.body.startDate && req.body.endDate && req.body.endDate <= req.body.startDate) {
      return error(res, 'End date must be after start date', 400);
    }

    const plan = await prisma.recurringPlan.create({
      data: req.body,
    });

    await logAction('RecurringPlan', plan.id, 'create', null, plan, req.user.id);

    return success(res, plan, 'Plan created successfully', 201);
  } catch (err) {
    console.error('Create plan error:', err);
    return error(res, 'Failed to create plan');
  }
};

/**
 * PUT /plans/:id
 * Update a recurring plan.
 */
const update = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await prisma.recurringPlan.findUnique({ where: { id } });
    if (!existing) {
      return error(res, 'Plan not found', 404);
    }

    // Convert date strings from frontend to proper Date objects
    if (req.body.startDate) req.body.startDate = new Date(req.body.startDate);
    if (req.body.endDate) req.body.endDate = new Date(req.body.endDate);

    if (req.body.startDate && req.body.endDate && req.body.endDate <= req.body.startDate) {
      return error(res, 'End date must be after start date', 400);
    }

    const plan = await prisma.recurringPlan.update({
      where: { id },
      data: req.body,
    });

    await logAction('RecurringPlan', plan.id, 'update', existing, plan, req.user.id);

    return success(res, plan, 'Plan updated successfully');
  } catch (err) {
    console.error('Update plan error:', err);
    return error(res, 'Failed to update plan');
  }
};

/**
 * DELETE /plans/:id
 * Delete a plan only if no subscriptions are attached.
 */
const remove = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await prisma.recurringPlan.findUnique({ where: { id } });
    if (!existing) {
      return error(res, 'Plan not found', 404);
    }

    // Check for attached subscriptions
    const subscriptionCount = await prisma.subscription.count({
      where: { planId: id },
    });

    if (subscriptionCount > 0) {
      return error(res, 'Cannot delete plan with active subscriptions. Remove subscriptions first.', 400);
    }

    await prisma.recurringPlan.delete({ where: { id } });

    await logAction('RecurringPlan', id, 'delete', existing, null, req.user.id);

    return success(res, null, 'Plan deleted successfully');
  } catch (err) {
    console.error('Remove plan error:', err);
    return error(res, 'Failed to delete plan');
  }
};

module.exports = {
  getAll,
  getById,
  create,
  update,
  remove,
};
