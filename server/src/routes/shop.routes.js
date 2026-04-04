const { Router } = require('express');
const { authenticate } = require('../middleware/auth');
const shopController = require('../controllers/shop.controller');

const router = Router();

// Public - browse products and plans
router.get('/products', shopController.getProducts);
router.get('/products/:id', shopController.getProductDetail);
router.get('/plans', shopController.getPlans);

// Auth required - subscription actions
router.post('/subscribe', authenticate, shopController.subscribe);
router.post('/subscriptions/:id/accept', authenticate, shopController.acceptQuotation);
router.post('/subscriptions/:id/reject', authenticate, shopController.rejectQuotation);
router.post('/subscriptions/:id/pay', authenticate, shopController.paySubscription);

module.exports = router;
