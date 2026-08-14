const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const rootDir = path.resolve(__dirname, '..');

test('casos de exito no muestra Biscotto, TMM ni Azul Marino', () => {
  const page = fs.readFileSync(path.join(rootDir, 'casos-exito.html'), 'utf8');

  assert.doesNotMatch(page, /Biscotto|logoBiscotto|biscottocafe/i);
  assert.doesNotMatch(page, /TMM Control de Plagas|tmmlogo|controldeplagastmm/i);
  assert.doesNotMatch(page, /Azul Marino|azulmarino/i);
});

test('casos de exito mantiene los casos restantes', () => {
  const page = fs.readFileSync(path.join(rootDir, 'casos-exito.html'), 'utf8');

  assert.match(page, /Invicta Rent/);
  assert.match(page, /Vortex Rooms/);
  assert.match(page, /Manuel Conesa/);
});

test('casos de exito distribuye los tres casos en una fila de escritorio', () => {
  const page = fs.readFileSync(path.join(rootDir, 'casos-exito.html'), 'utf8');

  assert.match(page, /grid-cols-1 md:grid-cols-3/);
});
