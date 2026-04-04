const { Router } = require('express');
const { authenticate } = require('../middleware/auth');
const shopController = require('../controllers/shop.controller');

const router = Router();

// Public routes (no auth needed for browsing)
router.get('/products', shopController.getProducts);
router.get('/products/:id', shopController.getProductDetail);
router.get('/plans', shopController.getPlans);

// Auth required for cart and orders
router.get('/cart', authenticate, shopController.getCart);
router.post('/cart/add', authenticate, shopController.addToCart);
router.put('/cart/item/:itemId', authenticate, shopController.updateCartItem);
router.delete('/cart/item/:itemId', authenticate, shopController.removeCartItem);
router.post('/cart/discount', authenticate, shopController.applyDiscount);
router.post('/checkout', authenticate, shopController.checkout);
router.post('/checkout/stripe', authenticate, shopController.stripeCheckout);
router.post('/subscribe', authenticate, shopController.subscribe);
router.get('/orders', authenticate, shopController.getOrders);
router.get('/orders/:id', authenticate, shopController.getOrderDetail);

module.exports = router;
