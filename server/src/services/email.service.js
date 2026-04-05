const transporter = require('../config/mailer');

const FROM_EMAIL = process.env.SMTP_USER || 'noreply@example.com';
const FROM_NAME = process.env.SMTP_FROM_NAME || 'SubManager';
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';
const isConfigured = !!process.env.SMTP_USER && !!process.env.SMTP_PASS;

// ─── Base HTML Template ─────────────────────────────────────────────────────

const baseTemplate = ({ title, preheader, body, ctaUrl, ctaText, footer }) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  ${preheader ? `<span style="display:none;font-size:1px;color:#fff;max-height:0;overflow:hidden;">${preheader}</span>` : ''}
  <style>
    body { margin: 0; padding: 0; background: #f4f4f7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
    .wrapper { width: 100%; background: #f4f4f7; padding: 40px 0; }
    .container { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
    .header { background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 28px 32px; text-align: center; }
    .header h1 { margin: 0; color: #ffffff; font-size: 22px; font-weight: 700; letter-spacing: -0.3px; }
    .body { padding: 32px; color: #374151; font-size: 15px; line-height: 1.7; }
    .body h2 { margin: 0 0 16px; color: #1a1a2e; font-size: 20px; font-weight: 700; }
    .body p { margin: 0 0 14px; }
    .info-card { background: #f8f9fc; border-radius: 8px; padding: 18px 20px; margin: 18px 0; border-left: 4px solid #6366f1; }
    .info-card table { width: 100%; border-collapse: collapse; }
    .info-card td { padding: 5px 0; font-size: 14px; vertical-align: top; }
    .info-card .label { color: #6b7280; width: 140px; font-weight: 500; }
    .info-card .value { color: #1f2937; font-weight: 600; }
    .cta-wrap { text-align: center; margin: 28px 0; }
    .cta { display: inline-block; background: #6366f1; color: #ffffff !important; padding: 13px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px; }
    .cta:hover { background: #4f46e5; }
    .divider { border: none; border-top: 1px solid #e5e7eb; margin: 24px 0; }
    .footer { padding: 20px 32px; text-align: center; color: #9ca3af; font-size: 12px; line-height: 1.6; }
    .badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
    .badge-active { background: #d1fae5; color: #065f46; }
    .badge-confirmed { background: #dbeafe; color: #1e40af; }
    .badge-quotation { background: #fef3c7; color: #92400e; }
    .badge-paused { background: #fee2e2; color: #991b1b; }
    .badge-closed { background: #f3f4f6; color: #4b5563; }
    .badge-paid { background: #d1fae5; color: #065f46; }
    @media only screen and (max-width: 620px) {
      .container { margin: 0 16px; }
      .body, .footer { padding: 24px 20px; }
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <h1>${FROM_NAME}</h1>
      </div>
      <div class="body">
        ${body}
        ${ctaUrl && ctaText ? `
          <div class="cta-wrap">
            <a href="${ctaUrl}" class="cta">${ctaText}</a>
          </div>
        ` : ''}
      </div>
      <div class="footer">
        ${footer || `&copy; ${new Date().getFullYear()} ${FROM_NAME}. All rights reserved.`}
      </div>
    </div>
  </div>
</body>
</html>
`;

const infoCard = (rows) => {
  const rowsHtml = rows
    .filter(([, val]) => val !== undefined && val !== null && val !== '')
    .map(([label, value]) => `<tr><td class="label">${label}</td><td class="value">${value}</td></tr>`)
    .join('');
  return `<div class="info-card"><table>${rowsHtml}</table></div>`;
};

const badge = (status) => `<span class="badge badge-${status}">${status}</span>`;

// ─── Send Helper ────────────────────────────────────────────────────────────

const send = async (to, subject, html) => {
  if (!isConfigured) {
    console.log(`--- Email (SMTP not configured) ---`);
    console.log(`To: ${to} | Subject: ${subject}`);
    console.log('------------------------------------');
    return;
  }
  try {
    await transporter.sendMail({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to,
      subject,
      html,
    });
    console.log(`Email sent to ${to}: ${subject}`);
  } catch (err) {
    console.warn(`Email delivery failed (${subject}):`, err.message);
  }
};

const sendWithAttachment = async (to, subject, html, attachments) => {
  if (!isConfigured) {
    console.log(`--- Email with attachment (SMTP not configured) ---`);
    console.log(`To: ${to} | Subject: ${subject}`);
    console.log('----------------------------------------------------');
    return;
  }
  try {
    await transporter.sendMail({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to,
      subject,
      html,
      attachments,
    });
    console.log(`Email sent to ${to}: ${subject}`);
  } catch (err) {
    console.warn(`Email delivery failed (${subject}):`, err.message);
  }
};

// ─── 1. Welcome Email ──────────────────────────────────────────────────────

const sendWelcomeEmail = async (to, fullName) => {
  const html = baseTemplate({
    title: 'Welcome!',
    preheader: `Welcome to ${FROM_NAME}, ${fullName}!`,
    body: `
      <h2>Welcome, ${fullName}!</h2>
      <p>Your account has been created successfully. You can now browse our products, subscribe to plans, and manage your subscriptions.</p>
      <p>Here's what you can do:</p>
      <ul style="padding-left: 20px; margin: 14px 0;">
        <li>Browse our <strong>product catalog</strong> and subscription plans</li>
        <li>Subscribe and manage your <strong>subscriptions</strong></li>
        <li>View and pay your <strong>invoices</strong> online</li>
        <li>Track your <strong>payment history</strong></li>
      </ul>
    `,
    ctaUrl: `${CLIENT_URL}/dashboard`,
    ctaText: 'Go to Dashboard',
  });
  await send(to, `Welcome to ${FROM_NAME}!`, html);
};

// ─── 2. Password Reset ─────────────────────────────────────────────────────

const sendPasswordResetEmail = async (to, resetLink) => {
  const html = baseTemplate({
    title: 'Reset Your Password',
    preheader: 'You requested a password reset',
    body: `
      <h2>Password Reset Request</h2>
      <p>You requested a password reset for your account. Click the button below to set a new password.</p>
      <p style="color: #6b7280; font-size: 13px;">This link expires in <strong>1 hour</strong>. If you didn't request this, you can safely ignore this email.</p>
    `,
    ctaUrl: resetLink,
    ctaText: 'Reset Password',
  });
  await send(to, 'Reset Your Password', html);
};

// ─── 3. Quotation Sent (to customer) ───────────────────────────────────────

const sendQuotationEmail = async (to, { customerName, subscriptionNo, planName, billingPeriod, items, totalAmount }) => {
  const itemsHtml = items && items.length > 0
    ? `<table style="width:100%;border-collapse:collapse;margin:12px 0;">
        <tr style="border-bottom:1px solid #e5e7eb;">
          <td style="padding:8px 0;font-weight:600;font-size:13px;color:#6b7280;">Product</td>
          <td style="padding:8px 0;font-weight:600;font-size:13px;color:#6b7280;text-align:center;">Qty</td>
          <td style="padding:8px 0;font-weight:600;font-size:13px;color:#6b7280;text-align:right;">Price</td>
        </tr>
        ${items.map(i => `
          <tr style="border-bottom:1px solid #f3f4f6;">
            <td style="padding:8px 0;font-size:14px;">${i.name}</td>
            <td style="padding:8px 0;font-size:14px;text-align:center;">${i.quantity}</td>
            <td style="padding:8px 0;font-size:14px;text-align:right;">$${Number(i.amount).toFixed(2)}</td>
          </tr>
        `).join('')}
        ${totalAmount !== undefined ? `
          <tr>
            <td colspan="2" style="padding:10px 0;font-weight:700;font-size:14px;text-align:right;">Total</td>
            <td style="padding:10px 0;font-weight:700;font-size:14px;text-align:right;color:#6366f1;">$${Number(totalAmount).toFixed(2)}</td>
          </tr>
        ` : ''}
      </table>`
    : '';

  const html = baseTemplate({
    title: 'New Quotation',
    preheader: `You have a new quotation ${subscriptionNo}`,
    body: `
      <h2>You've Received a Quotation</h2>
      <p>Hi ${customerName},</p>
      <p>A new subscription quotation has been prepared for you. Please review the details below and accept or reject it from your portal.</p>
      ${infoCard([
        ['Quotation No', subscriptionNo],
        ['Plan', planName],
        ['Billing', billingPeriod],
      ])}
      ${itemsHtml}
    `,
    ctaUrl: `${CLIENT_URL}/subscriptions`,
    ctaText: 'View Quotation',
  });
  await send(to, `Quotation ${subscriptionNo} - Review Required`, html);
};

// ─── 4. Quotation Accepted (notify staff) ──────────────────────────────────

const sendQuotationAcceptedEmail = async (to, { customerName, subscriptionNo }) => {
  const html = baseTemplate({
    title: 'Quotation Accepted',
    preheader: `${customerName} accepted quotation ${subscriptionNo}`,
    body: `
      <h2>Quotation Accepted ${badge('confirmed')}</h2>
      <p><strong>${customerName}</strong> has accepted the quotation and the subscription is now confirmed. The customer will proceed to payment.</p>
      ${infoCard([
        ['Subscription', subscriptionNo],
        ['Customer', customerName],
        ['Status', 'Confirmed — awaiting payment'],
      ])}
    `,
    ctaUrl: `${CLIENT_URL}/subscriptions`,
    ctaText: 'View Subscription',
  });
  await send(to, `Quotation ${subscriptionNo} Accepted by ${customerName}`, html);
};

// ─── 5. Quotation Rejected (notify staff) ──────────────────────────────────

const sendQuotationRejectedEmail = async (to, { customerName, subscriptionNo, reason }) => {
  const html = baseTemplate({
    title: 'Quotation Rejected',
    preheader: `${customerName} rejected quotation ${subscriptionNo}`,
    body: `
      <h2>Quotation Rejected ${badge('closed')}</h2>
      <p><strong>${customerName}</strong> has rejected the quotation.</p>
      ${infoCard([
        ['Subscription', subscriptionNo],
        ['Customer', customerName],
        ['Reason', reason || 'No reason provided'],
      ])}
    `,
    ctaUrl: `${CLIENT_URL}/subscriptions`,
    ctaText: 'View Subscription',
  });
  await send(to, `Quotation ${subscriptionNo} Rejected by ${customerName}`, html);
};

// ─── 6. Payment Confirmation (to customer) ─────────────────────────────────

const sendPaymentConfirmationEmail = async (to, { customerName, subscriptionNo, amount, invoiceNo, method }) => {
  const html = baseTemplate({
    title: 'Payment Confirmed',
    preheader: `Your payment of $${Number(amount).toFixed(2)} was successful`,
    body: `
      <h2>Payment Confirmed ${badge('paid')}</h2>
      <p>Hi ${customerName},</p>
      <p>We've received your payment. Your subscription is now active.</p>
      ${infoCard([
        ['Amount', `$${Number(amount).toFixed(2)}`],
        ['Method', method || 'Stripe'],
        ['Invoice', invoiceNo || '-'],
        ['Subscription', subscriptionNo],
      ])}
      <p style="color: #6b7280; font-size: 13px;">A detailed invoice is available in your portal.</p>
    `,
    ctaUrl: `${CLIENT_URL}/subscriptions`,
    ctaText: 'View Subscription',
  });
  await send(to, `Payment Confirmed — $${Number(amount).toFixed(2)}`, html);
};

// ─── 7. Subscription Activated ──────────────────────────────────────────────

const sendSubscriptionActivatedEmail = async (to, { customerName, subscriptionNo, planName, expirationDate }) => {
  const html = baseTemplate({
    title: 'Subscription Active',
    preheader: `Your subscription ${subscriptionNo} is now active`,
    body: `
      <h2>Subscription Activated ${badge('active')}</h2>
      <p>Hi ${customerName},</p>
      <p>Great news! Your subscription is now <strong>active</strong>. You have full access to all features included in your plan.</p>
      ${infoCard([
        ['Subscription', subscriptionNo],
        ['Plan', planName],
        ['Valid Until', expirationDate ? new Date(expirationDate).toLocaleDateString() : 'Ongoing'],
      ])}
    `,
    ctaUrl: `${CLIENT_URL}/dashboard`,
    ctaText: 'Go to Dashboard',
  });
  await send(to, `Subscription ${subscriptionNo} is Now Active`, html);
};

// ─── 8. Subscription Paused ────────────────────────────────────────────────

const sendSubscriptionPausedEmail = async (to, { customerName, subscriptionNo, reason }) => {
  const html = baseTemplate({
    title: 'Subscription Paused',
    preheader: `Your subscription ${subscriptionNo} has been paused`,
    body: `
      <h2>Subscription Paused ${badge('paused')}</h2>
      <p>Hi ${customerName},</p>
      <p>Your subscription has been paused. You can resume it anytime from your portal.</p>
      ${infoCard([
        ['Subscription', subscriptionNo],
        ['Reason', reason || 'Paused by user'],
      ])}
    `,
    ctaUrl: `${CLIENT_URL}/subscriptions`,
    ctaText: 'Manage Subscription',
  });
  await send(to, `Subscription ${subscriptionNo} Paused`, html);
};

// ─── 9. Subscription Closed / Cancelled ────────────────────────────────────

const sendSubscriptionClosedEmail = async (to, { customerName, subscriptionNo, reason, renewable }) => {
  const html = baseTemplate({
    title: 'Subscription Closed',
    preheader: `Your subscription ${subscriptionNo} has been closed`,
    body: `
      <h2>Subscription Closed ${badge('closed')}</h2>
      <p>Hi ${customerName},</p>
      <p>Your subscription has been closed.</p>
      ${infoCard([
        ['Subscription', subscriptionNo],
        ['Reason', reason || 'Closed by user'],
      ])}
      ${renewable ? '<p>You can <strong>renew</strong> this subscription anytime from your portal.</p>' : ''}
    `,
    ctaUrl: `${CLIENT_URL}/subscriptions`,
    ctaText: renewable ? 'Renew Subscription' : 'View Subscriptions',
  });
  await send(to, `Subscription ${subscriptionNo} Closed`, html);
};

// ─── 10. Subscription Renewed ──────────────────────────────────────────────

const sendSubscriptionRenewedEmail = async (to, { customerName, oldSubscriptionNo, newSubscriptionNo, planName }) => {
  const html = baseTemplate({
    title: 'Subscription Renewed',
    preheader: `Your subscription has been renewed as ${newSubscriptionNo}`,
    body: `
      <h2>Subscription Renewed ${badge('confirmed')}</h2>
      <p>Hi ${customerName},</p>
      <p>Your subscription has been renewed. Please proceed to payment to activate it.</p>
      ${infoCard([
        ['Previous', oldSubscriptionNo],
        ['New Subscription', newSubscriptionNo],
        ['Plan', planName],
      ])}
    `,
    ctaUrl: `${CLIENT_URL}/subscriptions`,
    ctaText: 'View & Pay',
  });
  await send(to, `Subscription Renewed — ${newSubscriptionNo}`, html);
};

// ─── 11. Invoice Email (with PDF attachment) ────────────────────────────────

const sendInvoiceEmail = async (to, { customerName, invoiceNo, netAmount, dueDate, pdfBuffer }) => {
  const attachments = [];
  if (pdfBuffer) {
    attachments.push({
      filename: `${invoiceNo}.pdf`,
      content: pdfBuffer,
      contentType: 'application/pdf',
    });
  }

  const html = baseTemplate({
    title: `Invoice ${invoiceNo}`,
    preheader: `Your invoice ${invoiceNo} for $${Number(netAmount).toFixed(2)}`,
    body: `
      <h2>Invoice ${invoiceNo}</h2>
      <p>Hi ${customerName || 'there'},</p>
      <p>A new invoice has been generated for your subscription.</p>
      ${infoCard([
        ['Invoice No', invoiceNo],
        ['Amount Due', `$${Number(netAmount).toFixed(2)}`],
        ['Due Date', dueDate ? new Date(dueDate).toLocaleDateString() : '-'],
      ])}
      ${pdfBuffer ? '<p style="color:#6b7280;font-size:13px;">The PDF invoice is attached to this email.</p>' : ''}
    `,
    ctaUrl: `${CLIENT_URL}/invoices`,
    ctaText: 'View Invoice',
  });

  await sendWithAttachment(to, `Invoice ${invoiceNo} — $${Number(netAmount).toFixed(2)}`, html, attachments);
};

// ─── 12. Recurring Invoice Reminder ────────────────────────────────────────

const sendInvoiceReminderEmail = async (to, { customerName, invoiceNo, netAmount, dueDate }) => {
  const html = baseTemplate({
    title: 'Payment Reminder',
    preheader: `Reminder: Invoice ${invoiceNo} is due`,
    body: `
      <h2>Payment Reminder</h2>
      <p>Hi ${customerName},</p>
      <p>This is a friendly reminder that you have an outstanding invoice.</p>
      ${infoCard([
        ['Invoice No', invoiceNo],
        ['Amount Due', `$${Number(netAmount).toFixed(2)}`],
        ['Due Date', dueDate ? new Date(dueDate).toLocaleDateString() : '-'],
      ])}
    `,
    ctaUrl: `${CLIENT_URL}/invoices`,
    ctaText: 'Pay Now',
  });
  await send(to, `Payment Reminder — Invoice ${invoiceNo}`, html);
};

// ─── 13. Internal User Invite ──────────────────────────────────────────────

const sendInternalUserInviteEmail = async (to, { fullName, email, password, invitedBy }) => {
  const html = baseTemplate({
    title: 'You\'ve Been Invited',
    preheader: `${invitedBy} has invited you to join ${FROM_NAME}`,
    body: `
      <h2>You're Invited to ${FROM_NAME}</h2>
      <p>Hi ${fullName},</p>
      <p><strong>${invitedBy}</strong> has created an account for you as an <strong>Internal User</strong>. You can now log in and start managing subscriptions, invoices, and customers.</p>
      ${infoCard([
        ['Email', email],
        ['Password', password],
        ['Role', 'Internal User'],
      ])}
      <p style="color: #ef4444; font-size: 13px; font-weight: 500;">Please change your password after your first login.</p>
    `,
    ctaUrl: `${CLIENT_URL}/login`,
    ctaText: 'Log In Now',
  });
  await send(to, `You've been invited to ${FROM_NAME}`, html);
};

module.exports = {
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendQuotationEmail,
  sendQuotationAcceptedEmail,
  sendQuotationRejectedEmail,
  sendPaymentConfirmationEmail,
  sendSubscriptionActivatedEmail,
  sendSubscriptionPausedEmail,
  sendSubscriptionClosedEmail,
  sendSubscriptionRenewedEmail,
  sendInvoiceEmail,
  sendInvoiceReminderEmail,
  sendInternalUserInviteEmail,
};
