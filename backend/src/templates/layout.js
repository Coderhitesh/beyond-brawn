const env = require('../config/env');
const { formatINR } = require('../utils/helpers');

const C = { black: '#000000', ink: '#16181A', lime: '#A8E61D', paper: '#FFFFFF', mist: '#F3F4F1', line: '#E2E4DE', mute: '#6B7069' };

const esc = (s = '') => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const abs = (url = '') => (/^https?:\/\//.test(url) ? url : `${env.clientUrl}${url.startsWith('/') ? '' : '/'}${url}`);

const button = (label, href) =>
  `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0 4px"><tr><td bgcolor="${C.lime}" style="border-radius:4px"><a href="${abs(href)}" style="display:inline-block;padding:13px 26px;font:700 14px Arial,Helvetica,sans-serif;color:${C.black};text-decoration:none">${esc(label)}</a></td></tr></table>`;

const otpBox = (otp) =>
  `<div style="margin:22px 0;padding:18px;background:${C.mist};border-left:4px solid ${C.lime};font:700 32px 'Courier New',monospace;letter-spacing:8px;color:${C.black}">${esc(otp)}</div>`;

const p = (html) => `<p style="margin:0 0 14px;font:400 15px/1.6 Arial,Helvetica,sans-serif;color:${C.ink}">${html}</p>`;
const h1 = (text) => `<h1 style="margin:0 0 16px;font:800 24px/1.25 Arial,Helvetica,sans-serif;color:${C.black}">${esc(text)}</h1>`;
const small = (html) => `<p style="margin:14px 0 0;font:400 12px/1.5 Arial,Helvetica,sans-serif;color:${C.mute}">${html}</p>`;

function itemsTable(order) {
  const rows = (order.items || [])
    .map(
      (i) => `<tr>
        <td style="padding:10px 0;border-bottom:1px solid ${C.line};font:400 14px/1.4 Arial,sans-serif;color:${C.ink}">${esc(i.name)}${i.variantLabel ? `<br><span style="color:${C.mute};font-size:12px">${esc(i.variantLabel)}</span>` : ''}</td>
        <td align="center" style="padding:10px 8px;border-bottom:1px solid ${C.line};font:400 14px Arial,sans-serif;color:${C.ink}">${i.quantity}</td>
        <td align="right" style="padding:10px 0;border-bottom:1px solid ${C.line};font:700 14px Arial,sans-serif;color:${C.ink}">${formatINR(i.lineTotal)}</td>
      </tr>`
    )
    .join('');
  const pr = order.pricing || {};
  const line = (label, value, bold) =>
    `<tr><td colspan="2" align="right" style="padding:5px 8px 5px 0;font:${bold ? 700 : 400} 14px Arial,sans-serif;color:${C.ink}">${label}</td><td align="right" style="padding:5px 0;font:${bold ? 800 : 400} ${bold ? 16 : 14}px Arial,sans-serif;color:${C.black}">${value}</td></tr>`;
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:18px 0">
    <tr><th align="left" style="padding-bottom:8px;border-bottom:2px solid ${C.black};font:700 12px Arial,sans-serif;color:${C.mute}">Item</th><th style="padding-bottom:8px;border-bottom:2px solid ${C.black};font:700 12px Arial,sans-serif;color:${C.mute}">Qty</th><th align="right" style="padding-bottom:8px;border-bottom:2px solid ${C.black};font:700 12px Arial,sans-serif;color:${C.mute}">Amount</th></tr>
    ${rows}
    ${line('Subtotal', formatINR(pr.subtotal))}
    ${pr.couponDiscount ? line(`Coupon${order.coupon && order.coupon.code ? ` (${esc(order.coupon.code)})` : ''}`, `- ${formatINR(pr.couponDiscount)}`) : ''}
    ${line('Shipping', pr.shipping ? formatINR(pr.shipping) : 'Free')}
    ${pr.tax ? line(pr.taxInclusive ? 'GST (included)' : 'GST', formatINR(pr.tax)) : ''}
    ${line('Total', formatINR(pr.total), true)}
  </table>`;
}

function addressBlock(a) {
  if (!a) return '';
  return `<div style="margin:14px 0;padding:14px 16px;background:${C.mist};font:400 14px/1.6 Arial,sans-serif;color:${C.ink}"><strong>Delivering to</strong><br>${esc(a.fullName)}, ${esc(a.phone)}<br>${esc(a.line1)}${a.line2 ? `, ${esc(a.line2)}` : ''}<br>${esc(a.city)}, ${esc(a.state)} ${esc(a.pincode)}</div>`;
}

function layout({ title, preheader = '', body, brand = {} }) {
  const name = (brand.general && brand.general.siteName) || 'Beyond Brawn';
  const tagline = (brand.general && brand.general.tagline) || '';
  const contact = brand.contact || {};
  const logo = brand.general && brand.general.logoDarkUrl ? abs(brand.general.logoDarkUrl) : '';
  const header = logo
    ? `<img src="${logo}" alt="${esc(name)}" height="40" style="display:block;height:40px;border:0;color:${C.paper};font:800 20px Arial,sans-serif">`
    : `<span style="font:800 20px Arial,sans-serif;letter-spacing:1px;color:${C.paper}">BEYOND <span style="color:${C.lime}">BRAWN</span></span>`;
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>${esc(title)}</title></head>
<body style="margin:0;padding:0;background:${C.mist}">
<div style="display:none;max-height:0;overflow:hidden;opacity:0">${esc(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="${C.mist}"><tr><td align="center" style="padding:24px 12px">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:${C.paper}">
    <tr><td bgcolor="${C.black}" style="padding:22px 28px;border-bottom:4px solid ${C.lime}"><a href="${env.clientUrl}" style="text-decoration:none">${header}</a></td></tr>
    <tr><td style="padding:32px 28px 28px">${body}</td></tr>
    <tr><td bgcolor="${C.black}" style="padding:20px 28px;font:400 12px/1.6 Arial,sans-serif;color:#B9BDB5">
      <strong style="color:${C.paper}">${esc(name)}</strong>${tagline ? `<br>${esc(tagline)}` : ''}<br>
      ${contact.email ? `<a href="mailto:${esc(contact.email)}" style="color:${C.lime};text-decoration:none">${esc(contact.email)}</a>` : ''}${contact.phone ? ` &nbsp;|&nbsp; ${esc(contact.phone)}` : ''}<br>
      ${contact.address ? esc(contact.address) : ''}
    </td></tr>
  </table>
</td></tr></table></body></html>`;
}

module.exports = { C, esc, abs, button, otpBox, p, h1, small, itemsTable, addressBlock, layout };
