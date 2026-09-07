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
  const css = read('assets/css/crm-embla-carousel.css');
  const js = read('assets/js/crm-embla-carousel.js');
  const containerBlock = cssBlock(css, '.crm-embla__container');

  const screenCards = [...page.matchAll(/class="[^"]*\bcrm-embla__figure\b[^"]*"[\s\S]*?data-story="([^"]+)"/g)].map((match) => match[1]);

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

  assert.match(page, /assets\/js\/embla-carousel\.umd\.js\?v=8\.6\.0/);
  assert.match(page, /class="crm-embla" data-crm-embla/);
  assert.match(page, /class="crm-embla__viewport" data-embla-main/);
  assert.match(page, /class="crm-embla-thumbs__viewport" data-embla-thumbs/);
  assert.match(page, /assets\/css\/crm-embla-carousel\.css\?v=20260818/);
  assert.match(page, /assets\/js\/crm-embla-carousel\.js\?v=20260818/);

  assert.match(css, /\.crm-embla__container\s*{[\s\S]*display:\s*flex;/);
  assert.match(css, /\.crm-embla__viewport\s*{[\s\S]*overflow:\s*hidden;/);
  assert.match(css, /\.crm-embla-thumbs__container\s*{[\s\S]*display:\s*flex;/);
  assert.match(css, /\.crm-embla__figure::after\s*{/);
  assert.match(css, /\.crm-embla__progress-bar\s*{[\s\S]*transform:\s*scaleX\(0\.1\);/);
  assert.doesNotMatch(containerBlock, /display:\s*grid;/);

  assert.match(js, /window\.EmblaCarousel/);
  assert.match(js, /mainApi\.scrollTo/);
  assert.match(js, /thumbsApi\.scrollTo/);
  assert.match(js, /function onSelect/);
  assert.match(js, /function preventClickAfterDrag/);
});
