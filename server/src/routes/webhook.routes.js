const { Router } = require('express');

const router = Router();

/**
 * POST /webhooks/stripe
 * Placeholder handler for Stripe webhooks.
 */
router.post('/stripe', (req, res) => {
  console.log('Stripe webhook received:', {
    type: req.body?.type || 'unknown',
    timestamp: new Date().toISOString(),
  });

  return res.status(200).json({ received: true });
});

module.exports = router;
