// crm-pricing.js — Sección de precios de crm.html: toggle mensual/anual y
// modal que crea la cuenta con 7 días de prueba gratis (misma Edge Function
// que solicitar-demo.html). Antes del formulario, el modal ofrece un upsell
// (agendar llamada vs. probarlo por su cuenta) — ver docs/REGLAS_NEGOCIO.md.
// No cobra nada al alta: si al terminar el trial el tenant no cabe en el
// plan gratuito, se bloquea y ahí se le ofrece pagar (flujo ya existente de
// trial-checkout, ver docs/REGLAS_NEGOCIO.md).
(() => {
  const SUPABASE_URL = 'https://edjugpekcntzvqaskbmc.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVkanVncGVrY250enZxYXNrYm1jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIxMTc0NjksImV4cCI6MjA4NzY5MzQ2OX0.JOyutVcE_OB5Bszuz12_aTBK4RRzD-a79QQ3uLS7IyA';
  const TRIAL_SIGNUP_URL = `${SUPABASE_URL}/functions/v1/trial-signup`;
  const CHECKOUT_DIRECTO_URL = 'https://backend.automanize.com/webhook/checkout-directo';

  const TIER_NOMBRES = { tier1: 'Plus', tier2: 'Pro', tier3: 'Elite' };
  let periodoActual = 'mensual';
  let tierSeleccionado = null;
  let tenantIdCreado = null;

  // --- Toggle mensual/anual ---
  const btnMensual = document.getElementById('priceToggleMensual');
  const btnAnual = document.getElementById('priceToggleAnual');
  const setToggleActivo = (btnActivo, btnInactivo) => {
    btnActivo.classList.add('bg-[#FFB300]', 'text-black');
    btnActivo.classList.remove('text-[#888]');
    btnInactivo.classList.remove('bg-[#FFB300]', 'text-black');
    btnInactivo.classList.add('text-[#888]');
  };
  const aplicarPeriodo = (periodo) => {
    periodoActual = periodo;
    document.querySelectorAll('.price-amount[data-mensual]').forEach((el) => { el.textContent = el.dataset[periodo]; });
    document.querySelectorAll('.price-period[data-mensual]').forEach((el) => { el.textContent = el.dataset[periodo]; });
  };
  btnMensual?.addEventListener('click', () => { setToggleActivo(btnMensual, btnAnual); aplicarPeriodo('mensual'); });
  btnAnual?.addEventListener('click', () => { setToggleActivo(btnAnual, btnMensual); aplicarPeriodo('anual'); });

  // --- Modal de contratación ---
  const modal = document.getElementById('pricingModal');
  const modalKicker = document.getElementById('pricingModalKicker');
  const pricingScreens = modal ? [...modal.querySelectorAll('.pricing-screen')] : [];
  const upsellCallLink = document.getElementById('pricingUpsellCall');
  const upsellSelfBtn = document.getElementById('pricingUpsellSelf');
  const form = document.getElementById('pricingForm');
  const formError = document.getElementById('pricingError');
  const success = document.getElementById('pricingSuccess');
  const successTitulo = document.getElementById('pricingSuccessTitulo');
  const buyNowBtn = document.getElementById('pricingBuyNow');
  const buyNowError = document.getElementById('pricingBuyNowError');
  let lastFocus = null;

  const showPricingScreen = (name) => {
    pricingScreens.forEach((screen) => { screen.classList.toggle('hidden', screen.dataset.screen !== name); });
  };

  const openModal = (tier) => {
    tierSeleccionado = tier;
    tenantIdCreado = null;
    modalKicker.textContent = `Prueba de 7 días — ${TIER_NOMBRES[tier] || ''}`;
    formError.textContent = '';
    buyNowError.textContent = '';
    form.reset();
    success.classList.add('hidden');
    buyNowBtn.classList.add('hidden');
    showPricingScreen('upsell');
    lastFocus = document.activeElement;
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    document.body.style.overflow = 'hidden';
    window.setTimeout(() => upsellCallLink?.focus(), 100);
  };
  const closeModal = () => {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
    document.body.style.overflow = '';
    lastFocus?.focus();
  };

  document.querySelectorAll('.js-open-pricing-modal').forEach((btn) => {
    btn.addEventListener('click', () => openModal(btn.dataset.tier));
  });
  upsellSelfBtn?.addEventListener('click', () => {
    showPricingScreen('form');
    window.setTimeout(() => form.querySelector('input')?.focus(), 100);
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
    if (!tierSeleccionado) {
      formError.textContent = 'Elige un plan antes de continuar.';
      return;
    }

    const datos = Object.fromEntries(new FormData(form).entries());
    const submitButton = form.querySelector('button[type="submit"]');
    const textoOriginal = submitButton.textContent;
    submitButton.disabled = true;
    submitButton.textContent = 'Creando tu cuenta...';

    try {
      const resSignup = await fetch(TRIAL_SIGNUP_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', apikey: SUPABASE_ANON_KEY },
        body: JSON.stringify({
          empresa: datos.nombre,
          telefono: datos.telefono,
          email: datos.email,
          nif: datos.nif,
          website: datos.website,
          privacidad_aceptada: datos.privacidad_aceptada === 'on',
          event_source_url: window.location.href,
        }),
      });
      const dataSignup = await resSignup.json().catch(() => ({}));
      if (!resSignup.ok || dataSignup.error) throw new Error(dataSignup.error || 'No se pudo crear tu cuenta.');

      tenantIdCreado = dataSignup.tenant_id || null;
      const primero = String(datos.nombre || '').trim().split(/\s+/)[0];
      successTitulo.textContent = primero ? `¡Gracias, ${primero}!` : '¡Listo!';
      form.classList.add('hidden');
      success.classList.remove('hidden');
      buyNowBtn.classList.toggle('hidden', !tenantIdCreado);
    } catch (err) {
      formError.textContent = err.message || 'Hubo un error. Inténtalo de nuevo o escríbenos por WhatsApp.';
      submitButton.disabled = false;
      submitButton.textContent = textoOriginal;
    }
  });

  buyNowBtn?.addEventListener('click', async () => {
    if (!tenantIdCreado || !tierSeleccionado) return;
    buyNowError.textContent = '';
    const textoOriginal = buyNowBtn.textContent;
    buyNowBtn.disabled = true;
    buyNowBtn.textContent = 'Preparando el pago...';

    try {
      const res = await fetch(CHECKOUT_DIRECTO_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenant_id: tenantIdCreado, tier: tierSeleccionado, periodo: periodoActual }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.error || !data.url) throw new Error(data.error || 'No se pudo iniciar el pago.');
      window.location.href = data.url;
    } catch (err) {
      buyNowError.textContent = err.message || 'Hubo un error. Inténtalo de nuevo o escríbenos por WhatsApp.';
      buyNowBtn.disabled = false;
      buyNowBtn.textContent = textoOriginal;
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
    const frame = document.getElementById('eliteCalcomFrame');
    if (frame) frame.src = `https://cal.com/automanize/elitegold?${params.toString()}`;
    showEliteScreen('elite-calcom');
  });
})();
