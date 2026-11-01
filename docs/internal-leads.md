# Automatización de leads del panel interno

Módulo inicial publicado el 31/10/2026 (PR #66). Mejoras de ayuda y edición
publicadas el 01/11/2026 (PR #69, commit `23b3288`). Pestaña en `panel-interno.html`,
sin reconstruir Finanzas, Altas, Seguimiento ni Recordatorios. Código del módulo
en `assets/js/internal-leads.js`, estilos acotados en `assets/css/internal-leads.css`.

Reutiliza sesión Supabase del panel. Toda lectura/mutación pasa por
`https://backend.automanize.com/webhook/internal-leads` con Bearer; la autorización
real exige administrador de Finanzas o superadmin de Automanize en servidor;
un administrador de una inmobiliaria no basta. Sin claves de Airtable/Meta ni
service role en navegador. Render de datos con textContent; cierre de sesión
limpia datos y rechaza respuestas en vuelo de la sesión anterior.

Cinco subvistas: Leads (50 por página, filtros, búsqueda, selección y pausa),
Secuencias (edición visual por paso, vista previa, versiones), Conversaciones
(ledger comercial, mensajes manuales por texto/plantilla y pausa) y Configuración
(mapeo Airtable, horario, límites, gates, plantillas Meta y errores), y Ayuda
(guía del flujo, tiempos, campos, pausa, versiones, prueba y diagnóstico). No muestra
datos simulados cuando backend no está desplegado: informa conexión pendiente.

Los leads se importan sin activar envíos. Solo puede activarse un contacto con
consentimiento acreditado. La aceptación en formulario de Meta indicada por el
usuario debe enlazarse a casilla booleana y evidencia antes de campañas. Datos
de conversaciones de la página actual; usar búsqueda/paginación en Leads para
otros contactos. La bandeja tiene hasta 200 eventos y no promete histórico Meta
completo. Estadísticas de estados corresponden a la página y están etiquetadas.

Los envíos siguen apagados en servidor. Modo de prueba por defecto; no se han
enviado mensajes. El número comercial aún no aparece vinculado en Supabase.
Comprobación de solo lectura del 01/11/2026: módulo activo, envío desactivado,
modo exclusivo de pruebas y sin `LEADS_PHONE_ID`/`LEADS_TENANT_ID` configurados
en el contenedor. DB: 53 contactos nuevos, 0 campañas y 0 trabajos. No se cambia
la configuración de producción ni se envía ningún mensaje en esta mejora.
Backend, esquema, variables, límites y pasos de producción en `docs/internal-leads.md`
de la rama `feat/internal-leads-automation` del repositorio backend (todavía no
está en la rama local consultada). No interpretar la ausencia de ese archivo en
otra rama como ausencia del módulo desplegado.

## Editor manual y ayuda (01/11/2026)

El ejemplo opcional crea tres pasos con esperas 0, 2 y 5 días, sin plantillas ni
activación. No reemplaza un borrador con contenido. Cada paso mantiene nombre,
plantilla Meta, idioma, hora de Madrid y días de la semana. Un campo por parámetro
del cuerpo, en orden, con botones para añadir y quitar; admite texto fijo y las
variables existentes. El texto completo sigue definido en la plantilla aprobada
de Meta, no en el nombre del paso ni en los parámetros.

La primera espera cuenta desde la activación del contacto; las siguientes desde
el envío previo. No se suman desde la importación. El horario general, los días
permitidos, la separación mínima y el presupuesto diario pueden aplazar la fecha.
La vista previa explica el intervalo, no promete una fecha exacta. Se validan
nombre, plantilla, número de pasos, esperas enteras de 0–365 días, días y campos
vacíos antes de guardar; el backend conserva su validación y autorización.
Guardar crea otra versión y no inscribe contactos. Sin cambios de API, tablas,
permisos ni proveedores; se mantiene la cobertura HTTP pendiente descrita abajo.

La prueba real requiere primero el alta oficial de coexistencia del número
comercial de Automanize, canal dedicado y plantillas aprobadas. No reutilizar
identificadores de una inmobiliaria. El destinatario autorizado se configura
privadamente; no se incluye su teléfono en código, documentación ni datos de prueba.

Rutas REST/RPC pertenecen a familias del monitor, pero la nueva API HTTP del
backend **tiene cobertura pendiente**. No se amplían permisos, publicación de
archivos internos, sourcemaps ni manifiesto de release CRM. Política Caddy
existente sigue protegiendo `.env`, docs, configuración y SQL.

Validación: `node --test tests/internal-leads.test.cjs`. Chromium real con
`PLAYWRIGHT_CORE` y `CHROMIUM_BIN`: `node --test tests/internal-leads-browser.test.cjs`
(sin estas variables se omite explícitamente). Ejecutar también pruebas Caddy
con `CADDY_BIN`, regresiones web y `node scripts/check-crm-release.mjs`.

Verificación 01/11/2026: pasan 5 comprobaciones (Chromium con datos sintéticos,
integración/sesión, seguridad HTTP Caddy y canal de descargas) y los 103 archivos
de la release CRM conservan sus hashes. Batería web completa: 31/32 pasan;
el fallo de metadatos sociales ya documentado afecta a app/seendy.html,
eliminar-datos.html, firmar-contrato.html y oauth-drive.html, sin cambios aquí.
No equivale a una prueba de entrega de WhatsApp ni a una nueva auditoría RLS.

Despliegue de esta mejora autorizado por el usuario y realizado con `pull
--ff-only` en `/var/www/automanize`, conservando recursos no versionados y sin
reconstruir/reiniciar el backend. Copia previa de los tres archivos de interfaz
en `/var/backups/automanize/leads-ui-20261101-*`. Comprobación HTTP pública:
panel 200 y referencia JS `v=20261101`; JS/CSS coinciden byte a byte con Git.
Cloudflare añade su script al HTML, por lo que el hash HTML público no coincide
con el del origen. Release CRM comprobada en el VPS: 103 archivos correctos.
Documentación, `.env` y sourcemaps siguen 404; GPTBot recibe 403 en el panel.

La conexión oficial disponible en Seendy guarda el canal en el tenant de la
sesión. Antes del alta comercial, verificar una cuenta exclusiva de Automanize;
no usar la sesión de una inmobiliaria. No se ha completado el alta, activado
envíos ni ejecutado la prueba real. El acceso automatizado al navegador no
estaba disponible en esta sesión; la autorización de Meta/verificación móvil
requiere intervención del usuario. La cobertura HTTP del monitor sigue pendiente.
