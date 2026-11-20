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

test('los 3 planes muestran la conexion con ChatGPT y Claude con sus logos', () => {
  const crm = read('crm.html');
  const bloques = crm.match(/<div class="crm-plan__ia">[\s\S]*?<\/div>/g) || [];
  assert.equal(bloques.length, 3);
  for (const bloque of bloques) {
    assert.match(bloque, /Conexión con ChatGPT y Claude/);
    assert.match(bloque, /src="assets\/images\/logos\/chatgpt\.svg"/);
    assert.match(bloque, /src="assets\/images\/logos\/claude\.svg"/);
  }
  assert.ok(fs.existsSync(path.join(rootDir, 'assets/images/logos/chatgpt.svg')));
  assert.ok(fs.existsSync(path.join(rootDir, 'assets/images/logos/claude.svg')));
  assert.match(crm, /rental-subpages\.css\?v=20261120-1/);
});

test('Contratar va directo a Stripe y la cuenta se crea despues', () => {
  const js = read('assets/js/crm-pricing.js');
  const crm = read('crm.html');
  assert.match(js, /webhook\/crm-checkout/);
  assert.doesNotMatch(js, /trial-signup|checkout-directo/);
  assert.doesNotMatch(crm, /pricingForm|pricingModal/);
  assert.match(read('alta-crm.html'), /webhook\/crm-alta/);
});
