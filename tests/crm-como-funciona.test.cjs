const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const rootDir = path.resolve(__dirname, '..');

function readCrm() {
  return fs.readFileSync(path.join(rootDir, 'crm.html'), 'utf8');
}

test('crm incluye una seccion explicativa de como funciona Nize', () => {
  const page = readCrm();

  assert.match(page, /id="como-funciona"/);
  assert.match(page, /¿Cómo funciona\?/);
  assert.match(page, /CRM \+ WhatsApp/);
  assert.doesNotMatch(page, /dudas frecuentes/i);
});

test('crm explica los modulos principales del CRM', () => {
  const page = readCrm();

  assert.match(page, /<h3[^>]*>CRM<\/h3>/);
  for (const label of ['Panel de control', 'Inmuebles y habitaciones', 'Interesados', 'Propietarios', 'Inquilinos', 'Contratos', 'Cobros y gastos', 'Incidencias']) {
    assert.match(page, new RegExp(label));
  }
});

test('crm explica el asistente como crm mas whatsapp operativo', () => {
  const page = readCrm();

  assert.match(page, /<h3[^>]*>Asistente<\/h3>/);
  assert.match(page, /Atención por WhatsApp/);
  assert.match(page, /Enseña pisos por WhatsApp/);
  assert.match(page, /Panel de Interesados/);
  assert.match(page, /Agenda visitas en el CRM/);
  assert.match(page, /disponibilidad por zonas/);
  assert.match(page, /Recordatorios a inquilinos/);
  assert.match(page, /Pagos e incidencias/);
});

test('crm resuelve objeciones sobre importacion, arranque y automatizaciones', () => {
  const page = readCrm();

  assert.match(page, /Si estás pensando esto/);
  assert.match(page, /importación con IA/);
  assert.match(page, /2 minutos/);
  assert.match(page, /disponibilidad/);
  assert.match(page, /automatizaciones desde el CRM/);
});

test('hero enlaza a la nueva explicacion de funcionamiento', () => {
  const page = readCrm();

  assert.match(page, /href="#como-funciona"[\s\S]*Ver cómo funciona/);
});
