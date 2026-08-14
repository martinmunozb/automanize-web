(function () {
    "use strict";

    var stories = {
        control: {
            category: "Control total",
            title: "Tu negocio de un vistazo.",
            lead: "Consulta el estado de propiedades, contratos, pagos e incidencias desde un panel claro que se actualiza contigo.",
            items: ["Indicadores clave en tiempo real", "Agenda y vencimientos centralizados", "Acceso rápido a cada área de gestión"],
            image: "assets/images/crm-carousel/panel-control.png",
            alt: "Resumen de operaciones del CRM Nize"
        },
        inmuebles: {
            category: "Inmuebles",
            title: "Toda tu cartera, bien organizada.",
            lead: "Consulta pisos, habitaciones, disponibilidad y estado de alquiler desde una vista visual preparada para trabajar con rapidez.",
            items: ["Vista completa de la cartera", "Disponibilidad siempre visible", "Acceso directo a cada inmueble"],
            image: "assets/images/crm-carousel/inmuebles.png",
            alt: "Gestión de inmuebles del CRM Nize"
        },
        interesados: {
            category: "Interesados",
            title: "Cada oportunidad, en seguimiento.",
            lead: "Centraliza los contactos, identifica nuevas oportunidades y consulta la evolución de cada periodo sin perder conversaciones importantes.",
            items: ["Contactos ordenados por periodo", "Seguimiento de asignaciones", "Búsqueda rápida y segmentación"],
            image: "assets/images/crm-carousel/interesados.png",
            alt: "Seguimiento de contactos interesados en Nize"
        },
        propietarios: {
            category: "Propietarios",
            title: "Todo centralizado, siempre accesible.",
            lead: "Reúne propietarios, datos de contacto, inmuebles vinculados y documentación en una única área de trabajo.",
            items: ["Información de contacto unificada", "Inmuebles vinculados", "Acceso directo a Drive"],
            image: "assets/images/crm-carousel/propietarios.png",
            alt: "Gestión de propietarios en Nize"
        },
        calendario: {
            category: "Calendario",
            title: "Tu equipo siempre coordinado.",
            lead: "Organiza visitas, llamadas, firmas y recordatorios en una agenda compartida con las tareas importantes siempre a la vista.",
            items: ["Calendario compartido", "Tareas con prioridad y vencimiento", "Vista diaria, semanal, mensual y anual"],
            image: "assets/images/crm-carousel/calendario.png",
            alt: "Calendario y tareas del equipo en Nize"
        },
        inquilinos: {
            category: "Inquilinos",
            title: "Cada inquilino, siempre al día.",
            lead: "Consulta contratos, cobros, incidencias, fechas clave y documentación desde la ficha de cada inquilino.",
            items: ["Estado del contrato visible", "Alertas de cobros e incidencias", "Información y documentos conectados"],
            image: "assets/images/crm-carousel/inquilinos.png",
            alt: "Gestión de inquilinos en Nize"
        },
        contratos: {
            category: "Contratos",
            title: "Del borrador a la firma, sin fricción.",
            lead: "Genera, envía, firma y controla cada versión de los contratos manteniendo todo el historial en un mismo lugar.",
            items: ["Plantillas y versiones", "Firma remota", "Estado y trazabilidad del envío"],
            image: "assets/images/crm-carousel/contratos.png",
            alt: "Gestión de contratos en Nize"
        },
        incidencias: {
            category: "Incidencias",
            title: "Resuelve cada aviso con claridad.",
            lead: "Prioriza las incidencias abiertas, identifica las urgentes y conserva un historial claro de cada resolución.",
            items: ["Prioridades y estados visibles", "Búsqueda por inmueble o inquilino", "Historial de incidencias resueltas"],
            image: "assets/images/crm-carousel/incidencias.png",
            alt: "Gestión de incidencias en Nize"
        },
        cobros: {
            category: "Cobros",
            title: "Cada cobro, bajo seguimiento.",
            lead: "Distingue lo cobrado de lo pendiente y revisa el historial financiero por inmueble o por inquilino.",
            items: ["Resumen mensual de cobros", "Pendientes y vencidos destacados", "Historial por inmueble o inquilino"],
            image: "assets/images/crm-carousel/cobros.png",
            alt: "Gestión de cobros en Nize"
        },
        gastos: {
            category: "Gastos",
            title: "Las cuentas claras por inmueble.",
            lead: "Organiza gastos, suministros y pagos a propietarios con filtros rápidos y una lectura financiera sencilla.",
            items: ["Gastos agrupados por inmueble", "Control de suministros", "Pagos y prorrateos centralizados"],
            image: "assets/images/crm-carousel/gastos.png",
            alt: "Gestión de gastos en Nize"
        }
    };

    var carousel = document.querySelector("[data-crm-carousel]");
    var modal = document.querySelector("[data-crm-modal]");
    if (!carousel || !modal) return;

    var track = carousel.querySelector("[data-crm-track]");
    var previousButton = carousel.querySelector("[data-crm-prev]");
    var nextButton = carousel.querySelector("[data-crm-next]");
    var panel = modal.querySelector(".crm-story-modal__panel");
    var category = modal.querySelector("[data-modal-category]");
    var title = modal.querySelector("[data-modal-title]");
    var lead = modal.querySelector("[data-modal-lead]");
    var list = modal.querySelector("[data-modal-list]");
    var image = modal.querySelector("[data-modal-image]");
    var lastTrigger = null;

    function cardStep() {
        var card = track.querySelector(".crm-story");
        var gap = parseFloat(window.getComputedStyle(track).gap) || 16;
        return card ? card.getBoundingClientRect().width + gap : 300;
    }

    function updateControls() {
        var maxScroll = track.scrollWidth - track.clientWidth;
        previousButton.disabled = track.scrollLeft <= 2;
        nextButton.disabled = track.scrollLeft >= maxScroll - 2;
    }

    function scroll(direction) {
        track.scrollBy({ left: cardStep() * direction, behavior: "smooth" });
    }

    function openStory(key, trigger) {
        var story = stories[key];
        if (!story) return;

        lastTrigger = trigger;
        category.textContent = story.category;
        title.textContent = story.title;
        lead.textContent = story.lead;
        list.replaceChildren();
        story.items.forEach(function (item) {
            var listItem = document.createElement("li");
            listItem.textContent = item;
            list.appendChild(listItem);
        });
        image.src = story.image;
        image.alt = story.alt;
        modal.hidden = false;
        document.body.classList.add("crm-modal-open");
        panel.focus();
    }

    function revealStory(key, trigger) {
        var card = carousel.querySelector('[data-story="' + key + '"]');
        if (!card) return;

        var centeredPosition = card.offsetLeft - (track.clientWidth - card.clientWidth) / 2;
        track.scrollTo({
            left: Math.max(0, centeredPosition),
            behavior: "smooth"
        });
        openStory(key, trigger);
    }

    function closeStory() {
        if (modal.hidden) return;
        modal.hidden = true;
        document.body.classList.remove("crm-modal-open");
        if (lastTrigger) lastTrigger.focus();
    }

    previousButton.addEventListener("click", function () { scroll(-1); });
    nextButton.addEventListener("click", function () { scroll(1); });
    track.addEventListener("scroll", updateControls, { passive: true });
    window.addEventListener("resize", updateControls);

    carousel.querySelectorAll("[data-story]").forEach(function (card) {
        card.addEventListener("click", function () {
            openStory(card.getAttribute("data-story"), card);
        });
    });

    document.querySelectorAll("[data-open-story]").forEach(function (link) {
        link.addEventListener("click", function (event) {
            event.preventDefault();
            revealStory(link.getAttribute("data-open-story"), link);
        });
    });

    modal.querySelectorAll("[data-crm-close]").forEach(function (control) {
        control.addEventListener("click", closeStory);
    });

    document.addEventListener("keydown", function (event) {
        if (event.key === "Escape") closeStory();
        if (modal.hidden || event.key !== "Tab") return;

        var focusable = modal.querySelectorAll("button:not([disabled]), [href], [tabindex]:not([tabindex='-1'])");
        var first = focusable[0];
        var last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
        }
    });

    updateControls();
})();
