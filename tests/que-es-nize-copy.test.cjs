const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const rootDir = path.resolve(__dirname, '..');

function read(file) {
  return fs.readFileSync(path.join(rootDir, file), 'utf8');
}

test('el dock presenta la llamada como Qué es Nize', () => {
  const ui = read('assets/js/automanize-ui.js');

  assert.match(ui, /data-title="¿Qué es Nize\?"/);
  assert.match(ui, />¿Qué es Nize\?</);
  assert.doesNotMatch(ui, /data-title="Consultoría"/);
  assert.doesNotMatch(ui, />Consultoría</);
});

test('el paso 1 explica Nize y recoge datos de gestión de alquileres', () => {
  const page = read('consultoria-gratuita.html');

  assert.match(page, /<title>¿Qué es Nize\? - Automanize<\/title>/);
  assert.match(page, /Descubre qué es Nize y agenda una llamada/);
  assert.match(page, /Paso 1 de 2/);
  assert.match(page, /¿Qué es Nize\?/);
  assert.match(page, /Tipo de gestión/);
  assert.match(page, /Número de pisos o habitaciones/);
  assert.match(page, /Qué quieres resolver con Nize/);
  assert.doesNotMatch(page, /consultoría gratuita/i);
});

test('el paso 2 agenda una llamada para ver cómo encaja Nize', () => {
  const page = read('agendar-llamada.html');

  assert.match(page, /<title>Agenda tu llamada sobre Nize - Automanize<\/title>/);
  assert.match(page, /Agenda una llamada para ver cómo encaja Nize/);
  assert.match(page, /Tipo de gestión/);
  assert.match(page, /Cartera/);
  assert.match(page, /Qué quiere resolver/);
  assert.doesNotMatch(page, /consultoría gratuita/i);
});
