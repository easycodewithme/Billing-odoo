const prisma = require('../utils/prisma');
const { logAction } = require('./audit.service');
const invoiceService = require('./invoice.service');
const stripe = require('../config/stripe');
const config = require('../config/env');

/**
 * Record a manual payment against an invoice.
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

  await logAction('Payment', payment.id, 'create', null, payment, userId);

  return payment;
};

/**
 * Create a Stripe Checkout Session for an invoice.
 */
const createCheckoutSession = async (invoiceId) => {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: {
      invoiceLines: { include: { product: true, variant: true } },
      customer: { select: { fullName: true, email: true } },
    },
  });

  if (!invoice) {
    throw new Error('Invoice not found');
  }

  if (invoice.status === 'cancelled') {
    throw new Error('Cannot pay a cancelled invoice');
  }

  if (invoice.status === 'paid') {
    throw new Error('Invoice is already fully paid');
  }

  const outstanding = Number(invoice.outstandingAmount);
  if (outstanding <= 0) {
    throw new Error('No outstanding amount to pay');
  }

  // Build Stripe line items from invoice lines
  const lineItems = invoice.invoiceLines.map((line) => {
    const name = line.product.name + (line.variant ? ` - ${line.variant.value}` : '');
    const unitAmount = Math.round(
      ((Number(line.amount) + Number(line.taxAmount) - Number(line.discountAmount)) / line.quantity) * 100
    );

    return {
      price_data: {
        currency: 'usd',
        product_data: { name },
        unit_amount: Math.max(unitAmount, 0),
      },
      quantity: line.quantity,
    };
  });

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'payment',
    customer_email: invoice.customer?.email || undefined,
    line_items: lineItems,
    metadata: {
      invoiceId: invoice.id,
      invoiceNo: invoice.invoiceNo,
    },
    success_url: `${config.STRIPE_SUCCESS_URL}?session_id={CHECKOUT_SESSION_ID}&invoice_id=${invoice.id}`,
    cancel_url: `${config.STRIPE_CANCEL_URL}?invoice_id=${invoice.id}`,
  });

  // Store the session ID as a pending payment
  await prisma.payment.create({
    data: {
      invoiceId: invoice.id,
      method: 'stripe',
      amount: outstanding,
      status: 'pending',
      stripeSessionId: session.id,
      paymentDate: new Date(),
    },
  });

  return { sessionId: session.id, url: session.url };
};

/**
 * Handle Stripe webhook events.
 */
const handleStripeWebhook = async (event) => {
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;

      // Handle subscription payment
      if (session.metadata?.type === 'subscription_payment') {
        const subId = session.metadata.subscriptionId;
        if (subId) {
          // Generate invoice and mark as paid
          const invoiceService = require('./invoice.service');
          try {
            const invoice = await invoiceService.generateInvoice(subId);
            await invoiceService.confirmInvoice(invoice.id, null);

            // Record payment
            await prisma.payment.create({
              data: {
                invoiceId: invoice.id,
                method: 'stripe',
                amount: (session.amount_total || 0) / 100,
                status: 'completed',
                stripeSessionId: session.id,
                stripePaymentIntentId: session.payment_intent || null,
                reference: `Stripe: ${session.payment_intent || session.id}`,
                paymentDate: new Date(),
              },
            });

            await invoiceService.updatePaymentTotals(invoice.id);

            // Activate subscription
            await prisma.subscription.update({
              where: { id: subId },
              data: { status: 'active' },
            });

            await prisma.subscriptionStatusLog.create({
              data: {
                subscriptionId: subId,
                fromStatus: 'confirmed',
                toStatus: 'active',
                reason: 'Payment received via Stripe',
              },
            });

            console.log(`Subscription ${subId} activated after payment`);
          } catch (err) {
            console.error('Subscription payment processing error:', err);
          }
        }
        return;
      }

      const invoiceId = session.metadata?.invoiceId;

      if (!invoiceId) {
        console.warn('Stripe webhook: no invoiceId in metadata');
        return;
      }

      // Update the pending payment to completed
      const pendingPayment = await prisma.payment.findFirst({
        where: { stripeSessionId: session.id, status: 'pending' },
      });

      if (pendingPayment) {
        await prisma.payment.update({
          where: { id: pendingPayment.id },
          data: {
            status: 'completed',
            stripePaymentIntentId: session.payment_intent || null,
            reference: `Stripe: ${session.payment_intent || session.id}`,
          },
        });
      } else {
        // Create a new payment record if pending not found
        await prisma.payment.create({
          data: {
            invoiceId,
            method: 'stripe',
            amount: (session.amount_total || 0) / 100,
            status: 'completed',
            stripeSessionId: session.id,
            stripePaymentIntentId: session.payment_intent || null,
            reference: `Stripe: ${session.payment_intent || session.id}`,
            paymentDate: new Date(),
          },
        });
      }

      // Update invoice totals
      await invoiceService.updatePaymentTotals(invoiceId);

      await logAction('Payment', invoiceId, 'create', null, {
        source: 'stripe_webhook',
        sessionId: session.id,
        amount: (session.amount_total || 0) / 100,
      }, null);

      console.log(`Stripe payment completed for invoice ${invoiceId}`);
      break;
    }

    case 'checkout.session.expired': {
      const session = event.data.object;

      // Mark pending payment as failed
      const pendingPayment = await prisma.payment.findFirst({
        where: { stripeSessionId: session.id, status: 'pending' },
      });

      if (pendingPayment) {
        await prisma.payment.update({
          where: { id: pendingPayment.id },
          data: { status: 'failed' },
        });
      }

      console.log(`Stripe session expired: ${session.id}`);
      break;
    }

    case 'charge.refunded': {
      const charge = event.data.object;
      const paymentIntent = charge.payment_intent;

      const originalPayment = await prisma.payment.findFirst({
        where: { stripePaymentIntentId: paymentIntent, status: 'completed' },
      });

      if (originalPayment) {
        // Create a refund payment record
        await prisma.payment.create({
          data: {
            invoiceId: originalPayment.invoiceId,
            method: 'stripe',
            amount: (charge.amount_refunded || 0) / 100,
            status: 'refunded',
            stripePaymentIntentId: paymentIntent,
            reference: `Refund: ${paymentIntent}`,
            paymentDate: new Date(),
          },
        });

        await invoiceService.updatePaymentTotals(originalPayment.invoiceId);
        console.log(`Stripe refund processed for payment intent ${paymentIntent}`);
      }
      break;
    }

    default:
      console.log(`Unhandled Stripe event: ${event.type}`);
  }
};

module.exports = {
  recordManualPayment,
  createCheckoutSession,
  handleStripeWebhook,
};
