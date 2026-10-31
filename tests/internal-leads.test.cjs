const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
test("el apartado se integra con la sesión del panel y conserva secciones existentes", () => {
  const html = fs.readFileSync("panel-interno.html", "utf8");
  for (const section of ["finanzas", "altas", "crm", "recordatorios", "leads"])
    assert.ok(html.includes(`id="section-${section}"`), section);
  assert.ok(html.includes("internal-leads.js"));
  assert.ok(html.includes("internalLeads.open(db)"));
  assert.ok(html.includes("Automatización de leads"));
});
test("cliente usa bearer de sesión, no almacena secretos ni inyecta datos en HTML", () => {
  const source = fs.readFileSync("assets/js/internal-leads.js", "utf8");
  new vm.Script(source);
  assert.ok(source.includes("auth.getSession()"));
  assert.ok(source.includes("Bearer ${session.access_token}"));
  assert.ok(
    !/innerHTML|insertAdjacentHTML|localStorage|service_role|AIRTABLE_TOKEN|\.eval\(/.test(source),
  );
  assert.ok(source.includes("textContent"));
  for (const name of ["Leads", "Secuencias", "Conversaciones", "Configuración"])
    assert.ok(source.includes(name));
});
