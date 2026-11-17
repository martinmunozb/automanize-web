# Aviso de traspaso de Drive — 17 noviembre 2026

Release: `crm-drive-progress-20261117`.
Fuente: `Automanize/automanize-app`, rama `chore/crm-drive-progress-20261117`,
commit `ede054f`. Integra únicamente la corrección del seguimiento sobre
`0980399`, fuente del CRM que estaba publicado (`crm-enlace-inmueble-20261117`).

El trabajo de Drive conserva su resultado al salir y volver a Inmuebles. Al
recargar, los pendientes guardados pasan a un aviso de resultado no confirmado;
no se relanzan movimientos. Los avisos se aíslan por empresa y usuario, pueden
cerrarse y, después de 90 segundos, explican una demora sin spinner infinito.
Los avisos antiguos sin ámbito no recuperan nombres de clientes.

Validación: 10 regresiones de tareas, 5 escenarios en Chromium con el panel real,
15 comprobaciones de edición de inmuebles, 8 pruebas de acciones Drive,
compilaciones web/escritorio y controles de seguridad de sus builds. La fuente
integrada vuelve a verificar el build web, las tareas y Chromium. Las operaciones
de Drive de las pruebas son simuladas; no se certifica ni se repite el movimiento
antiguo de un cliente. No cambia la DB, los permisos de Drive ni las rutas HTTP.

La release conserva los recursos de builds anteriores y el manifiesto completo.
Estado: **activa en producción** desde el 17 de noviembre de 2026. Commit de
release `e8a000de1838832171bcb9b161b08abee6a9630f`; fuente
`ede054fc296991f9d19ae9573a43e1456ed8b429`.

Activación: recursos antes que documentos, validación de los 117 hashes en el
VPS y avance fast-forward sin reset. Se conserva el cambio ajeno existente en
`nize-privacy.html` y todos los recursos de sesiones anteriores. Copia de los
documentos previos en `/tmp/nize-drive-progress-20261117T120605Z`; la release
anterior permanece recuperable desde Git en `993fe05880ab867e56f469fb9ddeb65ed4de9bf0`.

Verificación pública a las `2026-11-17T12:08:41Z`: los 117 recursos coinciden con
el manifiesto, el bundle público contiene la corrección, `/app/` apunta al nuevo
entry y conserva `Cache-Control: no-cache, max-age=0, must-revalidate` y
`X-Robots-Tag: noindex`. Cloudflare añade su script dinámico de JS Detection a
los HTML: tras retirar únicamente esa inserción conocida, todos los demás bytes
coinciden con los hashes de la release. No se ha retirado esa protección.

Las pestañas ya abiertas deben recargarse para cargar el código nuevo. Una
sincronización anterior de resultado desconocido muestra una advertencia
cerrable; no se declara completada ni se repite sin comprobar las carpetas.
