/* ==========================================================================
   CRM · Galería de capturas — Embla Carousel (patrón "Thumbs")
   Puerto a JS nativo del componente React "Embla Carousel Thumbs".
   El paquete embla-carousel-react es solo un hook alrededor de este mismo
   core (EmblaCarousel), por lo que el comportamiento es idéntico sin
   necesidad de React ni de un paso de build en un sitio estático.
   ========================================================================== */

(function () {
    "use strict";

    var stories = {
        control: {
            category: "Control total",
            title: "Tu negocio de un vistazo.",
            lead: "Consulta el estado de propiedades, contratos, pagos e incidencias desde un panel claro que se actualiza contigo.",
            items: ["Indicadores clave en tiempo real", "Agenda y vencimientos centralizados", "Acceso rapido a cada area de gestion"],
            image: "assets/images/crm-carousel/panel-control.png",
            alt: "Resumen de operaciones del CRM Nize"
        },
        inmuebles: {
            category: "Inmuebles",
            title: "Toda tu cartera, bien organizada.",
            lead: "Consulta pisos, habitaciones, disponibilidad y estado de alquiler desde una vista visual preparada para trabajar con rapidez.",
            items: ["Vista completa de la cartera", "Disponibilidad siempre visible", "Acceso directo a cada inmueble"],
            image: "assets/images/crm-carousel/inmuebles.png",
            alt: "Gestion de inmuebles del CRM Nize"
        },
        interesados: {
            category: "Interesados",
            title: "Cada oportunidad, en seguimiento.",
            lead: "Centraliza los contactos, identifica nuevas oportunidades y consulta la evolucion de cada periodo sin perder conversaciones importantes.",
            items: ["Contactos ordenados por periodo", "Seguimiento de asignaciones", "Busqueda rapida y segmentacion"],
            image: "assets/images/crm-carousel/interesados.png",
            alt: "Seguimiento de contactos interesados en Nize"
        },
        propietarios: {
            category: "Propietarios",
            title: "Todo centralizado, siempre accesible.",
            lead: "Reune propietarios, datos de contacto, inmuebles vinculados y documentacion en una unica area de trabajo.",
            items: ["Informacion de contacto unificada", "Inmuebles vinculados", "Acceso directo a Drive"],
            image: "assets/images/crm-carousel/propietarios.png",
            alt: "Gestion de propietarios en Nize"
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
            title: "Cada inquilino, siempre al dia.",
            lead: "Consulta contratos, cobros, incidencias, fechas clave y documentacion desde la ficha de cada inquilino.",
            items: ["Estado del contrato visible", "Alertas de cobros e incidencias", "Informacion y documentos conectados"],
            image: "assets/images/crm-carousel/inquilinos.png",
            alt: "Gestion de inquilinos en Nize"
        },
        contratos: {
            category: "Contratos",
            title: "Del borrador a la firma, sin friccion.",
            lead: "Genera, envia, firma y controla cada version de los contratos manteniendo todo el historial en un mismo lugar.",
            items: ["Plantillas y versiones", "Firma remota", "Estado y trazabilidad del envio"],
            image: "assets/images/crm-carousel/contratos.png",
            alt: "Gestion de contratos en Nize"
        },
        incidencias: {
            category: "Incidencias",
            title: "Resuelve cada aviso con claridad.",
            lead: "Prioriza las incidencias abiertas, identifica las urgentes y conserva un historial claro de cada resolucion.",
            items: ["Prioridades y estados visibles", "Busqueda por inmueble o inquilino", "Historial de incidencias resueltas"],
            image: "assets/images/crm-carousel/incidencias.png",
            alt: "Gestion de incidencias en Nize"
        },
        cobros: {
            category: "Cobros",
            title: "Cada cobro, bajo seguimiento.",
            lead: "Distingue lo cobrado de lo pendiente y revisa el historial financiero por inmueble o por inquilino.",
            items: ["Resumen mensual de cobros", "Pendientes y vencidos destacados", "Historial por inmueble o inquilino"],
            image: "assets/images/crm-carousel/cobros.png",
            alt: "Gestion de cobros en Nize"
        },
        gastos: {
            category: "Gastos",
            title: "Las cuentas claras por inmueble.",
            lead: "Organiza gastos, suministros y pagos a propietarios con filtros rapidos y una lectura financiera sencilla.",
            items: ["Gastos agrupados por inmueble", "Control de suministros", "Pagos y prorrateos centralizados"],
            image: "assets/images/crm-carousel/gastos.png",
            alt: "Gestion de gastos en Nize"
        }
    };

    var root = document.querySelector("[data-crm-embla]");
    var modal = document.querySelector("[data-crm-modal]");
    if (!root || !modal) return;

    var mainNode = root.querySelector("[data-embla-main]");
    var thumbsNode = root.querySelector("[data-embla-thumbs]");
    var figures = Array.prototype.slice.call(root.querySelectorAll("[data-story]"));
    var thumbButtons = Array.prototype.slice.call(root.querySelectorAll("[data-embla-thumb]"));
    var prevButton = root.querySelector("[data-embla-prev]");
    var nextButton = root.querySelector("[data-embla-next]");
    var progressBar = root.querySelector("[data-embla-progress]");
    var counterCurrent = root.querySelector("[data-embla-current]");

    var panel = modal.querySelector(".crm-story-modal__panel");
    var category = modal.querySelector("[data-modal-category]");
    var title = modal.querySelector("[data-modal-title]");
    var lead = modal.querySelector("[data-modal-lead]");
    var list = modal.querySelector("[data-modal-list]");
    var image = modal.querySelector("[data-modal-image]");

    var lastTrigger = null;
    var mainApi = null;
    var thumbsApi = null;

    /* ── Modal ─────────────────────────────────────────────────────────── */

    function openStory(key, trigger) {
        var story = stories[key];
        if (!story) return;

        lastTrigger = trigger || null;
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

    function closeStory() {
        if (modal.hidden) return;
        modal.hidden = true;
        document.body.classList.remove("crm-modal-open");
        if (lastTrigger) lastTrigger.focus();
    }

    modal.querySelectorAll("[data-crm-close]").forEach(function (control) {
        control.addEventListener("click", closeStory);
    });

    document.addEventListener("keydown", function (event) {
        if (event.key === "Escape") closeStory();
        if (modal.hidden || event.key !== "Tab") return;

        var focusable = modal.querySelectorAll("button:not([disabled]), [href], [tabindex]:not([tabindex='-1'])");
        if (!focusable.length) return;
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

    /* ── Carrusel ──────────────────────────────────────────────────────── */

    function goTo(index) {
        if (mainApi) mainApi.scrollTo(index);
    }

    function selectedIndex() {
        return mainApi ? mainApi.selectedScrollSnap() : 0;
    }

    function pad(value) {
        return value < 10 ? "0" + value : String(value);
    }

    function onSelect() {
        var index = selectedIndex();
        var total = figures.length;

        if (thumbsApi) thumbsApi.scrollTo(index);

        thumbButtons.forEach(function (button, i) {
            var isSelected = i === index;
            button.classList.toggle("is-selected", isSelected);
            button.setAttribute("aria-current", isSelected ? "true" : "false");
        });

        figures.forEach(function (figure, i) {
            // Solo la lámina visible es alcanzable con teclado.
            figure.tabIndex = i === index ? 0 : -1;
        });

        if (counterCurrent) counterCurrent.textContent = pad(index + 1);
        if (progressBar && total) {
            progressBar.style.transform = "scaleX(" + ((index + 1) / total) + ")";
        }

        if (prevButton && mainApi) prevButton.disabled = !mainApi.canScrollPrev();
        if (nextButton && mainApi) nextButton.disabled = !mainApi.canScrollNext();
    }

    function revealStory(key, trigger) {
        var figure = root.querySelector('[data-story="' + key + '"]');
        var index = figures.indexOf(figure);
        if (!figure || index < 0) return;

        goTo(index);
        root.scrollIntoView({ block: "center", behavior: "smooth" });
        openStory(key, trigger);
    }

    document.querySelectorAll("[data-open-story]").forEach(function (link) {
        link.addEventListener("click", function (event) {
            event.preventDefault();
            revealStory(link.getAttribute("data-open-story"), link);
        });
    });

    // Embla v8 no expone clickAllowed(), así que descartamos el clic que cierra
    // un arrastre para que deslizar no abra el modal ni salte de lámina.
    // En fase de captura: se ejecuta antes que los manejadores de los hijos.
    function preventClickAfterDrag(node) {
        var startX = 0;
        var startY = 0;
        var pressed = false;
        var dragged = false;
        var THRESHOLD = 6;

        node.addEventListener("pointerdown", function (event) {
            startX = event.clientX;
            startY = event.clientY;
            pressed = true;
            dragged = false;
        });

        node.addEventListener("pointermove", function (event) {
            if (!pressed) return;
            if (Math.abs(event.clientX - startX) > THRESHOLD || Math.abs(event.clientY - startY) > THRESHOLD) {
                dragged = true;
            }
        });

        node.addEventListener("pointerup", function () { pressed = false; });
        node.addEventListener("pointercancel", function () { pressed = false; dragged = false; });

        node.addEventListener("click", function (event) {
            if (!dragged) return;
            event.preventDefault();
            event.stopPropagation();
        }, true);
    }

    figures.forEach(function (figure) {
        figure.addEventListener("click", function () {
            openStory(figure.getAttribute("data-story"), figure);
        });
    });

    if (typeof window.EmblaCarousel !== "function" || !mainNode || !thumbsNode) {
        // Sin la librería el carrusel queda como scroll horizontal nativo:
        // el modal y los enlaces "Ver pantalla real" siguen funcionando.
        return;
    }

    mainApi = window.EmblaCarousel(mainNode, {
        loop: false,
        align: "start",
        skipSnaps: false,
        containScroll: "trimSnaps"
    });

    thumbsApi = window.EmblaCarousel(thumbsNode, {
        containScroll: "keepSnaps",
        dragFree: true,
        align: "start"
    });

    root.classList.add("is-ready");

    preventClickAfterDrag(mainNode);
    preventClickAfterDrag(thumbsNode);

    thumbButtons.forEach(function (button, index) {
        button.addEventListener("click", function () {
            goTo(index);
        });
    });

    if (prevButton) prevButton.addEventListener("click", function () { mainApi.scrollPrev(); });
    if (nextButton) nextButton.addEventListener("click", function () { mainApi.scrollNext(); });

    mainNode.addEventListener("keydown", function (event) {
        if (event.key === "ArrowRight") {
            event.preventDefault();
            mainApi.scrollNext();
        } else if (event.key === "ArrowLeft") {
            event.preventDefault();
            mainApi.scrollPrev();
        }
    });

    mainApi.on("select", onSelect).on("reInit", onSelect);
    onSelect();
})();
