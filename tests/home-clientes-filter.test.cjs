const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const rootDir = path.resolve(__dirname, '..');

test('home no muestra Biscotto, TMM ni Azul Marino en empresas que confian', () => {
  const page = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf8');

  assert.doesNotMatch(page, /Biscotto|logoBiscotto|biscottocafe/i);
  assert.doesNotMatch(page, /TMM Control de Plagas|logo-tmm|tmmlogo|controldeplagastmm/i);
  assert.doesNotMatch(page, /Azul Marino|azulmarino/i);
});

test('home mantiene los logos restantes de empresas que confian', () => {
  const page = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf8');

  assert.match(page, /Manuel Conesa/);
  assert.match(page, /Invicta Rent/);
  assert.match(page, /Vortex Rooms/);
});
