const prisma = require('../utils/prisma');
const { success, error, paginated } = require('../utils/apiResponse');
const { getPagination } = require('../utils/pagination');

// GET /shop/products - Public product listing for storefront
const getProducts = async (req, res) => {
  try {
    const { skip, take, page, limit } = getPagination(req.query);
    const { search, productType, minPrice, maxPrice, sortBy } = req.query;

    const where = { isActive: true };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (productType) where.productType = productType;
    if (minPrice || maxPrice) {
      where.salesPrice = {};
      if (minPrice) where.salesPrice.gte = Number(minPrice);
      if (maxPrice) where.salesPrice.lte = Number(maxPrice);
    }

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

// GET /shop/products/:id - Single product detail
const getProductDetail = async (req, res) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: req.params.id, isActive: true },
      include: { variants: true },
    });
    if (!product) return error(res, 'Product not found', 404);
    return success(res, product);
  } catch (err) {
    return error(res, 'Failed to fetch product');
  }
};

// GET /shop/cart - Get current user's cart
const getCart = async (req, res) => {
  try {
    let cart = await prisma.shopOrder.findFirst({
      where: { customerId: req.user.id, status: 'cart' },
      include: {
        items: { include: { product: true, variant: true }, orderBy: { createdAt: 'asc' } },
      },
    });
    if (!cart) {
      cart = { items: [], subtotal: 0, taxAmount: 0, discountAmount: 0, total: 0 };
    }
    return success(res, cart);
  } catch (err) {
    return error(res, 'Failed to fetch cart');
  }
};

// POST /shop/cart/add - Add item to cart
const addToCart = async (req, res) => {
  try {
    const { productId, variantId, quantity } = req.body;
    const qty = Number(quantity) || 1;

    const product = await prisma.product.findUnique({ where: { id: productId }, include: { variants: true } });
    if (!product || !product.isActive) return error(res, 'Product not found', 404);

    let unitPrice = Number(product.salesPrice);
    if (variantId) {
      const variant = product.variants.find(v => v.id === variantId);
      if (variant) unitPrice += Number(variant.extraPrice);
    }

    // Get or create cart
    let cart = await prisma.shopOrder.findFirst({
      where: { customerId: req.user.id, status: 'cart' },
    });

    if (!cart) {
      const orderNo = 'SO-' + Date.now() + Math.floor(Math.random() * 1000);
      cart = await prisma.shopOrder.create({
        data: { orderNo, customerId: req.user.id, status: 'cart' },
      });
    }

    // Check if item already in cart
    const existing = await prisma.shopOrderItem.findFirst({
      where: { orderId: cart.id, productId, variantId: variantId || null },
    });

    if (existing) {
      await prisma.shopOrderItem.update({
        where: { id: existing.id },
        data: { quantity: existing.quantity + qty, total: (existing.quantity + qty) * unitPrice },
      });
    } else {
      await prisma.shopOrderItem.create({
        data: {
          orderId: cart.id,
          productId,
          variantId: variantId || null,
          quantity: qty,
          unitPrice,
          total: qty * unitPrice,
        },
      });
    }

    // Recalculate cart totals
    await recalculateCart(cart.id);

    const updated = await prisma.shopOrder.findUnique({
      where: { id: cart.id },
      include: { items: { include: { product: true, variant: true } } },
    });

    return success(res, updated, 'Item added to cart');
  } catch (err) {
    console.error('Add to cart error:', err);
    return error(res, 'Failed to add to cart');
  }
};

// PUT /shop/cart/item/:itemId - Update cart item quantity
const updateCartItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { quantity } = req.body;
    const qty = Number(quantity);

    if (qty < 1) return error(res, 'Quantity must be at least 1', 400);

    const item = await prisma.shopOrderItem.findUnique({
      where: { id: itemId },
      include: { order: true },
    });

    if (!item || item.order.customerId !== req.user.id || item.order.status !== 'cart') {
      return error(res, 'Item not found', 404);
    }

    await prisma.shopOrderItem.update({
      where: { id: itemId },
      data: { quantity: qty, total: qty * Number(item.unitPrice) },
    });

    await recalculateCart(item.orderId);

    const cart = await prisma.shopOrder.findUnique({
      where: { id: item.orderId },
      include: { items: { include: { product: true, variant: true } } },
    });

    return success(res, cart);
  } catch (err) {
    return error(res, 'Failed to update cart');
  }
};

// DELETE /shop/cart/item/:itemId - Remove item from cart
const removeCartItem = async (req, res) => {
  try {
    const { itemId } = req.params;

    const item = await prisma.shopOrderItem.findUnique({
      where: { id: itemId },
      include: { order: true },
    });

    if (!item || item.order.customerId !== req.user.id || item.order.status !== 'cart') {
      return error(res, 'Item not found', 404);
    }

    await prisma.shopOrderItem.delete({ where: { id: itemId } });
    await recalculateCart(item.orderId);

    const cart = await prisma.shopOrder.findUnique({
      where: { id: item.orderId },
      include: { items: { include: { product: true, variant: true } } },
    });

    return success(res, cart);
  } catch (err) {
    return error(res, 'Failed to remove item');
  }
};

// POST /shop/cart/discount - Apply discount code
const applyDiscount = async (req, res) => {
  try {
    const { code } = req.body;

    const cart = await prisma.shopOrder.findFirst({
      where: { customerId: req.user.id, status: 'cart' },
      include: { items: true },
    });

    if (!cart || cart.items.length === 0) return error(res, 'Cart is empty', 400);

    const discount = await prisma.discount.findFirst({
      where: { name: { equals: code, mode: 'insensitive' }, isActive: true },
    });

    if (!discount) return error(res, 'Invalid discount code', 404);

    const now = new Date();
    if (now < new Date(discount.startDate) || now > new Date(discount.endDate)) {
      return error(res, 'Discount code has expired', 400);
    }
    if (discount.limitUsage && discount.currentUsage >= discount.limitUsage) {
      return error(res, 'Discount code usage limit reached', 400);
    }

    const subtotal = cart.items.reduce((sum, i) => sum + Number(i.total), 0);
    if (discount.minPurchase && subtotal < Number(discount.minPurchase)) {
      return error(res, `Minimum purchase of $${discount.minPurchase} required`, 400);
    }

    let discountAmount = 0;
    if (discount.type === 'percentage') {
      discountAmount = subtotal * (Number(discount.value) / 100);
    } else {
      discountAmount = Number(discount.value);
    }

    await prisma.shopOrder.update({
      where: { id: cart.id },
      data: {
        discountCode: code,
        discountAmount: Math.min(discountAmount, subtotal),
        total: Math.max(subtotal - discountAmount, 0),
      },
    });

    const updated = await prisma.shopOrder.findUnique({
      where: { id: cart.id },
      include: { items: { include: { product: true, variant: true } } },
    });

    return success(res, updated, 'Discount applied');
  } catch (err) {
    return error(res, 'Failed to apply discount');
  }
};

// POST /shop/checkout - Complete checkout
const checkout = async (req, res) => {
  try {
    const { shippingName, shippingEmail, shippingPhone, shippingAddress, paymentMethod } = req.body;

    const cart = await prisma.shopOrder.findFirst({
      where: { customerId: req.user.id, status: 'cart' },
      include: { items: { include: { product: true, variant: true } } },
    });

    if (!cart || cart.items.length === 0) return error(res, 'Cart is empty', 400);

    const order = await prisma.shopOrder.update({
      where: { id: cart.id },
      data: {
        status: 'confirmed',
        shippingName: shippingName || req.user.fullName,
        shippingEmail: shippingEmail || req.user.email,
        shippingPhone: shippingPhone || req.user.phone,
        shippingAddress,
        paymentMethod: paymentMethod || 'stripe',
        paidAt: new Date(),
      },
      include: { items: { include: { product: true, variant: true } } },
    });

    // Increment discount usage if applied
    if (cart.discountCode) {
      await prisma.discount.updateMany({
        where: { name: { equals: cart.discountCode, mode: 'insensitive' } },
        data: { currentUsage: { increment: 1 } },
      });
    }

    return success(res, order, 'Order placed successfully', 201);
  } catch (err) {
    console.error('Checkout error:', err);
    return error(res, 'Failed to complete checkout');
  }
};

// GET /shop/orders - Portal user's order history
const getOrders = async (req, res) => {
  try {
    const { skip, take, page, limit } = getPagination(req.query);

    const where = { customerId: req.user.id, status: { not: 'cart' } };

    const [orders, total] = await Promise.all([
      prisma.shopOrder.findMany({
        where, skip, take,
        include: { items: { include: { product: true, variant: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.shopOrder.count({ where }),
    ]);

    return paginated(res, orders, total, page, limit);
  } catch (err) {
    return error(res, 'Failed to fetch orders');
  }
};

// GET /shop/orders/:id - Single order detail
const getOrderDetail = async (req, res) => {
  try {
    const order = await prisma.shopOrder.findUnique({
      where: { id: req.params.id },
      include: {
        items: { include: { product: true, variant: true } },
        customer: { select: { fullName: true, email: true, phone: true } },
      },
    });

    if (!order || order.customerId !== req.user.id) {
      return error(res, 'Order not found', 404);
    }

    return success(res, order);
  } catch (err) {
    return error(res, 'Failed to fetch order');
  }
};

// POST /shop/checkout/stripe - Create Stripe session for cart
const stripeCheckout = async (req, res) => {
  try {
    const stripe = require('../config/stripe');
    const config = require('../config/env');

    const cart = await prisma.shopOrder.findFirst({
      where: { customerId: req.user.id, status: 'cart' },
      include: { items: { include: { product: true, variant: true } }, customer: true },
    });

    if (!cart || cart.items.length === 0) return error(res, 'Cart is empty', 400);

    const lineItems = cart.items.map(item => ({
      price_data: {
        currency: 'usd',
        product_data: {
          name: item.product.name + (item.variant ? ` - ${item.variant.value}` : ''),
        },
        unit_amount: Math.round(Number(item.unitPrice) * 100),
      },
      quantity: item.quantity,
    }));

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: cart.customer?.email,
      line_items: lineItems,
      metadata: { orderId: cart.id, orderNo: cart.orderNo },
      success_url: `${config.STRIPE_SUCCESS_URL}?order_id=${cart.id}`,
      cancel_url: `${config.STRIPE_CANCEL_URL}?order_id=${cart.id}`,
    });

    return success(res, { sessionId: session.id, url: session.url });
  } catch (err) {
    console.error('Stripe shop checkout error:', err);
    return error(res, 'Failed to create checkout session');
  }
};

// Helper: recalculate cart totals
async function recalculateCart(orderId) {
  const items = await prisma.shopOrderItem.findMany({ where: { orderId } });
  const subtotal = items.reduce((sum, i) => sum + Number(i.total), 0);

  const cart = await prisma.shopOrder.findUnique({ where: { id: orderId } });
  const discountAmount = Number(cart.discountAmount || 0);

  await prisma.shopOrder.update({
    where: { id: orderId },
    data: {
      subtotal,
      total: Math.max(subtotal - discountAmount, 0),
    },
  });
}

module.exports = {
  getProducts,
  getProductDetail,
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  applyDiscount,
  checkout,
  getOrders,
  getOrderDetail,
  stripeCheckout,
};
