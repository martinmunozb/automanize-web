const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const rootDir = path.resolve(__dirname, '..');

function read(file) {
  return fs.readFileSync(path.join(rootDir, file), 'utf8');
}

function cssBlock(css, selector) {
  const match = css.match(new RegExp(`${selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*{[^}]*}`));
  assert.ok(match, `No se encontro el bloque ${selector}`);
  return match[0];
}

test('crm muestra todas las pantallas reales con acordeon estilo React Bits', () => {
  const page = read('crm.html');
  const css = read('assets/css/crm-apple-cards-carousel.css');
  const js = read('assets/js/crm-apple-cards-carousel.js');
  const trackBlock = cssBlock(css, '.crm-stories__track');

  const screenCards = [...page.matchAll(/class="[^"]*\bcrm-story\b[^"]*"[\s\S]*?data-story="([^"]+)"/g)].map((match) => match[1]);

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

  assert.match(page, /cdn\.jsdelivr\.net\/npm\/gsap@3\.12\.5\/dist\/gsap\.min\.js/);
  assert.match(page, /class="crm-stories__track accordion-gallery"/);
  assert.match(page, /class="crm-story ag-panel"/);
  assert.match(page, /assets\/css\/crm-apple-cards-carousel\.css\?v=2026081403/);
  assert.match(page, /assets\/js\/crm-apple-cards-carousel\.js\?v=2026081403/);

  assert.match(css, /\.accordion-gallery\s*{[\s\S]*display:\s*flex;/);
  assert.match(css, /\.accordion-gallery\s*{[\s\S]*perspective:\s*1400px;/);
  assert.match(css, /\.ag-panel\s*{[\s\S]*will-change:\s*flex-grow,\s*transform;/);
  assert.match(css, /\.crm-story::after\s*{/);
  assert.match(css, /\.crm-stories__controls\s*{[\s\S]*display:\s*none;/);
  assert.doesNotMatch(trackBlock, /display:\s*grid;/);

  assert.match(js, /window\.gsap/);
  assert.match(js, /flexGrow/);
  assert.match(js, /rotateY/);
  assert.match(js, /function setActive/);
  assert.match(js, /ResizeObserver/);
});
