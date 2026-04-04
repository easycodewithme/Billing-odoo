const prisma = require('../utils/prisma');
const { success, error, paginated } = require('../utils/apiResponse');
const { getPagination } = require('../utils/pagination');
const { logAction } = require('../services/audit.service');

/**
 * GET /products
 * Paginated list with optional search by name and filter by isActive.
 */
const getAll = async (req, res) => {
  try {
    const { skip, take, page, limit } = getPagination(req.query);
    const { search, isActive } = req.query;

    const where = {};

    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }

    // By default, only show active products unless explicitly requested
    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    } else if (!req.query.showInactive) {
      where.isActive = true;
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.product.count({ where }),
    ]);

    return paginated(res, products, total, page, limit);
  } catch (err) {
    console.error('Get all products error:', err);
    return error(res, 'Failed to fetch products');
  }
};

/**
 * GET /products/:id
 * Single product with variants.
 */
const getById = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await prisma.product.findUnique({
      where: { id },
      include: { variants: true },
    });

    if (!product) {
      return error(res, 'Product not found', 404);
    }

    return success(res, product);
  } catch (err) {
    console.error('Get product by ID error:', err);
    return error(res, 'Failed to fetch product');
  }
};

/**
 * POST /products
 * Create a new product.
 */
const create = async (req, res) => {
  try {
    const { name, productType, salesPrice, costPrice, description } = req.body;

    const product = await prisma.product.create({
      data: {
        name,
        productType: productType || null,
        salesPrice,
        costPrice: costPrice || null,
        description: description || null,
      },
    });

    await logAction('Product', product.id, 'create', null, product, req.user.id);

    return success(res, product, 'Product created successfully', 201);
  } catch (err) {
    console.error('Create product error:', err);
    return error(res, 'Failed to create product');
  }
};

/**
 * PUT /products/:id
 * Update a product.
 */
const update = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      return error(res, 'Product not found', 404);
    }

    const allowedFields = ['name', 'productType', 'salesPrice', 'costPrice', 'description', 'image'];
    const updateData = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    }

    const product = await prisma.product.update({
      where: { id },
      data: updateData,
    });

    await logAction('Product', product.id, 'update', existing, product, req.user.id);

    return success(res, product, 'Product updated successfully');
  } catch (err) {
    console.error('Update product error:', err);
    return error(res, 'Failed to update product');
  }
};

/**
 * DELETE /products/:id
 * Soft delete (set isActive = false). Admin only.
 */
const remove = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      return error(res, 'Product not found', 404);
    }

    const product = await prisma.product.update({
      where: { id },
      data: { isActive: false },
    });

    await logAction('Product', product.id, 'delete', existing, product, req.user.id);

    return success(res, null, 'Product deactivated successfully');
  } catch (err) {
    console.error('Remove product error:', err);
    return error(res, 'Failed to deactivate product');
  }
};

/**
 * POST /products/:id/variants
 * Add a variant to a product.
 */
const addVariant = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) {
      return error(res, 'Product not found', 404);
    }

    const { attribute, value, extraPrice } = req.body;

    const variant = await prisma.productVariant.create({
      data: {
        productId: id,
        attribute,
        value,
        extraPrice: extraPrice || 0,
      },
    });

    return success(res, variant, 'Variant added successfully', 201);
  } catch (err) {
    console.error('Add variant error:', err);
    return error(res, 'Failed to add variant');
  }
};

/**
 * PUT /products/:id/variants/:variantId
 * Update a variant on a product.
 */
const updateVariant = async (req, res) => {
  try {
    const { id, variantId } = req.params;

    const variant = await prisma.productVariant.findFirst({
      where: { id: variantId, productId: id },
    });

    if (!variant) {
      return error(res, 'Variant not found', 404);
    }

    const updated = await prisma.productVariant.update({
      where: { id: variantId },
      data: req.body,
    });

    return success(res, updated, 'Variant updated successfully');
  } catch (err) {
    console.error('Update variant error:', err);
    return error(res, 'Failed to update variant');
  }
};

/**
 * DELETE /products/:id/variants/:variantId
 * Remove a variant from a product.
 */
const removeVariant = async (req, res) => {
  try {
    const { id, variantId } = req.params;

    const variant = await prisma.productVariant.findFirst({
      where: { id: variantId, productId: id },
    });

    if (!variant) {
      return error(res, 'Variant not found', 404);
    }

    await prisma.productVariant.delete({ where: { id: variantId } });

    return success(res, null, 'Variant removed successfully');
  } catch (err) {
    console.error('Remove variant error:', err);
    return error(res, 'Failed to remove variant');
  }
};

module.exports = {
  getAll,
  getById,
  create,
  update,
  remove,
  addVariant,
  updateVariant,
  removeVariant,
};
