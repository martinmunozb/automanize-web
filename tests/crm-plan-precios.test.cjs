const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const rootDir = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(rootDir, file), 'utf8');

test('crm.html vende 3 planes: CRM por Stripe, Gold y Elite Gold por llamada', () => {
  const crm = read('crm.html');
  const js = read('assets/js/crm-pricing.js');
  assert.match(js, /PRECIOS = \{ 15: 27, 30: 54, 60: 81 \}/);
  assert.match(js, /81 \+ \(\(inmuebles - 60\) \/ 30\) \* 27/);
  assert.equal((crm.match(/<article class="crm-plan[ "]/g) || []).length, 3);
  assert.match(crm, /id="crmContratar"[^>]*data-inmuebles="15"/);
  assert.match(crm, /data-plan="Gold"/);
  assert.match(crm, /data-plan="Elite Gold"/);
  assert.match(crm, /2 usuarios/);
  assert.match(crm, /3 usuarios/);
  assert.doesNotMatch(crm, /[Pp]ack|[Ss]in l[ií]mite de/);
  assert.doesNotMatch(crm, /data-tier=|priceToggle|Hasta 3 pisos|7 días/);
});

test('Contratar va directo a Stripe y la cuenta se crea despues', () => {
  const js = read('assets/js/crm-pricing.js');
  const crm = read('crm.html');
  assert.match(js, /webhook\/crm-checkout/);
  assert.doesNotMatch(js, /trial-signup|checkout-directo/);
  assert.doesNotMatch(crm, /pricingForm|pricingModal/);
  assert.match(read('alta-crm.html'), /webhook\/crm-alta/);
});
