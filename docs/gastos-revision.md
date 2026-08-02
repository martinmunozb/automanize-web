# gastos-revision.html — Revisión de gastos clasificados por IA

## Para qué sirve

Página donde un gestor revisa, corrige y confirma (o rechaza) los gastos que
la IA de `automanize-backend` detectó automáticamente en la carpeta "Subir
Gastos" de Drive de un tenant. Sin login — accede mediante un enlace con
token que llega por WhatsApp.

**URL**: `https://automanize.com/gastos-revision.html?token=<lote_token>`

## Lógica

- El `token` es un `lote_token` (uuid) compartido por todos los gastos que la
  IA analizó en la misma pasada diaria — no es un token por gasto.
- El enlace lo genera `automanize-backend` (`src/gastos/procesar.js`) tras
  cada pasada del cron con propuestas nuevas, y lo envía por WhatsApp al
  `telefono_priv_admin` del tenant.
- Lectura de datos: llamada directa desde el navegador a la función RPC de
  Supabase `get_gastos_revision_portal_data` (misma técnica que
  `pago.html` — bypassa RLS de forma controlada con la anon key, sin pasar
  por ningún backend). Devuelve los gastos `pendiente` de esa tanda +
  catálogo de inmuebles del tenant para el selector de corrección.
- Escritura: cada Confirmar/Rechazar hace `POST` a
  `https://backend.automanize.com/webhook/gastos-revision-submit`. Ahí, y
  solo ahí, se mueve el archivo en Drive y se inserta en `pagos_inmueble`.
- Lógica completa del flujo (de dónde salen los datos, umbrales, por qué no
  se usa la tabla `gastos`): `automanize-backend/docs/flow-gastos.md`.
