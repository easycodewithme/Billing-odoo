const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');

/**
 * Generate an invoice PDF using pdf-lib (no browser dependency).
 * @param {object} invoice - Full invoice object with lines, customer, subscription
 * @returns {Promise<Buffer>} PDF buffer
 */
const generateInvoicePDF = async (invoice) => {
  const doc = await PDFDocument.create();
  const page = doc.addPage([595, 842]); // A4
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const { width, height } = page.getSize();

  const dark = rgb(0.1, 0.1, 0.12);
  const gray = rgb(0.4, 0.4, 0.45);
  const accent = rgb(0.39, 0.4, 0.95);
  const lightBg = rgb(0.96, 0.96, 0.98);
  const white = rgb(1, 1, 1);

  let y = height - 50;
  const marginLeft = 50;
  const marginRight = width - 50;

  // ── Header ──
  page.drawText('INVOICE', {
    x: marginLeft, y, size: 28, font: fontBold, color: accent,
  });
  page.drawText(invoice.invoiceNo || '', {
    x: marginLeft, y: y - 22, size: 11, font, color: gray,
  });

  // Status badge
  const statusText = (invoice.status || 'draft').toUpperCase();
  page.drawText(statusText, {
    x: marginRight - fontBold.widthOfTextAtSize(statusText, 10) - 10,
    y, size: 10, font: fontBold, color: accent,
  });

  y -= 55;

  // ── Dates row ──
  const issuedAt = invoice.issuedAt ? new Date(invoice.issuedAt).toLocaleDateString() : '-';
  const dueDate = invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : '-';

  page.drawText('Issue Date:', { x: marginLeft, y, size: 9, font: fontBold, color: gray });
  page.drawText(issuedAt, { x: marginLeft + 65, y, size: 9, font, color: dark });

  page.drawText('Due Date:', { x: 300, y, size: 9, font: fontBold, color: gray });
  page.drawText(dueDate, { x: 360, y, size: 9, font, color: dark });

  y -= 30;

  // ── Customer ──
  page.drawText('Bill To:', { x: marginLeft, y, size: 9, font: fontBold, color: gray });
  y -= 15;
  const customerName = invoice.customer?.fullName || '-';
  const customerEmail = invoice.customer?.email || '-';
  page.drawText(customerName, { x: marginLeft, y, size: 11, font: fontBold, color: dark });
  y -= 14;
  page.drawText(customerEmail, { x: marginLeft, y, size: 9, font, color: gray });

  // Subscription ref
  if (invoice.subscription?.subscriptionNo) {
    page.drawText('Subscription:', { x: 300, y: y + 14, size: 9, font: fontBold, color: gray });
    page.drawText(invoice.subscription.subscriptionNo, { x: 375, y: y + 14, size: 9, font, color: dark });
  }

  y -= 35;

  // ── Table Header ──
  const cols = [marginLeft, 220, 310, 370, 430, marginRight];
  const headers = ['Description', 'Qty', 'Unit Price', 'Tax', 'Discount', 'Amount'];

  page.drawRectangle({
    x: marginLeft - 5, y: y - 5, width: marginRight - marginLeft + 10, height: 20,
    color: accent,
  });

  headers.forEach((h, i) => {
    const xPos = i === 0 ? cols[i] : cols[i] - 10;
    page.drawText(h, {
      x: xPos, y: y, size: 8, font: fontBold, color: white,
    });
  });

  y -= 25;

  // ── Table Rows ──
  const lines = invoice.invoiceLines || [];

  lines.forEach((line, idx) => {
    if (y < 120) return; // Safety: don't overflow page

    if (idx % 2 === 0) {
      page.drawRectangle({
        x: marginLeft - 5, y: y - 5, width: marginRight - marginLeft + 10, height: 18,
        color: lightBg,
      });
    }

    const desc = line.description || line.product?.name || '-';
    const truncDesc = desc.length > 35 ? desc.substring(0, 32) + '...' : desc;

    page.drawText(truncDesc, { x: cols[0], y, size: 8, font, color: dark });
    page.drawText(String(line.quantity || 0), { x: cols[1], y, size: 8, font, color: dark });
    page.drawText(`$${Number(line.unitPrice || 0).toFixed(2)}`, { x: cols[2] - 10, y, size: 8, font, color: dark });
    page.drawText(`$${Number(line.taxAmount || 0).toFixed(2)}`, { x: cols[3] - 10, y, size: 8, font, color: dark });
    page.drawText(`$${Number(line.discountAmount || 0).toFixed(2)}`, { x: cols[4] - 10, y, size: 8, font, color: dark });

    const lineTotal = Number(line.amount || 0);
    page.drawText(`$${lineTotal.toFixed(2)}`, { x: cols[5] - 50, y, size: 8, font: fontBold, color: dark });

    y -= 20;
  });

  y -= 10;

  // ── Separator ──
  page.drawLine({
    start: { x: 300, y }, end: { x: marginRight, y },
    thickness: 0.5, color: gray,
  });

  y -= 20;

  // ── Totals ──
  const totals = [
    ['Subtotal', `$${Number(invoice.totalAmount || 0).toFixed(2)}`],
    ['Tax', `$${Number(invoice.taxAmount || 0).toFixed(2)}`],
    ['Discount', `-$${Number(invoice.discountAmount || 0).toFixed(2)}`],
  ];

  totals.forEach(([label, value]) => {
    page.drawText(label, { x: 370, y, size: 9, font, color: gray });
    page.drawText(value, { x: marginRight - font.widthOfTextAtSize(value, 9) - 5, y, size: 9, font, color: dark });
    y -= 16;
  });

  // Net total
  y -= 5;
  page.drawRectangle({
    x: 360, y: y - 5, width: marginRight - 355, height: 22,
    color: accent,
  });
  const netLabel = 'Net Total';
  const netValue = `$${Number(invoice.netAmount || 0).toFixed(2)}`;
  page.drawText(netLabel, { x: 370, y, size: 10, font: fontBold, color: white });
  page.drawText(netValue, { x: marginRight - fontBold.widthOfTextAtSize(netValue, 10) - 5, y, size: 10, font: fontBold, color: white });

  y -= 30;

  // Paid / Outstanding
  const paidValue = `$${Number(invoice.paidAmount || 0).toFixed(2)}`;
  const outValue = `$${Number(invoice.outstandingAmount || 0).toFixed(2)}`;
  page.drawText('Paid:', { x: 370, y, size: 9, font, color: gray });
  page.drawText(paidValue, { x: marginRight - font.widthOfTextAtSize(paidValue, 9) - 5, y, size: 9, font, color: rgb(0.1, 0.6, 0.3) });
  y -= 16;
  page.drawText('Outstanding:', { x: 370, y, size: 9, font: fontBold, color: gray });
  page.drawText(outValue, { x: marginRight - fontBold.widthOfTextAtSize(outValue, 9) - 5, y, size: 9, font: fontBold, color: Number(invoice.outstandingAmount) > 0 ? rgb(0.8, 0.2, 0.2) : dark });

  // ── Footer ──
  page.drawText('Thank you for your business.', {
    x: marginLeft, y: 40, size: 9, font, color: gray,
  });
  page.drawText('Subscription Management System', {
    x: marginLeft, y: 25, size: 7, font, color: rgb(0.7, 0.7, 0.7),
  });

  const pdfBytes = await doc.save();
  return Buffer.from(pdfBytes);
};

module.exports = { generateInvoicePDF };
