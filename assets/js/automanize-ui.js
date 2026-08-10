/* ===================================================================
   AUTOMANIZE — UI COMPARTIDA
   Inyecta el dock flotante (la navegación del sitio, que sustituye a la
   antigua navbar superior) y arranca la animación SplitText.

   El dock se inyecta desde aquí en vez de copiarlo en cada .html: son
   ~60 líneas de marcado idénticas en una docena de páginas, y tenerlas
   duplicadas garantizaba que se desincronizaran al primer cambio. Los
   enlaces importantes siguen existiendo como HTML real en el pie de
   cada página, así que la navegación no depende de este script.
   =================================================================== */

(function () {
    'use strict';

    // --- Marcado del dock -------------------------------------------
    // Mismos iconos y orden que la portada.
    const DOCK_HTML = `
    <nav class="floating-dock" id="floatingDock" aria-label="Navegación principal">
        <a class="dock-item" href="index.html" data-title="Home">
            <svg class="dock-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11.5 12 4l9 7.5" /><path d="M5 10v9a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-9" /></svg>
            <span class="dock-tooltip">Inicio</span>
        </a>
        <a class="dock-item" href="casos-exito.html" data-title="Casos de éxito">
            <svg class="dock-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
                <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
                <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
                <path d="M4 22h16" />
                <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
                <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
                <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
            </svg>
            <span class="dock-tooltip">Casos de éxito</span>
        </a>
        <a class="dock-item" href="our-services.html" data-title="Servicios" data-menu="servicios">
            <svg class="dock-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="7" height="7" rx="1" /><rect x="13" y="4" width="7" height="7" rx="1" /><rect x="4" y="13" width="7" height="7" rx="1" /><rect x="13" y="13" width="7" height="7" rx="1" /></svg>
            <span class="dock-tooltip">Servicios</span>
        </a>
        <a class="dock-item" href="sobre-nosotros.html" data-title="Automanize">
            <img class="dock-icon" src="assets/images/nize-isotipo.png" alt="" />
            <span class="dock-tooltip">Sobre nosotros</span>
        </a>
        <a class="dock-item" id="dockInstagram" href="https://www.instagram.com/automanize/" target="_blank" rel="noopener noreferrer" data-title="Instagram">
            <svg class="dock-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                <line x1="17.5" y1="6.5" x2="17.5" y2="6.5" />
            </svg>
            <span class="dock-tooltip">Instagram</span>
        </a>
        <a class="dock-item" href="consultoria-gratuita.html" data-title="Consultoría">
            <svg class="dock-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="7" cy="7" r="2.5" />
                <path d="M2.4 19.6v-1a4.6 4.6 0 0 1 4.6-4.6 4.6 4.6 0 0 1 4.6 4.6v1" />
                <path d="M13.3 4.5h6.4a1.8 1.8 0 0 1 1.8 1.8v3.2a1.8 1.8 0 0 1-1.8 1.8h-3.1l-2.3 2v-2h-.5a1.8 1.8 0 0 1-1.8-1.8V6.3a1.8 1.8 0 0 1 1.8-1.8z" stroke-width="1.5" />
                <path d="M15 6.9h4.2M15 8.5h2.8" stroke-width="1.4" />
            </svg>
            <span class="dock-tooltip">Consultoría</span>
        </a>
        <a class="dock-item" href="consultoria-gratuita.html" data-title="Solicitar demo">
            <svg class="dock-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="9.25" />
                <path d="M10 8.3v7.4l6.2-3.7z" fill="currentColor" stroke="none" />
            </svg>
            <span class="dock-tooltip">Solicitar demo</span>
        </a>
    </nav>

    <div class="dock-panel" id="dockPanel" role="menu" aria-label="Servicios">
        <div class="dock-panel-card">
            <a href="our-services.html#whatsapp">Asistente de WhatsApp</a>
            <a href="facturacion.html">Facturación Inteligente</a>
            <a href="our-services.html#cobros">Gestor de Cobros</a>
            <a href="https://captador.automanize.com/radar">Captador de Clientes</a>
            <a href="crm.html">Centraliza tu empresa</a>
            <a href="diseno-web.html">Diseño Web</a>
        </div>
    </div>`;

    function montarDock() {
        // Si la página ya trae su propio dock escrito a mano (la portada),
        // no se duplica.
        if (document.getElementById('floatingDock')) return;

        const cont = document.createElement('div');
        cont.innerHTML = DOCK_HTML;
        while (cont.firstChild) document.body.appendChild(cont.firstChild);

        // Marca el icono de la página actual
        const actual = location.pathname.split('/').pop() || 'index.html';
        document.querySelectorAll('.floating-dock .dock-item').forEach((a) => {
            const href = (a.getAttribute('href') || '').split('#')[0];
            if (href && href === actual) a.classList.add('is-current');
        });
    }

    function iniciarDock() {
        const dock = document.getElementById('floatingDock');
        if (!dock) return;
        const items = [...dock.querySelectorAll('.dock-item')];

        const BASE_SCALE = 1;
        const MAX_SCALE  = 1.55;
        const RANGE      = 140;   // px de radio de influencia del ratón

        // Magnificación tipo dock de macOS: por cada movimiento del ratón
        // se mide la distancia de cada icono al puntero y se escala según
        // esa distancia (en el original de Aceternity lo hace Framer
        // Motion con useMotionValue/useSpring).
        function magnify(mouseX) {
            items.forEach((item) => {
                const rect = item.getBoundingClientRect();
                const center = rect.left + rect.width / 2;
                const dist = Math.abs(mouseX - center);
                const t = Math.max(0, 1 - dist / RANGE);
                const scale = BASE_SCALE + (MAX_SCALE - BASE_SCALE) * t;
                item.style.transform = `translateY(${(scale - 1) * -14}px) scale(${scale})`;
            });
        }
        function reset() { items.forEach((item) => { item.style.transform = ''; }); }

        dock.addEventListener('mouseenter', () => dock.classList.add('is-expanded'));
        dock.addEventListener('mouseleave', () => { dock.classList.remove('is-expanded'); reset(); });
        dock.addEventListener('mousemove', (e) => magnify(e.clientX));

        // --- Submenú de Servicios ---
        const panel = document.getElementById('dockPanel');
        const trigger = dock.querySelector('[data-menu="servicios"]');

        // En un móvil no hay puntero que "pase por encima": mouseenter y
        // mouseleave no llegan a dispararse nunca. Se detecta aquí para
        // darle al submenú un comportamiento a base de toques.
        const puedeHover = matchMedia('(hover: hover) and (pointer: fine)').matches;

        // Sin hover la barra no se puede expandir de ninguna manera, así
        // que en táctil se deja siempre a tamaño completo.
        if (!puedeHover) dock.classList.add('is-expanded');

        if (panel && trigger) {
            let cerrarTimer = null;

            function colocar() {
                // Se mide el icono YA magnificado y se centra el panel
                // sobre él, sujetándolo dentro de la pantalla.
                const r = trigger.getBoundingClientRect();
                const ancho = panel.offsetWidth;
                const margen = 10;
                let x = r.left + r.width / 2 - ancho / 2;
                x = Math.min(Math.max(x, margen), innerWidth - ancho - margen);
                panel.style.left = x + 'px';
                panel.style.top = (r.top - panel.offsetHeight) + 'px';
                panel.style.setProperty('--punta-x', (r.left + r.width / 2 - x) + 'px');
            }

            function abrir() {
                clearTimeout(cerrarTimer);
                panel.classList.add('is-open');
                trigger.classList.add('has-panel-open');
                colocar();
            }

            function cerrar() {
                // clearTimeout previo OBLIGATORIO: trigger y dock disparan
                // "mouseleave" casi a la vez al cruzar hacia el panel, así
                // que cerrar() se llama dos veces seguidas. Sin esto, el
                // temporizador de la PRIMERA llamada queda huérfano y
                // cierra el panel aunque el ratón ya esté dentro.
                clearTimeout(cerrarTimer);
                cerrarTimer = setTimeout(() => {
                    panel.classList.remove('is-open');
                    trigger.classList.remove('has-panel-open');
                }, 160);
            }

            function cerrarYa() {
                clearTimeout(cerrarTimer);
                panel.classList.remove('is-open');
                trigger.classList.remove('has-panel-open');
            }

            if (puedeHover) {
                trigger.addEventListener('mouseenter', abrir);
                trigger.addEventListener('mouseleave', cerrar);
                panel.addEventListener('mouseenter', () => clearTimeout(cerrarTimer));
                panel.addEventListener('mouseleave', cerrar);
                dock.addEventListener('mousemove', () => { if (panel.classList.contains('is-open')) colocar(); });
                dock.addEventListener('mouseleave', cerrar);
            } else {
                // Táctil: el primer toque despliega el submenú en vez de
                // seguir el enlace; el segundo, con el panel ya abierto,
                // sí navega a la página de Servicios.
                trigger.addEventListener('click', (e) => {
                    if (!panel.classList.contains('is-open')) {
                        e.preventDefault();
                        abrir();
                    }
                });

                // Un toque fuera del panel lo cierra. Va en la fase de
                // captura para enterarse aunque el destino del toque
                // detenga la propagación.
                document.addEventListener('click', (e) => {
                    if (!panel.classList.contains('is-open')) return;
                    if (panel.contains(e.target) || trigger.contains(e.target)) return;
                    cerrarYa();
                }, true);
            }

            addEventListener('scroll', () => { if (panel.classList.contains('is-open')) colocar(); }, { passive: true });
        }

        // --- Instagram: en móvil intenta abrir la app ---
        const igLink = document.getElementById('dockInstagram');
        if (igLink && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
            igLink.removeAttribute('target');
            igLink.addEventListener('click', (e) => {
                e.preventDefault();
                const inicio = Date.now();
                location.href = 'instagram://user?username=automanize';
                // Si tras un momento seguimos en la pestaña, la app no
                // estaba instalada: se cae al perfil web.
                setTimeout(() => {
                    if (!document.hidden && Date.now() - inicio < 2000) {
                        location.href = 'https://www.instagram.com/automanize/';
                    }
                }, 1200);
            });
        }
    }

    // --- SplitText ---------------------------------------------------
    function iniciarSplitText() {
        const DELAY = 50;               // ms entre letra y letra
        const DURATION = 1.25;          // s por letra
        const MAX_STAGGER_TOTAL = 900;  // tope de la cascada completa (ms)
        const THRESHOLD = 0.1;
        const ROOT_MARGIN = '0px 0px -80px 0px';

        const targets = document.querySelectorAll('[data-split]');
        if (!targets.length) return;

        // Parte el texto respetando el marcado anidado: solo envuelve los
        // nodos de texto. Los <br> se dejan intactos.
        function splitChars(root) {
            const chars = [];
            (function walk(node) {
                [...node.childNodes].forEach((child) => {
                    if (child.nodeType === Node.TEXT_NODE) {
                        const text = child.textContent;
                        if (!text.trim() && !text.includes(' ')) return;

                        // Las letras van dentro de UN envoltorio inline: si
                        // el padre es flex, cada letra suelta sería un flex
                        // item y los espacios se descartarían.
                        const frag = document.createElement('span');
                        frag.className = 'split-frag';

                        // Se agrupan por PALABRA: sueltas, al ser
                        // inline-block, el navegador puede cortar entre
                        // cualquier par de letras y partir palabras.
                        text.split(/(\s+)/).forEach((trozo) => {
                            if (!trozo) return;
                            if (/^\s+$/.test(trozo)) {
                                frag.appendChild(document.createTextNode(trozo));
                                return;
                            }
                            const palabra = document.createElement('span');
                            palabra.className = 'split-word';
                            for (const ch of trozo) {
                                const span = document.createElement('span');
                                span.className = 'split-char';
                                span.textContent = ch;
                                palabra.appendChild(span);
                                chars.push(span);
                            }
                            frag.appendChild(palabra);
                        });

                        node.replaceChild(frag, child);
                        return;
                    }

                    if (child.nodeType !== Node.ELEMENT_NODE) return;
                    const tag = child.tagName.toLowerCase();
                    if (tag === 'br') return;

                    // Piezas que NO se parten y se animan como una unidad:
                    //  - <svg>: partirlo lo rompería.
                    //  - .shiny-gold: su degradado usa background-clip:text
                    //    sobre TODO el bloque; partido, se volvería invisible.
                    if (tag === 'svg' || child.classList.contains('shiny-gold') ||
                        child.hasAttribute('data-split-unit')) {
                        child.classList.add('split-char');
                        chars.push(child);
                        return;
                    }
                    walk(child);
                });
            })(root);
            return chars;
        }

        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                const el = entry.target;
                if (!entry.isIntersecting) {
                    // Al salir de pantalla se vuelve al estado inicial para
                    // que la cascada se repita en la próxima entrada.
                    el.classList.remove('is-revealed');
                    return;
                }
                // Quitar y poner la clase en el mismo tick no basta: el
                // navegador agrupa los cambios. Leer offsetWidth fuerza un
                // reflow entre medias y reinicia la animación.
                el.classList.remove('is-revealed');
                void el.offsetWidth;
                el.classList.add('is-revealed');
            });
        }, { threshold: THRESHOLD, rootMargin: ROOT_MARGIN });

        targets.forEach((el) => {
            const chars = splitChars(el);
            if (!chars.length) return;

            // El desfase de 50 ms está pensado para textos cortos. En un
            // párrafo largo daría varios segundos hasta la última letra, así
            // que se limita el total de la cascada.
            const stagger = Math.min(DELAY, MAX_STAGGER_TOTAL / chars.length);
            chars.forEach((ch, i) => {
                ch.style.animationDelay = (i * stagger).toFixed(1) + 'ms';
                ch.style.setProperty('--split-duration', DURATION + 's');
            });

            // Marca de "ya partido": es lo que activa el estado oculto en
            // CSS. Si este script no se ejecutara, el texto se vería normal.
            el.classList.add('is-split');
            observer.observe(el);
        });
    }

    function iniciar() {
        document.body.classList.add('am-page');
        montarDock();
        iniciarDock();
        iniciarSplitText();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', iniciar);
    } else {
        iniciar();
    }
})();
