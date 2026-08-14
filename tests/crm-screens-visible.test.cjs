const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const rootDir = path.resolve(__dirname, '..');

function read(file) {
  return fs.readFileSync(path.join(rootDir, file), 'utf8');
}

test('crm muestra todas las pantallas reales en una cuadricula visible', () => {
  const page = read('crm.html');
  const css = read('assets/css/crm-apple-cards-carousel.css');

  const screenCards = [...page.matchAll(/class="crm-story"[\s\S]*?data-story="([^"]+)"/g)].map((match) => match[1]);

  assert.deepEqual(screenCards, [
    'control',
    'inmuebles',
    'interesados',
    'propietarios',
    'calendario',
    'inquilinos',
    'contratos',
    'incidencias',
    'cobros',
    'gastos',
  ]);

  assert.match(css, /\.crm-stories__track\s*{[\s\S]*display:\s*grid;/);
  assert.match(css, /\.crm-stories__track\s*{[\s\S]*overflow:\s*visible;/);
  assert.match(css, /\.crm-stories__controls\s*{[\s\S]*display:\s*none;/);
  assert.doesNotMatch(css, /\.crm-stories__track\s*{[\s\S]*overflow-x:\s*auto;/);
  assert.match(page, /assets\/css\/crm-apple-cards-carousel\.css\?v=\d+/);
});
