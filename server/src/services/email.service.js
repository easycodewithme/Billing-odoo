const transporter = require('../config/mailer');

const FROM_EMAIL = process.env.SMTP_USER || 'noreply@example.com';
const FROM_NAME = process.env.SMTP_FROM_NAME || 'Subscription Manager';
const isConfigured = !!process.env.SMTP_USER && !!process.env.SMTP_PASS;

/**
 * Send a password reset email.
 */
const sendPasswordResetEmail = async (to, resetLink) => {
  if (!isConfigured) {
    console.log('--- Password Reset Email (SMTP not configured) ---');
    console.log(`To: ${to}`);
    console.log(`Reset Link: ${resetLink}`);
    console.log('---------------------------------------------------');
    return;
  }

  try {
    await transporter.sendMail({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to,
      subject: 'Reset Your Password',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #1a1a2e;">Password Reset Request</h2>
          <p>You requested a password reset for your Subscription Management account.</p>
          <p>Click the button below to reset your password. This link expires in 1 hour.</p>
          <a href="${resetLink}"
             style="display: inline-block; background: #6366f1; color: white; padding: 12px 24px;
                    text-decoration: none; border-radius: 6px; margin: 16px 0; font-weight: bold;">
            Reset Password
          </a>
          <p style="color: #666; font-size: 14px;">
            If you did not request this reset, you can safely ignore this email.
          </p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="color: #999; font-size: 12px;">Subscription Management System</p>
        </div>
      `,
    });
    console.log(`Password reset email sent to ${to}`);
  } catch (err) {
    console.warn('Email delivery failed (password reset):', err.message);
  }
};

/**
 * Send an invoice email with a PDF attachment.
 */
const sendInvoiceEmail = async (to, invoiceNo, pdfBuffer) => {
  if (!isConfigured) {
    console.log('--- Invoice Email (SMTP not configured) ---');
    console.log(`To: ${to}`);
    console.log(`Invoice No: ${invoiceNo}`);
    console.log(`PDF Size: ${pdfBuffer ? pdfBuffer.length : 0} bytes`);
    console.log('----------------------------------------------');
    return;
  }

  try {
    const attachments = [];
    if (pdfBuffer) {
      attachments.push({
        filename: `${invoiceNo}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf',
      });
    }

    await transporter.sendMail({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to,
      subject: `Invoice ${invoiceNo}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #1a1a2e;">Invoice ${invoiceNo}</h2>
          <p>Please find your invoice attached to this email.</p>
          ${pdfBuffer
            ? '<p>The PDF is attached for your records.</p>'
            : '<p>You can view and download the invoice from your portal.</p>'
          }
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="color: #999; font-size: 12px;">Subscription Management System</p>
        </div>
      `,
      attachments,
    });
    console.log(`Invoice email sent to ${to} (${invoiceNo})`);
  } catch (err) {
    console.warn('Email delivery failed (invoice):', err.message);
  }
};

module.exports = {
  sendPasswordResetEmail,
  sendInvoiceEmail,
};
