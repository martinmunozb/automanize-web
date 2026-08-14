const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const rootDir = path.resolve(__dirname, '..');

test('todas las paginas versionan el javascript compartido de interfaz', () => {
  const htmlFiles = fs
    .readdirSync(rootDir)
    .filter((file) => file.endsWith('.html'));

  for (const file of htmlFiles) {
    const page = fs.readFileSync(path.join(rootDir, file), 'utf8');
    if (!page.includes('assets/js/automanize-ui.js')) continue;

    assert.match(
      page,
      /assets\/js\/automanize-ui\.js\?v=20260814/,
      `${file} debe cargar automanize-ui.js versionado`,
    );
    assert.doesNotMatch(
      page,
      /assets\/js\/automanize-ui\.js(["'])/,
      `${file} no debe cargar automanize-ui.js sin version`,
    );
  }
});

test('crm versiona el css de pantallas reales', () => {
  const page = fs.readFileSync(path.join(rootDir, 'crm.html'), 'utf8');

  assert.match(page, /assets\/css\/crm-apple-cards-carousel\.css\?v=20260814/);
});
