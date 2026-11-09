# Seendy con estilo Nize, no leídos y orden reciente

Release `seendy-nize-20261109`, fuente app
`75be3213acb448e0bff7fbd15b9664cdd747d36a`, integrada en PR app #107.
Conserva la fuente de Contabilidad/Resumen propio de la release activa anterior.
El manifiesto cubre 113 archivos runtime, incluidos ambos HTML del CRM y Seendy.
Se conservan assets anteriores para sesiones abiertas; no se publican mapas,
fuente interna, SQL ni documentación. La URL del iframe usa
`v=inbox-20261109-nize`.

La bandeja sigue los temas de Nize y usa su acento amarillo. En móvil se compacta
la cabecera, se distribuyen las pestañas y se conserva el compositor accesible.
No leídos mantiene abierto el chat al marcarlo leído. El orden y la hora de fila
usan el último mensaje, sin adelantar conversaciones por prioridad o reasignación.

Preparada y verificada antes de publicar: pruebas de Seendy, seguridad de app,
build web/renderer, manifiesto SHA-256, prueba Caddy con HTTP real en contenedor
aislado y canal de descargas. El paquete ensamblado pasó el circuito CRM → iframe
con APIs locales de prueba, temas, borradores/ampliación y móvil 375/430 px;
la auditoría de componentes cubre nueve anchos. Sin WhatsApps ni datos reales en
las pruebas. El estado activo se registra tras la comprobación pública.

Los nombres comerciales se publican por separado en backend PR #79. No cambia
ningún permiso o esquema, ni hay nuevas rutas de acceso. Se mantienen las familias
Supabase documentadas y la limitación de cobertura HTTP del backend ya descrita.
Esta publicación no distribuye instaladores de escritorio.
