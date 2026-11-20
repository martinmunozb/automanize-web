# Automanize — Arquitectura general

## Qué es este proyecto

Web de marketing y utilidades de **Automanize** / **Nize**. Hospedada en `automanize.com`.

- **Automanize**: empresa que vende automatizaciones para negocios (diseño web, CRM, WhatsApp, facturación).
- **Nize**: producto SaaS de gestión inmobiliaria multi-tenant (pisos, inquilinos, cobros, incidencias, WhatsApp).

---

## Stack

| Capa | Tecnología |
|---|---|
| Hosting | **VPS propio**: Caddy (reverse proxy, Docker, `/root/caddy-main/`) → contenedor `webAutomanize` (nginx:alpine sirviendo `/var/www/automanize` directo) |
| Backend / DB | Supabase — proyecto `edjugpekcntzvqaskbmc` (región eu-central-1) |
| Funciones serverless | Netlify Functions (Node.js) — ⚠️ pendiente de confirmar si siguen desplegadas en Netlify real o hay que migrarlas |
| Pagos | Stripe |
| Automatización | `automanize-backend` (Node.js) — n8n (`n8n.automanize.com`) se apagó del todo el 18 ago 2026 |
| Fuentes | Inter (Google Fonts) |

**Importante**: `netlify.toml`, `_headers` y `_redirects` están en el repo pero **no los lee nada en producción** — el sitio no lo sirve Netlify, lo sirve el Caddy del VPS. Cualquier redirect, rewrite o header nuevo tiene que ir en `/root/caddy-main/Caddyfile` (ese Caddy también sirve `controldeplagastmm.com` y `captador.automanize.com`; `n8n.automanize.com` estaba en el mismo Caddy pero n8n se apagó del todo el 18 ago 2026 — si el Caddyfile todavía tiene esa entrada, ya no sirve nada).

---

## Estructura de archivos

```
/
├── index.html              — Landing principal Automanize
├── solicitar-demo.html     — Reserva de la llamada Elite Gold en popup de Cal.com, enlazada desde el sitio
├── alta-crm.html           — Crear la cuenta después de pagar el Plan CRM en Stripe
├── gracias-demo.html       — Agradecimiento tras reservar desde solicitar-demo.html
├── formulario.html         — Formulario dinámico de leads por token (WhatsApp)
├── alta-agencia.html       — Ficha de alta para agencias ya contratadas, por token
├── alta-agencia-admin.html — Panel interno: ver fichas recibidas y generar tokens
├── pago-nize.html          — Página de pago/confirmación Nize
├── captador-nize.html      — Landing captador de inmuebles
├── crm.html                — Landing CRM. Incluye la sección de precios (Plan CRM por tramos + Elite Gold);
│                             todos los botones de pago llevan a la prueba de 7 días, no cobran al
│                             alta (assets/js/crm-pricing.js, ver docs/REGLAS_NEGOCIO.md del repo
│                             padre) — nize.html es solo la landing del embudo, sin precios
├── radar.html              — Landing Radar
├── facturacion.html        — Landing Facturación
├── diseno-web.html         — Landing Diseño Web
├── reservas.html           — Sistema de reservas
├── docs/                   — Documentación de lógica (este directorio)
├── netlify/functions/      — Funciones serverless (Stripe, descarga)
├── incidencias/fotos/      — Subida de fotos de incidencias por token
├── seleccionar/            — Selección de inmuebles por lead
└── gastos-revision.html    — Revisión/confirmación de gastos clasificados por IA (automanize-backend)
```

---

## Sistema multi-tenant (Nize)

- Cada inmobiliaria cliente es un **tenant** (tabla `tenants` en Supabase).
- Todos los datos (clientes, pisos, incidencias, pagos…) tienen `tenant_id` como columna de aislamiento.
- El acceso autenticado usa `get_tenant_id()` (función SECURITY DEFINER que lee `perfiles_app.tenant_id` a partir de `auth.uid()`).
- Los usuarios anónimos (leads, inquilinos desde WhatsApp) acceden por token o funciones RPC específicas.

---

## Fuentes relacionadas

- `docs/marketing-alquileres.md` — rediseño comercial de alquileres, navegación,
  precios y testimonios anónimos (código preparado; consultar estado en ese documento)

- `docs/supabase.md` — tablas, RLS y funciones RPC
- `docs/formulario.md` — formulario dinámico de leads
- `docs/alta-agencia.md` — ficha de alta de agencias ya contratadas + panel admin
- `docs/nize-trial.md` — landing de prueba gratis
- `docs/netlify-functions.md` — funciones de Netlify / Stripe
- `docs/telefono.md` — lógica del prefijo telefónico
- `docs/incidencias-fotos.md` — subida de fotos de incidencias por token
- `docs/gastos-revision.md` — revisión/confirmación de gastos clasificados por IA


## Planes coordinados ? publicado 20/11/2026

PR web #98 acompa?a backend #76/#98 y app #105/#126. La contrataci?n CRM usa
`/webhook/crm-checkout`; `alta-crm.html` llama a `/webhook/crm-alta` despu?s del
pago. Retirar `checkout-directo` solo cuando se publique esta web. La p?gina de
alta lleva no-referrer, noindex y pol?tica privada Caddy en sus dos URLs.
El formulario recoge empresa, email, tel?fono, contrase?a y aceptaci?n de
privacidad; no se almacena la contrase?a en Stripe ni se registra el session_id.
Las rutas HTTP nuevas no est?n supervisadas por el monitor de Supabase (pendiente);
la autorizaci?n del pago y el alta se comprueba en servidor. La release CRM debe
preservar el c?digo publicado 743b162 y subirse con manifiesto completo.


Publicados backend, contrataci?n y CRM `crm-planes-20261120` (sourceCommit 4cb2412,
118 recursos verificados). Caddy validado/recargado por USR1 para alta-crm privada.
Se conserva nize-privacy.html modificado en el VPS y los activos anteriores.
Navegador: CRM y alta sin pago v?lido sin errores JavaScript. Cloudflare inyecta
un script din?mico en HTML; hashes de origen ?ntegros y recursos p?blicos
verificados normalizando ?nicamente esa inyecci?n. Backend/SQL/GoRoom:
`automanize-backend/docs/planes.md`; Windows 1.0.116 publicado en ambos canales.
