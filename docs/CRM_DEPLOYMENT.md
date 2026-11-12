# CRM releases

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
