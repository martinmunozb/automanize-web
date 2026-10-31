# Automatización de leads del panel interno

Preparado el 31/10/2026, no desplegado. Nueva pestaña en `panel-interno.html`,
sin reconstruir Finanzas, Altas, Seguimiento ni Recordatorios. Código del módulo
en `assets/js/internal-leads.js`, estilos acotados en `assets/css/internal-leads.css`.

Reutiliza sesión Supabase del panel. Toda lectura/mutación pasa por
`https://backend.automanize.com/webhook/internal-leads` con Bearer; la autorización
real exige superadmin de Automanize en servidor. Sin claves de Airtable/Meta ni
service role en navegador. Render de datos con textContent; cierre de sesión
limpia datos y rechaza respuestas en vuelo de la sesión anterior.

Cuatro subvistas: Leads (50 por página, filtros, búsqueda, selección y pausa),
Secuencias (edición visual por paso, vista previa, versiones), Conversaciones
(ledger comercial, mensajes manuales por texto/plantilla y pausa) y Configuración
(mapeo Airtable, horario, límites, gates, plantillas Meta y errores). No muestra
datos simulados cuando backend no está desplegado: informa conexión pendiente.

Los leads se importan sin activar envíos. Solo puede activarse un contacto con
consentimiento acreditado. La aceptación en formulario de Meta indicada por el
usuario debe enlazarse a casilla booleana y evidencia antes de campañas. Datos
de conversaciones de la página actual; usar búsqueda/paginación en Leads para
otros contactos. La bandeja tiene hasta 200 eventos y no promete histórico Meta
completo. Estadísticas de estados corresponden a la página y están etiquetadas.

Los envíos siguen apagados en servidor. Modo de prueba por defecto; no se han
enviado mensajes. El número comercial aún no aparece vinculado en Supabase.
Backend, esquema, variables, límites y pasos de producción en
`../../automanize-backend/docs/internal-leads.md` (solo documentación interna).

Rutas REST/RPC pertenecen a familias del monitor, pero la nueva API HTTP del
backend **tiene cobertura pendiente**. No se amplían permisos, publicación de
archivos internos, sourcemaps ni manifiesto de release CRM. Política Caddy
existente sigue protegiendo `.env`, docs, configuración y SQL.

Validación: `node --test tests/internal-leads.test.cjs`. Chromium real con
`PLAYWRIGHT_CORE` y `CHROMIUM_BIN`: `node --test tests/internal-leads-browser.test.cjs`
(sin estas variables se omite explícitamente). Ejecutar también pruebas Caddy
con `CADDY_BIN`, regresiones web y `node scripts/check-crm-release.mjs`.
