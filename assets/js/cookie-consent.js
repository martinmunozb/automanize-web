(function () {
  var STORAGE_KEY = 'automanize_cookie_consent';
  var PIXEL_ID = '878301471795466';
  var GA_ID = 'G-SQ2QT5PJTL';

  function getConsent() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY));
    } catch (e) {
      return null;
    }
  }

  var CAPI_URL = 'https://edjugpekcntzvqaskbmc.supabase.co/functions/v1/meta-capi';
  var SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVkanVncGVrY250enZxYXNrYm1jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIxMTc0NjksImV4cCI6MjA4NzY5MzQ2OX0.JOyutVcE_OB5Bszuz12_aTBK4RRzD-a79QQ3uLS7IyA';

  function newEventId() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    return Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 12);
  }

  function getCookie(name) {
    var m = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
    return m ? decodeURIComponent(m[1]) : null;
  }

  function setCookie(name, value) {
    var domain = /(^|\.)automanize\.com$/.test(location.hostname) ? '; domain=.automanize.com' : '';
    document.cookie = name + '=' + value + '; max-age=7776000; path=/; SameSite=Lax' + domain;
  }

  // _fbp y _fbc los crea el Pixel al cargar, pero tarde para el primer PageView y
  // nunca si un bloqueador corta fbevents.js. Se crean aqui (mismo formato que usa
  // Meta, que las reutiliza) para que el envio por Conversions API lleve siempre el
  // clic del anuncio (fbc) y el navegador (fbp): sin eso Meta no atribuye la visita.
  function ensureMetaCookies() {
    var fbclid = new URLSearchParams(location.search).get('fbclid');
    var fbc = getCookie('_fbc');
    if (fbclid && (!fbc || fbc.split('.').slice(3).join('.') !== fbclid)) {
      setCookie('_fbc', 'fb.1.' + Date.now() + '.' + fbclid);
    }
    if (!getCookie('_fbp')) {
      setCookie('_fbp', 'fb.1.' + Date.now() + '.' + Math.floor(Math.random() * 1e10));
    }
  }

  // En memoria y no solo en localStorage: si el navegador bloquea localStorage, el
  // consentimiento dado en esta visita tiene que valer igual.
  var marketingGranted = false;
  function hasMarketingConsent() {
    return marketingGranted;
  }

  // Identificadores de Meta para mandarlos al servidor junto a una conversion.
  // Sin consentimiento de marketing no se devuelve nada.
  function metaIds() {
    if (!hasMarketingConsent()) return {};
    return { fbp: getCookie('_fbp') || undefined, fbc: getCookie('_fbc') || undefined };
  }

  // Mismo evento por el Pixel (navegador) y por la Conversions API (servidor) con
  // el mismo event_id: Meta los deduplica y cuenta uno, pero si el Pixel esta
  // bloqueado sigue llegando el del servidor.
  function sendCapi(eventName, eventId) {
    var ids = metaIds();
    try {
      fetch(CAPI_URL, {
        method: 'POST',
        keepalive: true,
        headers: { 'Content-Type': 'application/json', apikey: SUPABASE_ANON_KEY },
        body: JSON.stringify({ event_name: eventName, event_id: eventId, event_source_url: location.href, fbp: ids.fbp, fbc: ids.fbc })
      }).catch(function () {});
    } catch (e) {}
  }

  function loadMetaPixel() {
    marketingGranted = true;
    if (window.fbq) return;
    ensureMetaCookies();
    !function (f, b, e, v, n, t, s) {
      if (f.fbq) return; n = f.fbq = function () {
        n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments)
      };
      if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = '2.0';
      n.queue = []; t = b.createElement(e); t.async = !0;
      t.src = v; s = b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t, s)
    }(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
    fbq('init', PIXEL_ID);
    var pageViewId = newEventId();
    fbq('track', 'PageView', {}, { eventID: pageViewId });
    sendCapi('PageView', pageViewId);
  }

  // Para los formularios (altas, contacto): mismo event_id en Pixel y servidor.
  function trackMeta(eventName, params, eventId) {
    if (hasMarketingConsent() && typeof window.fbq === 'function') {
      fbq('track', eventName, params || {}, { eventID: eventId });
    }
  }

  // La etiqueta de Google (gtag.js) y los defaults del Modo de consentimiento v2 van
  // INLINE en el <head> de cada pagina, no aqui: el verificador de Google lee el HTML
  // de forma estatica y no detecta una etiqueta inyectada por JavaScript. Este archivo
  // solo se encarga del banner, de actualizar el consentimiento y del Pixel de Meta.
  // Este shim es por si alguna pagina se quedara sin el bloque inline.
  window.dataLayer = window.dataLayer || [];
  if (typeof window.gtag !== 'function') {
    window.gtag = function () { dataLayer.push(arguments); };
  }

  function updateGoogleConsent(marketing) {
    var value = marketing ? 'granted' : 'denied';
    gtag('consent', 'update', {
      ad_storage: value,
      ad_user_data: value,
      ad_personalization: value,
      analytics_storage: value
    });
  }

  function applyConsent(consent) {
    var marketing = !!(consent && consent.marketing);
    updateGoogleConsent(marketing);
    if (marketing) loadMetaPixel();
  }

  function setConsent(marketing) {
    var data = { necessary: true, marketing: !!marketing, ts: Date.now() };
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch (e) {}
    applyConsent(data);
    hideBanner();
  }

  function hideBanner() {
    var el = document.getElementById('automanize-cookie-banner');
    if (el) el.remove();
  }

  function injectStyles() {
    if (document.getElementById('automanize-cookie-banner-styles')) return;
    var style = document.createElement('style');
    style.id = 'automanize-cookie-banner-styles';
    style.textContent = [
      '#automanize-cookie-banner{position:fixed;left:0;right:0;bottom:0;z-index:9999;padding:16px;font-family:inherit;}',
      '#automanize-cookie-banner .acb-box{max-width:820px;margin:0 auto;background:#181811;color:#fcfcfb;border-radius:16px;padding:18px 20px;box-shadow:0 10px 40px rgba(0,0,0,.35);}',
      '#automanize-cookie-banner .acb-text{margin:0 0 14px;font-size:13px;line-height:1.55;}',
      '#automanize-cookie-banner .acb-text a{color:#ffca28;text-decoration:underline;}',
      '#automanize-cookie-banner .acb-actions{display:flex;flex-wrap:wrap;gap:10px;}',
      '#automanize-cookie-banner .acb-btn{cursor:pointer;border-radius:999px;padding:9px 18px;font-size:13px;font-weight:600;border:1px solid rgba(255,255,255,.3);background:transparent;color:#fcfcfb;}',
      '#automanize-cookie-banner .acb-accept{background:#ffca28;color:#181811;border-color:#ffca28;}',
      '#automanize-cookie-banner .acb-settings{margin-top:14px;display:flex;flex-direction:column;gap:8px;border-top:1px solid rgba(255,255,255,.15);padding-top:14px;}',
      '#automanize-cookie-banner .acb-toggle{display:flex;align-items:center;gap:8px;font-size:13px;}',
      '#automanize-cookie-banner .acb-toggle input[type=checkbox]{accent-color:#6b6b62;}',
      '#automanize-cookie-banner .acb-settings-actions{display:flex;flex-wrap:wrap;gap:10px;}',
      '#automanize-cookie-banner .acb-save{background:#ffca28;color:#181811;border-color:#ffca28;}'
    ].join('');
    document.head.appendChild(style);
  }

  function showBanner() {
    if (document.getElementById('automanize-cookie-banner') || !document.body) return;
    injectStyles();
    var wrap = document.createElement('div');
    wrap.id = 'automanize-cookie-banner';
    wrap.innerHTML =
      '<div class="acb-box">' +
        '<p class="acb-text">Usamos cookies propias y de terceros para que el sitio funcione y, si lo permites, para medir su uso y mejorar nuestra publicidad. Más información en nuestra <a href="/cookies.html">Política de Cookies</a>.</p>' +
        '<div class="acb-actions">' +
          '<button type="button" class="acb-btn acb-config" id="acb-config">Personalizar cookies</button>' +
          '<button type="button" class="acb-btn acb-accept" id="acb-accept">Aceptar todas</button>' +
        '</div>' +
        '<div class="acb-settings" id="acb-settings" hidden>' +
          '<label class="acb-toggle"><input type="checkbox" checked disabled /> Necesarias (siempre activas)</label>' +
          '<label class="acb-toggle"><input type="checkbox" id="acb-marketing" checked /> Publicidad / medición (Google Analytics y Meta Pixel)</label>' +
          '<div class="acb-settings-actions">' +
            '<button type="button" class="acb-btn acb-reject" id="acb-reject">Rechazar</button>' +
            '<button type="button" class="acb-btn acb-save" id="acb-save">Guardar preferencias</button>' +
          '</div>' +
        '</div>' +
      '</div>';
    document.body.appendChild(wrap);
    document.getElementById('acb-accept').addEventListener('click', function () { setConsent(true); });
    document.getElementById('acb-config').addEventListener('click', function () {
      document.getElementById('acb-settings').hidden = false;
    });
    document.getElementById('acb-reject').addEventListener('click', function () { setConsent(false); });
    document.getElementById('acb-save').addEventListener('click', function () {
      setConsent(document.getElementById('acb-marketing').checked);
    });
  }

  var existing = getConsent();
  if (existing) {
    if (existing.marketing) loadMetaPixel();
  } else {
    showBanner();
  }

  window.AutomanizeConsent = { get: getConsent, openSettings: showBanner };
  window.AutomanizeMeta = { newEventId: newEventId, ids: metaIds, track: trackMeta };
})();
