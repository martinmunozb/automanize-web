const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const rootDir = path.resolve(__dirname, '..');

function read(file) {
  return fs.readFileSync(path.join(rootDir, file), 'utf8');
}

test('el formulario publico del Plan CRM exige privacidad', () => {
  const crm = read('crm.html');
  const crmPricing = read('assets/js/crm-pricing.js');

  assert.match(crm, /id="pricingForm"[\s\S]*name="privacidad_aceptada" required/);
  assert.match(crm, /id="pricingForm"[\s\S]*nize-privacy\.html/);
  assert.match(crmPricing, /privacidad_aceptada:\s*datos\.privacidad_aceptada === 'on'/);
});
