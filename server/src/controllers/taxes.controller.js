const prisma = require('../utils/prisma');
const { success, error, paginated } = require('../utils/apiResponse');
const { getPagination } = require('../utils/pagination');

/**
 * GET /taxes
 * Paginated list of taxes.
 */
const getAll = async (req, res) => {
  try {
    const { skip, take, page, limit } = getPagination(req.query);

    const [taxes, total] = await Promise.all([
      prisma.tax.findMany({
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.tax.count(),
    ]);

    return paginated(res, taxes, total, page, limit);
  } catch (err) {
    console.error('Get all taxes error:', err);
    return error(res, 'Failed to fetch taxes');
  }
};

/**
 * GET /taxes/:id
 */
const getById = async (req, res) => {
  try {
    const { id } = req.params;

    const tax = await prisma.tax.findUnique({ where: { id } });

    if (!tax) {
      return error(res, 'Tax not found', 404);
    }

    return success(res, tax);
  } catch (err) {
    console.error('Get tax by ID error:', err);
    return error(res, 'Failed to fetch tax');
  }
};

/**
 * POST /taxes
 * Create a new tax.
 */
const create = async (req, res) => {
  try {
    const tax = await prisma.tax.create({
      data: req.body,
    });

    return success(res, tax, 'Tax created successfully', 201);
  } catch (err) {
    console.error('Create tax error:', err);
    return error(res, 'Failed to create tax');
  }
};

/**
 * PUT /taxes/:id
 * Update a tax.
 */
const update = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await prisma.tax.findUnique({ where: { id } });
    if (!existing) {
      return error(res, 'Tax not found', 404);
    }

    const tax = await prisma.tax.update({
      where: { id },
      data: req.body,
    });

    return success(res, tax, 'Tax updated successfully');
  } catch (err) {
    console.error('Update tax error:', err);
    return error(res, 'Failed to update tax');
  }
};

/**
 * DELETE /taxes/:id
 * Delete a tax.
 */
const remove = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await prisma.tax.findUnique({ where: { id } });
    if (!existing) {
      return error(res, 'Tax not found', 404);
    }

    await prisma.tax.delete({ where: { id } });

    return success(res, null, 'Tax deleted successfully');
  } catch (err) {
    console.error('Remove tax error:', err);
    return error(res, 'Failed to delete tax');
  }
};

module.exports = {
  getAll,
  getById,
  create,
  update,
  remove,
};
