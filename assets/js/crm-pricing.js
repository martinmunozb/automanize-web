// crm-pricing.js — Sección de precios de crm.html. El modal del Plan CRM manda
// los datos al backend y redirige a Stripe: la cuenta se crea al confirmarse el
// pago (ver docs/REGLAS_NEGOCIO.md).
(() => {
  const CRM_CHECKOUT_URL = 'https://backend.automanize.com/webhook/crm-checkout';
  const MAX_PACKS = 20;
  // Importes sin IVA: la fuente de verdad del cobro es src/trial/reglas.js del backend.
  const PRECIOS = { 15: 27, 30: 54, 60: 81 };
  const precioDe = (inmuebles) => PRECIOS[inmuebles] ?? 81 + ((inmuebles - 60) / 30) * 27;

  let inmueblesSeleccionados = null;

  // --- Selector de packs ---
  let packs = 1;
  const packCantidad = document.getElementById('crmPackCantidad');
  const packResumen = document.getElementById('crmPackResumen');
  const packContratar = document.getElementById('crmPackContratar');
  const pintarPacks = () => {
    const inmuebles = 60 + packs * 30;
    packCantidad.textContent = packs === 1 ? '1 pack' : `${packs} packs`;
    packResumen.textContent = `Hasta ${inmuebles} inmuebles · ${precioDe(inmuebles)}€/mes + IVA`;
    packContratar.dataset.inmuebles = String(inmuebles);
  };
  document.getElementById('crmPackMenos')?.addEventListener('click', () => { packs = Math.max(1, packs - 1); pintarPacks(); });
  document.getElementById('crmPackMas')?.addEventListener('click', () => { packs = Math.min(MAX_PACKS, packs + 1); pintarPacks(); });

  // --- Modal de contratación ---
  const modal = document.getElementById('pricingModal');
  const modalKicker = document.getElementById('pricingModalKicker');
  const form = document.getElementById('pricingForm');
  const formError = document.getElementById('pricingError');
  let lastFocus = null;

  const openModal = (inmuebles) => {
    inmueblesSeleccionados = inmuebles;
    modalKicker.textContent = `Hasta ${inmuebles} inmuebles · ${precioDe(inmuebles)}€/mes + IVA`;
    formError.textContent = '';
    form.reset();
    lastFocus = document.activeElement;
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    document.body.style.overflow = 'hidden';
    window.setTimeout(() => form.querySelector('input')?.focus(), 100);
  };
  const closeModal = () => {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
    document.body.style.overflow = '';
    lastFocus?.focus();
  };

  document.querySelectorAll('.js-open-pricing-modal').forEach((btn) => {
    btn.addEventListener('click', () => openModal(Number(btn.dataset.inmuebles)));
  });
  document.getElementById('pricingModalClose')?.addEventListener('click', closeModal);
  modal?.addEventListener('click', (event) => { if (event.target === modal) closeModal(); });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !modal.classList.contains('hidden')) closeModal();
  });

  form?.addEventListener('submit', async (event) => {
    event.preventDefault();
    formError.textContent = '';

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const datos = Object.fromEntries(new FormData(form).entries());
    const submitButton = form.querySelector('button[type="submit"]');
    const textoOriginal = submitButton.textContent;
    submitButton.disabled = true;
    submitButton.textContent = 'Preparando el pago...';

    try {
      const res = await fetch(CRM_CHECKOUT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inmuebles: inmueblesSeleccionados,
          empresa: datos.nombre,
          telefono: datos.telefono,
          email: datos.email,
          nif: datos.nif,
          website: datos.website,
          privacidad_aceptada: datos.privacidad_aceptada === 'on',
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.error || !data.url) throw new Error(data.error || 'No se pudo iniciar el pago.');
      window.location.href = data.url;
    } catch (err) {
      formError.textContent = err.message || 'Hubo un error. Inténtalo de nuevo o escríbenos por WhatsApp.';
      submitButton.disabled = false;
      submitButton.textContent = textoOriginal;
    }
  });

  // --- Modal Elite Gold: datos -> situación -> agenda en Cal.com ---
  const eliteModal = document.getElementById('eliteModal');
  const eliteScreens = eliteModal ? [...eliteModal.querySelectorAll('.elite-screen')] : [];
  const eliteBackBtn = document.getElementById('eliteModalBack');
  const eliteOrder = ['elite-1', 'elite-2', 'elite-calcom'];
  let eliteData = {};
  let eliteIndex = 0;
  let eliteLastFocus = null;

  const showEliteScreen = (name) => {
    eliteIndex = eliteOrder.indexOf(name);
    eliteScreens.forEach((screen) => { screen.classList.toggle('hidden', screen.dataset.screen !== name); });
    eliteBackBtn?.classList.toggle('hidden', eliteIndex === 0);
    eliteBackBtn?.classList.toggle('flex', eliteIndex !== 0);
  };
  const openEliteModal = () => {
    eliteData = {};
    document.getElementById('eliteForm1')?.reset();
    document.getElementById('eliteForm2')?.reset();
    showEliteScreen('elite-1');
    eliteLastFocus = document.activeElement;
    eliteModal.classList.remove('hidden');
    eliteModal.classList.add('flex');
    document.body.style.overflow = 'hidden';
    window.setTimeout(() => eliteModal.querySelector('input')?.focus(), 100);
  };
  const closeEliteModal = () => {
    eliteModal.classList.add('hidden');
    eliteModal.classList.remove('flex');
    document.body.style.overflow = '';
    eliteLastFocus?.focus();
  };

  document.querySelectorAll('.js-open-elite-modal').forEach((btn) => {
    btn.addEventListener('click', openEliteModal);
  });
  document.getElementById('eliteModalClose')?.addEventListener('click', closeEliteModal);
  eliteBackBtn?.addEventListener('click', () => { if (eliteIndex > 0) showEliteScreen(eliteOrder[eliteIndex - 1]); });
  eliteModal?.addEventListener('click', (event) => { if (event.target === eliteModal) closeEliteModal(); });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && eliteModal && !eliteModal.classList.contains('hidden')) closeEliteModal();
  });

  document.getElementById('eliteForm1')?.addEventListener('submit', (event) => {
    event.preventDefault();
    const eliteForm1 = event.target;
    if (!eliteForm1.checkValidity()) { eliteForm1.reportValidity(); return; }
    eliteData = { ...eliteData, ...Object.fromEntries(new FormData(eliteForm1).entries()) };
    showEliteScreen('elite-2');
  });

  document.getElementById('eliteForm2')?.addEventListener('submit', (event) => {
    event.preventDefault();
    const eliteForm2 = event.target;
    if (!eliteForm2.checkValidity()) { eliteForm2.reportValidity(); return; }
    eliteData = { ...eliteData, ...Object.fromEntries(new FormData(eliteForm2).entries()) };
    const notas = `Habitaciones/inmuebles: ${eliteData.volumen}. Mayor problema ahora: ${eliteData.problema}`;
    const params = new URLSearchParams({ name: eliteData.nombre || '', email: eliteData.email || '', notes: notas });
    // Cal.com pide el teléfono: se rellena solo para no preguntarlo otra vez. Exige
    // formato internacional; si no lo cumple, lo escribe la persona en el calendario.
    const telefonoCal = String(eliteData.telefono || '').replace(/[\s().-]/g, '').replace(/^00/, '+');
    if (/^[6789]\d{8}$/.test(telefonoCal)) params.set('attendeePhoneNumber', `+34${telefonoCal}`);
    else if (/^\+\d{8,15}$/.test(telefonoCal)) params.set('attendeePhoneNumber', telefonoCal);
    // Igual que en landing.js: el Schedule lo manda calcom-booking al confirmarse
    // la reserva, y con esta metadata puede atribuirlo al anuncio de Meta.
    const ids = window.AutomanizeMeta ? window.AutomanizeMeta.ids() : {};
    if (ids.fbp) params.set('metadata[fbp]', ids.fbp);
    if (ids.fbc) params.set('metadata[fbc]', ids.fbc);
    params.set('metadata[ua]', navigator.userAgent.slice(0, 400));
    params.set('metadata[url]', window.location.href.slice(0, 400));
    const frame = document.getElementById('eliteCalcomFrame');
    if (frame) frame.src = `https://cal.com/automanize/elitegold?${params.toString()}`;
    showEliteScreen('elite-calcom');
  });
})();
