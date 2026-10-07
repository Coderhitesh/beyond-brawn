const PDFDocument = require('pdfkit');
const settings = require('./settings.service');

const inr = (n) => `Rs. ${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const date = (d) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' });

// Streams a GST invoice PDF for a paid order (order must have populated items).
async function streamInvoice(order, res) {
  const { general, contact } = await settings.getAll();
  const doc = new PDFDocument({ size: 'A4', margin: 40 });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="invoice-${order.orderNumber}.pdf"`);
  doc.pipe(res);

  const W = doc.page.width - 80;
  doc.rect(0, 0, doc.page.width, 92).fill('#000000');
  doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(22).text('BEYOND', 40, 32, { continued: true }).fillColor('#A8E61D').text(' BRAWN');
  doc.fillColor('#FFFFFF').font('Helvetica').fontSize(9).text(general.tagline || '', 40, 60);
  doc.font('Helvetica-Bold').fontSize(16).fillColor('#FFFFFF').text('TAX INVOICE', 40, 36, { width: W, align: 'right' });

  doc.fillColor('#000000').font('Helvetica').fontSize(9);
  let y = 112;
  doc.font('Helvetica-Bold').text('Sold by', 40, y).font('Helvetica');
  doc.text(general.siteName, 40, y + 13).text(contact.address || '', 40, y + 25, { width: 240 });
  let sy = doc.y;
  if (contact.gstin) { doc.text(`GSTIN: ${contact.gstin}`, 40, sy); sy = doc.y; }
  if (contact.fssai) { doc.text(`FSSAI: ${contact.fssai}`, 40, sy); sy = doc.y; }

  const rx = 330;
  doc.font('Helvetica-Bold').text('Invoice / Order no.', rx, y).font('Helvetica').text(order.orderNumber, rx + 110, y);
  doc.font('Helvetica-Bold').text('Order date', rx, y + 14).font('Helvetica').text(date(order.placedAt || order.createdAt), rx + 110, y + 14);
  doc.font('Helvetica-Bold').text('Payment', rx, y + 28).font('Helvetica').text(`${(order.paymentMethod || 'Razorpay').toUpperCase()} (${order.paymentStatus})`, rx + 110, y + 28);

  y = Math.max(sy, y + 50) + 16;
  const a = order.shippingAddress || {};
  doc.font('Helvetica-Bold').text('Ship to', 40, y).font('Helvetica');
  doc.text(`${a.fullName || ''}, ${a.phone || ''}`, 40, y + 13);
  doc.text(`${a.line1 || ''}${a.line2 ? `, ${a.line2}` : ''}`, 40, y + 25, { width: 300 });
  doc.text(`${a.city || ''}, ${a.state || ''} ${a.pincode || ''}, ${a.country || 'India'}`, 40, doc.y);
  doc.text(order.customer.email || '', 40, doc.y);

  y = doc.y + 18;
  const cols = [
    { label: 'Item', x: 40, w: 230, align: 'left' },
    { label: 'SKU', x: 270, w: 80, align: 'left' },
    { label: 'Qty', x: 350, w: 35, align: 'right' },
    { label: 'Rate', x: 385, w: 65, align: 'right' },
    { label: 'GST %', x: 450, w: 40, align: 'right' },
    { label: 'Amount', x: 490, w: 65, align: 'right' },
  ];
  doc.rect(40, y, W, 20).fill('#000000');
  doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(8.5);
  cols.forEach((c) => doc.text(c.label, c.x + 4, y + 6, { width: c.w - 8, align: c.align }));
  y += 20;
  doc.fillColor('#000000').font('Helvetica').fontSize(8.5);

  (order.items || []).forEach((it) => {
    const name = `${it.name}${it.variantLabel ? ` (${it.variantLabel})` : ''}`;
    const h = Math.max(20, doc.heightOfString(name, { width: cols[0].w - 8 }) + 10);
    if (y + h > doc.page.height - 160) { doc.addPage(); y = 40; }
    const cells = [name, it.sku || '', String(it.quantity), inr(it.price), `${it.gstRate ?? ''}`, inr(it.lineTotal)];
    cols.forEach((c, i) => doc.text(cells[i], c.x + 4, y + 6, { width: c.w - 8, align: c.align }));
    y += h;
    doc.moveTo(40, y).lineTo(40 + W, y).strokeColor('#DDDDDD').lineWidth(0.5).stroke();
  });

  const pr = order.pricing || {};
  y += 12;
  const row = (label, value, bold) => {
    doc.font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(bold ? 11 : 9).text(label, 350, y, { width: 120, align: 'right' }).text(value, 470, y, { width: 85, align: 'right' });
    y += bold ? 18 : 14;
  };
  row('Subtotal', inr(pr.subtotal));
  if (pr.couponDiscount) row(`Coupon${order.coupon && order.coupon.code ? ` (${order.coupon.code})` : ''}`, `- ${inr(pr.couponDiscount)}`);
  row('Shipping', pr.shipping ? inr(pr.shipping) : 'Free');
  row(pr.taxInclusive ? 'GST (included in prices)' : 'GST', inr(pr.tax));
  y += 2;
  doc.moveTo(350, y).lineTo(40 + W, y).strokeColor('#000000').lineWidth(1).stroke();
  y += 6;
  row('Total paid', inr(pr.total), true);

  doc.font('Helvetica').fontSize(8).fillColor('#666666').text(`This is a computer generated invoice. For help write to ${contact.email || ''}${contact.phone ? ` or call ${contact.phone}` : ''}.`, 40, doc.page.height - 70, { width: W, align: 'center' });
  doc.end();
}

module.exports = { streamInvoice };
