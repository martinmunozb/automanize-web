# CRM releases

## Botón de renovación de Seendy — 28 noviembre 2026

`crm-seendy-reconexion-20261128`, fuente app `246747c`, abre el asistente desde
«Renovar permiso con Meta» y enfoca el paso de preparación. La ventana oficial
se abre después de confirmar los requisitos y pulsar el botón de autorización.
La publicación web consta de `seendy.html`, su JS con hash y el manifiesto.
Mantiene las entradas del CRM, los assets históricos y la API existente.

## Número repetido en Seendy — 27 noviembre 2026

Publicada y verificada `crm-seendy-numero-unico-20261127`, runtime `3fabfb6`,
fuente app `0f1be6b` (#135). Sobre la release anterior de la guía del cliente:
solo cambia Seendy HTML y un nuevo JS con hash. Se conservan documentos CRM,
recursos históricos y fuente base; 126 archivos verificados en origen y dominio
público. Auditoría CRM/iframe con APIs sintéticas y caso de número duplicado:
una fila desconectada con renovación visible, cero errores y mutaciones reales.

Se oculta únicamente la fila activa sin acceso a Meta si existe otra desconectada
del mismo teléfono normalizado. No se borran canales, secretos, mensajes ni
conversaciones ni se cambia el enrutado. Recuento real posterior de los dos
canales de InvictaRent: 19 conversaciones y 528 mensajes, sin cambios.
Sin nuevas rutas, permisos ni RLS; mismos controles y familias del monitor.
Pruebas helpers/Realtime/conexión y build web con seguridad correctos; protecciones
HTTP y denegación anónima/de conectores verificadas en el dominio público.
Backup modo 600: `/var/backups/automanize/seendy-numero-unico-20261127/entries-before.tar.gz`
(entradas y manifiesto; los assets anteriores se conservan). Evidencias locales:
`output/seendy-numero-unico-20261127/` fuera de los recursos públicos. Sin instalador.

## Guía de conexión para el cliente — 27 noviembre 2026

Release `crm-seendy-guia-cliente-20261127`, fuente Seendy
`f637a70350456e9ef573dd39d809a16ff4a85245` (app #133, integrado en main).
Preparada sobre la release pública `crm-seendy-conexion-guiada-20261126`:
solo cambia la entrada Seendy y su JS con hash. Se conservan los documentos
de entrada del CRM, sus hashes y los recursos anteriores. El manifiesto incluye
125 archivos y mantiene la fuente base del CRM por separado.

El cliente ve desde el inicio seis pasos para conectar su propio número de
WhatsApp Business usando su cuenta de Meta y su móvil. El permiso se describe
como administrador de su empresa en Nize. No cambia la autorización de servidor,
datos, RLS, proveedores ni rutas; siguen las familias Supabase ya documentadas.
No se autoriza Meta por el cliente ni se envían mensajes. Sin instalador nuevo.

Activa y verificada el 27/11/2026 a las 10:08 Europe/Madrid en
`https://automanize.com/app/`, runtime `7f0b790`. Los 125 archivos coinciden en
origen y dominio público (HTML tras retirar la inyección observada de Cloudflare).
Auditoría CRM → iframe con APIs sintéticas: seis pasos visibles antes de abrir
el asistente, borrador conservado, temas, ampliación y móvil; cero errores y cero
mutaciones reales. Internos/maps 404, GPTBot 403, rutas legítimas 200, HTML
no-cache/noindex y denegación anónima/de conectores conservados.

Pruebas de conexión servidor/UI/workspace y build web con controles previos
correctos. Política HTTP real de Caddy verificada en el VPS. Backup previo con
modo 600 en `/var/backups/automanize/seendy-guia-cliente-20261127/app-before.tar.gz`.
Evidencias locales en `output/seendy-cliente-20261127/` del workspace, fuera de
los archivos públicos. El checkout VPS conserva sus archivos ajenos e históricos.

## Guided WhatsApp authorization — 2026-11-26

Published and verified at 23:35 Europe/Madrid on 2026-11-26:
release `crm-seendy-conexion-guiada-20261126`. Only Seendy HTML and its
hashed JS/CSS change. The main CRM entry and `renderer-web.html` retain their
previous hashes from `crm-seendy-sin-acceso-20261126b` (base app source `8a9dea01`).
`release.json` retains the CRM base `sourceCommit` and adds `seendySourceCommit`
`fc40a9727e69ecb5e162ab54c1db139cb1c002b4`; 124 resources are versioned, including
the previous runtime assets. This is a composite release, not a full CRM rebuild.

Seendy offers prerequisites, Meta authorization and step-specific errors without
copying tokens. Its inbox drafts and final authorization/import result survive
navigation and Realtime updates. The server rollout preserves deployed connector
token rejection and background WhatsApp template copying. It updates the two
existing Edge Functions and applies `sql_seendy_reconexion_verificada.sql`, keeping
authorized disconnection and requiring verified signup for reactivation.

Local UI/WorkspaceApp/handler checks, app security, both builds, and real Caddy
HTTP policy tests passed. Source PRs: automanize-app#130 and #131. Workspace
documentation: martinmunozb/Automanize#81. No new routes, tables or providers; the
existing Supabase monitor route families apply. No WhatsApp test is sent and the
customer must authorize Meta personally. No desktop installer is published here.

Runtime `aeaadaf` was activated assets first, preserving all historical assets and
unrelated VPS files. All 124 origin and public resources match the manifest
(HTML verified after removing only the observed Cloudflare challenge injection).
The real CRM→iframe audit, with synthetic API responses, verifies the menu and
guide, disabled preparation until confirmation, draft retention, dark/light,
expanded view and mobile with zero errors and zero real mutations. Supabase rejects
anonymous and connector-token HTTP calls; CORS and 12 rolled-back SQL permission
checks passed against the active migration. Internal files/maps remain 404,
GPTBot 403, legitimate routes 200 and HTML no-cache/noindex.
Active functions: embedded-signup v18 and ensure-workspace v19. Database migration
`seendy_reconexion_verificada_20261126` applied, with effective grants/search_path
and RLS verified. Previous web backup (mode 600):
`/var/backups/automanize/seendy-conexion-guiada-20261126/app-before.tar.gz`.

## Seendy y Resumen propio — 2026-11-24

Release `crm-seendy-resumen-20261124`, fuente de aplicación `074277f`, sobre
`crm-bancos-propietario-20261124`. La bandeja de Seendy aprovecha la altura
disponible en portátiles. Resumen propio incorpora la descarga por inmueble
y meses, muestra la fórmula del margen y retira los bloques duplicados.

Activa en automanize.com desde el commit web `d0dc860`. Se verificaron los 119
recursos en el origen, 115 hashes por HTTPS, el panel interno y Seendy en el CRM
público con datos ficticios. La versión anterior se conserva en `9258b9b`.

La migración de gastos recurrentes `20261124180957` se aplicó antes de publicar
el panel interno. La primera ejecución programada finalizó correctamente a
las 19:15 de Madrid. Ver `panel-interno-finanzas.md`.

## Shared rooms: one occupant leaves without a new contract, and Undo — 2026-11-18

Release `crm-baja-ocupante-20261118`, source `2ea37fcb223b91de39117c8af559d7f6dcf1b60c`
(`crm-drive-inquilinos-20261117` source `ef24a64` + automanize-app#123). "Dar de baja a un
ocupante" keeps the same contract: the leaver gets `inquilinos_clientes.activo=false` and
`fecha_baja` (column added in production the same day); if the holder leaves another
occupant becomes holder and pending payments move to them. The Cobros room timeline shows
occupants per month. Finalizar, Dar de baja a un ocupante and Eliminar cobro offer Undo for 20 s.

## Drive: tenant folders for renters with their own Drive — 2026-11-17

Release `crm-drive-inquilinos-20261117`, source `ef24a64a870a6720dda078f47fb5d87ddba6eb32`
(`crm-finalizar-compartido-20261117` source `71853b3` + automanize-app#122). Tenants with
their own Drive now get the renter folder (`createTenantFolders` in `driveNative.js`);
before, the action was unknown and renters were saved without a folder. Existing
GoRoom, Daniel Holgado and Darío Ginés folders were backfilled the same day.
No UI text, route or data model changes.

## Shared contracts: "Finalizar" no longer archives everyone silently — 2026-11-17

Release `crm-finalizar-compartido-20261117`, app source `71853b3` (branch
`chore/crm-finalizar-compartido-20261117` = `crm-drive-status-20261117` source
`96e2843` + automanize-app#121). On a contract with secondary occupants,
"Finalizar" lists every person, offers "Dar de baja a un ocupante" first and asks
a second confirmation before archiving all of them. In Interesados, "Reiniciar y
quitar inquilino" is not offered when the holder shares the contract. Only the
Inquilinos and Clientes chunks change in behaviour; no data, route or permission
changes. Web build security hooks passed; all 117 manifest files verified.

## Candidate property link — 2026-11-17

Release `crm-enlace-inmueble-20261117`, app source `0980399` on top of
`crm-contratos-huecos-20261116` source `27f50c5`. Prepared with the public
property form and selection filters (web#106), and the CRM copy-link menu
(app#117). The menu uses the documented property/room relationship and the
existing floating-menu positioning for mobile; its browser regression covers
general/property/room links, URL encoding, search, clipboard errors and Escape.

Build security, Caddy HTTP policy, previous CRM forms and the complete manifest
passed locally. A read-only real GoRoom form check and a simulated selection
check cover the property label, fallback and all filters. Database definitions,
permissions and tenant isolation were verified in production with test writes
rolled back. RPC calls use the existing monitored Supabase family.

Activated 2026-11-17 at approximately 00:52 Europe/Madrid, runtime commit
`05685883a688bbfebaa9245cadd3cb45f7289cf4`. All 117 origin files match the
manifest. Public verification confirms 113 exact hashes and four HTML files
after removing only Cloudflare's existing challenge injection; both public
portal sources also match. CRM no-cache/noindex, internal-file 404 responses,
GPTBot 403 and legitimate OAuth/payment/privacy routes are preserved. The
previous version is backed up in
`/var/backups/automanize/crm-enlace-inmueble-before-20261116T235148Z.tar.gz`.
Historical assets and unrelated VPS files remain in place. No backend or
installer is published here. Property-interest persistence and API details:
`formulario.md`.

## Contract templates: more gap markers detected — 2026-11-16

Release `crm-contratos-huecos-20261116`, source `27f50c51f5122cc3c32dc72d38823eae048ba07e`
(`crm-gestor-pausa-20261116` + automanize-app#116). Importing a contract template
now turns underscore, dotted and Word en/em-dash gaps into variables, not only
`---`. Tenant data is not assigned inside the landlord section. Only the
Contratos chunk changes; no UI text, route or data changes.

## Manager contact: 24 h automation pause — 2026-11-16

Release `crm-gestor-pausa-20261116`, source `5c62a46d12340c74867efd9668a1df27dab127fb`
(`crm-personas-compacto-20261116` source `cdb1530` + automanize-app#115). Configuración →
Contacto con el gestor: the WhatsApp channel chooses between sending the phone
number or pausing automatic replies for 24 h (`tenants.contacto_gestor_modo`).
Requires backend `sql/027_contacto_gestor_pausa.sql` (applied 2026-11-16) and
backend#87 (deployed). No other UI text changes versus the previous release.

## Visual people directory published — 2026-11-16

Prepared on `release/crm-personas-visual-20261116`, based on the complete
`crm-calendario-20261116` web release. Activated on 2026-11-16. All 117 release files verified on the public domain.
Its source is the `release/personas-source-20261116` app branch, which applies
the directory cards to source `382d6b7` while retaining the calendar, payment
method and question-editor improvements. The source passes 38 functional checks
and real-component Chromium checks at 390/768/1440px in light and dark themes.

The app source repository and this web repository have different remotes.
`/var/www/automanize` is the **WebAutomanize** checkout: pulling the app's
`feat/visual-inquilinos-propietarios` branch from its `origin` fails because that
branch belongs to another repository. Do not change the web checkout's remote.

The app's `inmuebles/scripts/publish-people-web.ps1` performs the complete
security checks and normal npm builds on the configured Windows machine,
then imports the build using `scripts/import-crm-build.mjs`, checks the complete
manifest and web security policy, and pushes the two branches to their own
repositories. It does not bypass npm security hooks or alter production access.
The generated web manifest includes every current build resource and retains
old hashed assets. The validated web branch has
been pushed, pulled on the VPS and checked there.

## Full-screen form questions editor — 2026-11-16

Release `crm-editor-preguntas-20261116`, source `b85cb967cf0067325719d357947f87578b90a44b`
(previous release + automanize-app `e717d62`). Interesados → Preguntas del
formulario becomes a near full-screen window: question order on the left,
editor on the right, filters summarised in a sentence with a candidate preview,
and a "Cómo funciona" panel with examples. Selected filter answers are now
visible (styles.css forced the card background on bordered buttons). No data,
route or permission changes.

## Form disqualification rules — 2026-11-16

Release `crm-reglas-descarte-20261116`, source `bb419e1a98cf8bec39dc8632f55545d8318f01f8`
(`0c2d723` + automanize-app#112). Adds the "Descartar candidato si…" editor to
Interesados → Preguntas del formulario and the red disqualification notice in the
lead record. Requires the `sql_formulario_reglas_descarte.sql` migration
(applied 2026-11-16). The public `formulario.html` applies the rules (web#103).
No other CRM behaviour changes; Seendy only changes asset hashes.

## Visual allocation and expense categories — 2026-11-12

Published release `crm-gastos-repartos-20261112`, source
`0c2d723f4a0a7441d262d9b4403d40e3f166d2ae`, presents compact property supply
cards, allocation overview/search, breakdowns on demand and review by tenant
before explicit save/notification. Category editing separates property/general
scope, inheritance, selected cards and pending changes. It writes only changed
rules and displays save errors. Closing categories returns to the same property.
Dialogs support focus/Escape, mobile and dark mode. Existing eligibility,
budget, daily allocation, Gmail monthly allocation and notification idempotency
remain unchanged. No database migration, permission change or new route.

Validation covers 40 functional tests plus real-component Chromium with
scope/inheritance/empty-list/reset, save failures, category creation, mobile,
dark mode, invalid shares, editing/deletion and notification failures/double
click. Web and desktop builds include their security hooks.

All 116 files verified at origin and over the public domain (112 exact hashes
and four HTML documents after accounting for Cloudflare's existing injection).
Internal resources remain 404, GPTBot is blocked from the CRM and privacy stays
public; no-cache remains active. Previous-release backup:
`/var/backups/automanize/crm-before-repartos-20261112T174140Z.tar.gz`.


## Visual expense filters — 2026-11-11

Published release `crm-gastos-filtros-20261111`, source
`d1ecb7af2cea420843aa4d6ca794ad5a0d82e5fc`, improves only the expense filters.
Property, zone and owner have visual triggers and searchable card pickers;
property cards include code, zone, period count and total. Status/type use
buttons, and selected filters can be removed individually. Native dialogs keep
focus, support Escape and adapt to mobile. The ledger, Gmail documents, payment
actions and Cobros retain their behavior. No new queries, routes or permissions.
The browser fixture exercises combined filters, history references, search,
individual clearing, focus restoration and mobile/dark layouts, as well as the
existing editing and allocation flows with simulated data.

All 116 origin files verified; the public domain verifies 112 exact hashes and
four HTML documents with the existing Cloudflare challenge injection accounted
for. Internal files remain blocked, CRM crawler restrictions and no-cache remain
active, and the privacy page is public. Previous-release backup:
`/var/backups/automanize/crm-before-filtros-20261111T224526Z.tar.gz`.

## Complete visual expense register — 2026-11-11

Published release `crm-gastos-registro-20261111`, source
`504e62207472671bc8ac04694e85b1e1ba99470a`, presents all scoped expense rows
as cards without nested property/room disclosures. Imported Gmail invoices have
a source filter and direct document link. Historical references remain visible;
the all-month view counts each stored row once, while month views retain invoice
allocation. Search includes supplier and invoice number. Details open in one
accessible native dialog; property settings and analysis are separate dialogs.

Cobros and Resumen propio runtime are unchanged by this release. No new routes,
queries, database migrations or permissions are included. Existing scoped inputs
and Drive permissions remain authoritative. The browser fixture covers viewing
without writes, Gmail, historic references, search, month/history views, mobile,
dark mode, monthly editing/deletion and allocation with notification failures.

All 116 origin files were verified after activation. The public domain verifies
112 exact resource hashes and four HTML documents after accounting for the
existing Cloudflare challenge injection. Internal files remain 404, GPTBot is
blocked from the CRM, privacy is public and the manifest retains no-cache.
Previous-release backup:
`/var/backups/automanize/crm-before-registro-20261111T222157Z.tar.gz`.


## Visual expense cards — 2026-11-11

Activated and publicly verified on 2026-11-11: all 118 origin files match;
114 public resources match exact hashes and the four HTML documents match after
the existing Cloudflare challenge injection is accounted for. The CRM/internal
file protections remain active. Recovery archive:
`/var/backups/automanize/crm-before-gastos-20261111T214734Z.tar.gz`.

Release `crm-gastos-visual-20261111` uses source
`62911e7` and applies the visual redesign to Gastos. The expense page now has
property and room cards, with movements, graphs, categories and allocation
settings disclosed on demand. Its month selector stays visible. Monthly totals
reuse the filtered rows and allocated amounts already used by the existing list.

Cobros retains its original property cards, circular summary, chart and full
table. Its functional fixes remain: room-specific metric cards/dialogs and Back
restoring the expanded property. Accounting remains inside Resumen propio.

Validation covers expense editing and deletion, monthly recurrence, allocation
with/without notifications, double-click protection, notification failures,
mobile layouts, room details and filters. Cobros room context and navigation
pass their real-component browser regression. Web and desktop compile with the
security hooks enabled. No API, database or permission changes are included.

## Financial overview and room context — 2026-11-11

Release `crm-resumen-visual-20261111` uses app source
`90c0f10555e04d21d9281ef832fa16ea0aeccca4`. It retains the deployed MCP consent
and connection controls (`b7f1b57`) and Gmail monthly allocation (`8de2b89`).
Accounting is a disclosure inside the financial overview. Property results,
payment history, guarantees and notes open on demand. Room payment cards and
their dialogs use the selected room, and Back restores the expanded property.

Activated on the public web on 2026-11-11. All 118 origin files match the
manifest. Public verification confirms 114 exact resource hashes and the four
HTML documents after accounting for Cloudflare's existing challenge injection.
Internal files remain 404, GPTBot remains blocked from the CRM, privacy remains
public, and the MCP health endpoint remains healthy. The previous release is
backed up at `/var/backups/automanize/crm-before-resumen-20261111T212927Z.tar.gz`.

The source passes 37 functional checks, its browser fixture covers room totals,
Back/focus, disclosures, Excel, permissions and mobile/dark layouts, and the web
artifact passes security and the release manifest check. The deployment uploads
assets before atomically switching documents, retains previous hashed assets and
backs up the preceding release. No database changes, new routes or permission
changes are part of this publication.

The live CRM is served from `app/`. Its HTML, all generated assets, and
`app/release.json` form one versioned release. A website update must preserve
these files unless it intentionally publishes another complete CRM release.

Before publishing:

1. Preserve and test the intended renderer source. Build its web distribution.
2. Copy the distribution's assets and HTML into `app/`, keeping previous hashed
   assets for sessions that still have an older page open. Use LF line endings.
3. Generate `app/release.json` with the entry script and SHA-256 of the HTML and
   every asset belonging to that build. Never change the entry alone.
4. Run `node scripts/check-crm-release.mjs` and commit the release files together.
5. Push the commit before deploying it. Upload assets before replacing the HTML,
   then verify the public entry and asset hashes.

GitHub checks the manifest when a change touches the CRM. Resetting the live
checkout to `origin/main` preserves the CRM only when the deployed release has
already been committed and pushed. A manual copy on the server is not a durable
release. Do not use a reset to discard unpublished changes.

The manifest also includes `seendy.html`, its static base CSS and all generated
Seendy assets. `documents` lists the secondary HTML entry points checked for
complete dependencies. Seendy's current design CSS and local font are hashed
build assets, so the new interface does not reuse the previous CSS cache key.

The Nginx container does not apply Netlify's `_headers` file. Caddy must send
`Cache-Control: no-cache, max-age=0, must-revalidate` for CRM documents and the
release manifest. The matcher is in `ops/caddy/crm-cache.caddy`. The installer
`scripts/install-crm-cache-policy.py` validates and backs up the active VPS config
before adding it to the Automanize host block and gracefully reloading Caddy.
The iframe also has a versioned URL to bypass previously cached HTML.

On 2026-10-17, release `crm-restored-20261017` restores the tested renderer from
2026-10-16: compact forms, property workspace, contract attachments, visits,
responsive diagram connections, and room-expense proration rules. The previous
published entry had been replaced by a reset to an older version in `origin/main`.

## Drive supervision and visual folder map — 2026-11-17

Current release is `crm-drive-status-20261117`, app source
`96e28430178df47ac9cdeae1e4ca2e60d1065137`, web code
`fdec2d400b8bd3c4d43ceb97149ad403113591b4`. It separates accounts that have never
configured Drive, shows healthy record counts/proportions and labels unlinked
folders explicitly. The backend/monitor/broker now use the web's canonical OAuth
client through a private server-only function; the prior fallback to shared
OAuth generated false reconnection alerts for all three connected accounts.
All three own roots are accessible without reconnecting or altering tokens.
Corrected audit: 455 healthy records, 121 pending configuration, 10 location/access
issues, 70 records across 35 unconfigured accounts. No open reconnection alerts.
All 117 public resources, entry, precise-state strings and privacy headers passed
verification. Backup: `/tmp/nize-drive-status-20261117T200913Z`.

Initial visual map release `crm-drive-map-20261117`, app source
`6572d97f557dc03c20eb95758f3d53b8db7b5c40`, web code
`f1d3bc7b95d8ef6405ce159672a8c72c27d75f60`. Superadmin → Drive defaults to a
hierarchical account/folder map, with affected branches, per-folder check status,
account search, issue filter, expand/collapse and mobile layout. The table remains
available. Backend-only audit credentials; the tree RPC checks Superadmin.

All 117 manifest resources and the public entry were verified over HTTPS,
including the tree RPC/map strings in the public bundle, existing stuck-progress
fix, no-cache HTML and noindex. Cloudflare's known JS Detection insertion is the
only normalized HTML difference. Assets were published before HTML and prior
hashed resources retained. Unrelated dirty `nize-privacy.html` was preserved.
Rollback documents: `/tmp/nize-drive-map-20261117T193031Z`; prior web code
`d5046dfa9ae9ade3fe3b9565415f18f6ed91e244` (Drive monitoring table release).

Independent Drive monitor: 45 active companies and 656 monitored records,
persistent alerts and grouped mail to automanize@gmail.com. Test email and first
real digest confirmed delivered by the provider. Read-only audit does not repair
or move folders. See backend `docs/drive-supervision.md` for effective grants,
migrations, interval/caps, coverage and deployment backups. No Caddy, OAuth,
portal or unrelated app permission changes were needed.

## Payment method in the payment detail — 2026-11-16

Release `crm-forma-pago-20261116`, source automanize-app branch
`chore/crm-forma-pago-20261116` (previous release `b85cb96` + "Forma de pago"
field). Cobros → expanded payment → Contexto shows "Forma de pago": Efectivo when
`pagos.es_efectivo`, otherwise "No efectivo" once collected. Separate from the AI
verdict. No data, route or permission changes.

## Bancos con despliegue gradual — 2026-11-23

Release `crm-bancos-20261123`, app source `d56b1e3bda2e51d2c829910d3d61e2f547a491e0`
(`deploy/banking-real-test-20261120` = `crm-planes-20261120` + Bancos). Parte de
`release/precios-conexion-ia-20261120`, así que conserva planes y precios. Bancos
(Finanzas) solo aparece al admin de las empresas de la lista del CRM
(`puedeUsarBancos`, hoy la empresa propia); el backend aplica la misma lista con
`BANKING_TENANT_IDS`. Sin cambios de base de datos en esta publicación (028/029 ya
estaban). La rama web `deploy/banking-real-test-20261120` queda superada.
