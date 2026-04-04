const prisma = require('../utils/prisma');
const { success, error, paginated } = require('../utils/apiResponse');
const { getPagination } = require('../utils/pagination');
const invoiceService = require('../services/invoice.service');
const { generateInvoicePDF } = require('../services/pdf.service');
const { sendInvoiceEmail } = require('../services/email.service');

/**
 * GET /invoices
 * List invoices with pagination and filters.
 */
const getAll = async (req, res) => {
  try {
    const { skip, take, page, limit } = getPagination(req.query);
    const { status, customerId, startDate, endDate, overdue } = req.query;

    const where = {};

    if (req.user.role === 'portal_user') {
      where.customerId = req.user.id;
    }

    if (status) {
      where.status = status;
    }

    if (customerId) {
      where.customerId = customerId;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate);
      }
    }

    // Overdue filter: dueDate < now AND status != paid AND status != cancelled
    if (overdue === 'true') {
      where.dueDate = { lt: new Date() };
      where.status = { notIn: ['paid', 'cancelled'] };
    }

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        skip,
        take,
        include: {
          customer: { select: { fullName: true, email: true } },
          subscription: { select: { subscriptionNo: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.invoice.count({ where }),
    ]);

    return paginated(res, invoices, total, page, limit);
  } catch (err) {
    console.error('Get all invoices error:', err);
    return error(res, 'Failed to fetch invoices');
  }
};

/**
 * GET /invoices/:id
 * Get a single invoice with full details.
 */
const getById = async (req, res) => {
  try {
    const { id } = req.params;

    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        invoiceLines: {
          include: {
            product: true,
            variant: true,
            tax: true,
          },
        },
        payments: true,
        customer: true,
        subscription: true,
      },
    });

    if (!invoice) {
      return error(res, 'Invoice not found', 404);
    }

    if (req.user.role === 'portal_user' && invoice.customerId !== req.user.id) {
      return error(res, 'Not authorized', 403);
    }

    return success(res, invoice);
  } catch (err) {
    console.error('Get invoice by ID error:', err);
    return error(res, 'Failed to fetch invoice');
  }
};

/**
 * POST /invoices/generate/:subscriptionId
 * Generate an invoice from a subscription.
 */
const generate = async (req, res) => {
  try {
    const { subscriptionId } = req.params;

    const invoice = await invoiceService.generateInvoice(subscriptionId);

    return success(res, invoice, 'Invoice generated successfully', 201);
  } catch (err) {
    console.error('Generate invoice error:', err);
    const statusCode = err.message.includes('not found') ? 404 : 400;
    return error(res, err.message, statusCode);
  }
};

/**
 * PATCH /invoices/:id/confirm
 * Confirm a draft invoice.
 */
const confirm = async (req, res) => {
  try {
    const { id } = req.params;

    const invoice = await invoiceService.confirmInvoice(id, req.user.id);

    return success(res, invoice, 'Invoice confirmed successfully');
  } catch (err) {
    console.error('Confirm invoice error:', err);
    const statusCode = err.message.includes('not found') ? 404 : 400;
    return error(res, err.message, statusCode);
  }
};

/**
 * PATCH /invoices/:id/cancel
 * Cancel an invoice.
 */
const cancel = async (req, res) => {
  try {
    const { id } = req.params;

    const invoice = await invoiceService.cancelInvoice(id, req.user.id);

    return success(res, invoice, 'Invoice cancelled successfully');
  } catch (err) {
    console.error('Cancel invoice error:', err);
    const statusCode = err.message.includes('not found') ? 404 : 400;
    return error(res, err.message, statusCode);
  }
};

/**
 * POST /invoices/:id/send
 * Generate PDF and send invoice via email.
 */
const sendInvoice = async (req, res) => {
  try {
    const { id } = req.params;

    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        invoiceLines: { include: { product: true, variant: true, tax: true } },
        customer: true,
        subscription: { select: { subscriptionNo: true } },
      },
    });

    if (!invoice) {
      return error(res, 'Invoice not found', 404);
    }

    if (!invoice.customer?.email) {
      return error(res, 'Customer has no email address', 400);
    }

    const pdfBuffer = await generateInvoicePDF(invoice);
    await sendInvoiceEmail(invoice.customer.email, invoice.invoiceNo, pdfBuffer);

    return success(res, { invoiceId: id }, 'Invoice sent successfully');
  } catch (err) {
    console.error('Send invoice error:', err);
    return error(res, 'Failed to send invoice');
  }
};

/**
 * GET /invoices/:id/pdf
 * Generate and download invoice as PDF.
 */
const downloadPDF = async (req, res) => {
  try {
    const { id } = req.params;

    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        invoiceLines: { include: { product: true, variant: true, tax: true } },
        customer: true,
        subscription: { select: { subscriptionNo: true } },
      },
    });

    if (!invoice) {
      return error(res, 'Invoice not found', 404);
    }

    const pdfBuffer = await generateInvoicePDF(invoice);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${invoice.invoiceNo}.pdf"`,
      'Content-Length': pdfBuffer.length,
    });

    return res.send(pdfBuffer);
  } catch (err) {
    console.error('Download PDF error:', err);
    return error(res, 'Failed to generate PDF');
  }
};

/**
 * PATCH /invoices/:id/revert-draft
 * Revert a cancelled invoice back to draft status.
 */
const revertToDraft = async (req, res) => {
  try {
    const { id } = req.params;
    const invoice = await prisma.invoice.findUnique({ where: { id } });
    if (!invoice) return error(res, 'Invoice not found', 404);
    if (invoice.status !== 'cancelled') return error(res, 'Only cancelled invoices can be reverted to draft', 400);

    const updated = await prisma.invoice.update({
      where: { id },
      data: { status: 'draft', issuedAt: null, dueDate: null },
    });
    return success(res, updated, 'Invoice reverted to draft');
  } catch (err) {
    return error(res, 'Failed to revert invoice');
  }
};

module.exports = {
  getAll,
  getById,
  generate,
  confirm,
  cancel,
  sendInvoice,
  downloadPDF,
  revertToDraft,
};
