(() => {
  const modal = document.getElementById('cta-modal');
  const card = modal.querySelector('.modal-card');
  const screens = [...modal.querySelectorAll('.modal-screen')];
  const backButton = modal.querySelector('.modal-back');
  const closeXButton = modal.querySelector('.modal-close');
  const openButtons = document.querySelectorAll('.js-open-cta');
  const closeButtons = document.querySelectorAll('.js-close-cta');
  const gotoButtons = modal.querySelectorAll('[data-goto]');
  let lastFocus = null;
  let screenHistory = [];
  let blockClose = false;

  const SUPABASE_URL = 'https://edjugpekcntzvqaskbmc.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVkanVncGVrY250enZxYXNrYm1jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIxMTc0NjksImV4cCI6MjA4NzY5MzQ2OX0.JOyutVcE_OB5Bszuz12_aTBK4RRzD-a79QQ3uLS7IyA';

  // Funnel propio en Supabase (landing_eventos): un id de sesion por visitante,
  // guardado en localStorage, para poder ver despues por SQL cuantos abren el popup,
  // a que pantalla llegan y donde abandonan. Solo inserta, nunca lee.
  let sessionId = localStorage.getItem('nize-landing-session');
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem('nize-landing-session', sessionId);
  }
  const logEvento = (evento, pantalla, meta) => {
    fetch(`${SUPABASE_URL}/rest/v1/landing_eventos`, {
      method: 'POST',
      keepalive: true,
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({ session_id: sessionId, evento, pantalla, meta }),
    }).catch(() => {});
  };
  logEvento('page_view');

  // El paso de WhatsApp es obligatorio: sin X, sin atras, sin cerrar por fuera/Esc.
  const BLOCKING_SCREENS = new Set(['whatsapp']);

  const focusables = () => [...modal.querySelectorAll('button, a[href], input, textarea')]
    .filter(el => !el.disabled && el.offsetParent !== null);

  const showScreen = (name, canGoBack) => {
    screens.forEach(screen => { screen.hidden = screen.dataset.screen !== name; });
    blockClose = BLOCKING_SCREENS.has(name);
    backButton.hidden = blockClose || !canGoBack;
    closeXButton.hidden = blockClose;
    card.scrollTop = 0;
    logEvento('screen_view', name);
  };

  const openModal = (startScreen) => {
    lastFocus = document.activeElement;
    screenHistory = [];
    showScreen(startScreen || 'elite-1', false);
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
    window.setTimeout(() => modal.querySelector('.modal-close')?.focus({ preventScroll: true }), 120);
  };

  const closeModal = () => {
    if (blockClose) return;
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
    lastFocus?.focus();
    logEvento('modal_close');
  };

  const goToScreen = (name) => {
    const current = screens.find(screen => !screen.hidden)?.dataset.screen;
    if (current) screenHistory.push(current);
    showScreen(name, true);
  };

  const goBack = () => {
    const previous = screenHistory.pop();
    showScreen(previous || 'elite-1', screenHistory.length > 0);
  };

  // Envia un evento al Pixel de Meta si el script cargo (puede fallar por bloqueadores).
  // El eventId, cuando se pasa, tiene que coincidir con el que se manda por Conversions
  // API (server-side) del mismo evento, para que Meta deduplique en vez de contar doble.
  const trackPixel = (event, params, eventId) => {
    if (typeof fbq !== 'function') return;
    fbq('track', event, params, eventId ? { eventID: eventId } : undefined);
  };

  // Reenvio server-side a la Conversions API (funcion meta-capi): no bloqueante,
  // si falla no afecta al flujo del usuario.
  const META_CAPI_URL = `${SUPABASE_URL}/functions/v1/meta-capi`;
  const sendCapiEvent = (eventName, { eventId, email, phone, contentName } = {}) => {
    // keepalive: el boton de WhatsApp navega a gracias.html justo despues de este
    // fetch — sin esto, el navegador corta la peticion a medias al desmontar la
    // pagina y el evento nunca llega completo al servidor (solo el preflight OPTIONS).
    fetch(META_CAPI_URL, {
      method: 'POST',
      keepalive: true,
      headers: { 'Content-Type': 'application/json', apikey: SUPABASE_ANON_KEY },
      body: JSON.stringify({
        event_name: eventName,
        event_id: eventId,
        event_source_url: window.location.href,
        email,
        phone,
        content_name: contentName,
      }),
    }).catch(() => {});
  };

  openButtons.forEach(button => button.addEventListener('click', () => openModal(button.dataset.goto)));
  closeButtons.forEach(button => button.addEventListener('click', closeModal));
  gotoButtons.forEach(button => button.addEventListener('click', () => goToScreen(button.dataset.goto)));
  backButton.addEventListener('click', goBack);

  document.addEventListener('keydown', event => {
    if (!modal.classList.contains('is-open')) return;
    if (event.key === 'Escape') closeModal();
    if (event.key === 'Tab') {
      const items = focusables();
      const first = items[0];
      const last = items[items.length - 1];
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
  });

  // --- Flujo Elite Gold: datos -> situacion -> agenda en Cal.com -> WhatsApp ---
  let eliteData = {};

  document.getElementById('eliteForm1')?.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!event.target.checkValidity()) { event.target.reportValidity(); return; }
    eliteData = { ...eliteData, ...Object.fromEntries(new FormData(event.target).entries()) };
    goToScreen('elite-2');
  });

  document.getElementById('eliteForm2')?.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!event.target.checkValidity()) { event.target.reportValidity(); return; }
    eliteData = { ...eliteData, ...Object.fromEntries(new FormData(event.target).entries()) };

    // El telefono va dentro de las notas a proposito: Cal.com solo acepta
    // prefill de campos que existan en el tipo de evento, y el nuestro no tiene
    // campo de telefono. Metiendolo aqui viaja con la reserva (se ve al abrirla,
    // que antes no pasaba) y vuelve en el webhook BOOKING_CREATED, que es de
    // donde lo saca calcom-booking para no volver a pedirselo en usar-demo.html.
    // Si se cambia el formato de esta linea, hay que cambiar la regex de alli.
    const notas = `Teléfono: ${eliteData.telefono || '—'} · Habitaciones/inmuebles: ${eliteData.volumen}. Mayor problema ahora: ${eliteData.problema}`;
    const params = new URLSearchParams({ name: eliteData.nombre || '', email: eliteData.email || '', notes: notas });
    document.getElementById('calcomFrame').src = `https://cal.com/automanize/elitegold?${params.toString()}`;

    const eventId = crypto.randomUUID();
    trackPixel('Schedule', { content_name: 'Nize Elite Gold' }, eventId);
    sendCapiEvent('Schedule', { eventId, email: eliteData.email, phone: eliteData.telefono, contentName: 'Nize Elite Gold' });
    goToScreen('elite-calcom');
  });

  document.getElementById('joinWhatsapp')?.addEventListener('click', () => {
    const eventId = crypto.randomUUID();
    trackPixel('Contact', { content_name: 'Comunidad de WhatsApp' }, eventId);
    sendCapiEvent('Contact', { eventId, email: eliteData.email, phone: eliteData.telefono, contentName: 'Comunidad de WhatsApp' });
    // Abre WhatsApp en pestaña nueva (ahi se queda el usuario) y deja que el enlace
    // navegue la pestaña actual a gracias.html por detras (href="gracias.html" en el HTML).
    window.open('https://chat.whatsapp.com/E0etJCg5X1e0kjdjfHkFhX', '_blank', 'noopener,noreferrer');
  });

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => entry.isIntersecting && entry.target.classList.add('in-view'));
  }, { threshold: .14 });
  document.querySelectorAll('.reveal-on-scroll').forEach(element => observer.observe(element));

  // ── Video de producto del hero ──────────────────────────────────────────
  // Arranca solo al entrar en pantalla y se pausa al salir: un video grande
  // reproduciendose fuera de vista gasta bateria y datos para nada.
  //
  // El autoplay solo lo permite el navegador si va en silencio, asi que el
  // video arranca mudo y se ofrece un boton para activar el sonido. Si el
  // fichero no trae pista de audio, el boton no llega a aparecer.
  const videoHero = document.querySelector('[data-hero-video]');
  if (videoHero) {
    const botonSonido = document.querySelector('[data-video-sound]');
    const sinMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (sinMovimiento) {
      // Con "reducir movimiento" activado no se reproduce nada solo: se deja el
      // poster y los controles para que lo lance quien quiera.
      videoHero.removeAttribute('autoplay');
      videoHero.controls = true;
    } else {
      const visorVideo = new IntersectionObserver(entradas => {
        entradas.forEach(entrada => {
          if (entrada.isIntersecting) {
            // play() devuelve una promesa que el navegador rechaza si decide
            // bloquear el autoplay. Sin el catch queda un error suelto en
            // consola; aqui se cae a mostrar los controles.
            const intento = videoHero.play();
            if (intento && intento.catch) intento.catch(() => { videoHero.controls = true; });
          } else if (!videoHero.paused) {
            videoHero.pause();
          }
        });
      }, { threshold: .25 });
      visorVideo.observe(videoHero);
    }

    // El boton de sonido solo tiene sentido si el video trae audio. No hay una
    // forma estandar de saberlo, asi que se prueban las propiedades que exponen
    // los distintos navegadores; si ninguna responde se asume que si lo tiene
    // (mejor un boton de mas que un video mudo sin manera de activarlo).
    const tieneAudio = video => {
      if (typeof video.mozHasAudio === 'boolean') return video.mozHasAudio;
      if (typeof video.webkitAudioDecodedByteCount === 'number') return video.webkitAudioDecodedByteCount > 0;
      if (video.audioTracks) return video.audioTracks.length > 0;
      return true;
    };

    if (botonSonido) {
      videoHero.addEventListener('loadeddata', () => {
        if (tieneAudio(videoHero)) botonSonido.hidden = false;
      }, { once: true });

      botonSonido.addEventListener('click', () => {
        videoHero.muted = !videoHero.muted;
        const icono = botonSonido.querySelector('.video-sound-icon');
        const texto = botonSonido.querySelector('.video-sound-text');
        if (icono) icono.textContent = videoHero.muted ? '\u{1F507}' : '\u{1F50A}';
        if (texto) texto.textContent = videoHero.muted ? 'Activar sonido' : 'Silenciar';
        botonSonido.setAttribute('aria-label', videoHero.muted ? 'Activar sonido' : 'Silenciar');
        // Al quitar el silencio puede haber quedado pausado por el bloqueo.
        if (!videoHero.muted && videoHero.paused) videoHero.play().catch(() => {});
      });
    }
  }
})();
