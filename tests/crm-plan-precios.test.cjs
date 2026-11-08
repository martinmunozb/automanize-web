const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const rootDir = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(rootDir, file), 'utf8');

test('crm.html vende el Plan CRM mensual con IVA aparte y mantiene Elite Gold', () => {
  const crm = read('crm.html');
  for (const [precio, inmuebles] of [['27', '15'], ['54', '30'], ['81', '60'], ['108', '90']]) {
    assert.match(crm, new RegExp(`crm-plan__amount[^>]*>${precio}€</span><span class="crm-plan__period">/mes \\+ IVA`));
    assert.match(crm, new RegExp(`data-inmuebles="${inmuebles}"`));
  }
  assert.match(crm, /\+27€ al mes por cada 30 inmuebles más/);
  assert.doesNotMatch(crm, /[Pp]ack/);
  assert.doesNotMatch(crm, /data-tier=|priceToggle|Hasta 3 pisos|7 días/);
  assert.match(crm, /js-open-elite-modal/);
});

test('el modal paga en Stripe y no crea pruebas gratis', () => {
  const js = read('assets/js/crm-pricing.js');
  assert.match(js, /webhook\/crm-checkout/);
  assert.doesNotMatch(js, /trial-signup|checkout-directo/);
});
