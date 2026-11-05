# Política de privacidad: Seendy — 5 de noviembre de 2026

Cambio preparado en `docs/seendy-privacidad`, pendiente de revisión/publicación.
Corresponde al flujo de números nuevos del
[PR de app #96](https://github.com/Automanize/automanize-app/pull/96).

`nize-privacy.html` añade el papel de la empresa respecto de sus contactos, el
alta manual de Seendy, los datos recogidos y el carácter de declaración interna
del estado de permiso. Describe que abrir una ficha no envía mensajes y la
sincronización opcional con Google Contacts, incluidos los campos de la ficha
que usa la función existente. No acredita permisos de destinatarios concretos.

La política de la inmobiliaria responsable y su información al destinatario no
quedan sustituidas automáticamente por la política general de Automanize. No se
afirma que estén firmados nuevos DPA ni se cambia un plazo de conservación.
El RAT y las revisiones 02/03 y 06 del módulo se actualizan en el repo de app.

`privacy.html` mantiene su redirección a la política unificada. El cambio solo
afecta al texto y a esta documentación: no modifica scripts, consentimiento de
cookies, formularios, endpoints, despliegue ni `app/` o su manifiesto. No incorpora
una nueva ruta de acceso a datos y no necesita ampliar las familias del monitor.

Validación realizada: `node --test tests/trial-signup-privacy.test.cjs`,
`node --test tests/security-policy.test.cjs` con Caddy disponible,
`node scripts/check-crm-release.mjs` y revisión del diff de HTML, todos correctos.
Para comprobar el manifiesto se restauraron los bytes LF originales de Git en
tres archivos de `app/leads/` que el checkout Windows había convertido a CRLF;
no se modificó su contenido versionado ni el manifiesto. No se considera
publicado por la mera aprobación de este PR.
