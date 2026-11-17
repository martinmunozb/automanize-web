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
Estado: preparada; la activación y sus hashes se registran después del despliegue.
