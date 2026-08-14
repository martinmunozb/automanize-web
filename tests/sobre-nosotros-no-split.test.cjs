const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const rootDir = path.resolve(__dirname, '..');

test('sobre nosotros no usa animacion de letras al entrar', () => {
  const page = fs.readFileSync(path.join(rootDir, 'sobre-nosotros.html'), 'utf8');

  assert.doesNotMatch(page, /data-split/);
});
