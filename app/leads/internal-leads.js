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
  const deliveryLabels = {
    sent: "Enviado",
    delivered: "Entregado",
    read: "Leído",
    failed: "No entregado",
  };
  const jobLabels = {
    pending: "Programado",
    reserved: "Enviando",
    sending: "Enviando",
    sent: "Enviado",
    cancelled: "Detenido",
    uncertain: "Por revisar",
    error: "Error",
  };
  // Orden de la pestaña Plantillas: primero lo que aún requiere atención.
  const templateStates = {
    PENDING: ["En revisión de Meta", "yellow", 0],
    IN_APPEAL: ["En apelación", "yellow", 0],
    REJECTED: ["Rechazada", "red", 1],
    PAUSED: ["Pausada", "orange", 2],
    LIMIT_EXCEEDED: ["Límite superado", "orange", 2],
    DISABLED: ["Desactivada", "gray", 3],
    PENDING_DELETION: ["Eliminándose", "gray", 3],
    APPROVED: ["Aprobada", "green", 4],
  };
  const templateState = (t) => templateStates[t.status] || [t.status, "gray", 3];
  const fieldOptions = [
    ["{{nombre}}", "Nombre del contacto"],
    ["{{empresa}}", "Empresa"],
    ["{{origen}}", "Origen"],
    ["{{telefono}}", "Teléfono"],
    ["{{email}}", "Email"],
  ];
  let db,
    root,
    view = "Leads",
    status = null,
    metrics = null,
    airtable = null,
    leadsMode = "Airtable",
    leads = [],
    upcoming = [],
    campaigns = [],
    templates = [],
    templatesError = "",
    templatesCheckedAt = 0,
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
    input.setAttribute("aria-label", label);
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
      n.scrollIntoView({ block: "nearest" });
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
    await loadUpcoming();
  }
  // Toda la cola, no solo la página visible. Si falla, la lista de contactos sigue.
  async function loadUpcoming() {
    try {
      const active = [];
      for (let p = 0; ; p++) {
        const r = await api("list", { page: p, state: "active" }, "GET");
        active.push(...r.items);
        if (!r.items.length || active.length >= r.total) break;
      }
      upcoming = active.filter((lead) => lead.next_due);
    } catch {
      upcoming = [];
    }
  }
  async function loadTemplates() {
    templatesError = "";
    templates = [];
    if (!status?.whatsapp.configured) {
      templatesError = "El canal de WhatsApp todavía no está vinculado.";
      return;
    }
    try {
      templates = (await api("templates", undefined, "GET")).items;
      templatesCheckedAt = Date.now();
    } catch (e) {
      templatesError = e.message;
    }
  }
  const isAssignable = (c) => !status?.config.blocked_campaign_ids?.includes(c.id);
  const usableTemplates = () => templates.filter((t) => t.status === "APPROVED" && t.supported);
  async function load() {
    [status, { items: campaigns }] = await Promise.all([api("status"), api("campaigns")]);
    metrics = await api("metrics", undefined, "GET").catch(() => null);
    airtable = await api("airtable", undefined, "GET").catch(() => null);
    if (!airtable?.columns?.length) airtable = null;
    await Promise.all([loadLeads(), loadTemplates()]);
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
    for (const name of ["Leads", "Secuencias", "Plantillas", "Conversaciones", "Configuración", "Ayuda"]) {
      const b = button(name, async () => {
        view = name;
        if (name === "Plantillas") await loadTemplates();
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
    else if (view === "Plantillas") renderTemplates(content);
    else if (view === "Conversaciones") renderInbox(content);
    else if (view === "Ayuda") renderHelp(content);
    else renderConfig(content);
  }
  function renderHelp(parent) {
    const sections = [
      [
        "Cómo funciona",
        "1. Los contactos se importan desde Airtable. 2. Crea una secuencia: qué se envía si no contesta y qué se envía si contesta. 3. Enciende la revisión diaria en Configuración para que los contactos nuevos con consentimiento reciban el primer mensaje a la hora elegida, o actívalos a mano desde Leads. Importar o guardar una secuencia no envía mensajes por sí solo.",
      ],
      [
        "Cómo importar leads",
        "En Leads, pulsa Sincronizar Airtable. También se hace solo cada 15 minutos. Los contactos entran como Nuevo; solo la revisión diaria, si está encendida, activa a los que entraron después de encenderla. Si una fila tiene el teléfono mal o repetido, se avisa y las demás se importan igualmente.",
      ],
      [
        "Cómo crear una secuencia",
        "En Secuencias, pon un nombre y añade un paso por mensaje. Elige una plantilla aprobada por Meta, indica con qué dato se rellena cada campo y cuánto esperar. Puedes reordenar y eliminar pasos. Pulsa Calcular fechas para ver un ejemplo y guarda. Marca Activar esta versión para poder usarla.",
      ],
      [
        "Cómo activar o pausar un contacto",
        "En Leads, elige la secuencia y el paso por el que empieza el contacto, y pulsa Activar; el panel pide confirmación y te dice cuándo saldrá el mensaje. Los anteriores no se envían. Si ese mensaje tiene espera, indica también el día en el que va el contacto: sale cuando se cumpla el resto de la espera. El botón ¿Cómo funciona?, en la vista Automatización, lo explica con un ejemplo. Pausar cancela lo programado. Reanudar continúa por el mensaje pendiente sin repetir los ya enviados; solo se elige el día de su espera.",
      ],
      [
        "Cuándo sale cada mensaje",
        "La espera del primer mensaje se cuenta desde la activación del lead. Las siguientes se cuentan desde el envío del mensaje anterior, nunca desde la importación. Ejemplo: primer mensaje con 0 días, segundo 2 días después del primero y tercero 5 días después del segundo. Son días de calendario de Madrid; si un envío cae fuera de los días u horas permitidos, pasa al siguiente momento permitido. El límite diario y la separación mínima también pueden retrasarlo. Consulta Próximo envío en Leads.",
      ],
      [
        "Qué pasa si el cliente responde",
        "Se cancelan los mensajes siguientes y el contacto queda como Respondido, con el motivo visible. Si ese mensaje tiene activado Si contesta, se le envía esa plantilla una sola vez: al momento o, fuera de horario, al abrir el siguiente. Después sigue una persona. Cualquier respuesta cuenta, también un «no me interesa», salvo una baja: esta lo detiene todo e impide volver a escribirle. Si una persona le escribe desde el móvil o desde Seendy, la secuencia se detiene y no se reanuda sola, y el mensaje de Si contesta pendiente ya no sale.",
      ],
      [
        "Cómo comprobar si se envió un mensaje",
        "En Leads, pulsa Conversación. Verás los mensajes programados, enviados y detenidos, con su motivo, y el estado de entrega que comunica WhatsApp: Enviado, Entregado, Leído o No entregado. Enviado significa que Meta lo aceptó, no que haya llegado.",
      ],
      [
        "Qué significan los errores",
        "Método de pago: Meta bloquea los mensajes iniciados por la empresa hasta corregirlo en la cuenta de WhatsApp. Plantilla no aprobada: elige otra o espera la aprobación. Falta un dato: el contacto no tiene, por ejemplo, empresa, y esa plantilla la necesita. Por revisar: no se sabe si salió; compruébalo en WhatsApp y, en Configuración, indica si llegó. Nunca se reenvía automáticamente.",
      ],
      [
        "Qué escribir en los campos",
        "Cada campo de la plantilla se rellena en orden con un dato del contacto (nombre, empresa, origen, teléfono o email) o con un texto fijo. El texto completo del mensaje se define en la plantilla de Meta. Las plantillas con cabeceras multimedia o botones variables no se pueden usar aquí.",
      ],
      [
        "Cómo cambiar una secuencia",
        "Editar crea una versión nueva y Duplicar crea una copia. Los contactos ya activados mantienen sus mensajes y esperas originales, también si apagas un mensaje en la versión nueva. Activar una versión permite seleccionarla para nuevos contactos; no activa contactos ni habilita el envío general. La revisión diaria sigue usando la versión elegida en Configuración hasta que la cambies. Pausar una secuencia bloquea sus envíos. No permitir asignar solo impide ponérsela a contactos nuevos: quien ya la tiene sigue.",
      ],
      [
        "Prueba con tu número",
        "En Configuración, pulsa Comprobar canal y crea el contacto de prueba; solo se admiten números autorizados. Crea una secuencia y actívala solo para ese contacto. Verifica recepción y estado de entrega; responde desde tu WhatsApp para comprobar que se detiene. Reiniciar prueba, en Leads, permite repetirla.",
      ],
      [
        "Por qué puede no enviar",
        "Cada contacto muestra en Leads lo que le impide recibir mensajes. Comprueba también el estado del canal en Configuración. Se respetan horario, días, límite diario y sincronización reciente de Airtable.",
      ],
    ];
    parent.append(el("h3", "Guía rápida de seguimiento"));
    for (const [title, text] of sections) {
      const details = el("details", undefined, "la-card");
      details.open = title === "Cómo funciona" || title === "Cuándo sale cada mensaje";
      details.append(el("summary", title));
      note(details, text);
      parent.append(details);
    }
    parent.append(
      button(
        "Crear mi primera secuencia",
        async () => {
          view = "Secuencias";
          render();
        },
        true,
      ),
    );
  }
  const stateOrder = ["new", "pending", "active", "responded", "finished", "paused", "error", "opted_out"];
  const barRow = (name, bars, max) => {
    const row = el("div", undefined, "la-bar-row");
    row.append(el("span", name, "la-bar-name"));
    const marks = el("div", undefined, "la-bar-marks");
    for (const { value, series, label } of bars) {
      const line = el("div", undefined, "la-bar-line");
      const mark = el("span", undefined, `la-bar la-bar-${series}`);
      mark.style.width = `${max ? (value / max) * 100 : 0}%`;
      line.title = `${label}: ${value}`;
      line.append(mark, el("span", String(value), "la-bar-value"));
      marks.append(line);
    }
    row.append(marks);
    return row;
  };
  function renderSummary(parent) {
    const stats = el("div", undefined, "la-stats");
    const share = (n, of) => (of ? ` · ${Math.round((n / of) * 100)} %` : "");
    for (const [label, value, detail] of metrics
      ? [
          ["Contactos", metrics.total, `${metrics.without_consent} sin consentimiento`],
          ["Contactados", metrics.contacted, `${metrics.pending} envíos programados`],
          [
            "Han contestado",
            metrics.replied,
            `${metrics.replied_after_message} tras un mensaje${share(metrics.replied_after_message, metrics.contacted)}`,
          ],
          ["Por revisar", metrics.to_review, `Bajas: ${metrics.by_state.opted_out || 0}`],
        ]
      : [["Total filtrado", total, "Resumen no disponible"]]) {
      const card = el("div", undefined, "stat-card");
      card.append(
        el("div", label, "stat-label"),
        el("div", String(value), "stat-value"),
        el("small", detail),
      );
      stats.append(card);
    }
    parent.append(stats);
    if (!metrics) return;
    const charts = el("div", undefined, "la-charts");
    const phases = el("div", undefined, "la-card");
    phases.append(el("h3", "En qué fase está cada contacto"));
    note(phases, "Pulsa una fase para ver sus contactos.");
    const shown = stateOrder.filter((s) => s !== "pending" || metrics.by_state[s]);
    const maxState = Math.max(0, ...shown.map((s) => metrics.by_state[s] || 0));
    for (const state of shown) {
      const row = barRow(
        labels[state],
        [{ value: metrics.by_state[state] || 0, series: 1, label: labels[state] }],
        maxState,
      );
      const open = button("", async () => {
        filter = state;
        search = "";
        page = 0;
        await loadLeads();
        render();
      });
      open.className = `la-bar-button${filter === state ? " active" : ""}`;
      open.setAttribute("aria-label", `Ver contactos en fase ${labels[state]}`);
      open.replaceChildren(row);
      phases.append(open);
    }
    const messages = el("div", undefined, "la-card");
    messages.append(el("h3", "Respuesta por mensaje"));
    if (metrics.by_message.length) {
      const legend = el("div", undefined, "la-legend");
      for (const [series, name] of [
        [1, "Enviados"],
        [2, "Contestaron a ese mensaje"],
      ]) {
        const item = el("span");
        item.append(el("i", undefined, `la-bar la-bar-${series}`), name);
        legend.append(item);
      }
      messages.append(legend);
      const maxSent = Math.max(...metrics.by_message.map((m) => m.sent));
      for (const m of metrics.by_message)
        messages.append(
          barRow(
            `Mensaje ${m.step + 1}`,
            [
              { value: m.sent, series: 1, label: "Enviados" },
              { value: m.replied, series: 2, label: "Contestaron" },
            ],
            maxSent,
          ),
        );
    } else note(messages, "Todavía no se ha enviado ningún mensaje de una secuencia.");
    const d = metrics.delivery;
    note(
      messages,
      `Último estado en WhatsApp: ${d.sent || 0} enviados, ${d.delivered || 0} entregados, ${d.read || 0} leídos, ${d.failed || 0} no entregados · ${metrics.reply_messages_sent} mensajes de «Si contesta».`,
    );
    charts.append(phases, messages);
    parent.append(charts);
    if (metrics.test_contacts)
      note(parent, `Incluye ${metrics.test_contacts} contacto de prueba.`);
  }
  const repliedText = (lead) =>
    lead.state === "opted_out"
      ? "Pidió la baja"
      : lead.state === "responded"
        ? `Sí · ${date(lead.replied_at)}`
        : lead.last_sent
          ? "No"
          : "—";
  const chipColors = /^(blue|cyan|teal|green|yellow|orange|red|pink|purple|gray)/;
  const madridDay = (d) => d.toLocaleDateString("sv-SE", { timeZone: "Europe/Madrid" });
  const safeUrl = (value) => {
    try {
      const url = new URL(String(value));
      return ["http:", "https:"].includes(url.protocol) ? url.href : "";
    } catch {
      return "";
    }
  };
  const cellLink = (text, href, external) => {
    const a = el("a", text, "la-cell-link");
    a.href = href;
    if (external) {
      a.target = "_blank";
      a.rel = "noopener noreferrer";
    }
    return a;
  };
  const registeredDate = (td, value) => {
    const day = String(value).slice(0, 10);
    const parsed = new Date(`${day}T12:00:00Z`);
    if (!Number.isFinite(+parsed)) return void (td.textContent = String(value));
    const days = Math.round((Date.parse(madridDay(new Date())) - Date.parse(day)) / 86400000);
    td.append(
      el(
        "strong",
        parsed.toLocaleDateString("es-ES", {
          day: "numeric",
          month: "short",
          year: "numeric",
          timeZone: "UTC",
        }),
      ),
      el("small", days === 0 ? "Hoy" : days === 1 ? "Ayer" : days > 1 ? `Hace ${days} días` : ""),
    );
  };
  const longText = (td, value) => {
    const text = el("div", String(value), "la-long");
    td.classList.add("la-long-cell");
    td.append(text);
    if (String(value).length <= 120) return;
    const more = el("button", "Ver todo", "la-more");
    more.type = "button";
    more.addEventListener("click", () => {
      more.textContent = text.classList.toggle("open") ? "Ver menos" : "Ver todo";
    });
    td.append(more);
  };
  const airtableCell = (column, value) => {
    const td = el("td");
    const blank = value === undefined || value === null || value === "";
    if (blank) {
      td.append(el("span", "—", "la-empty"));
      return td;
    }
    if (column.type === "date" || column.type === "dateTime") registeredDate(td, value);
    else if (column.type === "singleSelect") {
      const color = column.choices?.find((c) => c.name === value)?.color || "gray";
      const family = chipColors.exec(color)?.[1] || "gray";
      td.append(el("span", String(value), `la-chip la-chip-${family}`));
    } else if (column.type === "email") td.append(cellLink(String(value), `mailto:${value}`));
    else if (column.type === "phoneNumber")
      td.append(cellLink(String(value), `tel:${String(value).replace(/[^\d+]/g, "")}`));
    else if (column.type === "url") {
      const href = safeUrl(value);
      td.append(href ? cellLink("Abrir enlace", href, true) : el("span", String(value)));
    } else if (column.type === "multilineText" || String(value).length > 120)
      longText(td, value);
    else td.textContent = Array.isArray(value) ? value.join(", ") : String(value);
    return td;
  };
  const airtableFields = (lead) => {
    const stored = airtable.records[lead.airtable_id];
    if (stored) return stored;
    const map = status?.config.mapping || {};
    return { [map.name]: lead.name, [map.phone]: "+" + lead.phone, [map.email]: lead.email };
  };
  const days = (n) => `${n} ${n === 1 ? "día" : "días"}`;
  const leadActions = (lead) => {
    const actions = el("div", undefined, "la-lead-actions");
    actions.append(
      button("Conversación", async () => {
        conversation = lead;
        view = "Conversaciones";
        render();
      }),
    );
    if (lead.seendy_path) {
      const seendy = el("a", "Abrir en Seendy", "btn btn-sm btn-ghost");
      seendy.href = lead.seendy_path;
      seendy.target = "_blank";
      seendy.rel = "noopener noreferrer";
      actions.append(seendy);
    }
    return actions;
  };
  const selectBox = (lead) => {
    const check = el("input");
    check.type = "checkbox";
    check.setAttribute("aria-label", `Seleccionar ${lead.name || lead.phone}`);
    check.addEventListener("change", () =>
      check.checked ? selected.add(lead.id) : selected.delete(lead.id),
    );
    return check;
  };
  function renderAirtableTable(parent) {
    const wrap = el("div", undefined, "la-table-wrap"),
      table = el("table", undefined, "la-airtable"),
      head = el("tr"),
      thead = el("thead"),
      body = el("tbody");
    for (const name of ["Seleccionar", ...airtable.columns.map((c) => c.name), "Estado", "Acciones"])
      head.append(el("th", name));
    thead.append(head);
    table.append(thead);
    for (const lead of leads) {
      const row = el("tr"),
        checkCell = el("td"),
        stateCell = el("td"),
        actions = el("td"),
        fields = airtableFields(lead);
      checkCell.append(selectBox(lead));
      row.append(checkCell);
      for (const column of airtable.columns) row.append(airtableCell(column, fields[column.name]));
      stateCell.append(el("span", labels[lead.state] || lead.state, "la-state"));
      if (lead.is_test) stateCell.append(el("small", "Contacto de prueba"));
      actions.append(leadActions(lead));
      row.append(stateCell, actions);
      body.append(row);
    }
    table.append(body);
    wrap.append(table);
    parent.append(wrap);
  }
  // Lo que bloquea a todos se dice una vez arriba, no en cada contacto.
  const sharedBlockers = () => {
    const open = leads.filter((l) => !["responded", "finished", "opted_out"].includes(l.state));
    if (open.length < 2) return [];
    return (open[0].blockers || []).filter((b) => open.every((l) => l.blockers?.includes(b)));
  };
  function showAutomationHelp() {
    const dialog = el("dialog", undefined, "la-help");
    dialog.setAttribute("aria-labelledby", "laHelpTitle");
    const title = el("h3", "Cómo elegir por dónde va un contacto");
    title.id = "laHelpTitle";
    dialog.append(title);
    note(
      dialog,
      "Una secuencia es una lista de mensajes separados por días de espera. Aquí indicas en qué punto está el contacto y la secuencia sigue desde ahí.",
    );
    const terms = el("dl", undefined, "la-help-terms");
    for (const [term, text] of [
      ["Secuencia", "Los mensajes que recibirá."],
      ["Empezar en", "El siguiente mensaje que debe recibir. Los anteriores no se le envían."],
      [
        "Día",
        "Cuántos días de la espera de ese mensaje ya han pasado. Si el mensaje no tiene espera, no aparece.",
      ],
    ])
      terms.append(el("dt", term), el("dd", text));
    dialog.append(terms);
    const example = el("div", undefined, "la-help-example");
    example.append(
      el("strong", "Ejemplo"),
      el("p", "Una secuencia con el mensaje 2 a los 2 días del 1 y el mensaje 3 a los 5 días del 2."),
      el(
        "p",
        "Si eliges Mensaje 3 y Día 3 de 5, ya han pasado 3 de esos 5 días: el mensaje 3 sale dentro de 2 días y no se envían ni el 1 ni el 2.",
      ),
      el("p", "Si eliges el último día, Día 5 de 5, sale en el primer momento permitido."),
    );
    dialog.append(example);
    const after = el("ul");
    for (const text of [
      "Los mensajes siguientes mantienen su espera normal, contada desde este envío.",
      "Los días son de calendario de Madrid. El horario, los días permitidos y el límite diario pueden retrasar el envío.",
      "Al activar se muestra la fecha prevista, que luego aparece en Próximo envío.",
      "Un contacto pausado sigue en su mensaje pendiente: al reanudar solo eliges el día.",
      "Si el contacto contesta, la secuencia se detiene.",
    ])
      after.append(el("li", text));
    dialog.append(after);
    const close = el("button", "Entendido", "btn btn-sm btn-accent");
    close.type = "button";
    close.addEventListener("click", () => dialog.close());
    dialog.append(close);
    dialog.addEventListener("close", () => dialog.remove());
    root.append(dialog);
    dialog.showModal();
  }
  function leadControls(lead) {
    const box = el("div", undefined, "la-lead-controls");
    const resuming = !!lead.snapshot;
    let choice, startChoice;
    if (resuming)
      box.append(
        el(
          "p",
          `Sigue en «${campaigns.find((c) => c.id === lead.campaign_id)?.name || "su secuencia"}», mensaje ${lead.step + 1} de ${lead.snapshot.length}: ${lead.snapshot[lead.step]?.name || lead.snapshot[lead.step]?.template || ""}`,
          "la-lead-resume",
        ),
      );
    else {
      choice = select(
        box,
        "Secuencia",
        [
          ["", "Seleccionar"],
          ...campaigns.filter((c) => c.active && isAssignable(c)).map((c) => [c.id, c.name]),
        ],
        "",
      );
      startChoice = select(box, "Empezar en", [], "");
    }
    const dayChoice = select(box, "Día", [], "");
    const hint = el("small", "", "la-lead-hint");
    hint.setAttribute("aria-live", "polite");
    const currentStep = () =>
      resuming
        ? lead.snapshot[lead.step]
        : (campaigns.find((c) => c.id === choice.value)?.steps || []).filter(
            (s) => s.enabled !== false,
          )[Number(startChoice.value)];
    const showHint = () => {
      const step = currentStep();
      if (!step) return (hint.textContent = "Elige una secuencia para ver cuándo saldría.");
      const left = (step.delay_days || 0) - Number(dayChoice.value);
      hint.textContent =
        left > 0
          ? `Saldrá dentro de ${days(left)}${step.time ? ` a las ${step.time}` : ""}.`
          : "Saldrá en el primer momento permitido.";
    };
    const fillDays = () => {
      const step = currentStep(),
        wait = step?.delay_days || 0;
      dayChoice.replaceChildren(
        ...Array.from({ length: wait + 1 }, (_, d) => {
          const o = el(
            "option",
            `Día ${d} de ${wait} · ${d === wait ? "sale ya" : `faltan ${days(wait - d)}`}`,
          );
          o.value = String(d);
          return o;
        }),
      );
      dayChoice.parentElement.hidden = !wait;
      // Un mensaje posterior entra sin esperar salvo que se indique otro día.
      dayChoice.value = String(!resuming && Number(startChoice.value) > 0 ? wait : 0);
      showHint();
    };
    if (!resuming) {
      const fillSteps = () => {
        startChoice.replaceChildren(
          ...(campaigns.find((c) => c.id === choice.value)?.steps || [])
            .filter((s) => s.enabled !== false)
            .map((s, i) => {
              const o = el("option", `Mensaje ${i + 1}: ${s.name || s.template}`);
              o.value = String(i);
              return o;
            }),
        );
        startChoice.disabled = !choice.value;
        fillDays();
      };
      choice.addEventListener("change", fillSteps);
      startChoice.addEventListener("change", fillDays);
      fillSteps();
    } else fillDays();
    dayChoice.addEventListener("change", showHint);
    const activate = button(
      resuming ? "Reanudar" : "Activar",
      async () => {
        if (!resuming && !choice.value) throw new Error("Selecciona una secuencia");
        const sequence = resuming
          ? "la secuencia pendiente"
          : `«${campaigns.find((c) => c.id === choice.value)?.name}»`;
        if (
          !confirm(
            `¿Activar ${sequence} para ${lead.name || "+" + lead.phone}? Se le enviarán mensajes de WhatsApp si no responde.${Number(startChoice?.value) > 0 ? ` Empezará en el mensaje ${Number(startChoice.value) + 1}, sin enviarle los anteriores.` : ""} ${hint.textContent}`,
          )
        )
          return;
        const r = await api("activate", {
          id: lead.id,
          campaign_id: resuming ? lead.campaign_id : choice.value,
          start_step: Number(startChoice?.value || 0),
          start_day: Number(dayChoice.value || 0),
        });
        await loadLeads();
        render();
        error(`Activado. Próximo envío previsto: ${date(r?.due_at)}.`);
      },
      true,
    );
    activate.disabled = !lead.consent;
    const submit = el("div", undefined, "la-lead-submit");
    submit.append(activate);
    box.append(submit, hint);
    if (!lead.consent) box.append(el("small", "No se puede activar sin consentimiento acreditado.", "la-lead-hint"));
    return box;
  }
  function automationCard(lead, shared) {
    const card = el("article", undefined, "la-lead");
    const top = el("div", undefined, "la-lead-top");
    const contact = el("div", undefined, "la-lead-contact");
    contact.append(
      el("strong", lead.name || "Sin nombre"),
      el("span", `+${lead.phone}${lead.email ? ` · ${lead.email}` : ""}`),
      el("small", `${lead.entry_date || "Sin fecha"} · ${lead.source || "Sin origen"}`),
    );
    const actions = leadActions(lead);
    if (lead.state === "active")
      actions.append(
        button("Pausar", async () => {
          await api("pause", { id: lead.id });
          await loadLeads();
          render();
        }),
      );
    if (lead.is_test && lead.state !== "opted_out")
      actions.append(
        button("Reiniciar prueba", async () => {
          if (!confirm("¿Reiniciar el contacto de prueba? Se borrará su programación.")) return;
          await api("reset_test_lead", { id: lead.id });
          await loadLeads();
          render();
        }),
      );
    top.append(selectBox(lead), contact, el("span", labels[lead.state] || lead.state, "la-state"), actions);
    card.append(top);
    const reasons = [
      lead.is_test ? "Contacto de prueba" : "",
      lead.stop_text,
      ...(lead.blockers || []).filter((b) => !shared.includes(b)),
    ].filter(Boolean);
    if (reasons.length) {
      const list = el("div", undefined, "la-lead-reasons");
      for (const text of reasons) list.append(el("small", text));
      card.append(list);
    }
    if (lead.snapshot || lead.last_sent || lead.next_due || lead.last_message) {
      const facts = el("dl", undefined, "la-lead-facts");
      const fact = (term, value) => {
        const box = el("div"),
          text = el("dd");
        if (value instanceof Node) text.append(value);
        else text.textContent = value || "—";
        box.append(el("dt", term), text);
        facts.append(box);
      };
      fact(
        "Paso",
        lead.snapshot ? `${Math.min(lead.step + 1, lead.snapshot.length)} de ${lead.snapshot.length}` : "",
      );
      fact(
        "Mensaje enviado",
        lead.last_sent
          ? `${lead.last_sent.label} · ${date(lead.last_sent.at)}${lead.last_sent.delivery ? ` · ${deliveryLabels[lead.last_sent.delivery] || lead.last_sent.delivery}` : ""}`
          : "",
      );
      fact("¿Contestó?", repliedText(lead));
      fact("Próximo envío", date(lead.next_due));
      if (lead.last_message) {
        const box = el("div");
        longText(box, lead.last_message);
        fact("Último mensaje", box);
      }
      card.append(facts);
    }
    if (!["active", "responded", "finished", "opted_out", "error"].includes(lead.state))
      card.append(leadControls(lead));
    return card;
  }
  function renderAutomation(parent) {
    const bar = el("div", undefined, "la-tools");
    bar.append(button("¿Cómo funciona?", async () => showAutomationHelp()));
    parent.append(bar);
    const shared = sharedBlockers();
    if (shared.length) {
      const box = el("div", undefined, "la-banner");
      box.append(el("strong", "Ahora no se pueden enviar mensajes a estos contactos:"));
      const list = el("ul");
      for (const text of shared) list.append(el("li", text));
      box.append(list);
      parent.append(box);
    }
    const list = el("div", undefined, "la-leads");
    for (const lead of leads) list.append(automationCard(lead, shared));
    parent.append(list);
  }
  function renderUpcoming(parent) {
    if (!upcoming.length) return;
    const madridDay = (value) =>
      new Date(value).toLocaleDateString("en-CA", { timeZone: "Europe/Madrid" });
    const today = new Date();
    const tomorrow = new Date(+today + 86400000);
    const dayLabel = (value) => {
      const day = madridDay(value);
      const when = new Date(value).toLocaleString("es-ES", {
        timeZone: "Europe/Madrid",
        weekday: "long",
        day: "numeric",
        month: "long",
        hour: "2-digit",
        minute: "2-digit",
      });
      if (day === madridDay(today)) return `Hoy, ${when}`;
      if (day === madridDay(tomorrow)) return `Mañana, ${when}`;
      return when;
    };
    const groups = new Map();
    for (const lead of [...upcoming].sort((a, b) => +new Date(a.next_due) - +new Date(b.next_due))) {
      const key = dayLabel(lead.next_due);
      const message = lead.snapshot?.[lead.step]?.name || "Mensaje";
      if (!groups.has(key)) groups.set(key, new Map());
      const messages = groups.get(key);
      messages.set(message, [...(messages.get(message) || []), lead.name || `+${lead.phone}`]);
    }
    const box = el("div", undefined, "la-banner");
    box.append(el("strong", `Próximos envíos automáticos: ${upcoming.length}`));
    for (const [when, messages] of groups) {
      const count = [...messages.values()].reduce((sum, names) => sum + names.length, 0);
      box.append(el("div", `${when} · ${count} ${count === 1 ? "mensaje" : "mensajes"}`));
      const list = el("ul");
      for (const [message, names] of messages)
        list.append(el("li", `${message} (${names.length}): ${names.join(", ")}`));
      box.append(list);
    }
    parent.append(box);
  }
  function renderLeads(parent) {
    renderUpcoming(parent);
    renderSummary(parent);
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
            `Sincronización: ${r.imported} revisados, ${r.rejected} requieren revisión. Sincronizar no activa a nadie.`,
          );
        },
        true,
      ),
    );
    const { base, table: airtableTable, view: airtableView } = status?.airtable || {};
    if (base && airtableTable) {
      const link = el("a", "Ir a Airtable", "btn btn-sm btn-ghost");
      link.href = `https://airtable.com/${[base, airtableTable, airtableView].filter(Boolean).map(encodeURIComponent).join("/")}`;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      tools.append(link);
    }
    parent.append(tools);
    parent.append(
      button("Pausar seleccionados", async () => {
        if (!selected.size) return;
        for (const id of [...selected]) await api("pause", { id });
        await loadLeads();
        render();
      }),
    );
    const showAirtable = !!airtable && leadsMode === "Airtable";
    if (airtable) {
      const modes = el("div", undefined, "la-tabs la-modes");
      for (const name of ["Airtable", "Automatización"]) {
        const b = button(name, async () => {
          leadsMode = name;
          render();
        });
        if (leadsMode === name) b.classList.add("active");
        modes.append(b);
      }
      parent.append(modes);
      if (airtable.not_imported?.length)
        note(
          parent,
          `Sin importar por teléfono o duplicado: ${airtable.not_imported.join(", ")}.`,
        );
    } else if (status)
      note(parent, "No se han podido leer las columnas de Airtable. Pulsa Actualizar para reintentar.");
    if (showAirtable) renderAirtableTable(parent);
    else renderAutomation(parent);
    if (!leads.length)
      note(
        parent,
        status
          ? "No hay contactos con estos filtros. Pulsa Sincronizar Airtable para importarlos sin activar envíos."
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
  function renderTemplates(parent) {
    const tools = el("div", undefined, "la-tools");
    tools.append(
      button("Comprobar ahora", async () => {
        await loadTemplates();
        render();
      }),
    );
    parent.append(tools);
    if (templatesError) return note(parent, templatesError);
    const pending = templates.filter((t) => templateState(t)[2] === 0).length;
    const approved = templates.filter((t) => t.status === "APPROVED").length;
    note(
      parent,
      `${pending} en revisión · ${approved} aprobadas · Última comprobación en Meta: ${date(templatesCheckedAt)}.${pending ? " Mientras haya alguna en revisión se comprueba cada minuto con esta pestaña abierta." : ""}`,
    );
    if (!templates.length) return note(parent, "Todavía no hay plantillas en esta cuenta de WhatsApp.");
    const wrap = el("div", undefined, "la-table-wrap"),
      table = el("table"),
      head = el("tr"),
      thead = el("thead"),
      body = el("tbody");
    for (const name of ["Estado", "Plantilla", "Categoría", "Texto", "Secuencias que la usan"])
      head.append(el("th", name));
    thead.append(head);
    table.append(thead);
    const ordered = [...templates].sort(
      (a, b) => templateState(a)[2] - templateState(b)[2] || a.name.localeCompare(b.name),
    );
    for (const t of ordered) {
      const row = el("tr"),
        [label, color] = templateState(t),
        stateCell = el("td"),
        nameCell = el("td"),
        textCell = el("td");
      stateCell.append(el("span", label, `la-chip la-chip-${color}`));
      if (t.rejected_reason) stateCell.append(el("small", `Motivo de Meta: ${t.rejected_reason}`));
      nameCell.append(el("strong", t.name), el("small", t.language));
      longText(textCell, t.body || "—");
      const used = campaigns
        .filter((c) => c.steps?.some((s) => s.template === t.name && s.language === t.language))
        .map((c) => c.name);
      row.append(
        stateCell,
        nameCell,
        el("td", t.category || "—"),
        textCell,
        el("td", used.join(", ") || "—"),
      );
      body.append(row);
    }
    table.append(body);
    wrap.append(table);
    parent.append(wrap);
  }
  const newStep = () => ({
    name: "",
    template: "",
    language: "es_ES",
    variables: [],
    delay_days: 0,
    time: "",
    weekdays: [1, 2, 3, 4, 5],
    only_if_no_reply: true,
    enabled: true,
    on_reply: null,
  });
  const templateSelect = (parent, message, label) => {
    const usable = usableTemplates();
    const current = `${message.template}|${message.language}`;
    const options = usable.map((t) => [
      `${t.name}|${t.language}`,
      `${t.name} · ${t.language} · ${t.category || ""}`,
    ]);
    if (message.template && !options.some(([v]) => v === current))
      options.unshift([current, `${message.template} · no disponible en Meta`]);
    const input = select(
      parent,
      label,
      [["", usable.length ? "Elige una plantilla" : "Sin plantillas aprobadas"], ...options],
      message.template ? current : "",
    );
    input.addEventListener("change", () => {
      const [template, language] = input.value.split("|");
      const chosen = usable.find((t) => t.name === template && t.language === language);
      message.template = template || "";
      message.language = language || "es_ES";
      message.variables = Array.from(
        { length: chosen?.parameters || 0 },
        (_, i) => message.variables[i] || "",
      );
      render();
    });
    return usable.find((t) => t.name === message.template && t.language === message.language);
  };
  const variableFields = (message, context, onInput) => {
    const variables = el("div");
    message.variables.forEach((value, parameter) => {
      const preset = fieldOptions.some(([v]) => v === value);
      const source = select(
        variables,
        `Campo {{${parameter + 1}}} ${context}`,
        [...fieldOptions, ["", "Texto fijo"]],
        preset ? value : "",
      );
      source.addEventListener("change", () => {
        message.variables[parameter] = source.value;
        render();
      });
      if (preset) return;
      const input = field(
        variables,
        `Texto fijo del campo {{${parameter + 1}}}`,
        "text",
        value,
      );
      input.placeholder = "Escribe el texto";
      input.maxLength = 500;
      input.addEventListener("input", () => {
        message.variables[parameter] = input.value;
        onInput();
      });
    });
    return variables;
  };
  function renderCampaigns(parent) {
    parent.append(el("h3", "Crea tu secuencia paso a paso"));
    note(
      parent,
      "Cada mensaje tiene dos caminos: si no contesta, sale el mensaje siguiente tras la espera; si contesta, los siguientes se cancelan y puedes enviarle otro mensaje. Puedes activar o desactivar cada uno.",
    );
    if (!usableTemplates().length)
      parent.append(
        el(
          "div",
          templatesError
            ? `No se pueden cargar las plantillas: ${templatesError}`
            : "Todavía no hay plantillas aprobadas por Meta. Sin ellas no se puede guardar una secuencia.",
          "la-banner",
        ),
      );
    parent.append(
      button("Usar ejemplo: 0, 2 y 5 días", async () => {
        if (
          campaignName.trim() ||
          campaignActive ||
          steps.length > 1 ||
          steps.some((s) => JSON.stringify(s) !== JSON.stringify(newStep()))
        )
          throw new Error(
            "El ejemplo necesita un borrador vacío. Conserva tu trabajo actual guardándolo primero.",
          );
        steps = [0, 2, 5].map((delay_days, i) => ({
          ...newStep(),
          delay_days,
          name: ["Primer contacto", "Seguimiento", "Último seguimiento"][i],
        }));
        render();
      }),
    );
    note(
      parent,
      "Editar guarda una versión nueva. Los leads ya activados conservan los pasos originales. Una baja lo detiene todo y nunca recibe el mensaje de Si contesta.",
    );
    const list = el("div", undefined, "la-tools");
    for (const c of campaigns) {
      const card = el("div", undefined, "la-card");
      card.append(
        el("strong", c.name),
        el("p", `${c.steps.filter((s) => s.enabled !== false).length} pasos · ${c.active ? "Activa" : "Pausada"} · ${isAssignable(c) ? "Se puede asignar" : "No se puede asignar"}`),
        el(
          "small",
          c.steps
            .filter((s) => s.enabled !== false)
            .map(
              (s) =>
                `${s.template} (${s.delay_days} d)${s.on_reply?.enabled ? ` [si contesta: ${s.on_reply.template}]` : ""}`,
            )
            .join(" → "),
        ),
        button("Editar como nueva versión", async () => {
          steps = structuredClone(c.steps);
          campaignName = c.name + " · nueva versión";
          campaignActive = false;
          render();
        }),
        button("Duplicar", async () => {
          steps = structuredClone(c.steps);
          campaignName = c.name + " · copia";
          campaignActive = false;
          render();
          error("Copia cargada abajo. Revísala y guárdala.");
        }),
        button(isAssignable(c) ? "No permitir asignar" : "Permitir asignar", async () => {
          await api("campaign_assignable", { id: c.id, assignable: !isAssignable(c) });
          await load();
        }),
        button(c.active ? "Pausar secuencia" : "Activar secuencia", async () => {
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
      const outer = el("div", undefined, "la-step");
      outer.append(el("h3", `Mensaje ${index + 1}`));
      if (index > 0) {
        const sendIt = field(outer, "Enviar si no contesta al mensaje anterior", "checkbox");
        sendIt.checked = step.enabled !== false;
        sendIt.addEventListener("change", () => {
          step.enabled = sendIt.checked;
          render();
        });
      }
      const card = el("div");
      card.hidden = step.enabled === false;
      outer.append(card);
      const grid = el("div", undefined, "la-form-grid");
      const nameInput = field(grid, "Nombre", "text", step.name);
      nameInput.addEventListener("input", () => {
        step.name = nameInput.value;
        preview();
      });
      const chosen = templateSelect(grid, step, "Plantilla aprobada de Meta");
      const delay = field(
        grid,
        index === 0 ? "Días desde la activación" : "Días desde el mensaje anterior",
        "number",
        step.delay_days,
      );
      delay.min = "0";
      delay.max = "365";
      delay.addEventListener("input", () => {
        step.delay_days = Number(delay.value);
        preview();
      });
      const whenInput = select(
        grid,
        "A qué hora (Madrid)",
        [
          ["", "En cuanto se pueda, dentro del horario"],
          ["at", "A una hora concreta"],
        ],
        step.time ? "at" : "",
      );
      whenInput.addEventListener("change", () => {
        step.time = whenInput.value ? "10:00" : "";
        render();
      });
      if (step.time) {
        const timeInput = field(grid, "Hora de envío", "time", step.time);
        timeInput.addEventListener("input", () => {
          step.time = timeInput.value;
          preview();
        });
      }
      if (chosen) card.append(el("p", `Texto: ${chosen.body}`, "la-note"));
      grid.append(variableFields(step, `del mensaje ${index + 1}`, () => preview()));
      note(
        card,
        index === 0
          ? "Este mensaje siempre se envía. 0 días = primer horario permitido desde que activas el contacto; con la revisión diaria sale a la hora de la revisión."
          : "La espera empieza cuando se envía el mensaje anterior, no cuando se importa el lead.",
      );
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
      const branch = el("div", undefined, "la-branch");
      branch.append(el("strong", `Si contesta al mensaje ${index + 1}`));
      const replyOn = field(branch, "Enviarle un mensaje", "checkbox");
      replyOn.checked = !!step.on_reply?.enabled;
      replyOn.addEventListener("change", () => {
        step.on_reply = {
          name: "",
          template: "",
          language: "es_ES",
          variables: [],
          ...step.on_reply,
          enabled: replyOn.checked,
        };
        render();
      });
      if (step.on_reply?.enabled) {
        const reply = step.on_reply;
        const replyChosen = templateSelect(branch, reply, "Plantilla si contesta");
        if (replyChosen) note(branch, `Texto: ${replyChosen.body}`);
        branch.append(
          variableFields(reply, `del mensaje ${index + 1}, si contesta`, () => preview()),
        );
      }
      note(
        branch,
        "Si contesta, los mensajes siguientes ya no salen y sigue una persona. Este mensaje sale al momento o, fuera de horario, al abrir el siguiente.",
      );
      card.append(branch);
      const move = (to) => async () => {
        steps.splice(to, 0, steps.splice(index, 1)[0]);
        render();
      };
      const up = button("Subir", move(index - 1));
      up.disabled = index === 0;
      const down = button("Bajar", move(index + 1));
      down.disabled = index === steps.length - 1;
      outer.append(
        up,
        down,
        button("Eliminar paso", async () => {
          steps.splice(index, 1);
          render();
        }),
      );
      editor.append(outer);
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
      steps.forEach((s, i) => {
        if (s.enabled === false) {
          summary.append(el("p", `${i + 1}. Desactivado: no se envía`));
          return;
        }
        summary.append(
          el(
            "p",
            `${i + 1}. ${s.name || s.template || "Plantilla pendiente"} · ${s.delay_days} días ${i === 0 ? "desde la activación" : `después del mensaje anterior`} · ${s.time || "primera hora permitida"} (Madrid)${s.variables.length ? " · " + s.variables.join(" / ") : ""}`,
          ),
          el(
            "p",
            s.on_reply?.enabled
              ? `   Si contesta: ${s.on_reply.template || "plantilla pendiente"} y fin de la secuencia`
              : "   Si contesta: fin de la secuencia, sin más mensajes",
          ),
        );
      });
    }
    preview();
    const dates = el("div", undefined, "la-preview");
    form.append(
      button("Calcular fechas", async () => {
        const on = steps.flatMap((s, i) => (s.enabled === false ? [] : [{ s, i }]));
        const r = await api("preview_schedule", { steps: on.map(({ s }) => s) });
        dates.replaceChildren(el("strong", "Si activas un contacto ahora y no contesta"));
        r.items.forEach((at, k) =>
          dates.append(el("p", `Mensaje ${on[k].i + 1}: ${date(at)}`)),
        );
      }),
      dates,
    );
    note(
      form,
      "Calendario orientativo: los días y horarios permitidos, la separación mínima y el límite diario pueden aplazar cada envío. La fecha real aparece en Próximo envío del contacto.",
    );
    form.append(
      button(
        "Guardar nueva versión",
        async () => {
          if (!name.value.trim()) throw new Error("Pon un nombre a la secuencia");
          if (!steps.length || steps.length > 20) throw new Error("Añade entre 1 y 20 mensajes");
          for (const [i, s] of steps.entries()) {
            if (s.enabled === false) continue;
            if (s.on_reply?.enabled) {
              if (!/^[a-z0-9_]{1,100}$/.test(s.on_reply.template))
                throw new Error(`Mensaje ${i + 1}: elige la plantilla de «Si contesta»`);
              if (s.on_reply.variables.some((v) => !v.trim()))
                throw new Error(`Mensaje ${i + 1}: rellena los campos de «Si contesta»`);
            }
            if (!/^[a-z0-9_]{1,100}$/.test(s.template))
              throw new Error(`Mensaje ${i + 1}: elige una plantilla aprobada`);
            if (!Number.isInteger(s.delay_days) || s.delay_days < 0 || s.delay_days > 365)
              throw new Error(
                `Mensaje ${i + 1}: la espera debe ser un número entero entre 0 y 365 días`,
              );
            if (!s.weekdays.length)
              throw new Error(`Mensaje ${i + 1}: selecciona al menos un día de envío`);
            if (s.variables.some((v) => !v.trim()))
              throw new Error(`Mensaje ${i + 1}: rellena todos los campos de la plantilla`);
          }
          await api("save_campaign", {
            campaign: { name: name.value, active: active.checked, steps },
          });
          steps = [];
          campaignName = "";
          campaignActive = false;
          await load();
          error(
            status?.config.auto_enabled
              ? "Secuencia guardada. La revisión diaria sigue usando la versión elegida en Configuración: cámbiala allí si quieres usar esta."
              : "Secuencia guardada. Ningún contacto se ha activado.",
          );
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
    if (lead.stop_text) note(chat, `Motivo: ${lead.stop_text}`);
    for (const blocker of lead.blockers || []) note(chat, `Bloqueo: ${blocker}`);
    const plan = el("div");
    plan.id = "laPlan";
    chat.append(plan);
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
          c.steps
            .filter((s) => s.template)
            .map((s) => [JSON.stringify(s), `${s.template} · ${s.language}`]),
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
        if (!confirm(`¿Enviar este mensaje a +${lead.phone}? La secuencia se pausará.`)) return;
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
    const plan = document.getElementById("laPlan");
    if (plan) {
      plan.replaceChildren();
      if (r.jobs?.length) plan.append(el("strong", "Plan de envíos"));
      for (const job of r.jobs || [])
        plan.append(
          el(
            "p",
            `${job.kind === "manual" ? "Manual" : `Mensaje ${job.step + 1}`} · ${job.template} · ${jobLabels[job.state] || job.state} · ${date(job.sent_at || job.due_at)}${job.error_text ? ` · ${job.error_text}` : ""}`,
            "la-note",
          ),
        );
    }
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
        el(
          "small",
          `${date(message.at)} · ${deliveryLabels[message.status] || message.status || message.kind}${message.error_text ? ` · ${message.error_text}` : ""}`,
        ),
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
      `WhatsApp Automanize: +34 694 20 60 79 · ${status.whatsapp.configured ? "canal vinculado en servidor" : status.whatsapp.detail || "vinculación pendiente"}`,
    );
    note(
      card,
      `Contactos de prueba configurados: ${status.test_phones?.map((phone) => "+" + phone).join(", ") || "pendiente"} · ${status.test_only ? "modo exclusivo de pruebas" : "modo comercial"}`,
    );
    const health = el("div");
    card.append(
      button("Comprobar canal", async () => {
        const r = await api("channel_check", undefined, "GET");
        health.replaceChildren();
        for (const item of r.items)
          note(health, `${item.ok ? "Correcto" : "Bloqueado"} · ${item.label}: ${item.detail}`);
      }),
      health,
    );
    const list = el("div");
    card.append(
      button("Ver plantillas de Meta", async () => {
        await loadTemplates();
        if (templatesError) throw new Error(templatesError);
        list.replaceChildren();
        if (!templates.length) note(list, "No hay ninguna plantilla en esta cuenta.");
        for (const t of templates)
          note(list, `${t.name} · ${t.language} · ${t.status} · ${t.parameters} campos`);
      }),
      list,
    );
    parent.append(card);
    if (status.test_phones?.length) {
      const test = el("div", undefined, "la-card");
      test.append(el("h3", "Contacto de prueba"));
      note(
        test,
        "Crea un contacto separado de Airtable, solo para números autorizados. Crearlo no envía nada.",
      );
      const grid = el("div", undefined, "la-form-grid");
      const phone = select(
        grid,
        "Número autorizado",
        status.test_phones.map((p) => [p, "+" + p]),
        status.test_phones[0],
      );
      const testName = field(grid, "Nombre", "text", "Prueba");
      const company = field(grid, "Empresa", "text", "Automanize");
      const source = field(grid, "Origen", "text", "Prueba interna");
      const evidence = field(grid, "Evidencia del consentimiento", "text");
      evidence.placeholder = "Quién lo autorizó, cómo y cuándo";
      test.append(
        grid,
        button(
          "Crear contacto de prueba",
          async () => {
            await api("test_lead", {
              phone: phone.value,
              name: testName.value,
              company: company.value,
              source: source.value,
              consent_evidence: evidence.value,
            });
            search = "";
            filter = "";
            page = 0;
            await loadLeads();
            error("Contacto de prueba listo. No se ha enviado nada.");
          },
          true,
        ),
      );
      parent.append(test);
    }
    const form = el("div", undefined, "la-card");
    form.append(el("h3", "Configuración de seguimiento"));
    const enabled = field(form, "Activación general", "checkbox");
    enabled.checked = cfg.enabled;
    note(
      form,
      "La activación general no supera el interruptor de envíos del servidor ni la lista de pruebas.",
    );
    form.append(el("strong", "Revisión diaria de Airtable"));
    const autoOn = field(form, "Enviar el primer mensaje automáticamente cada día", "checkbox");
    autoOn.checked = !!cfg.auto_enabled;
    const autoGrid = el("div", undefined, "la-form-grid");
    const autoTime = field(autoGrid, "Hora de la revisión (Madrid)", "time", cfg.auto_time || "10:00");
    const autoCampaign = select(
      autoGrid,
      "Secuencia de la revisión",
      [
        ["", "Elige una secuencia"],
        ...campaigns
          .filter((c) => (c.active && isAssignable(c)) || c.id === cfg.auto_campaign_id)
          .map((c) => [c.id, `${c.name}${c.active ? "" : " · pausada"}`]),
      ],
      cfg.auto_campaign_id || "",
    );
    form.append(autoGrid);
    note(
      form,
      `Cada día permitido lee Airtable a esa hora (puede tardar hasta 15 minutos) y envía el primer mensaje a los contactos nuevos con consentimiento. Solo entran los importados desde que la enciendes; los que ya estaban se activan a mano en Leads, eligiendo el paso. Última revisión: ${status.auto_last_run || "—"}.`,
    );
    if (cfg.auto_enabled && !campaigns.find((c) => c.id === cfg.auto_campaign_id)?.active)
      form.append(
        el("div", "La secuencia de la revisión diaria está pausada: hoy no entrará nadie.", "la-banner"),
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
    const allowed = el("div", undefined, "la-tools");
    const dayInputs = ["D", "L", "M", "X", "J", "V", "S"].map((label, d) => {
      const wrap = el("label", label, "la-day"),
        input = el("input");
      input.type = "checkbox";
      input.checked = cfg.weekdays.includes(d);
      wrap.prepend(input);
      allowed.append(wrap);
      return input;
    });
    const mapping = {};
    for (const [key, label] of Object.entries({
      name: "Nombre",
      company: "Empresa",
      phone: "Teléfono",
      email: "Email",
      date: "Fecha de registro",
      source: "Procedencia",
      consent: "Consentimiento (casilla marcada)",
      evidence: "Referencia / evidencia del consentimiento",
    }))
      mapping[key] = field(grid, `Columna de Airtable: ${label}`, "text", cfg.mapping[key] || "");
    form.append(el("strong", "Días permitidos"), allowed, grid);
    note(
      form,
      "El formulario de Meta recoge la aceptación según lo indicado. Para activaciones se requiere vincular una casilla de consentimiento y una referencia verificable del formulario/registro. Los contactos existentes se importan sin envíos.",
    );
    form.append(
      button(
        "Guardar configuración",
        async () => {
          if (
            enabled.checked &&
            !cfg.enabled &&
            !confirm("¿Encender la activación general? Los contactos activados podrán recibir mensajes.")
          )
            return;
          if (
            autoOn.checked &&
            !cfg.auto_enabled &&
            !confirm("¿Encender la revisión diaria? Los contactos nuevos con consentimiento recibirán el primer mensaje sin activarlos a mano.")
          )
            return;
          const config = {
            enabled: enabled.checked,
            auto_enabled: autoOn.checked,
            auto_time: autoTime.value,
            auto_campaign_id: autoCampaign.value,
            timezone: "Europe/Madrid",
            start: start.value,
            end: end.value,
            daily_limit: Number(limit.value),
            min_gap_minutes: Number(gap.value),
            weekdays: dayInputs.flatMap((input, d) => (input.checked ? [d] : [])),
            mapping: Object.fromEntries(Object.entries(mapping).map(([k, n]) => [k, n.value])),
          };
          await api("save_config", { config });
          await load();
          error("Configuración guardada.");
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
        for (const j of r.items) {
          const contact = j.internal_leads_records;
          results.append(
            el(
              "p",
              `${date(j.created_at)} · ${contact?.name || "+" + contact?.phone} · ${j.error_text || j.error_code || "—"}`,
            ),
            button("No llegó: permitir reactivarlo", async () => {
              if (!confirm("¿Confirmas que este mensaje NO llegó al contacto?")) return;
              await api("resolve_job", { id: j.id, outcome: "not_sent" });
              results.replaceChildren();
              await load();
              error("Revisado. Puedes reanudar el contacto desde Leads.");
            }),
            button("Sí llegó: continuar", async () => {
              if (!confirm("¿Confirmas que este mensaje SÍ llegó al contacto?")) return;
              await api("resolve_job", { id: j.id, outcome: "sent" });
              results.replaceChildren();
              await load();
              error("Revisado. Puedes reanudar el contacto desde Leads.");
            }),
          );
        }
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
      link.href = "/assets/css/internal-leads.css?v=20261104";
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
        view === "Plantillas" &&
        !document.hidden &&
        root.closest(".section.active") &&
        !busy &&
        Date.now() - templatesCheckedAt >= 60000 &&
        templates.some((t) => templateState(t)[2] === 0)
      )
        return run(async () => {
          await loadTemplates();
          render();
        });
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
