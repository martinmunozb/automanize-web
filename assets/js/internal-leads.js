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
    leads = [],
    campaigns = [],
    templates = [],
    templatesError = "",
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
  async function loadTemplates() {
    templatesError = "";
    templates = [];
    if (!status?.whatsapp.configured) {
      templatesError = "El canal de WhatsApp todavía no está vinculado.";
      return;
    }
    try {
      templates = (await api("templates", undefined, "GET")).items;
    } catch (e) {
      templatesError = e.message;
    }
  }
  const usableTemplates = () => templates.filter((t) => t.status === "APPROVED" && t.supported);
  async function load() {
    [status, { items: campaigns }] = await Promise.all([api("status"), api("campaigns")]);
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
    for (const name of ["Leads", "Secuencias", "Conversaciones", "Configuración", "Ayuda"]) {
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
    else if (view === "Ayuda") renderHelp(content);
    else renderConfig(content);
  }
  function renderHelp(parent) {
    const sections = [
      [
        "Cómo funciona",
        "1. Importa los contactos desde Airtable. 2. Crea una secuencia con los mensajes y sus esperas. 3. Actívala para cada contacto con consentimiento acreditado. Importar o guardar una secuencia no envía mensajes por sí solo.",
      ],
      [
        "Cómo importar leads",
        "En Leads, pulsa Sincronizar Airtable. También se hace solo cada 15 minutos. Los contactos entran como Nuevo y nunca se activan automáticamente. Si una fila tiene el teléfono mal o repetido, se avisa y las demás se importan igualmente.",
      ],
      [
        "Cómo crear una secuencia",
        "En Secuencias, pon un nombre y añade un paso por mensaje. Elige una plantilla aprobada por Meta, indica con qué dato se rellena cada campo y cuánto esperar. Puedes reordenar y eliminar pasos. Pulsa Calcular fechas para ver un ejemplo y guarda. Marca Activar esta versión para poder usarla.",
      ],
      [
        "Cómo activar o pausar un contacto",
        "En Leads, elige la secuencia en la fila del contacto y pulsa Activar; el panel pide confirmación y te dice cuándo saldrá el primer mensaje. Pausar cancela lo programado. Reanudar continúa por el mensaje pendiente sin repetir los ya enviados.",
      ],
      [
        "Cuándo sale cada mensaje",
        "La espera del primer mensaje se cuenta desde la activación del lead. Las siguientes se cuentan desde el envío del mensaje anterior, nunca desde la importación. Ejemplo: primer mensaje con 0 días, segundo 2 días después del primero y tercero 5 días después del segundo. Son días de calendario de Madrid; si un envío cae fuera de los días u horas permitidos, pasa al siguiente momento permitido. El límite diario y la separación mínima también pueden retrasarlo. Consulta Próximo envío en Leads.",
      ],
      [
        "Qué pasa si el cliente responde",
        "Se cancelan todos los mensajes pendientes y el contacto queda como Respondido, con el motivo visible. Lo mismo ocurre si pide la baja, que además impide volver a escribirle. Si una persona le escribe desde el móvil o desde Seendy, la secuencia también se detiene y no se reanuda sola.",
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
        "Editar crea una versión nueva y Duplicar crea una copia. Los contactos ya activados mantienen sus mensajes y esperas originales. Activar una versión permite seleccionarla para nuevos contactos; no activa contactos ni habilita el envío general. Pausar una secuencia bloquea sus envíos.",
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
      if (lead.is_test) stateCell.append(el("small", "Contacto de prueba"));
      if (lead.stop_text) stateCell.append(el("small", lead.stop_text));
      for (const blocker of lead.blockers || []) stateCell.append(el("small", blocker));
      if (!lead.blockers && !lead.consent)
        stateCell.append(el("small", "Sin consentimiento acreditado"));
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
            const sequence = lead.snapshot
              ? "la secuencia pendiente"
              : `«${campaigns.find((c) => c.id === choice.value)?.name}»`;
            if (
              !confirm(
                `¿Activar ${sequence} para ${lead.name || "+" + lead.phone}? Se le enviarán mensajes de WhatsApp si no responde.`,
              )
            )
              return;
            const r = await api("activate", { id: lead.id, campaign_id: choice.value });
            await loadLeads();
            render();
            error(`Activado. Próximo envío previsto: ${date(r?.due_at)}.`);
          },
          true,
        );
        activate.disabled = !lead.consent;
        actions.append(activate);
      }
      if (lead.is_test && lead.state !== "opted_out")
        actions.append(
          button("Reiniciar prueba", async () => {
            if (!confirm("¿Reiniciar el contacto de prueba? Se borrará su programación.")) return;
            await api("reset_test_lead", { id: lead.id });
            await loadLeads();
            render();
          }),
        );
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
  const newStep = () => ({
    name: "",
    template: "",
    language: "es_ES",
    variables: [],
    delay_days: 0,
    time: "",
    weekdays: [1, 2, 3, 4, 5],
    only_if_no_reply: true,
  });
  function renderCampaigns(parent) {
    parent.append(el("h3", "Crea tu secuencia paso a paso"));
    note(
      parent,
      "Elige una plantilla de WhatsApp por mensaje, rellena sus campos y decide cuánto esperar. El primer paso cuenta desde la activación; los demás, desde el envío anterior.",
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
      "Editar guarda una versión nueva. Los leads ya activados conservan los pasos originales. Una respuesta o baja detiene siempre el seguimiento.",
    );
    const list = el("div", undefined, "la-tools");
    for (const c of campaigns) {
      const card = el("div", undefined, "la-card");
      card.append(
        el("strong", c.name),
        el("p", `${c.steps.length} pasos · ${c.active ? "Activa" : "Pausada"}`),
        el("small", c.steps.map((s) => `${s.template} (${s.delay_days} d)`).join(" → ")),
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
      const card = el("div", undefined, "la-step");
      card.append(el("h3", `Mensaje ${index + 1}`));
      const grid = el("div", undefined, "la-form-grid");
      const nameInput = field(grid, "Nombre", "text", step.name);
      nameInput.addEventListener("input", () => {
        step.name = nameInput.value;
        preview();
      });
      const usable = usableTemplates();
      const current = `${step.template}|${step.language}`;
      const options = usable.map((t) => [
        `${t.name}|${t.language}`,
        `${t.name} · ${t.language} · ${t.category || ""}`,
      ]);
      if (step.template && !options.some(([v]) => v === current))
        options.unshift([current, `${step.template} · no disponible en Meta`]);
      const templateInput = select(
        grid,
        "Plantilla aprobada de Meta",
        [["", usable.length ? "Elige una plantilla" : "Sin plantillas aprobadas"], ...options],
        step.template ? current : "",
      );
      templateInput.addEventListener("change", () => {
        const [template, language] = templateInput.value.split("|");
        const chosen = usable.find((t) => t.name === template && t.language === language);
        step.template = template || "";
        step.language = language || "es_ES";
        step.variables = Array.from({ length: chosen?.parameters || 0 }, (_, i) => step.variables[i] || "");
        render();
      });
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
      const chosen = usable.find((t) => t.name === step.template && t.language === step.language);
      if (chosen) card.append(el("p", `Texto: ${chosen.body}`, "la-note"));
      const variables = el("div");
      step.variables.forEach((value, parameter) => {
        const preset = fieldOptions.some(([v]) => v === value);
        const source = select(
          variables,
          `Campo {{${parameter + 1}}} del mensaje ${index + 1}`,
          [...fieldOptions, ["", "Texto fijo"]],
          preset ? value : "",
        );
        source.addEventListener("change", () => {
          step.variables[parameter] = source.value;
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
          step.variables[parameter] = input.value;
          preview();
        });
      });
      grid.append(variables);
      note(
        card,
        index === 0
          ? "0 días = primer horario permitido desde que activas el contacto."
          : `La espera empieza cuando se envía el mensaje ${index}, no cuando se importa el lead.`,
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
      note(card, "Solo enviar si no ha respondido: obligatorio");
      const move = (to) => async () => {
        steps.splice(to, 0, steps.splice(index, 1)[0]);
        render();
      };
      const up = button("Subir", move(index - 1));
      up.disabled = index === 0;
      const down = button("Bajar", move(index + 1));
      down.disabled = index === steps.length - 1;
      card.append(
        up,
        down,
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
            `${i + 1}. ${s.name || s.template || "Plantilla pendiente"} · ${s.delay_days} días ${i === 0 ? "desde la activación" : `después del mensaje ${i}`} · ${s.time || "primera hora permitida"} (Madrid)${s.variables.length ? " · " + s.variables.join(" / ") : ""}`,
          ),
        ),
      );
    }
    preview();
    const dates = el("div", undefined, "la-preview");
    form.append(
      button("Calcular fechas", async () => {
        const r = await api("preview_schedule", { steps });
        dates.replaceChildren(el("strong", "Si activas un contacto ahora"));
        r.items.forEach((at, i) => dates.append(el("p", `Mensaje ${i + 1}: ${date(at)}`)));
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
          error("Secuencia guardada. Ningún contacto se ha activado.");
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
          const config = {
            enabled: enabled.checked,
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
      link.href = "/assets/css/internal-leads.css?v=20261102";
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
