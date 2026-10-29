# Contratos por Gmail

El CRM llama a `POST /api/contracts/email/send` con la sesion de Supabase,
el contrato, su tenant y el destinatario. Caddy redirige la peticion a
`/webhook/contrato-email-enviar` del backend. Importar el contenido de
`contracts-signature.caddy` dentro del bloque de automanize.com, antes del
proxy de archivos estaticos; validar antes de activar los cambios.

El servidor valida usuario y tenant, descarga el PDF de Storage y lo envia
adjunto por la cuenta Gmail configurada. Solo entonces marca el contrato
como enviado, pendiente de devolucion. Si hay Gmail OAuth del tenant se usa
esa cuenta; si no, se usa Gmail compartido por OAuth o SMTP con variables
`GMAIL_SMTP_USER` y `GMAIL_SMTP_APP_PASSWORD` del servidor.

DocuSeal esta pausado: el endpoint antiguo de envio devuelve 503.
Los contratos enviados antes conservan su historial.

El destinatario responde al correo con el PDF firmado. Un usuario del CRM
selecciona **Adjuntar PDF firmado** en la fila del contrato; se almacena el PDF,
su hash y fecha de recepcion y se marca completado. No se monitoriza la bandeja
de Gmail ni se importa automaticamente el adjunto recibido.

Verificacion: `node --test tests/contratos-email.mjs` en el backend y
`node scripts/audit-gmail.mjs` en inmuebles (UI con servicios simulados).

## Entrega de ramas y estado aplicado — 29/10/2026

Esta rama solo entrega el snippet y esta documentacion: no incluye los archivos
de `app/` de la build antigua `contratos-gmail-20261029`.

Las tres rutas del snippet ya se insertaron en el bloque de automanize.com de
`/root/caddy-main/Caddyfile`, con copia previa, validacion de Caddy y activacion.
El endpoint de email devuelve 401 sin sesion y el de envio DocuSeal devuelve 503.
El backend Gmail y sus variables de servidor tambien estan ya aplicados; consultar
`automanize-backend/docs/contratos-gmail-20261029.md`. Sin cambios de BD ni Edge
Functions. La nueva ruta no tiene un monitor Supabase especifico: sus errores se
consultan en el backend y en la capa HTTP.

Para recuperar los cambios del 28/10 junto a Gmail, integrar la rama de fuentes
de automanize-app sobre la base correcta y seguir `docs/CRM_DEPLOYMENT.md`: build,
manifiesto, check-crm-release, commit y push antes del despliegue del mantenedor.
No se compila ni despliega otra release en esta entrega de ramas.
