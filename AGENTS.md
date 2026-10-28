# Seguridad y documentación

Consultar `docs/general.md`, la ficha de la funcionalidad,
`docs/CLIENT_SECURITY.md` y `docs/CRM_DEPLOYMENT.md` antes de modificar la web.
En el workspace completo también se aplican `../AGENTS.md` y
`../docs/SEGURIDAD_CLIENTES.md`.

Toda funcionalidad nueva conserva las protecciones y los flujos legítimos de
web/demo/CRM. Revisar acceso público o autenticado, datos expuestos, autorización
por tenant y cobertura del monitor. Una ruta HTTP nueva no queda vigilada por el
monitor de Supabase solo por estar en esta web; documentar su cobertura real.
No incluir secretos, documentación interna ni sourcemaps en los archivos servidos.

Producción usa Caddy: los cambios en `_headers`/Netlify no activan controles en
el VPS. No bloquear formularios por token, OAuth, pagos ni recursos legítimos al
ampliar las restricciones. Ejecutar `node --test tests/security-policy.test.cjs`
con `CADDY_BIN` configurado y `node scripts/check-crm-release.mjs`.
Probar también los flujos afectados y actualizar su documentación. Conservar
íntegro el manifiesto y los hashes de la release CRM al cambiar otros archivos.
