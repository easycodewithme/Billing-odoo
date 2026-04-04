/**
 * Email service (stubbed).
 * All methods log to console for now. Replace with a real provider
 * (e.g. Resend, SendGrid, SES) when ready.
 */

/**
 * Send a password reset email.
 * @param {string} to - Recipient email address
 * @param {string} resetLink - Password reset URL
 */
const sendPasswordResetEmail = async (to, resetLink) => {
  console.log('--- Password Reset Email (stub) ---');
  console.log(`To: ${to}`);
  console.log(`Reset Link: ${resetLink}`);
  console.log('-----------------------------------');
};

/**
 * Send an invoice email with a PDF attachment.
 * @param {string} to - Recipient email address
 * @param {string} invoiceNo - Invoice number
 * @param {Buffer} pdfBuffer - PDF file contents
 */
const sendInvoiceEmail = async (to, invoiceNo, pdfBuffer) => {
  console.log('--- Invoice Email (stub) ---');
  console.log(`To: ${to}`);
  console.log(`Invoice No: ${invoiceNo}`);
  console.log(`PDF Size: ${pdfBuffer ? pdfBuffer.length : 0} bytes`);
  console.log('----------------------------');
};

module.exports = {
  sendPasswordResetEmail,
  sendInvoiceEmail,
};
