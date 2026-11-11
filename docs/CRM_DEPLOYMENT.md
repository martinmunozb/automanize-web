# CRM releases

## Financial overview and room context — 2026-11-11

Release `crm-resumen-visual-20261111` uses app source
`90c0f10555e04d21d9281ef832fa16ea0aeccca4`. It retains the deployed MCP consent
and connection controls (`b7f1b57`) and Gmail monthly allocation (`8de2b89`).
Accounting is a disclosure inside the financial overview. Property results,
payment history, guarantees and notes open on demand. Room payment cards and
their dialogs use the selected room, and Back restores the expanded property.

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
