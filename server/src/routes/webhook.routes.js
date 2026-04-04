const { Router } = require('express');
const stripe = require('../config/stripe');
const { handleStripeWebhook } = require('../services/payment.service');

const router = Router();

/**
 * POST /webhooks/stripe
 * Handle Stripe webhook events with signature verification.
 * Note: This route must receive raw body (configured in app.js).
 */
router.post('/stripe', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    if (webhookSecret && webhookSecret !== 'whsec_placeholder') {
      // Verify signature in production
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } else {
      // In development without webhook secret, parse raw body
      event = JSON.parse(req.body.toString());
      console.warn('Stripe webhook: signature verification skipped (no secret configured)');
    }
  } catch (err) {
    console.error('Stripe webhook signature verification failed:', err.message);
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  try {
    await handleStripeWebhook(event);
    return res.status(200).json({ received: true });
  } catch (err) {
    console.error('Stripe webhook processing error:', err);
    return res.status(500).json({ error: 'Webhook processing failed' });
  }
});

module.exports = router;
