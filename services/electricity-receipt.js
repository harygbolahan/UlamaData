// Printable electricity token receipt (HTML for expo-print). Deliberately different from the
// generic transaction receipt: the token and units are the point of the document.

const escapeHtml = (value) => String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const formatNaira = (amount) => {
    const num = parseFloat(String(amount ?? '').replace(/[^\d.]/g, ''));
    return Number.isFinite(num) ? `₦${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '';
};

/**
 * @param {object} r
 * @param {string} r.token, r.units, r.meterNumber, r.meterType, r.disco, r.customerName,
 *   r.customerAddress, r.amount, r.reference, r.date, r.status
 * @param {string} [accent] brand colour
 */
export const generateElectricityReceiptHTML = (r, accent = '#1E1B8B') => {
    const rows = [
        ['Meter Number', r.meterNumber],
        ['Meter Type', r.meterType],
        ['Customer Name', r.customerName],
        ['Address', r.customerAddress],
        ['Disco', r.disco],
        ['Amount Paid', formatNaira(r.amount)],
        ['Reference', r.reference],
        ['Date', r.date],
    ].filter(([, value]) => value);

    const status = r.status || 'Completed';
    const statusColor = /fail/i.test(status) ? '#DC2626' : /refund/i.test(status) ? '#2563EB' : /process|pend/i.test(status) ? '#D97706' : '#16A34A';

    return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: #fff; color: #111; padding: 32px; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
.slip { max-width: 560px; margin: 0 auto; border: 1px solid #E5E7EB; border-radius: 18px; overflow: hidden; }
.band { background: ${accent}; color: #fff; padding: 22px 28px; display: flex; justify-content: space-between; align-items: center; }
.brand { font-size: 22px; font-weight: 800; letter-spacing: -0.4px; }
.band-sub { font-size: 11px; opacity: 0.8; text-transform: uppercase; letter-spacing: 1.4px; margin-top: 3px; }
.bolt { width: 44px; height: 44px; border-radius: 50%; background: rgba(255,255,255,0.16); display: flex; align-items: center; justify-content: center; font-size: 24px; }
.disco-row { display: flex; justify-content: space-between; align-items: center; padding: 18px 28px; border-bottom: 1px dashed #D1D5DB; }
.disco { font-size: 17px; font-weight: 700; }
.status { font-size: 11px; font-weight: 700; color: #fff; background: ${statusColor}; padding: 5px 12px; border-radius: 99px; text-transform: uppercase; letter-spacing: 0.6px; }
.token-wrap { padding: 26px 28px 22px; text-align: center; }
.token-label { font-size: 11px; font-weight: 700; color: #6B7280; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 12px; }
.token { display: inline-block; font-family: 'Courier New', Courier, monospace; font-size: 26px; font-weight: 700; letter-spacing: 2px; color: #111; border: 2px solid #111; border-radius: 12px; padding: 14px 18px; word-break: break-all; }
.units { margin-top: 16px; display: inline-flex; align-items: baseline; gap: 6px; background: #FEF3C7; color: #92400E; border-radius: 99px; padding: 8px 18px; }
.units-value { font-size: 20px; font-weight: 800; }
.units-label { font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; }
table { width: 100%; border-collapse: collapse; }
td { padding: 11px 28px; font-size: 13px; vertical-align: top; border-top: 1px solid #F3F4F6; }
td.k { color: #6B7280; width: 38%; }
td.v { font-weight: 600; text-align: right; word-break: break-word; }
.howto { margin: 6px 28px 0; padding: 14px 16px; background: #F9FAFB; border-radius: 12px; font-size: 12px; color: #374151; line-height: 1.6; }
.howto b { color: #111; }
.foot { text-align: center; padding: 20px 28px 24px; font-size: 11px; color: #9CA3AF; line-height: 1.6; }
.foot .brand-small { color: ${accent}; font-weight: 700; font-size: 13px; }
</style>
</head>
<body>
<div class="slip">
  <div class="band">
    <div>
      <div class="brand">UlamaData</div>
      <div class="band-sub">Electricity Token Receipt</div>
    </div>
    <div class="bolt">⚡</div>
  </div>

  <div class="disco-row">
    <div class="disco">${escapeHtml(r.disco || 'Electricity')}</div>
    <div class="status">${escapeHtml(status)}</div>
  </div>

  ${r.token ? `<div class="token-wrap">
    <div class="token-label">Meter Token</div>
    <div class="token">${escapeHtml(r.token)}</div>
    ${r.units ? `<div><div class="units"><span class="units-value">${escapeHtml(r.units)}</span><span class="units-label">kWh Units</span></div></div>` : ''}
  </div>` : ''}

  <table>
    ${rows.map(([k, v]) => `<tr><td class="k">${escapeHtml(k)}</td><td class="v">${escapeHtml(v)}</td></tr>`).join('')}
  </table>

  ${r.token ? `<div class="howto"><b>How to load:</b> enter the 20-digit token on your meter keypad and press <b>Enter</b>. Keep this receipt until the units reflect on your meter.</div>` : ''}

  <div class="foot">
    <div class="brand-small">UlamaData</div>
    This is a computer-generated receipt. For support, contact us via the app.
  </div>
</div>
</body>
</html>`;
};
