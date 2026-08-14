const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const rootDir = path.resolve(__dirname, '..');

test('el inicio tiene una llamada a la accion visible hacia Nize', () => {
  const home = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf8');

  assert.match(home, /class="brand-cta-row"/);
  assert.match(home, /href="crm\.html"[^>]*>[\s\S]*Ver Nize/);
});
