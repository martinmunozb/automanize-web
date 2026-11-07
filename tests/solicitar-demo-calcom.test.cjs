const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const read = (file) => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');

test('solicitar-demo reserva por Cal.com y lleva a la pagina de gracias', () => {
  const html = read('solicitar-demo.html');
  const csp = html.match(/http-equiv="Content-Security-Policy"\s+content="([^"]+)"/)[1];

  assert.match(html, /calLink: 'automanize\/elitegold'/);
  assert.match(html, /bookingSuccessfulV2[\s\S]*gracias-demo\.html/);
  for (const directiva of ['script-src', 'frame-src', 'connect-src']) {
    assert.match(csp, new RegExp(`${directiva}[^;]*https://app\\.cal\\.com`), directiva);
  }
  assert.doesNotMatch(html, /trial-signup/);
  assert.ok(fs.existsSync(path.join(__dirname, '..', 'gracias-demo.html')));
});

test('solicitar-demo sigue confirmando el retorno de Stripe', () => {
  const html = read('solicitar-demo.html');
  assert.match(html, /get\('pago'\) === 'exitoso'/);
  assert.match(html, /Pago confirmado/);
});
