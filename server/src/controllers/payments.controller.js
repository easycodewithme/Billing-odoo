const prisma = require('../utils/prisma');
const { success, error, paginated } = require('../utils/apiResponse');
const { getPagination } = require('../utils/pagination');
const paymentService = require('../services/payment.service');

/**
 * GET /payments
 * List payments with pagination and filters.
 */
const getAll = async (req, res) => {
  try {
    const { skip, take, page, limit } = getPagination(req.query);
    const { method, startDate, endDate } = req.query;

    const where = {};

    if (method) {
      where.method = method;
    }

    if (startDate || endDate) {
      where.paymentDate = {};
      if (startDate) {
        where.paymentDate.gte = new Date(startDate);
      }
      if (endDate) {
        where.paymentDate.lte = new Date(endDate);
      }
    }

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        skip,
        take,
        include: {
          invoice: {
            select: {
              invoiceNo: true,
              status: true,
              customer: { select: { fullName: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.payment.count({ where }),
    ]);

    return paginated(res, payments, total, page, limit);
  } catch (err) {
    console.error('Get all payments error:', err);
    return error(res, 'Failed to fetch payments');
  }
};

/**
 * GET /payments/:id
 * Get a single payment with details.
 */
const getById = async (req, res) => {
  try {
    const { id } = req.params;

    const payment = await prisma.payment.findUnique({
      where: { id },
      include: {
        invoice: {
          include: {
            customer: true,
          },
        },
      },
    });

    if (!payment) {
      return error(res, 'Payment not found', 404);
    }

    return success(res, payment);
  } catch (err) {
    console.error('Get payment by ID error:', err);
    return error(res, 'Failed to fetch payment');
  }
};

/**
 * POST /payments/manual
 * Record a manual payment.
 */
const recordManual = async (req, res) => {
  try {
    const { invoiceId, method, amount, reference, notes } = req.body;

    const payment = await paymentService.recordManualPayment(
      invoiceId,
      { method, amount, reference, notes },
      req.user.id
    );

    return success(res, payment, 'Payment recorded successfully', 201);
  } catch (err) {
    console.error('Record manual payment error:', err);
    const statusCode = err.message.includes('not found') ? 404 : 400;
    return error(res, err.message, statusCode);
  }
};

/**
 * POST /payments/checkout/:invoiceId
 * Create a Stripe checkout session (placeholder).
 */
const createCheckout = async (req, res) => {
  try {
    return success(res, {
      invoiceId: req.params.invoiceId,
      message: 'Stripe integration coming soon',
    });
  } catch (err) {
    console.error('Create checkout error:', err);
    return error(res, 'Failed to create checkout session');
  }
};

module.exports = {
  getAll,
  getById,
  recordManual,
  createCheckout,
};
