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
    showScreen(startScreen || 'choose', false);
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
    showScreen(previous || 'choose', screenHistory.length > 0);
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

  // --- Alta real del trial de 7 dias: misma Edge Function que solicitar-demo.html ---
  const TRIAL_SIGNUP_URL = `${SUPABASE_URL}/functions/v1/trial-signup`;

  const trialForm = document.getElementById('trialForm');
  const trialError = document.getElementById('trialError');

  trialForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    trialError.textContent = '';

    if (!trialForm.checkValidity()) {
      trialForm.reportValidity();
      return;
    }

    const datos = Object.fromEntries(new FormData(trialForm).entries());
    const submitButton = trialForm.querySelector('button[type="submit"]');
    const textoOriginal = submitButton.textContent;
    const eventId = crypto.randomUUID();
    submitButton.disabled = true;
    submitButton.textContent = 'Enviando...';

    try {
      const res = await fetch(TRIAL_SIGNUP_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', apikey: SUPABASE_ANON_KEY },
        body: JSON.stringify({
          empresa: datos.nombre,
          telefono: datos.telefono,
          email: datos.email,
          nif: datos.nif,
          website: datos.website,
          event_id: eventId,
          event_source_url: window.location.href,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.error) throw new Error(data.error || 'No se pudo procesar tu solicitud.');
      // El CompleteRegistration server-side ya lo manda trial-signup con este mismo
      // event_id; aqui solo el del navegador, para que Meta deduplique los dos.
      trackPixel('CompleteRegistration', { content_name: 'Nize - prueba gratis 7 dias' }, eventId);
      goToScreen('whatsapp');
    } catch (err) {
      trialError.textContent = err.message || 'Hubo un error. Inténtalo de nuevo o escríbenos por WhatsApp.';
      logEvento('trial_error', 'trial-form', { mensaje: trialError.textContent });
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = textoOriginal;
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

    const notas = `Habitaciones/inmuebles: ${eliteData.volumen}. Mayor problema ahora: ${eliteData.problema}`;
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
})();
