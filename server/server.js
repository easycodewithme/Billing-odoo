const app = require('./src/app');
const config = require('./src/config/env');
const cron = require('node-cron');
const { runBillingCycle } = require('./src/services/billing.service');

const PORT = config.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Environment: ${config.NODE_ENV}`);

  // Run recurring billing every day at midnight
  cron.schedule('0 0 * * *', () => {
    runBillingCycle().catch(console.error);
  });
  console.log('Billing cycle cron scheduled (daily at midnight): auto-close, billing, auto-renew');
});
