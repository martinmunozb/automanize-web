// crm-pricing.js — Sección de precios de crm.html: toggle mensual/anual y
// modal de "contratar" que crea la cuenta (misma Edge Function que la prueba
// gratis) y encadena un checkout directo de Stripe para el tier elegido.
(() => {
  const SUPABASE_URL = 'https://edjugpekcntzvqaskbmc.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVkanVncGVrY250enZxYXNrYm1jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIxMTc0NjksImV4cCI6MjA4NzY5MzQ2OX0.JOyutVcE_OB5Bszuz12_aTBK4RRzD-a79QQ3uLS7IyA';
  const TRIAL_SIGNUP_URL = `${SUPABASE_URL}/functions/v1/trial-signup`;
  const BACKEND_URL = 'https://backend.automanize.com';

  const TIER_NOMBRES = { tier1: 'Tier 1', tier2: 'Tier 2', tier3: 'Tier 3' };
  let periodoActual = 'mensual';
  let tierSeleccionado = null;

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
  const form = document.getElementById('pricingForm');
  const formError = document.getElementById('pricingError');
  let lastFocus = null;

  const openModal = (tier) => {
    tierSeleccionado = tier;
    modalKicker.textContent = `Contratar Nize — ${TIER_NOMBRES[tier] || ''}`;
    formError.textContent = '';
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
    btn.addEventListener('click', () => openModal(btn.dataset.tier));
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
          event_source_url: window.location.href,
        }),
      });
      const dataSignup = await resSignup.json().catch(() => ({}));
      if (!resSignup.ok || dataSignup.error) throw new Error(dataSignup.error || 'No se pudo crear tu cuenta.');

      submitButton.textContent = 'Abriendo el pago...';
      const resCheckout = await fetch(`${BACKEND_URL}/webhook/checkout-directo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenant_id: dataSignup.tenant_id, tier: tierSeleccionado, periodo: periodoActual }),
      });
      const dataCheckout = await resCheckout.json().catch(() => ({}));
      if (!resCheckout.ok || dataCheckout.error) throw new Error(dataCheckout.error || 'No se pudo abrir el pago.');

      window.location.href = dataCheckout.url;
    } catch (err) {
      formError.textContent = err.message || 'Hubo un error. Inténtalo de nuevo o escríbenos por WhatsApp.';
      submitButton.disabled = false;
      submitButton.textContent = textoOriginal;
    }
  });
})();
