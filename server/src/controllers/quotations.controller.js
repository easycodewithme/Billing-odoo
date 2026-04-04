const prisma = require('../utils/prisma');
const { success, error, paginated } = require('../utils/apiResponse');
const { getPagination } = require('../utils/pagination');

/**
 * GET /quotation-templates
 * Paginated list of quotation templates with recurringPlan relation.
 */
const getAll = async (req, res) => {
  try {
    const { skip, take, page, limit } = getPagination(req.query);

    const [templates, total] = await Promise.all([
      prisma.quotationTemplate.findMany({
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: { recurringPlan: true },
      }),
      prisma.quotationTemplate.count(),
    ]);

    return paginated(res, templates, total, page, limit);
  } catch (err) {
    console.error('Get all quotation templates error:', err);
    return error(res, 'Failed to fetch quotation templates');
  }
};

/**
 * GET /quotation-templates/:id
 * Single template with lines and product relations.
 */
const getById = async (req, res) => {
  try {
    const { id } = req.params;

    const template = await prisma.quotationTemplate.findUnique({
      where: { id },
      include: {
        recurringPlan: true,
        templateLines: {
          include: { product: true },
        },
      },
    });

    if (!template) {
      return error(res, 'Quotation template not found', 404);
    }

    return success(res, template);
  } catch (err) {
    console.error('Get quotation template by ID error:', err);
    return error(res, 'Failed to fetch quotation template');
  }
};

/**
 * POST /quotation-templates
 * Create a template with nested templateLines.
 */
const create = async (req, res) => {
  try {
    const { name, recurringPlanId, templateLines, lines, ...rest } = req.body;
    const lineData = templateLines || lines || [];

    const template = await prisma.quotationTemplate.create({
      data: {
        name,
        recurringPlanId: recurringPlanId || null,
        validityDays: rest.validityDays || 30,
        templateLines: lineData.length > 0
          ? {
              create: lineData.map((line) => ({
                productId: line.productId,
                quantity: line.quantity || 1,
                unitPrice: line.unitPrice,
              })),
            }
          : undefined,
      },
      include: {
        recurringPlan: true,
        templateLines: {
          include: { product: true },
        },
      },
    });

    return success(res, template, 'Quotation template created successfully', 201);
  } catch (err) {
    console.error('Create quotation template error:', err);
    return error(res, 'Failed to create quotation template');
  }
};

/**
 * PUT /quotation-templates/:id
 * Update template - delete old lines, create new lines in a transaction.
 */
const update = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await prisma.quotationTemplate.findUnique({ where: { id } });
    if (!existing) {
      return error(res, 'Quotation template not found', 404);
    }

    const { templateLines, lines, ...templateData } = req.body;
    const lineData = templateLines || lines;

    // Only pass valid fields to update
    const updateData = {};
    if (templateData.name) updateData.name = templateData.name;
    if (templateData.validityDays) updateData.validityDays = Number(templateData.validityDays);
    if (templateData.recurringPlanId !== undefined) updateData.recurringPlanId = templateData.recurringPlanId || null;

    const template = await prisma.$transaction(async (tx) => {
      // Update template fields
      await tx.quotationTemplate.update({
        where: { id },
        data: updateData,
      });

      // If lines provided, replace all lines
      if (lineData) {
        // Delete existing lines
        await tx.quotationTemplateLine.deleteMany({
          where: { templateId: id },
        });

        // Create new lines
        if (lineData.length > 0) {
          await tx.quotationTemplateLine.createMany({
            data: lineData.map((line) => ({
              templateId: id,
              productId: line.productId,
              quantity: line.quantity || 1,
              unitPrice: line.unitPrice,
            })),
          });
        }
      }

      // Return the updated template with relations
      return tx.quotationTemplate.findUnique({
        where: { id },
        include: {
          recurringPlan: true,
          templateLines: {
            include: { product: true },
          },
        },
      });
    });

    return success(res, template, 'Quotation template updated successfully');
  } catch (err) {
    console.error('Update quotation template error:', err);
    return error(res, 'Failed to update quotation template');
  }
};

/**
 * DELETE /quotation-templates/:id
 * Delete template (cascade deletes lines).
 */
const remove = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await prisma.quotationTemplate.findUnique({ where: { id } });
    if (!existing) {
      return error(res, 'Quotation template not found', 404);
    }

    await prisma.quotationTemplate.delete({ where: { id } });

    return success(res, null, 'Quotation template deleted successfully');
  } catch (err) {
    console.error('Remove quotation template error:', err);
    return error(res, 'Failed to delete quotation template');
  }
};

module.exports = {
  getAll,
  getById,
  create,
  update,
  remove,
};
