const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { test } = require('node:test');
const vm = require('node:vm');

const html = readFileSync(join(__dirname, '../panel-interno.html'), 'utf8');
const form = html.slice(html.indexOf('  let finFormTipo'), html.indexOf('  // SECCIÓN: ALTAS DE AGENCIA'));

function financeForm(type, recurring = true) {
  const calls = [];
  const errors = [];
  const fields = {
    formNombre: { value: 'Licencia' },
    formTipo: { value: 'Software' },
    formImporte: { value: '30' },
    formFecha: { value: '2028-01-31' },
    formNotas: { value: '' },
    formRecurrente: { checked: recurring },
    formFrecuencia: { value: 'mensual' },
    formRepeticiones: { value: '3' },
    formSaveBtn: {},
  };
  const context = vm.createContext({
    document: { getElementById: (id) => fields[id] },
    crypto: { randomUUID: () => 'f7440b21-5cb1-49bb-9d07-ed69fba0461b' },
    db: { rpc: async (name, args) => { calls.push({ name, args }); return {}; } },
    showErr: (_id, message) => errors.push(message),
    hideEl: () => {},
  });
  vm.runInContext(form, context);
  vm.runInContext(`finFormTipo = '${type}'; finCloseForm = () => {}; finLoadData = async () => {};`, context);
  return { context, calls, errors, save: () => vm.runInContext('finSaveForm()', context) };
}

test('a recurring expense submits a single schedule and reuses its ID on retry', async () => {
  const { context, calls, errors, save } = financeForm('gasto');
  const rpc = context.db.rpc;
  context.db.rpc = async (...args) => {
    await rpc(...args);
    return { error: new Error('Conexión interrumpida') };
  };
  await save();
  assert.deepEqual(errors, ['Conexión interrumpida']);
  context.db.rpc = rpc;
  await save();
  assert.deepEqual(calls.map((call) => call.name), ['finanzas_programar_gasto', 'finanzas_programar_gasto']);
  assert.equal(calls[0].args.p_id, calls[1].args.p_id);
  assert.equal(calls[1].args.p_fecha, '2028-01-31');
  assert.equal(calls[1].args.p_repeticiones, 3);
});

test('single expenses and the existing recurring-income flow still use the corresponding upserts', async () => {
  const expense = financeForm('gasto', false);
  await expense.save();
  assert.deepEqual(expense.calls.map((call) => call.name), ['finanzas_upsert_gasto']);
  const income = financeForm('ingreso');
  await income.save();
  assert.ok(income.calls.every((call) => call.name === 'finanzas_upsert_ingreso'));
  assert.deepEqual(income.calls.map((call) => call.args.p_fecha), ['2028-01-31', '2028-02-29', '2028-03-31']);
});
