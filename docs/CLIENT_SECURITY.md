# Protección de archivos internos y rastreo

La política se instaló y verificó en producción el 28/10/2026. Incluye las URLs
limpias sin `.html` y aplica las cabeceras privadas al final de la respuesta para
que no las sobrescriba la política general del host. Se conservó un backup del
Caddyfile y se validó antes de recargar Caddy sin reiniciar otros dominios.

La web vive en Caddy → Nginx, no en Netlify. `_headers`, `netlify.toml` y
`vercel.json` no activan esta política en el VPS.

`ops/caddy/client-security.caddy` debe insertarse en el bloque de
`automanize.com, www.automanize.com`, antes de `reverse_proxy`. No sustituye el
bloque ni la política `crm-cache.caddy`; ambas políticas son complementarias.
No insertar dentro del bloque del backend: este tiene sus propias rutas y
contratos públicos. Mantener el origen Nginx sin acceso público que evite Caddy.

Procedimiento de despliegue:

1. Guardar una copia del Caddyfile activo de `/root/caddy-main/Caddyfile`.
2. Insertar una sola vez el contenido del snippet en el host indicado.
3. Validar desde `caddy_main` con `caddy validate --config <ruta> --adapter caddyfile`.
4. Recargar Caddy con su procedimiento habitual solo si valida.
5. Comprobar en el dominio público: `/docs/general.md`, `/.git/config` y un `.map`
   devuelven 404; una petición a `/app/` con `User-Agent: GPTBot` devuelve 403.
6. Comprobar login, demo/trial, formularios por token, pagos y OAuth. Un navegador
   normal debe recibir el CRM y sus recursos, y `/app/` debe llevar
   `X-Robots-Tag: noindex, nofollow, noarchive, nosnippet`.
7. Si falla algún flujo, restaurar la copia y recargar. No reemplazar el release
   CRM para desplegar esta política: sus hashes deben conservarse.

Prueba local de HTTP real (Node 20+ y Caddy disponible):

```powershell
$env:CADDY_BIN = 'C:/ruta/caddy.exe'
node --test tests/security-policy.test.cjs
node scripts/check-crm-release.mjs
```

La prueba valida el snippet con Caddy, arranca un servidor temporal y verifica
los códigos HTTP y las cabeceras. No verifica el VPS ni la autorización de la DB.

`robots.txt` contiene instrucciones voluntarias. El User-Agent es falsificable:
la política bloquea rastreadores declarados, no garantiza detectar automatización.
`noindex` no impide descargar contenido. No se bloquean buscadores convencionales
en las páginas de marketing. No se limita globalmente el enmarcado, porque hay
pantallas incrustadas del CRM. La arquitectura y los controles que faltan están
descritos en [SEGURIDAD_CLIENTES.md](../../docs/SEGURIDAD_CLIENTES.md) del workspace padre.
