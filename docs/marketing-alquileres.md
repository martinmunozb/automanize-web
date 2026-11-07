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


## Vista previa de portada con vídeo — 06/11/2026

Preparada localmente en la rama feat/home-video-20261106, sin publicar.
El usuario seleccionó la opción 3: visita inmobiliaria de Anastasia Shuraeva,
https://www.pexels.com/video/real-estate-agent-touring-the-couples-while-talking-7647253/
Licencia: https://www.pexels.com/license/ (consultada el 06/11/2026).
Los archivos property-tour-* se sirven localmente, sin depender de Pexels.
Vídeo de escritorio 3840x2160, versión móvil 1280x720, sin audio,
reproducción en bucle y botón de pausa; imagen de respaldo y respeto a
preferencias de movimiento reducido y ahorro de datos. Solo index.html carga
home-video.css y home-video.js. No cambia CRM, autenticación ni datos de clientes.
Verificado: CTA/clientes y política Caddy (4 pruebas), manifiesto CRM (112 archivos).

Refinamiento local: navegación dividida en marca, enlaces centrales y acceso/contacto.
La cápsula de enlaces y su animación CSS se inspiran en Pill Nav de React Bits
(https://reactbits.dev/components/pill-nav); implementación propia sin dependencias nuevas.
Los destinos originales se conservan. Menú móvil agrupado, foco visible,
animaciones desactivadas con movimiento reducido. Revisión visual a 1440, 820 y 390 px;
se comprobó apertura del menú móvil y ausencia de desbordamiento horizontal.


Rediseño del resto de la portada (local): home-sections.css unifica tipografía,
espaciado, tarjetas, producto, funciones, testimonios, planes, FAQ, contacto y pie.
Fondo verde oscuro para producto/contacto; superficies claras y acentos naranja.
Se comparó con la copia previa: texto íntegro, 45 enlaces, 23 imágenes y
31 desplegables conservados. En móvil se muestran también las descripciones
que la hoja anterior ocultaba. Sin datos nuevos ni cambios de autenticación.
Verificación: 4 pruebas locales y 112 archivos de la release CRM correctos.

## Refinamiento editorial y responsive — 07/11/2026 (solo local)

Se hizo git pull --ff-only en feat/home-video-20261106: bfa72c8 → 81f2732,
sin conflictos y conservando los cambios locales. La nueva release CRM recibida
se mantiene intacta (crm-contabilidad-resumen-20261107, 112 archivos verificados).

home-sections.css sustituye las tarjetas redondeadas y superficies verdes por
filas abiertas con separadores, producto con presentación lateral, testimonios
con tipografía serif, planes sin panel decorativo y cierre a ancho completo en
carbón. No modifica las otras páginas. Se verificó igualdad de todos los textos,
45 enlaces, 23 imágenes y 31 desplegables respecto a la copia previa.

Por petición posterior del usuario se elimina el botón de pausa del vídeo y su
lógica asociada. Se conserva el bucle automático, el póster si falla autoplay,
la preferencia de movimiento reducido, ahorro de datos y suspensión automática
al salir de pantalla o al ocultar la pestaña. Se comprobó reproducción real en
el navegador sin control de pausa.

Verificación responsive en navegador: 320, 360, 390, 580, 768, 820, 1024, 1280,
1440 y 1920 px sin desbordamiento horizontal. Navegación sin solapamientos en
801, 820, 1024 y 1151 px. Menú de 320 px apilado y menú horizontal 667 × 375
con altura limitada y desplazamiento cuando hace falta. Se probaron apertura y
cierre del menú y desplegables de público, funciones y preguntas con teclado.
Revisión visual en escritorio, tablet y móvil; no equivale a pruebas en dispositivos
físicos o en todos los navegadores. Todas las descripciones siguen visibles en móvil.
Cuatro pruebas existentes (CTA, clientes y política HTTP Caddy) correctas;
node --check assets/js/home-video.js y git diff --check correctos.

## Corrección de reproducción móvil — 07/11/2026

Tras el informe de vídeo detenido en Safari/iPhone, se prepara una inicialización
con autoplay, muted y playsinline explícitos, propiedades configuradas antes de
cargar el recurso y preload de metadatos. Se reintenta al estar listo el vídeo,
al volver a la página y de forma síncrona en una interacción real si el navegador
bloqueó el arranque. No se añade botón de pausa ni se fuerzan reintentos por tiempo.
Los dispositivos de puntero grueso utilizan el MP4 ligero, también en horizontal;
un fallo del decodificador de escritorio prueba una vez ese recurso ligero.
Se mantienen movimiento reducido, ahorro de datos y suspensión fuera de pantalla.

Comprobaciones: 8 pruebas de comportamiento con medios simulados (incluido rechazo
de autoplay seguido de interacción), 3 regresiones de portada y manifiesto CRM
(112 archivos) correctos. El MP4 móvil es H.264 High nivel 3.1 sin audio y con
metadatos antes de mdat (fast start). No se dispone de un iPhone/Safari real en esta
sesión: el funcionamiento en el dispositivo del usuario no se da por verificado.

Safari puede impedir autoplay por políticas de batería/navegador; una web no puede
garantizar reproducción automática en todas las configuraciones del dispositivo.
Fuentes: https://webkit.org/blog/6784/new-video-policies-for-ios/ y
https://bugs.webkit.org/show_bug.cgi?id=216887.

Publicación autorizada por el usuario. Comprobación previa del recurso móvil
en producción: HTTP 206 y Content-Range correctos para bytes 0-1. Doce pruebas
locales (incluida política Caddy) y los 112 archivos de Nize verificados. El
script usa una nueva versión de caché para que los móviles reciban la corrección.
