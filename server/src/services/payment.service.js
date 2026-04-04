const prisma = require('../utils/prisma');
const { logAction } = require('./audit.service');
const invoiceService = require('./invoice.service');

/**
 * Record a manual payment against an invoice.
 * @param {string} invoiceId - Invoice ID
 * @param {object} data - Payment data { method, amount, reference, notes }
 * @param {string} userId - User performing the action
 * @returns {Promise<object>} Created payment
 */
const recordManualPayment = async (invoiceId, data, userId) => {
  const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } });

  if (!invoice) {
    throw new Error('Invoice not found');
  }

  if (invoice.status === 'cancelled') {
    throw new Error('Cannot record payment for a cancelled invoice');
  }

  if (invoice.status === 'paid') {
    throw new Error('Invoice is already fully paid');
  }

  const payment = await prisma.payment.create({
    data: {
      invoiceId,
      method: data.method,
      amount: data.amount,
      reference: data.reference || null,
      notes: data.notes || null,
      status: 'completed',
      paymentDate: new Date(),
    },
    include: {
      invoice: {
        select: { invoiceNo: true, status: true },
      },
    },
  });

  // Update invoice payment totals
  await invoiceService.updatePaymentTotals(invoiceId);

  await logAction(
    'Payment',
    payment.id,
    'CREATE',
    null,
    payment,
    userId
  );

  return payment;
};

module.exports = {
  recordManualPayment,
};
