/* Automatización comercial: la autorización y los secretos viven en backend. */
(() => {
  "use strict";
  const API = "https://backend.automanize.com/webhook/internal-leads";
  const labels = {
    new: "Nuevo",
    pending: "Pendiente",
    active: "Activo",
    paused: "Pausado",
    responded: "Respondido",
    finished: "Finalizado",
    error: "Error",
    opted_out: "Baja",
  };
  let db,
    root,
    view = "Leads",
    status = null,
    leads = [],
    campaigns = [],
    total = 0,
    page = 0,
    search = "",
    filter = "",
    selected = new Set(),
    conversation = null,
    steps = [],
    campaignName = "",
    campaignActive = false,
    busy = false,
    refreshTimer,
    manualDraft = null,
    sessionGeneration = 0;
  const el = (tag, text, className) => {
    const n = document.createElement(tag);
    if (text !== undefined) n.textContent = text;
    if (className) n.className = className;
    return n;
  };
  const button = (text, action, accent = false) => {
    const b = el("button", text, `btn btn-sm ${accent ? "btn-accent" : "btn-ghost"}`);
    b.type = "button";
    b.addEventListener("click", () => run(action));
    return b;
  };
  const date = (value) =>
    value ? new Date(value).toLocaleString("es-ES", { timeZone: "Europe/Madrid" }) : "—";
  const field = (parent, label, type = "text", value = "") => {
    const box = el("label", undefined, "la-field");
    box.append(el("span", label));
    const input = el(type === "textarea" ? "textarea" : "input");
    if (type !== "textarea") input.type = type;
    input.value = value;
    box.append(input);
    parent.append(box);
    return input;
  };
  const select = (parent, label, options, value) => {
    const box = el("label", undefined, "la-field");
    box.append(el("span", label));
    const input = el("select");
    for (const [v, t] of options) {
      const o = el("option", t);
      o.value = v;
      input.append(o);
    }
    input.value = value;
    box.append(input);
    parent.append(box);
    return input;
  };
  const note = (parent, text) => parent.append(el("p", text, "la-note"));
  const error = (message) => {
    const n = document.getElementById("laFeedback");
    if (n) {
      n.textContent = message;
      n.className = "la-feedback";
    }
  };
  async function run(action) {
    if (busy) return;
    busy = true;
    root?.setAttribute("aria-busy", "true");
    try {
      await action();
    } catch (e) {
      error(e.message || "No se pudo completar la operación");
    } finally {
      busy = false;
      root?.removeAttribute("aria-busy");
    }
  }
  async function api(action, data, method = data ? "POST" : "GET") {
    const generation = sessionGeneration;
    const {
      data: { session },
    } = await db.auth.getSession();
    if (!session) throw new Error("Inicia sesión para acceder a los leads");
    const url = new URL(API);
    if (method === "GET") {
      url.searchParams.set("action", action);
      for (const [k, v] of Object.entries(data || {})) url.searchParams.set(k, String(v));
    }
    let response;
    try {
      response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        ...(method === "POST" ? { body: JSON.stringify({ ...data, action }) } : {}),
        signal: AbortSignal.timeout(45000),
      });
    } catch {
      throw new Error("No se pudo contactar con el módulo. Comprueba el despliegue del backend.");
    }
    const body = await response.json().catch(() => ({}));
    if (generation !== sessionGeneration) throw new Error("La sesión ha cambiado");
    if (!response.ok || !body.ok) throw new Error(body.error || `Error ${response.status}`);
    return body.result;
  }
  async function loadLeads() {
    const r = await api("list", { page, search, state: filter }, "GET");
    leads = r.items;
    total = r.total;
    selected.clear();
  }
  async function load() {
    [status, { items: campaigns }] = await Promise.all([api("status"), api("campaigns")]);
    await loadLeads();
    render();
  }
  function shell() {
    root.replaceChildren();
    const heading = el("div", undefined, "la-heading");
    heading.append(el("div", "Automatización de leads", "la-title"), button("Actualizar", load));
    root.append(heading);
    note(root, "Contactos comerciales de Automanize · Airtable → WhatsApp · Europe/Madrid");
    const banner = el(
      "div",
      status
        ? status.auto_send_enabled
          ? status.test_only
            ? "Modo de pruebas: solo números autorizados"
            : "Envíos habilitados en servidor"
          : "Envíos desactivados en servidor"
        : "Conexión pendiente con el módulo del backend",
      "la-banner",
    );
    root.append(banner);
    const tabs = el("div", undefined, "la-tabs");
    for (const name of ["Leads", "Secuencias", "Conversaciones", "Configuración"]) {
      const b = button(name, async () => {
        view = name;
        render();
      });
      if (view === name) b.classList.add("active");
      tabs.append(b);
    }
    root.append(tabs);
    const feedback = el("div", "", "la-feedback");
    feedback.id = "laFeedback";
    feedback.setAttribute("role", "status");
    root.append(feedback);
    const content = el("div", undefined, "la-content");
    root.append(content);
    return content;
  }
  function render() {
    const content = shell();
    if (view === "Leads") renderLeads(content);
    else if (view === "Secuencias") renderCampaigns(content);
    else if (view === "Conversaciones") renderInbox(content);
    else renderConfig(content);
  }
  function renderLeads(parent) {
    const stats = el("div", undefined, "la-stats");
    for (const [label, value] of [
      ["Total filtrado", total],
      ["Activos en página", leads.filter((l) => l.state === "active").length],
      ["Respondidos en página", leads.filter((l) => l.state === "responded").length],
      ["Sin consentimiento en página", leads.filter((l) => !l.consent).length],
    ]) {
      const card = el("div", undefined, "stat-card");
      card.append(el("div", label, "stat-label"), el("div", String(value), "stat-value"));
      stats.append(card);
    }
    parent.append(stats);
    const tools = el("div", undefined, "la-tools");
    const find = field(tools, "Buscar", "search", search);
    find.placeholder = "Nombre, teléfono o email";
    const state = select(tools, "Estado", [["", "Todos"], ...Object.entries(labels)], filter);
    tools.append(
      button("Buscar", async () => {
        search = find.value;
        filter = state.value;
        page = 0;
        await loadLeads();
        render();
      }),
      button(
        "Sincronizar Airtable",
        async () => {
          const r = await api("sync", {});
          await load();
          error(
            `Sincronización: ${r.imported} revisados, ${r.rejected} requieren revisión. Ninguno activado automáticamente.`,
          );
        },
        true,
      ),
    );
    parent.append(tools);
    parent.append(
      button("Pausar seleccionados", async () => {
        if (!selected.size) return;
        for (const id of [...selected]) await api("pause", { id });
        await loadLeads();
        render();
      }),
    );
    const wrap = el("div", undefined, "la-table-wrap"),
      table = el("table");
    const head = el("tr");
    for (const name of [
      "Seleccionar",
      "Contacto",
      "Entrada / origen",
      "Estado",
      "Paso",
      "Último mensaje",
      "Próximo envío",
      "Acciones",
    ])
      head.append(el("th", name));
    const thead = el("thead");
    thead.append(head);
    table.append(thead);
    const body = el("tbody");
    for (const lead of leads) {
      const row = el("tr");
      const checkCell = el("td"),
        check = el("input");
      check.type = "checkbox";
      check.setAttribute("aria-label", `Seleccionar ${lead.name || lead.phone}`);
      check.addEventListener("change", () =>
        check.checked ? selected.add(lead.id) : selected.delete(lead.id),
      );
      checkCell.append(check);
      row.append(checkCell);
      const contact = el("td");
      contact.append(
        el("strong", lead.name || "Sin nombre"),
        el("div", "+" + lead.phone),
        el("small", lead.email || ""),
      );
      row.append(contact);
      const origin = el("td");
      origin.append(el("div", lead.entry_date || "—"), el("small", lead.source || "—"));
      row.append(origin);
      const stateCell = el("td");
      stateCell.append(el("span", labels[lead.state] || lead.state, "la-state"));
      if (!lead.consent) stateCell.append(el("small", "Sin consentimiento acreditado"));
      row.append(stateCell);
      row.append(
        el(
          "td",
          lead.snapshot
            ? `${Math.min(lead.step + 1, lead.snapshot.length)} / ${lead.snapshot.length}`
            : "—",
        ),
        el("td", lead.last_message || "—"),
        el("td", date(lead.next_due)),
      );
      const actions = el("td");
      actions.append(
        button("Conversación", async () => {
          conversation = lead;
          view = "Conversaciones";
          render();
        }),
      );
      if (lead.state === "active")
        actions.append(
          button("Pausar", async () => {
            await api("pause", { id: lead.id });
            await loadLeads();
            render();
          }),
        );
      else if (!["responded", "finished", "opted_out", "error"].includes(lead.state)) {
        const choice = select(
          actions,
          "Secuencia",
          [["", "Seleccionar"], ...campaigns.filter((c) => c.active).map((c) => [c.id, c.name])],
          lead.campaign_id || "",
        );
        const activate = button(
          lead.snapshot ? "Reanudar" : "Activar",
          async () => {
            if (!lead.snapshot && !choice.value) throw new Error("Selecciona una secuencia");
            await api("activate", { id: lead.id, campaign_id: choice.value });
            await loadLeads();
            render();
          },
          true,
        );
        activate.disabled = !lead.consent;
        actions.append(activate);
      }
      row.append(actions);
      body.append(row);
    }
    table.append(body);
    wrap.append(table);
    parent.append(wrap);
    if (!leads.length)
      note(
        parent,
        status
          ? "No hay contactos con estos filtros. Sincroniza Airtable para importarlos sin activar envíos."
          : "El módulo aún no está disponible en el servidor.",
      );
    const pages = el("div", undefined, "la-tools");
    const prev = button("Anterior", async () => {
      page--;
      await loadLeads();
      render();
    });
    prev.disabled = page === 0;
    const next = button("Siguiente", async () => {
      page++;
      await loadLeads();
      render();
    });
    next.disabled = (page + 1) * 50 >= total;
    pages.append(prev, el("span", `Página ${page + 1} · 50 contactos por página`), next);
    parent.append(pages);
  }
  const newStep = () => ({
    name: "",
    template: "",
    language: "es_ES",
    variables: [],
    delay_days: 0,
    time: "10:00",
    weekdays: [1, 2, 3, 4, 5],
    only_if_no_reply: true,
  });
  function renderCampaigns(parent) {
    note(
      parent,
      "Editar guarda una versión nueva. Los leads ya activados conservan los pasos originales. Una respuesta o baja detiene siempre el seguimiento.",
    );
    const list = el("div", undefined, "la-tools");
    for (const c of campaigns) {
      const card = el("div", undefined, "la-card");
      card.append(
        el("strong", c.name),
        el("p", `${c.steps.length} pasos · ${c.active ? "Activa" : "Pausada"}`),
        button("Editar como nueva versión", async () => {
          steps = structuredClone(c.steps);
          campaignName = c.name + " · nueva versión";
          campaignActive = false;
          render();
        }),
        button(c.active ? "Pausar campaña" : "Activar campaña", async () => {
          await api("campaign_state", { id: c.id, active: !c.active });
          await load();
        }),
      );
      list.append(card);
    }
    parent.append(list);
    const form = el("div", undefined, "la-card");
    const name = field(form, "Nombre de la secuencia", "text", campaignName);
    name.id = "laCampaignName";
    name.addEventListener("input", () => (campaignName = name.value));
    const active = field(form, "Activar esta versión", "checkbox");
    active.checked = campaignActive;
    active.addEventListener("change", () => (campaignActive = active.checked));
    if (!steps.length) steps = [newStep()];
    const editor = el("div");
    steps.forEach((step, index) => {
      const card = el("div", undefined, "la-step");
      card.append(el("h3", `Paso ${index + 1}`));
      const grid = el("div", undefined, "la-form-grid");
      for (const [key, label, type] of [
        ["name", "Nombre", "text"],
        ["template", "Plantilla aprobada de Meta", "text"],
        ["language", "Idioma", "text"],
        ["delay_days", "Días desde el paso anterior", "number"],
        ["time", "Hora de envío (Madrid)", "time"],
      ]) {
        const input = field(grid, label, type, step[key]);
        if (type === "number") {
          input.min = "0";
          input.max = "365";
        }
        input.addEventListener("input", () => {
          step[key] = type === "number" ? Number(input.value) : input.value;
          preview();
        });
      }
      const variables = field(
        grid,
        "Variables de cuerpo (una por línea)",
        "textarea",
        step.variables.join("\n"),
      );
      variables.placeholder = "{{nombre}}";
      variables.addEventListener("input", () => {
        step.variables = variables.value.split("\n").filter(Boolean);
        preview();
      });
      card.append(grid);
      const days = el("div", undefined, "la-tools");
      ["D", "L", "M", "X", "J", "V", "S"].forEach((label, d) => {
        const wrap = el("label", label, "la-day"),
          input = el("input");
        input.type = "checkbox";
        input.checked = step.weekdays.includes(d);
        input.addEventListener("change", () => {
          step.weekdays = input.checked
            ? [...new Set([...step.weekdays, d])]
            : step.weekdays.filter((v) => v !== d);
          preview();
        });
        wrap.prepend(input);
        days.append(wrap);
      });
      card.append(days);
      note(card, "Solo enviar si no ha respondido: obligatorio");
      card.append(
        button("Eliminar paso", async () => {
          steps.splice(index, 1);
          render();
        }),
      );
      editor.append(card);
    });
    form.append(editor);
    form.append(
      button("+ Añadir paso", async () => {
        steps.push(newStep());
        render();
      }),
    );
    const summary = el("div", undefined, "la-preview");
    form.append(summary);
    function preview() {
      summary.replaceChildren(el("strong", "Vista previa"));
      steps.forEach((s, i) =>
        summary.append(
          el(
            "p",
            `${i + 1}. ${s.name || s.template || "Plantilla pendiente"} · +${s.delay_days} días · ${s.time || "primera hora permitida"} · ${s.variables.join(" / ")}`,
          ),
        ),
      );
    }
    preview();
    note(
      form,
      "Variables disponibles: {{nombre}}, {{telefono}}, {{email}}, {{origen}}. Por ahora se admiten plantillas con parámetros de texto en el cuerpo.",
    );
    form.append(
      button(
        "Guardar nueva versión",
        async () => {
          await api("save_campaign", {
            campaign: { name: name.value, active: active.checked, steps },
          });
          steps = [];
          campaignName = "";
          campaignActive = false;
          await load();
        },
        true,
      ),
    );
    parent.append(form);
  }
  function renderInbox(parent) {
    const layout = el("div", undefined, "la-inbox"),
      list = el("div", undefined, "la-inbox-list"),
      chat = el("div", undefined, "la-chat");
    list.append(el("h3", "Conversaciones"));
    note(list, "Contactos de la página actual de Leads. Usa su búsqueda para localizar otros.");
    for (const l of leads)
      list.append(
        button(`${l.name || l.phone} · ${labels[l.state]}`, async () => {
          conversation = l;
          manualDraft = null;
          render();
        }),
      );
    layout.append(list, chat);
    parent.append(layout);
    if (!conversation) {
      note(chat, "Selecciona un contacto para consultar los mensajes.");
      return;
    }
    const lead = conversation;
    chat.append(el("h3", lead.name || "+" + lead.phone));
    note(
      chat,
      `+${lead.phone} · ${labels[lead.state]} · ${lead.consent ? "Consentimiento acreditado" : "Consentimiento pendiente"}`,
    );
    chat.append(
      button("Pausar seguimiento", async () => {
        await api("pause", { id: lead.id });
        await loadLeads();
        conversation = leads.find((l) => l.id === lead.id) || lead;
        render();
      }),
    );
    const history = el("div", undefined, "la-history");
    history.id = "laHistory";
    chat.append(history);
    showHistory(lead.id).catch((e) => error(e.message));
    const text = field(
      chat,
      "Mensaje manual (dentro de las 24 h desde la última respuesta)",
      "textarea",
    );
    text.maxLength = 4000;
    text.addEventListener("input", () => {
      manualDraft = null;
    });
    const template = select(
      chat,
      "O usar plantilla",
      [
        ["", "Seleccionar plantilla"],
        ...campaigns.flatMap((c) =>
          c.steps.map((s) => [JSON.stringify(s), `${s.template} · ${s.language}`]),
        ),
      ],
      "",
    );
    note(
      chat,
      "Enviar manualmente pausa la secuencia. Fuera de 24 horas se requiere una plantilla aprobada. Los mensajes del móvil dependen de los eventos de coexistencia recibidos.",
    );
    const send = button(
      "Enviar mensaje",
      async () => {
        if (!text.value.trim() && !template.value)
          throw new Error("Escribe un mensaje o selecciona una plantilla");
        if (!manualDraft)
          manualDraft = {
            id: lead.id,
            request_id: crypto.randomUUID(),
            ...(text.value.trim()
              ? { text: text.value.trim() }
              : { template: JSON.parse(template.value) }),
          };
        await api("manual", manualDraft);
        manualDraft = null;
        text.value = "";
        await showHistory(lead.id);
        error("Mensaje en cola. Revisa el estado de entrega antes de repetirlo.");
      },
      true,
    );
    send.disabled =
      !status?.auto_send_enabled ||
      !status?.config.enabled ||
      !lead.consent ||
      lead.state === "opted_out";
    template.addEventListener("change", () => (manualDraft = null));
    chat.append(send);
  }
  async function showHistory(id) {
    const r = await api("events", { id }, "GET");
    const target = document.getElementById("laHistory");
    if (!target || conversation?.id !== id || view !== "Conversaciones") return;
    target.replaceChildren();
    if (!r.items.length)
      note(
        target,
        "No hay mensajes registrados por este módulo. No se presume una sincronización completa del historial.",
      );
    for (const message of r.items) {
      const card = el(
        "div",
        undefined,
        `la-bubble ${message.kind === "outbound" || message.kind === "manual" ? "la-out" : ""}`,
      );
      card.append(
        el("div", message.body || message.kind),
        el("small", `${date(message.at)} · ${message.status || message.kind}`),
      );
      target.append(card);
    }
    target.scrollTop = target.scrollHeight;
  }
  function renderConfig(parent) {
    if (!status) {
      note(parent, "Pulsa Actualizar para comprobar si el backend del módulo está disponible.");
      return;
    }
    const cfg = status.config,
      card = el("div", undefined, "la-card");
    card.append(el("h3", "Conexiones"));
    note(
      card,
      `Airtable: ${status.airtable.configured ? "credencial configurada" : "pendiente"} · Última sincronización: ${date(status.airtable.last_sync)}`,
    );
    if (status.airtable.error) note(card, status.airtable.error);
    note(
      card,
      `WhatsApp Automanize: +34 694 20 60 79 · ${status.whatsapp.configured ? "canal vinculado en servidor" : "vinculación pendiente"}`,
    );
    note(
      card,
      `Contactos de prueba configurados: ${status.test_phones?.map((phone) => "+" + phone).join(", ") || "pendiente"} · ${status.test_only ? "modo exclusivo de pruebas" : "modo comercial"}`,
    );
    note(
      card,
      "La existencia de credenciales no acredita la salud del canal ni la coexistencia. Su comprobación real se realiza antes del despliegue.",
    );
    const templates = el("div");
    card.append(
      button("Consultar plantillas en Meta", async () => {
        const r = await api("templates");
        templates.replaceChildren();
        for (const t of r.items)
          templates.append(el("p", `${t.name} · ${t.language} · ${t.status}`));
      }),
      templates,
    );
    parent.append(card);
    const form = el("div", undefined, "la-card");
    form.append(el("h3", "Configuración de seguimiento"));
    const enabled = field(form, "Activación general", "checkbox");
    enabled.checked = cfg.enabled;
    note(
      form,
      "La activación general no supera el interruptor de envíos del servidor ni la lista de pruebas.",
    );
    const grid = el("div", undefined, "la-form-grid");
    const start = field(grid, "Desde (Europe/Madrid)", "time", cfg.start),
      end = field(grid, "Hasta", "time", cfg.end),
      limit = field(grid, "Máximo de mensajes en 24 horas", "number", cfg.daily_limit),
      gap = field(
        grid,
        "Mínimo de minutos entre mensajes por contacto",
        "number",
        cfg.min_gap_minutes,
      );
    const weekdays = field(
      grid,
      "Días permitidos: 0 domingo, 1 lunes… 6 sábado",
      "text",
      cfg.weekdays.join(","),
    );
    const mapping = {};
    for (const [key, label] of Object.entries({
      name: "Nombre",
      phone: "Teléfono",
      email: "Email",
      date: "Fecha de registro",
      source: "Procedencia",
      consent: "Consentimiento (casilla marcada)",
      evidence: "Referencia / evidencia del consentimiento",
    }))
      mapping[key] = field(grid, `Columna de Airtable: ${label}`, "text", cfg.mapping[key] || "");
    form.append(grid);
    note(
      form,
      "El formulario de Meta recoge la aceptación según lo indicado. Para activaciones se requiere vincular una casilla de consentimiento y una referencia verificable del formulario/registro. Los contactos existentes se importan sin envíos.",
    );
    form.append(
      button(
        "Guardar configuración",
        async () => {
          const config = {
            enabled: enabled.checked,
            timezone: "Europe/Madrid",
            start: start.value,
            end: end.value,
            daily_limit: Number(limit.value),
            min_gap_minutes: Number(gap.value),
            weekdays: weekdays.value.split(",").map((v) => Number(v.trim())),
            mapping: Object.fromEntries(Object.entries(mapping).map(([k, n]) => [k, n.value])),
          };
          await api("save_config", { config });
          await load();
        },
        true,
      ),
    );
    parent.append(form);
    const errors = el("div", undefined, "la-card");
    errors.append(
      el("h3", "Errores y envíos pendientes de revisión"),
      button("Consultar errores", async () => {
        const r = await api("errors");
        results.replaceChildren();
        if (!r.items.length) note(results, "Sin errores registrados");
        for (const j of r.items)
          results.append(
            el("p", `${date(j.created_at)} · ${j.state} · ${j.error_code || "—"} · ${j.id}`),
          );
      }),
    );
    const results = el("div");
    errors.append(results);
    parent.append(errors);
  }
  function mount(client) {
    db = client;
    root = document.getElementById("internalLeadsRoot");
    if (!document.getElementById("internalLeadsStyles")) {
      const link = el("link");
      link.id = "internalLeadsStyles";
      link.rel = "stylesheet";
      link.href = "/assets/css/internal-leads.css?v=20261031";
      document.head.append(link);
    }
    db.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        sessionGeneration++;
        leads = [];
        campaigns = [];
        status = null;
        conversation = null;
        manualDraft = null;
        selected.clear();
        root.replaceChildren();
        clearInterval(refreshTimer);
      }
    });
    refreshTimer = setInterval(() => {
      if (
        document.hidden ||
        !root.closest(".section.active") ||
        busy ||
        view !== "Conversaciones" ||
        !conversation
      )
        return;
      run(() => showHistory(conversation.id));
    }, 15000);
  }
  window.internalLeads = {
    open: async (client) => {
      if (!root) mount(client);
      render();
      await run(load);
    },
  };
})();
