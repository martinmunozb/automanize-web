const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const rootDir = path.resolve(__dirname, '..');

function read(file) {
  return fs.readFileSync(path.join(rootDir, file), 'utf8');
}

test('el formulario publico del Plan CRM exige privacidad', () => {
  const alta = read('alta-crm.html');

  assert.match(alta, /id="altaForm"[\s\S]*name="privacidad_aceptada" required/);
  assert.match(alta, /id="altaForm"[\s\S]*nize-privacy\.html/);
  assert.match(alta, /privacidad_aceptada:\s*datos\.privacidad_aceptada === 'on'/);
});
