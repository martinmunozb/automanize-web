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

  function loadMetaPixel() {
    if (window.fbq) return;
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
    fbq('track', 'PageView');
  }

  function loadGA4() {
    if (window.gtag) return;
    var t = document.createElement('script');
    t.async = true;
    t.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
    document.head.appendChild(t);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { dataLayer.push(arguments); };
    gtag('js', new Date());
    gtag('config', GA_ID);
  }

  function applyConsent(consent) {
    if (consent && consent.marketing) {
      loadMetaPixel();
      loadGA4();
    }
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
      '#automanize-cookie-banner .acb-save{align-self:flex-start;background:#ffca28;color:#181811;border-color:#ffca28;}'
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
        '<p class="acb-text">Utilizamos cookies propias y de terceros para garantizar el funcionamiento del sitio y, con tu consentimiento, para analizar el uso y/o mostrar contenido personalizado. Puedes aceptar, rechazar o configurar las cookies. Más información en nuestra <a href="cookies.html">Política de Cookies</a>.</p>' +
        '<div class="acb-actions">' +
          '<button type="button" class="acb-btn acb-reject" id="acb-reject">Rechazar</button>' +
          '<button type="button" class="acb-btn acb-config" id="acb-config">Configurar</button>' +
          '<button type="button" class="acb-btn acb-accept" id="acb-accept">Aceptar todas</button>' +
        '</div>' +
        '<div class="acb-settings" id="acb-settings" hidden>' +
          '<label class="acb-toggle"><input type="checkbox" checked disabled /> Necesarias (siempre activas)</label>' +
          '<label class="acb-toggle"><input type="checkbox" id="acb-marketing" /> Publicidad / medición (Meta Pixel)</label>' +
          '<button type="button" class="acb-btn acb-save" id="acb-save">Guardar preferencias</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(wrap);
    document.getElementById('acb-accept').addEventListener('click', function () { setConsent(true); });
    document.getElementById('acb-reject').addEventListener('click', function () { setConsent(false); });
    document.getElementById('acb-config').addEventListener('click', function () {
      document.getElementById('acb-settings').hidden = false;
    });
    document.getElementById('acb-save').addEventListener('click', function () {
      setConsent(document.getElementById('acb-marketing').checked);
    });
  }

  var existing = getConsent();
  if (existing) {
    applyConsent(existing);
  } else {
    showBanner();
  }

  window.AutomanizeConsent = { get: getConsent, openSettings: showBanner };
})();
