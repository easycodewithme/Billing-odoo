const prisma = require('../utils/prisma');
const { logAction } = require('./audit.service');

/**
 * Invoice status rules (hackathon / judge reference).
 *
 * - draft: initial after generateInvoice; only draft may be confirmed.
 * - confirmed: issuedAt + dueDate set on confirm (dueDate = now + 30 days in confirmInvoice).
 * - paid: set automatically when sum(completed payments) >= netAmount (updatePaymentTotals).
 * - cancelled: cancelInvoice only if no payments exist; cannot pay cancelled invoices.
 */

/**
 * Generate a unique invoice number.
 * Format: INV-<timestamp><random 4 digits>
 */
const generateInvoiceNo = () => {
  const timestamp = Date.now();
  const random = Math.floor(1000 + Math.random() * 9000);
  return `INV-${timestamp}${random}`;
};

/**
 * Generate an invoice from a subscription's order lines.
 * @param {string} subscriptionId - Subscription ID
 * @returns {Promise<object>} Created invoice with lines
 */
const generateInvoice = async (subscriptionId) => {
  const subscription = await prisma.subscription.findUnique({
    where: { id: subscriptionId },
    include: {
      orderLines: {
        include: {
          product: true,
          variant: true,
          tax: true,
          discount: true,
        },
      },
    },
  });

  if (!subscription) {
    throw new Error('Subscription not found');
  }

  if (!subscription.orderLines || subscription.orderLines.length === 0) {
    throw new Error('Subscription has no order lines to invoice');
  }

  const invoiceNo = generateInvoiceNo();

  // Calculate line-level amounts
  const invoiceLines = [];
  for (const line of subscription.orderLines) {
    const lineAmount = Number(line.quantity) * Number(line.unitPrice);

    // Calculate tax amount
    let taxAmount = 0;
    if (line.tax) {
      taxAmount = lineAmount * (Number(line.tax.rate) / 100);
    }

    // Calculate discount amount
    let discountAmount = 0;
    if (line.discount) {
      const now = new Date();
      const discountStart = new Date(line.discount.startDate);
      const discountEnd = new Date(line.discount.endDate);
      const isDateValid = now >= discountStart && now <= discountEnd;
      const isUsageValid = !line.discount.limitUsage || line.discount.currentUsage < line.discount.limitUsage;
      const isPurchaseValid = !line.discount.minPurchase || lineAmount >= Number(line.discount.minPurchase);
      const isQuantityValid = !line.discount.minQuantity || line.quantity >= line.discount.minQuantity;

      if (isDateValid && isUsageValid && isPurchaseValid && isQuantityValid) {
        if (line.discount.type === 'percentage') {
          discountAmount = lineAmount * (Number(line.discount.value) / 100);
        } else {
          discountAmount = Number(line.discount.value);
        }
        // Increment usage atomically
        await prisma.discount.update({
          where: { id: line.discount.id },
          data: { currentUsage: { increment: 1 } },
        });
      }
    }

    invoiceLines.push({
      productId: line.productId,
      variantId: line.variantId || null,
      description: line.product.name + (line.variant ? ` - ${line.variant.value}` : ''),
      quantity: line.quantity,
      unitPrice: line.unitPrice,
      amount: lineAmount,
      taxId: line.taxId || null,
      taxAmount,
      discountAmount,
    });
  }

  // Calculate totals
  const totalAmount = invoiceLines.reduce((sum, l) => sum + l.amount, 0);
  const taxAmount = invoiceLines.reduce((sum, l) => sum + l.taxAmount, 0);
  const discountAmount = invoiceLines.reduce((sum, l) => sum + l.discountAmount, 0);
  const netAmount = totalAmount + taxAmount - discountAmount;

  // Create invoice and lines in a transaction
  const invoice = await prisma.$transaction(async (tx) => {
    const createdInvoice = await tx.invoice.create({
      data: {
        invoiceNo,
        subscriptionId,
        customerId: subscription.customerId,
        status: 'draft',
        totalAmount,
        taxAmount,
        discountAmount,
        netAmount,
        paidAmount: 0,
        outstandingAmount: netAmount,
        invoiceLines: {
          create: invoiceLines,
        },
      },
      include: {
        invoiceLines: {
          include: {
            product: true,
            variant: true,
            tax: true,
          },
        },
        customer: { select: { fullName: true, email: true } },
        subscription: { select: { subscriptionNo: true } },
      },
    });

    return createdInvoice;
  });

  return invoice;
};

/**
 * Confirm an invoice - set status, issuedAt, and dueDate.
 * @param {string} invoiceId - Invoice ID
 * @param {string} userId - User performing the action
 * @returns {Promise<object>} Updated invoice
 */
const confirmInvoice = async (invoiceId, userId) => {
  const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } });

  if (!invoice) {
    throw new Error('Invoice not found');
  }

  if (invoice.status !== 'draft') {
    throw new Error('Only draft invoices can be confirmed');
  }

  const now = new Date();
  const dueDate = new Date(now);
  dueDate.setDate(dueDate.getDate() + 30);

  const updated = await prisma.invoice.update({
    where: { id: invoiceId },
    data: {
      status: 'confirmed',
      issuedAt: now,
      dueDate,
    },
  });

  await logAction(
    'invoices',
    invoiceId,
    'update',
    { status: 'draft' },
    { status: 'confirmed', issuedAt: now, dueDate },
    userId
  );

  return updated;
};

/**
 * Cancel an invoice - only if no payments exist.
 * @param {string} invoiceId - Invoice ID
 * @param {string} userId - User performing the action
 * @returns {Promise<object>} Updated invoice
 */
const cancelInvoice = async (invoiceId, userId) => {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: { payments: true },
  });

  if (!invoice) {
    throw new Error('Invoice not found');
  }

  if (invoice.payments && invoice.payments.length > 0) {
    throw new Error('Cannot cancel an invoice that has payments');
  }

  if (invoice.status === 'cancelled') {
    throw new Error('Invoice is already cancelled');
  }

  const updated = await prisma.invoice.update({
    where: { id: invoiceId },
    data: { status: 'cancelled' },
  });

  await logAction(
    'invoices',
    invoiceId,
    'update',
    { status: invoice.status },
    { status: 'cancelled' },
    userId
  );

  return updated;
};

/**
 * Recalculate and update payment totals for an invoice.
 * @param {string} invoiceId - Invoice ID
 * @returns {Promise<object>} Updated invoice
 */
const updatePaymentTotals = async (invoiceId) => {
  const payments = await prisma.payment.findMany({
    where: {
      invoiceId,
      status: 'completed',
    },
  });

  const paidAmount = payments.reduce((sum, p) => sum + Number(p.amount), 0);

  const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } });

  if (!invoice) {
    throw new Error('Invoice not found');
  }

  const outstandingAmount = Number(invoice.netAmount) - paidAmount;

  const updateData = {
    paidAmount,
    outstandingAmount: Math.max(outstandingAmount, 0),
  };

  if (outstandingAmount <= 0) {
    updateData.status = 'paid';
  }

  const updated = await prisma.invoice.update({
    where: { id: invoiceId },
    data: updateData,
  });

  return updated;
};

module.exports = {
  generateInvoice,
  confirmInvoice,
  cancelInvoice,
  updatePaymentTotals,
};
