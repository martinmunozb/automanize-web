# Seendy web: visual release

Release `seendy-visual-20261105-2` rebuilds the complete CRM from app source
`2f3d2f9483b3eb0e08bd12f88c2e16f76680430b`. The branch incorporates the invoice
features already present in the live `crm-facturas-gastos-20261105` release;
publishing the inbox must not roll those features back.

The inbox adapts the responsive chat layout from
[satnaing/shadcn-admin](https://github.com/satnaing/shadcn-admin), MIT,
commit `e16c87f213a5ba5e45964e9b67c792105ec74d26`. The public license and
WA UI's message renderer license are included. It adds a dark header, violet
workspace, filter cards, a navigation rail and a contact panel. Existing
Seendy commands and permissions remain in use. Enlarging the CRM frame keeps
drafts and the iframe has `v=inbox-20261105-visual2`.
The CRM frame reserves space below the composer for the global Nize IA launcher;
the browser audit checks that the send button is not covered in either size.

`app/release.json` covers all 112 runtime files. Old hashed assets remain for
open sessions. No internal source, SQL, docs, environment files or sourcemaps
are copied into the release. There are no new backend routes, database objects,
providers, external assets or authentication changes. Supabase access uses the
existing monitored route families; this visual release does not independently
verify the monitor's live health or alter its coverage.

Verification before publishing: inbox regression with local API fixtures
(replies, failure drafts, notes, templates, media, assignment, assistant,
status, new number and nine responsive widths); web and renderer builds with
their security prebuild; compiled CRM-to-iframe audit; Caddy security and
download-channel tests; manifest SHA-256 validation. Tests do not send real
WhatsApp messages or change customer data.

Publication follows [CRM_DEPLOYMENT.md](CRM_DEPLOYMENT.md): push the versioned
release first, preserve the active files, copy assets before HTML and check the
public hashes and the compiled CRM-to-iframe flow with isolated API fixtures.
The first visual release was published and verified on 5 November 2026. This
follow-up fixes the launcher overlap found during that review; its deployment
evidence is recorded separately after verification. It does not publish desktop
installers. Cloudflare's existing JS detection adds a script to public HTML:
origin SHA-256 values are checked on VPS, public runtime assets are checked
byte-for-byte, and HTML is compared after removing that observed injection.
