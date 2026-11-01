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
    const calls = [];
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
      state: "new",
      consent: false,
    };
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
                whatsapp: { configured: false },
                auto_send_enabled: false,
                test_only: true,
              }
            : body.action === "list"
              ? { items: [lead], total: 1 }
              : body.action === "campaigns"
                ? { items: [] }
                : body.action === "events"
                  ? { items: [] }
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
    await page.getByLabel("Plantilla aprobada de Meta", { exact: true }).nth(0).fill("saludo");
    await page
      .getByLabel("Plantilla aprobada de Meta", { exact: true })
      .nth(1)
      .fill("recordatorio");
    await page.getByLabel("Plantilla aprobada de Meta", { exact: true }).nth(2).fill("cierre");
    await page
      .getByRole("button", { name: "+ Añadir campo rellenable", exact: true })
      .first()
      .click();
    await page.getByLabel("Parámetro 1 del mensaje 1", { exact: true }).fill("Hola {{nombre}}");
    assert.ok(
      (await page.locator(".la-preview").textContent()).includes("5 días después del mensaje 2"),
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
    assert.deepEqual(saved.steps[0].variables, ["Hola {{nombre}}"]);
    assert.equal(saved.active, false);
    await page.getByRole("button", { name: "Secuencias", exact: true }).click();
    await page.getByLabel("Nombre de la secuencia", { exact: true }).fill("Mi campaña");
    await page.getByRole("button", { name: "+ Añadir paso", exact: true }).click();
    assert.equal(
      await page.getByLabel("Nombre de la secuencia", { exact: true }).inputValue(),
      "Mi campaña",
    );
    await page.getByRole("button", { name: "Leads", exact: true }).click();
    await page.getByRole("checkbox").check();
    await page.getByRole("button", { name: "Pausar seleccionados" }).click();
    await page.waitForFunction(() => !document.querySelector("[aria-busy=true]"));
    assert.ok(calls.some((c) => c.action === "pause" && c.id === lead.id));
    await page.getByRole("button", { name: "Configuración", exact: true }).click();
    assert.equal(
      await page.getByLabel("Columna de Airtable: Nombre", { exact: true }).inputValue(),
      "NOMBRE",
    );
    await page.setViewportSize({ width: 390, height: 844 });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth));
    if (process.env.LEADS_SCREENSHOT)
      await page.screenshot({ path: process.env.LEADS_SCREENSHOT, fullPage: true });
    await page.evaluate(() => window.signOutHook("SIGNED_OUT"));
    assert.equal(await page.locator("#internalLeadsRoot").textContent(), "");
  },
);
