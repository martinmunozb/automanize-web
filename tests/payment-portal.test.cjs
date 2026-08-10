const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const rootDir = path.resolve(__dirname, '..');
const pagoHtml = fs.readFileSync(path.join(rootDir, 'pago.html'), 'utf8');

function loadPaymentHelpers() {
  const match = pagoHtml.match(/function normalizeMoney[\s\S]*?(?=\n  function isBlockedByManager)/);
  assert.ok(match, 'No se pudieron extraer los helpers de pago.html');

  const context = {};
  vm.createContext(context);
  vm.runInContext(`${match[0]}\nthis.helpers = { hasPendingBalance, isFuturePayment };`, context);
  return context.helpers;
}

test('no muestra una fianza ya pagada como pendiente aunque conserve importe', () => {
  const { hasPendingBalance } = loadPaymentHelpers();

  assert.equal(hasPendingBalance({
    tipo_pago: 'extra',
    concepto: 'Fianza',
    importe: 340,
    importe_inicial: 340,
    recibido: true,
    estado: 'Pagado',
  }), false);
});

test('mantiene una fianza no recibida como pendiente', () => {
  const { hasPendingBalance } = loadPaymentHelpers();

  assert.equal(hasPendingBalance({
    tipo_pago: 'extra',
    concepto: 'Fianza',
    importe: 340,
    importe_inicial: 340,
    recibido: false,
    estado: 'pendiente',
  }), true);
});
