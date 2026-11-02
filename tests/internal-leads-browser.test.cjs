const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
test(
  "panel de leads: XSS, editor, pausa, sesión y responsive en Chromium",
  { skip: !process.env.PLAYWRIGHT_CORE },
  async (t) => {
    const { chromium } = require(process.env.PLAYWRIGHT_CORE);
    const browser = await chromium.launch({
      headless: true,
      executablePath: process.env.CHROMIUM_BIN,
    });
    t.after(() => browser.close());
    const page = await browser.newPage({ viewport: { width: 1360, height: 1000 } });
    const calls = [],
      dialogs = [];
    const config = {
      enabled: false,
      timezone: "Europe/Madrid",
      start: "09:00",
      end: "18:00",
      daily_limit: 50,
      min_gap_minutes: 60,
      weekdays: [1, 2, 3, 4, 5],
      mapping: {
        name: "NOMBRE",
        phone: "Teléfono",
        email: "Correo electrónico",
        date: "FECHA REGISTRO",
        source: "PROCEDENCIA",
        consent: "",
        evidence: "",
      },
    };
    const lead = {
      id: "00000000-0000-0000-0000-000000000001",
      name: '<img src=x onerror="window.xss=true">',
      phone: "34600000000",
      email: "demo@example.invalid",
      state: "paused",
      consent: false,
      blockers: ["Modo de pruebas: este número no está autorizado."],
      stop_text: "Una persona intervino desde el móvil o Seendy. El seguimiento se detuvo.",
    };
    const campaign = {
      id: "00000000-0000-0000-0000-00000000000c",
      name: "Seguimiento",
      active: true,
      steps: [
        { name: "Primero", template: "saludo", language: "es_ES", variables: [], delay_days: 0, weekdays: [1] },
        { name: "Apagado", enabled: false, template: "", language: "es_ES", variables: [], delay_days: 1, weekdays: [1] },
        { name: "Tercero", template: "cierre", language: "es_ES", variables: [], delay_days: 2, weekdays: [1] },
      ],
    };
    const templates = ["saludo", "recordatorio", "cierre"].map((name, i) => ({
      name,
      language: "es_ES",
      status: "APPROVED",
      category: "MARKETING",
      body: `Texto de ${name}`,
      parameters: i === 0 ? 2 : 0,
      supported: true,
    }));
    templates.push({ ...templates[1], name: "rechazada", status: "REJECTED" });
    page.on("dialog", (dialog) => {
      dialogs.push(dialog.message());
      dialog.accept();
    });
    await page.route("**/*", async (route) => {
      const req = route.request(),
        url = new URL(req.url());
      if (url.pathname.includes("internal-leads.css"))
        return route.fulfill({
          contentType: "text/css",
          body: fs.readFileSync(path.join(__dirname, "../assets/css/internal-leads.css"), "utf8"),
        });
      if (url.pathname === "/webhook/internal-leads") {
        const body =
          req.method() === "POST" ? req.postDataJSON() : Object.fromEntries(url.searchParams);
        calls.push(body);
        const result =
          body.action === "status"
            ? {
                config,
                airtable: { configured: true },
                whatsapp: { configured: true },
                test_phones: ["34600000000"],
                auto_send_enabled: false,
                test_only: true,
              }
            : body.action === "list"
              ? { items: [lead], total: 1 }
              : body.action === "campaigns"
                ? { items: [campaign] }
                : body.action === "events"
                  ? { items: [] }
                  : body.action === "templates"
                    ? { items: templates }
                    : body.action === "preview_schedule"
                      ? { items: body.steps.map((_, i) => `2026-11-0${3 + i}T09:00:00Z`) }
                      : body.action === "channel_check"
                        ? {
                            items: [
                              {
                                label: "WhatsApp puede iniciar conversaciones",
                                ok: false,
                                detail: "Meta bloquea el envío por un problema con el método de pago.",
                              },
                            ],
                          }
                        : {};
        return route.fulfill({
          json: { ok: true, result },
          headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "*" },
        });
      }
      await route.abort();
    });
    const panelCSS = fs
      .readFileSync(path.join(__dirname, "../panel-interno.html"), "utf8")
      .match(/<style>([\s\S]*?)<\/style>/)[1];
    await page.setContent(
      `<html><head><base href="https://automanize.com/"><style>${panelCSS}</style></head><body><div class="section active" style="padding:16px"><div id="internalLeadsRoot"></div></div></body></html>`,
    );
    await page.addScriptTag({ path: path.join(__dirname, "../assets/js/internal-leads.js") });
    await page.evaluate(() =>
      window.internalLeads.open({
        auth: {
          getSession: async () => ({ data: { session: { access_token: "synthetic-test-jwt" } } }),
          onAuthStateChange: (fn) => {
            window.signOutHook = fn;
          },
        },
      }),
    );
    await page.waitForFunction(() =>
      [...document.styleSheets].some((s) => s.href?.includes("internal-leads.css")),
    );
    assert.ok(
      await page.evaluate(() =>
        [...document.styleSheets].some((s) => s.href?.includes("internal-leads.css")),
      ),
      "La prueba debe cargar el CSS real del módulo",
    );
    assert.equal(await page.locator("tbody tr").count(), 1);
    assert.equal(await page.locator("tbody img").count(), 0);
    assert.equal(await page.evaluate(() => !!window.xss), false);
    await page.getByRole("button", { name: "Ayuda", exact: true }).click();
    assert.ok(await page.getByText("2 días después del primero", { exact: false }).count());
    if (process.env.LEADS_SCREENSHOT_PREFIX)
      await page.screenshot({
        path: `${process.env.LEADS_SCREENSHOT_PREFIX}-help.png`,
        fullPage: true,
      });
    await page.getByRole("button", { name: "Crear mi primera secuencia", exact: true }).click();
    await page.getByLabel("Días desde la activación", { exact: true }).fill("4");
    await page.getByRole("button", { name: "Usar ejemplo: 0, 2 y 5 días", exact: true }).click();
    assert.equal(await page.locator(".la-step").count(), 1);
    assert.equal(
      await page.getByLabel("Días desde la activación", { exact: true }).inputValue(),
      "4",
    );
    await page.getByLabel("Días desde la activación", { exact: true }).fill("0");
    await page.getByRole("button", { name: "Usar ejemplo: 0, 2 y 5 días", exact: true }).click();
    assert.equal(await page.locator(".la-step").count(), 3);
    assert.equal(
      await page.getByLabel("Días desde la activación", { exact: true }).inputValue(),
      "0",
    );
    assert.deepEqual(
      await page
        .getByLabel("Días desde el mensaje anterior", { exact: true })
        .evaluateAll((nodes) => nodes.map((n) => n.value)),
      ["2", "5"],
    );
    const templateSelect = (i) =>
      page.getByLabel("Plantilla aprobada de Meta", { exact: true }).nth(i);
    assert.equal(await templateSelect(0).locator('option[value^="rechazada"]').count(), 0);
    await templateSelect(0).selectOption("saludo|es_ES");
    await templateSelect(1).selectOption("recordatorio|es_ES");
    await templateSelect(2).selectOption("cierre|es_ES");
    assert.ok(await page.getByText("Texto: Texto de saludo").count());
    await page.getByLabel("Texto fijo del campo {{2}}", { exact: true }).fill("Automanize");
    await page.getByLabel("Campo {{1}} del mensaje 1", { exact: true }).selectOption("{{nombre}}");
    assert.ok(
      (await page.locator(".la-preview").first().textContent()).includes(
        "5 días después del mensaje anterior",
      ),
    );
    await page.getByRole("button", { name: "Bajar", exact: true }).first().click();
    assert.equal(await templateSelect(0).inputValue(), "recordatorio|es_ES");
    await page.getByRole("button", { name: "Subir", exact: true }).nth(1).click();
    assert.equal(await templateSelect(0).inputValue(), "saludo|es_ES");
    await page.getByLabel("Enviarle un mensaje", { exact: true }).first().check();
    await page.getByLabel("Plantilla si contesta", { exact: true }).selectOption("cierre|es_ES");
    assert.ok(
      (await page.locator(".la-preview").first().textContent()).includes("Si contesta: cierre"),
    );
    await page
      .getByLabel("Enviar si no contesta al mensaje anterior", { exact: true })
      .nth(1)
      .uncheck();
    assert.ok(await page.getByText("Desactivado: no se envía").count());
    assert.equal(
      await page.getByLabel("Enviar si no contesta al mensaje anterior", { exact: true }).count(),
      2,
      "El primer mensaje siempre se envía: no tiene interruptor",
    );
    await page.getByRole("button", { name: "Calcular fechas", exact: true }).click();
    await page.getByText("Si activas un contacto ahora").waitFor();
    await page.getByText("Mensaje 2: ", { exact: false }).waitFor();
    assert.equal(await page.locator("#laFeedback").textContent(), "");
    assert.equal(
      calls.find((c) => c.action === "preview_schedule").steps.length,
      2,
      "Un paso apagado no entra en el calendario",
    );
    await page.getByLabel("Nombre de la secuencia", { exact: true }).fill("Seguimiento de prueba");
    if (process.env.LEADS_SCREENSHOT_PREFIX)
      await page.screenshot({
        path: `${process.env.LEADS_SCREENSHOT_PREFIX}-editor.png`,
        fullPage: true,
      });
    await page.getByRole("button", { name: "Guardar nueva versión", exact: true }).click();
    await page.waitForFunction(() => !document.querySelector("[aria-busy=true]"));
    const saved = calls.find((c) => c.action === "save_campaign").campaign;
    assert.deepEqual(
      saved.steps.map((s) => s.delay_days),
      [0, 2, 5],
    );
    assert.deepEqual(saved.steps[0].variables, ["{{nombre}}", "Automanize"]);
    assert.equal(saved.steps[0].on_reply.enabled, true);
    assert.equal(saved.steps[0].on_reply.template, "cierre");
    assert.equal(saved.steps[1].on_reply, null);
    assert.equal(saved.steps[2].enabled, false);
    assert.equal(saved.steps[0].time, "");
    assert.equal(saved.active, false);
    await page.getByRole("button", { name: "Secuencias", exact: true }).click();
    await page.getByLabel("Nombre de la secuencia", { exact: true }).fill("Mi campaña");
    await page.getByRole("button", { name: "+ Añadir paso", exact: true }).click();
    assert.equal(
      await page.getByLabel("Nombre de la secuencia", { exact: true }).inputValue(),
      "Mi campaña",
    );
    await page.getByRole("button", { name: "Leads", exact: true }).click();
    assert.ok(await page.getByText("Modo de pruebas: este número no está autorizado.").count());
    assert.ok(await page.getByText("Una persona intervino", { exact: false }).count());
    await page.getByLabel("Secuencia", { exact: true }).selectOption(campaign.id);
    assert.deepEqual(
      await page.getByLabel("Empezar en", { exact: true }).locator("option").allTextContents(),
      ["Mensaje 1: Primero", "Mensaje 2: Tercero"],
      "Solo se puede empezar en pasos encendidos",
    );
    if (process.env.LEADS_SCREENSHOT_PREFIX)
      await page.screenshot({
        path: `${process.env.LEADS_SCREENSHOT_PREFIX}-leads.png`,
        fullPage: true,
      });
    await page.getByRole("checkbox").check();
    await page.getByRole("button", { name: "Pausar seleccionados" }).click();
    await page.waitForFunction(() => !document.querySelector("[aria-busy=true]"));
    assert.ok(calls.some((c) => c.action === "pause" && c.id === lead.id));
    await page.getByRole("button", { name: "Configuración", exact: true }).click();
    assert.equal(
      await page.getByLabel("Columna de Airtable: Nombre", { exact: true }).inputValue(),
      "NOMBRE",
    );
    await page.getByLabel("Enviar el primer mensaje automáticamente cada día", { exact: true }).check();
    assert.equal(
      await page.getByLabel("Hora de la revisión (Madrid)", { exact: true }).inputValue(),
      "10:00",
    );
    await page.getByLabel("Secuencia de la revisión", { exact: true }).selectOption(campaign.id);
    if (process.env.LEADS_SCREENSHOT_PREFIX)
      await page.screenshot({
        path: `${process.env.LEADS_SCREENSHOT_PREFIX}-config.png`,
        fullPage: true,
      });
    await page.getByRole("button", { name: "Guardar configuración", exact: true }).click();
    await page.waitForFunction(() => !document.querySelector("[aria-busy=true]"));
    const autoConfig = calls.find((c) => c.action === "save_config").config;
    assert.equal(autoConfig.auto_enabled, true);
    assert.equal(autoConfig.auto_time, "10:00");
    assert.equal(autoConfig.auto_campaign_id, campaign.id);
    assert.ok(dialogs.some((d) => d.includes("revisión diaria")));
    await page.getByRole("button", { name: "Comprobar canal", exact: true }).click();
    await page.getByText("método de pago", { exact: false }).waitFor();
    await page
      .getByLabel("Evidencia del consentimiento", { exact: true })
      .fill("Autorización del titular");
    await page.getByRole("button", { name: "Crear contacto de prueba", exact: true }).click();
    await page.waitForFunction(() => !document.querySelector("[aria-busy=true]"));
    const created = calls.find((c) => c.action === "test_lead");
    assert.equal(created.phone, "34600000000");
    assert.equal(created.consent_evidence, "Autorización del titular");
    await page.setViewportSize({ width: 390, height: 844 });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth));
    if (process.env.LEADS_SCREENSHOT)
      await page.screenshot({ path: process.env.LEADS_SCREENSHOT, fullPage: true });
    await page.evaluate(() => window.signOutHook("SIGNED_OUT"));
    assert.equal(await page.locator("#internalLeadsRoot").textContent(), "");
  },
);
