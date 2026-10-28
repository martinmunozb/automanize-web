# Web pública: gestión de alquileres

## Rediseño del 28/10/2026

Estado: desplegado y activo en `https://automanize.com/` el 28/10/2026,
tras autorización del usuario. PR #51 integrado en main, commit `de4a87c`.
Actualización fast-forward de `/var/www/automanize`, con copia previa de las
páginas sustituidas en `/tmp/automanize-marketing-before-20261028.tar.gz`.
No se reiniciaron contenedores ni se modificó Caddy.

- `index.html`: portada centrada en propietarios, gestores para terceros y
  rent to rent. Capturas reales del CRM; detalle de funciones, casos de uso y
  preguntas en desplegables HTML nativos, cerrados inicialmente.
- `casos-exito.html`: GoRoom enlaza a `https://goroom.rent/`; se conservan
  Invicta Rent, Vortex Rooms y Manuel Conesa. No se añaden métricas ni se
  atribuyen testimonios anónimos a estas empresas.
- `crm.html`: textos de alquileres, acceso directo a precios y contenido de
  cada plan desplegable. Se conservan importes, límites, botones, identificadores,
  lógica mensual/anual y proceso de alta existentes.
- CRM, Asistente, equipo, contacto y los dos pasos de llamada comparten una
  navegación superior con enlace visible a `crm.html#precios`. El menú móvil
  de esas páginas utiliza `details` y funciona sin JavaScript. Su CSS oculta el
  dock anterior solo en esas páginas. El equipo muestra las biografías a petición.
- Estilos nuevos: `assets/css/rental-2026.css` (portada y clientes) y
  `assets/css/rental-subpages.css` (páginas comerciales existentes), con versión
  de caché propia. La portada y clientes conservan el menú de `home-2026.js`.

La demo, el CRM autenticado en `app/`, los portales por token y los formularios
de alta no se modifican. No se implementa una demo de 24 horas. Los accesos
existentes al trial en los planes conservan su funcionamiento.

## Contenido y testimonios

Fuente: capturas aportadas por el usuario el 28/10/2026. Se incluyen extractos
de puesta en marcha (25/09), contratos (28/09), cobros (sin fecha verificable)
e incidencias (06/10). No se inventa el año. Se omiten nombres y cualquier
identificador del chat. Las capturas originales no se copian al directorio
público. El chat que solo cambia la hora de una llamada se excluye.

Los extractos se distinguen de promesas del producto. El mensaje de incidencias
se limita al fragmento sin nombres. No se presenta su plazo como compromiso de
servicio. Los resultados de cobros son una experiencia individual.

Las funciones que requieren Asistente, integración o plan se describen con su
condición. El justificante de pago no se presenta como ingreso confirmado. La
tabla de precios de `crm.html#precios` sigue siendo la fuente de las mensualidades.

## Seguridad y cobertura

Solo cambia presentación y contenido público estático. No hay tablas, vistas,
RPC, exportaciones, permisos, secretos ni nuevas vías de acceso a datos de
clientes. Los enlaces reutilizan rutas existentes; el enlace a GoRoom es una
salida a su web, sin parámetros de cliente. No se amplía la cobertura del monitor:
las familias Supabase existentes permanecen iguales y el monitor no cubre la
lectura de páginas de marketing estáticas. No se cambia la configuración Caddy.

No se añaden proveedores, formularios ni herramientas de seguimiento. Se
conservan los scripts de consentimiento y medición existentes. Los nuevos
estilos no se cargan en `app/`, demo, OAuth, firma ni portales por token. La
release CRM y sus hashes deben seguir pasando `check-crm-release.mjs`.

## Verificación

- Pruebas de seguridad HTTP con Caddy y `node scripts/check-crm-release.mjs`.
- Pruebas existentes de clientes, CTA, pantallas del CRM, precios/privacidad y
  flujos relacionados. Los fallos previos ajenos al cambio se registran en el PR.
- Suite completa: 28/29 pasan. Un fallo ya presente en HEAD: metadatos
  sociales ausentes en `app/seendy.html`, `eliminar-datos.html`,
  `firmar-contrato.html` y `oauth-drive.html`.
  No se modifican esos archivos ni se presenta la suite como totalmente verde.
  Se recupera el enlace del hero a `crm.html#como-funciona`, que esperaba una
  prueba existente y faltaba en HEAD.
- Validación de recursos y anclajes locales en las páginas modificadas.
- Verificación pública después del despliegue: portada, clientes, CRM y los
  dos CSS nuevos devuelven 200 y contienen el contenido nuevo. CRM, trial,
  formulario, pago y OAuth devuelven 200. Los archivos internos de documentación
  y Git devuelven 404; GPTBot recibe 403 en `/app/`.
- El validador en el VPS comprueba los 101 archivos de la release CRM. Los hashes
  de `app/index.html` y `app/release.json` en disco se conservaron. El manifiesto
  público conserva su hash; el HTML público coincide con Git al descontar la
  inyección de challenge de Cloudflare. No se considera esa inyección una
  modificación de la release.
- Pendiente revisión visual real en móvil y escritorio: en esta sesión el
  navegador de Computer Use no está disponible. Las reglas responsive están
  preparadas, pero eso no equivale a una inspección visual del resultado.
