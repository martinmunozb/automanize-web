const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { test } = require('node:test');
const { join } = require('node:path');

const privacy = readFileSync(join(__dirname, '..', 'nize-privacy.html'), 'utf8');

test('la política explica el conector MCP de ChatGPT y Claude', () => {
  assert.match(privacy, /ChatGPT/);
  assert.match(privacy, /Claude/);
  assert.match(privacy, /revocar/i);
  assert.match(privacy, /permisos.*empresa|empresa.*permisos/is);
  assert.match(privacy, /no almacenamos.*conversacion/is);
});
