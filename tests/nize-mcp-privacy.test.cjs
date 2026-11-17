const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { test } = require('node:test');
const { join } = require('node:path');
const privacy = readFileSync(join(__dirname, '..', 'nize-privacy.html'), 'utf8');
test('la politica refleja el alcance documental autorizado del conector', () => {
  for (const pattern of [/ChatGPT/, /Claude/, /revocar/i, /empresa.*permisos/is, /no almacenamos.*conversacion/is,
    /documentos autorizados/, /vista previa/i, /10 minutos/, /16 minutos/, /no se crean enlaces publicos/i]) assert.match(privacy, pattern);
  assert.doesNotMatch(privacy, /excluye[^<]*archivos/i);
});
