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

    var carousel = document.querySelector("[data-crm-carousel]");
    var modal = document.querySelector("[data-crm-modal]");
    if (!carousel || !modal) return;

    var track = carousel.querySelector("[data-crm-track]");
    var cards = Array.prototype.slice.call(carousel.querySelectorAll("[data-story]"));
    var previousButton = carousel.querySelector("[data-crm-prev]");
    var nextButton = carousel.querySelector("[data-crm-next]");
    var panel = modal.querySelector(".crm-story-modal__panel");
    var category = modal.querySelector("[data-modal-category]");
    var title = modal.querySelector("[data-modal-title]");
    var lead = modal.querySelector("[data-modal-lead]");
    var list = modal.querySelector("[data-modal-list]");
    var image = modal.querySelector("[data-modal-image]");
    var gsap = window.gsap;
    var active = Math.min(2, cards.length - 1);
    var firstRun = true;
    var lastTrigger = null;
    var timeline = null;
    var mediaSize = 420;
    var prefersReduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function isVertical() {
        return window.matchMedia && window.matchMedia("(max-width: 767px)").matches;
    }

    function activeGrow() {
        var ratio = 0.52;
        return cards.length > 1 ? (ratio * (cards.length - 1)) / (1 - ratio) : 1;
    }

    function setImmediate(card, img, footer, isActive, index) {
        var vertical = isVertical();
        var rotate = isActive ? 0 : index < active ? 8 : -8;
        var drift = Math.max(-1.5, Math.min(1.5, active - index)) * 0.5 * mediaSize * 0.06;
        card.style.flexGrow = isActive ? activeGrow() : 1;
        card.style.transform = vertical ? "rotateX(" + -rotate + "deg)" : "rotateY(" + rotate + "deg)";
        card.style.setProperty("--ag-dim", isActive ? "0" : "0.35");
        img.style.setProperty("--ag-gray", isActive ? "0" : "1");
        img.style.transform = "translate(-50%, -50%) translate(" + (vertical ? 0 : drift) + "px, " + (vertical ? drift : 0) + "px)";
        footer.style.opacity = isActive ? "1" : "0";
        footer.style.transform = isActive ? "translateX(0)" : "translateX(-14px)";
    }

    function applyLayout(animate) {
        if (!cards.length) return;
        if (timeline) timeline.kill();

        var duration = animate && !prefersReduced ? 0.6 : 0;
        var vertical = isVertical();
        timeline = gsap && !prefersReduced ? gsap.timeline() : null;

        cards.forEach(function (card, index) {
            var isActive = index === active;
            var img = card.querySelector("img");
            var footer = card.querySelector(".crm-story__footer");
            var rotate = isActive ? 0 : index < active ? 8 : -8;
            var drift = Math.max(-1.5, Math.min(1.5, active - index)) * 0.5 * mediaSize * 0.06;

            card.classList.toggle("crm-story--active", isActive);
            card.setAttribute("aria-current", isActive ? "true" : "false");
            card.style.setProperty("--ag-dim", isActive ? "0" : "0.35");

            if (!timeline || !img || !footer) {
                if (img && footer) setImmediate(card, img, footer, isActive, index);
                return;
            }

            timeline.to(card, {
                flexGrow: isActive ? activeGrow() : 1,
                rotateX: vertical ? -rotate : 0,
                rotateY: vertical ? 0 : rotate,
                duration: duration,
                ease: "power3.out"
            }, 0);

            timeline.to(img, {
                xPercent: -50,
                yPercent: -50,
                x: vertical ? 0 : drift,
                y: vertical ? drift : 0,
                "--ag-gray": isActive ? 0 : 1,
                duration: duration,
                ease: "power3.out"
            }, 0);

            timeline.to(footer, {
                opacity: isActive ? 1 : 0,
                x: isActive ? 0 : -14,
                duration: isActive ? duration : duration * 0.6,
                ease: "power3.out"
            }, 0);
        });
    }

    function measure() {
        var rect = track.getBoundingClientRect();
        var total = isVertical() ? Math.max(rect.height, 860) : rect.width;
        var usable = Math.max(total - 10 * (cards.length - 1), 120);
        mediaSize = Math.max(180, usable * 0.52 * 1.22);
        track.style.setProperty("--ag-media-size", mediaSize + "px");
        applyLayout(!firstRun);
        firstRun = false;
    }

    function setActive(index, animate) {
        active = (index + cards.length) % cards.length;
        applyLayout(animate !== false);
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
        var index = cards.indexOf(card);
        if (!card || index < 0) return;

        setActive(index, true);
        card.scrollIntoView({ block: "center", inline: "center", behavior: "smooth" });
        openStory(key, trigger);
    }

    function closeStory() {
        if (modal.hidden) return;
        modal.hidden = true;
        document.body.classList.remove("crm-modal-open");
        if (lastTrigger) lastTrigger.focus();
    }

    cards.forEach(function (card, index) {
        card.addEventListener("mouseenter", function () { setActive(index, true); });
        card.addEventListener("focus", function () { setActive(index, true); });
        card.addEventListener("click", function (event) {
            if (index !== active) {
                event.preventDefault();
                setActive(index, true);
                return;
            }
            openStory(card.getAttribute("data-story"), card);
        });
        card.addEventListener("keydown", function (event) {
            if (event.key === "ArrowRight" || event.key === "ArrowDown") {
                event.preventDefault();
                setActive(index + 1, true);
                cards[active].focus();
            } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
                event.preventDefault();
                setActive(index - 1, true);
                cards[active].focus();
            }
        });
    });

    if (previousButton) previousButton.addEventListener("click", function () { setActive(active - 1, true); });
    if (nextButton) nextButton.addEventListener("click", function () { setActive(active + 1, true); });

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

    if ("ResizeObserver" in window) {
        new ResizeObserver(measure).observe(track);
    } else {
        window.addEventListener("resize", measure);
    }
    measure();
})();
