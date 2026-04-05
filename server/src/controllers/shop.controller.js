const prisma = require('../utils/prisma');
const { success, error, paginated } = require('../utils/apiResponse');
const { getPagination } = require('../utils/pagination');

// GET /shop/products - Public product listing
const getProducts = async (req, res) => {
  try {
    const { skip, take, page, limit } = getPagination(req.query);
    const { search, productType, sortBy } = req.query;

    const where = { isActive: true };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (productType && productType !== 'all') where.productType = productType;

    let orderBy = { createdAt: 'desc' };
    if (sortBy === 'price_asc') orderBy = { salesPrice: 'asc' };
    if (sortBy === 'price_desc') orderBy = { salesPrice: 'desc' };
    if (sortBy === 'name') orderBy = { name: 'asc' };

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where, skip, take, orderBy,
        include: { variants: true },
      }),
      prisma.product.count({ where }),
    ]);

    return paginated(res, products, total, page, limit);
  } catch (err) {
    console.error('Shop products error:', err);
    return error(res, 'Failed to fetch products');
  }
};

// GET /shop/products/:id - Product detail
const getProductDetail = async (req, res) => {
  try {
    const product = await prisma.product.findFirst({
      where: { id: req.params.id, isActive: true },
      include: { variants: true },
    });
    if (!product) return error(res, 'Product not found', 404);
    return success(res, product);
  } catch (err) {
    return error(res, 'Failed to fetch product');
  }
};

// GET /shop/plans - List available recurring plans
const getPlans = async (req, res) => {
  try {
    const plans = await prisma.recurringPlan.findMany({
      where: { isActive: true },
      orderBy: { price: 'asc' },
    });
    return success(res, plans);
  } catch (err) {
    return error(res, 'Failed to fetch plans');
  }
};

// POST /shop/subscribe - Portal user creates a subscription request (draft)
// Body: { planId, items: [{ productId, variantId?, quantity }], notes? }
const subscribe = async (req, res) => {
  try {
    const { planId, items, notes } = req.body;

    if (!planId) return error(res, 'Plan is required', 400);
    if (!items || items.length === 0) return error(res, 'At least one product is required', 400);

    const plan = await prisma.recurringPlan.findUnique({ where: { id: planId } });
    if (!plan || !plan.isActive) return error(res, 'Plan not found', 404);

    // Build order lines — unitPrice is the plan price (subscription cost)
    const planUnitPrice = Number(plan.price);
    const orderLineData = [];
    for (const item of items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
        include: { variants: true },
      });
      if (!product || !product.isActive) continue;

      if (item.variantId) {
        const variant = product.variants.find(v => v.id === item.variantId);
        if (!variant) continue;
      }
      const qty = item.quantity || 1;

      orderLineData.push({
        productId: item.productId,
        variantId: item.variantId || null,
        quantity: qty,
        unitPrice: planUnitPrice,
        amount: qty * planUnitPrice,
      });
    }

    if (orderLineData.length === 0) return error(res, 'No valid products selected', 400);

    const subscriptionNo = 'SUB-' + Date.now() + Math.floor(1000 + Math.random() * 9000);
    const startDate = new Date();
    const expirationDate = new Date();
    const periodDays = { daily: 1, weekly: 7, monthly: 30, yearly: 365 };
    expirationDate.setDate(expirationDate.getDate() + (periodDays[plan.billingPeriod] || 30));

    const subscription = await prisma.subscription.create({
      data: {
        subscriptionNo,
        customerId: req.user.id,
        planId,
        startDate,
        expirationDate,
        paymentTerms: 'Due on Receipt',
        notes: notes || null,
        status: 'draft',
        orderLines: { create: orderLineData },
      },
      include: {
        plan: { select: { name: true, billingPeriod: true, price: true } },
        orderLines: { include: { product: true, variant: true } },
        customer: { select: { fullName: true, email: true } },
      },
    });

    return success(res, subscription, 'Subscription request submitted', 201);
  } catch (err) {
    console.error('Subscribe error:', err);
    return error(res, 'Failed to create subscription request');
  }
};

// POST /shop/subscriptions/:id/accept - Portal user accepts quotation
const acceptQuotation = async (req, res) => {
  try {
    const { id } = req.params;

    const subscription = await prisma.subscription.findUnique({
      where: { id },
      include: { plan: true, orderLines: true },
    });

    if (!subscription) return error(res, 'Subscription not found', 404);
    if (subscription.customerId !== req.user.id) return error(res, 'Not authorized', 403);
    if (subscription.status !== 'quotation') return error(res, 'Can only accept quotations', 400);

    const updated = await prisma.$transaction(async (tx) => {
      const sub = await tx.subscription.update({
        where: { id },
        data: { status: 'confirmed' },
        include: {
          plan: true,
          orderLines: { include: { product: true, variant: true } },
          customer: { select: { fullName: true, email: true } },
        },
      });

      await tx.subscriptionStatusLog.create({
        data: {
          subscriptionId: id,
          fromStatus: 'quotation',
          toStatus: 'confirmed',
          changedById: req.user.id,
          reason: 'Customer accepted quotation',
        },
      });

      return sub;
    });

    // No invoice generated here — invoice is created automatically after payment via Stripe webhook
    return success(res, updated, 'Quotation accepted. Please proceed to payment.');
  } catch (err) {
    console.error('Accept quotation error:', err);
    return error(res, 'Failed to accept quotation');
  }
};

// POST /shop/subscriptions/:id/reject - Portal user rejects quotation
const rejectQuotation = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const subscription = await prisma.subscription.findUnique({ where: { id } });

    if (!subscription) return error(res, 'Subscription not found', 404);
    if (subscription.customerId !== req.user.id) return error(res, 'Not authorized', 403);
    if (subscription.status !== 'quotation') return error(res, 'Can only reject quotations', 400);

    const updated = await prisma.$transaction(async (tx) => {
      const sub = await tx.subscription.update({
        where: { id },
        data: { status: 'closed' },
      });

      await tx.subscriptionStatusLog.create({
        data: {
          subscriptionId: id,
          fromStatus: 'quotation',
          toStatus: 'closed',
          changedById: req.user.id,
          reason: reason || 'Customer rejected quotation',
        },
      });

      return sub;
    });

    return success(res, updated, 'Quotation rejected');
  } catch (err) {
    return error(res, 'Failed to reject quotation');
  }
};

// POST /shop/subscriptions/:id/pay - Portal user pays for confirmed subscription via Stripe
const paySubscription = async (req, res) => {
  try {
    const stripe = require('../config/stripe');
    const config = require('../config/env');
    const { id } = req.params;

    const subscription = await prisma.subscription.findUnique({
      where: { id },
      include: {
        orderLines: { include: { product: true, variant: true, tax: true, discount: true } },
        customer: { select: { fullName: true, email: true } },
        plan: true,
      },
    });

    if (!subscription) return error(res, 'Subscription not found', 404);
    if (subscription.customerId !== req.user.id) return error(res, 'Not authorized', 403);
    if (subscription.status !== 'confirmed') return error(res, 'Subscription must be confirmed before payment', 400);

    if (subscription.orderLines.length === 0) {
      return error(res, 'No order lines on this subscription', 400);
    }

    // Build Stripe line items directly from order lines (invoice is generated after payment)
    const lineItems = subscription.orderLines.map((line) => {
      const lineAmount = Number(line.amount);
      // Calculate discount
      let discountAmt = 0;
      if (line.discount && line.discount.value) {
        discountAmt = line.discount.type === 'percentage'
          ? lineAmount * (Number(line.discount.value) / 100)
          : Math.min(Number(line.discount.value), lineAmount);
      }
      // Calculate tax on discounted amount
      const taxableAmount = lineAmount - discountAmt;
      let taxAmt = 0;
      if (line.tax && line.tax.rate) {
        taxAmt = taxableAmount * (Number(line.tax.rate) / 100);
      }
      const lineNet = lineAmount - discountAmt + taxAmt;

      return {
        price_data: {
          currency: 'usd',
          product_data: {
            name: line.product.name + (line.variant ? ` - ${line.variant.value}` : ''),
          },
          unit_amount: Math.round((lineNet / line.quantity) * 100),
        },
        quantity: line.quantity,
      };
    });

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: subscription.customer?.email,
      line_items: lineItems,
      metadata: {
        subscriptionId: subscription.id,
        subscriptionNo: subscription.subscriptionNo,
        type: 'subscription_payment',
      },
      success_url: `${config.CLIENT_URL}/subscriptions/${subscription.id}?payment=success`,
      cancel_url: `${config.CLIENT_URL}/subscriptions/${subscription.id}?payment=cancelled`,
    });

    return success(res, { sessionId: session.id, url: session.url });
  } catch (err) {
    console.error('Pay subscription error:', err);
    return error(res, 'Failed to create payment session');
  }
};

// POST /shop/subscriptions/:id/confirm-payment
// Called by frontend after returning from Stripe — verifies payment and processes it
// This is a reliable fallback for when webhooks don't fire (local dev, network issues)
const confirmPayment = async (req, res) => {
  try {
    const stripe = require('../config/stripe');
    const invoiceService = require('../services/invoice.service');
    const { id } = req.params;

    const subscription = await prisma.subscription.findUnique({
      where: { id },
      include: { plan: true },
    });

    if (!subscription) return error(res, 'Subscription not found', 404);
    if (subscription.customerId !== req.user.id) return error(res, 'Not authorized', 403);

    // Already activated by webhook — nothing to do
    if (subscription.status === 'active') {
      return success(res, subscription, 'Subscription is already active');
    }

    if (subscription.status !== 'confirmed') {
      return error(res, 'Subscription is not in confirmed state', 400);
    }

    // Find the most recent Stripe checkout session for this subscription
    const sessions = await stripe.checkout.sessions.list({
      limit: 5,
    });

    const matchedSession = sessions.data.find(
      (s) => s.metadata?.subscriptionId === id && s.payment_status === 'paid'
    );

    if (!matchedSession) {
      return error(res, 'No completed payment found for this subscription', 400);
    }

    // Check if payment was already recorded (by webhook)
    const existingPayment = await prisma.payment.findFirst({
      where: { stripeSessionId: matchedSession.id, status: 'completed' },
    });

    if (existingPayment) {
      // Payment recorded but subscription not yet activated — activate now
      await prisma.subscription.update({
        where: { id },
        data: { status: 'active' },
      });
      return success(res, { status: 'active' }, 'Subscription activated');
    }

    // Process payment: generate invoice, record payment, activate subscription
    let invoice = await prisma.invoice.findFirst({
      where: { subscriptionId: id, status: { in: ['confirmed', 'draft'] } },
      orderBy: { createdAt: 'desc' },
    });
    if (!invoice) {
      invoice = await invoiceService.generateInvoice(id);
    }
    if (invoice.status === 'draft') {
      await invoiceService.confirmInvoice(invoice.id, null);
    }

    await prisma.payment.create({
      data: {
        invoiceId: invoice.id,
        method: 'stripe',
        amount: (matchedSession.amount_total || 0) / 100,
        status: 'completed',
        stripeSessionId: matchedSession.id,
        stripePaymentIntentId: matchedSession.payment_intent || null,
        reference: `Stripe: ${matchedSession.payment_intent || matchedSession.id}`,
        paymentDate: new Date(),
      },
    });

    await invoiceService.updatePaymentTotals(invoice.id);

    await prisma.subscription.update({
      where: { id },
      data: { status: 'active' },
    });

    await prisma.subscriptionStatusLog.create({
      data: {
        subscriptionId: id,
        fromStatus: 'confirmed',
        toStatus: 'active',
        reason: 'Payment confirmed via Stripe',
      },
    });

    return success(res, { status: 'active' }, 'Payment verified — subscription activated');
  } catch (err) {
    console.error('Confirm payment error:', err);
    return error(res, 'Failed to verify payment');
  }
};

module.exports = {
  getProducts,
  getProductDetail,
  getPlans,
  subscribe,
  acceptQuotation,
  rejectQuotation,
  paySubscription,
  confirmPayment,
};
