# CardFlow Phase 2: Client-Owned Cloud Workspace

Status: **Deferred, specification approved for implementation planning only**. None of the integrations described here are deployed.

## Objectives
Client owns their Google account, Sheets, Drive files, and weekly email recipient list. Maintain persistent, editable, searchable contact records across devices and automate reporting without requiring the developer's Google account.

## Phase 2 scope
1. **Account ownership and authentication**: Google OAuth authorization by the client's designated account. Configure OAuth consent, redirect URLs and verified scopes in a dedicated Google Cloud project. Use least-privilege grants. Never request Google password or expose client tokens to browsers or source control.
2. **Secure persistent storage**: Provision managed Postgres with tenant IDs, identities and contacts. Unique indexes for normalized email and telephone per tenant, explicit fallback for unidentifiable contacts, audit timestamps, notes, status, source and review state. Enforce authenticated tenant isolation server-side and in database policies. Keep OAuth tokens encrypted with key management, not in the contacts table.
3. **Google Sheets sync**: Connect to an existing client-owned spreadsheet or create one after OAuth. Columns: contact ID, person, position, company, email, phones, websites, postal address, location, category, event, capture date, follow-up status, notes, consent, last edited, sync status. Support editable rows and conflict reconciliation: database remains source of truth; capture spreadsheet edits by an explicit import/reconcile workflow or authorized periodic sync, never silently overwrite. Idempotent upserts by contact ID.
4. **Weekly email collateral**: Client chooses recipient(s), timezone, weekday and time. A protected Vercel Cron job or queue runs weekly and produces a CSV + counts of new and updated contacts, with a link to the Sheet. Use approved email sending provider with authenticated sender; do not assume Gmail personal sending permissions. Idempotency key per tenant/week, delivery log, retry/dead-letter handling and unsubscribe/change-report controls.
5. **Privacy and compliance**: UK GDPR/Data Protection Act considerations for networking contacts, retention policy, source/consent and outreach preference, data export and erasure requests. Business card collection does not automatically authorize unsolicited campaigns. Restrict public access; do not share contacts without client authorization.
6. **Operational hardening**: Rate limits, image-processing limits, AI budget guards, error observability without logging contact payloads, encrypted secrets, regular backup and restore exercises, OAuth refresh/revocation, token expiry and migration plan.

## Suggested architecture
Mobile web/PWA -> Vercel API -> authenticated contact service -> managed PostgreSQL. Background queue -> Sheets synchronization and report pipeline. Vision inference stays server-side with Krutrim. Use short-lived browser sessions and CSRF defense, no client secrets in JS.

## Proposed tables
- tenants(id, name, created_at)
- identities(id, tenant_id, provider_subject, email, role)
- contacts(id, tenant_id, name, title, company, email, phone, website, address, location, notes, event, category, status, consent_status, source, review_state, created_at, updated_at)
- spreadsheet_links(id, tenant_id, spreadsheet_id, sheet_id, sync_cursor, last_sync_at)
- deliveries(id, tenant_id, period_start, period_end, destination, state, provider_message_id, retry_count)
- audit_events(id, tenant_id, actor_id, object_id, action, timestamp)

## Prerequisites to be provided later
- Client-designated Google Workspace/Google account and explicit OAuth authorization.
- Client-approved destination spreadsheet/Drive folder and weekly recipient(s).
- Preferred schedule and timezone, sender domain and provider.
- Database/auth project, retention policy and ownership arrangements.

## Acceptance criteria
- New contacts securely saved and synchronized across devices under the correct tenant.
- Spreadsheet contains correctly typed fields; edits can be reconciled and do not create duplicates.
- Weekly mail delivered once with correct CSV and date range, retry-safe.
- Authorized client can revoke access, delete/export contacts and disconnect Google.
- Independent test accounts cannot read or edit each other's data.
- End-to-end integration tested with client's authorization; logs contain no raw contact PII.
- Backup restore, auth expiration, API outage, spreadsheet permission removal and report duplicate prevention tested.

## Delivery boundaries
**Phase 1 (now):** mobile camera capture, uploads, manual entry, local contact editing, searching, sorting/filtering, CSV/VCF export. Device-local persistence only, not synchronized. 
**Phase 2 (later):** Google OAuth, cloud database/auth, Google Sheets synchronization and weekly emails. No production-readiness or cloud-sync claim before acceptance evidence.

## Suggested implementation order
1. Tenant/auth + data store and migrations
2. Contacts API and migration from Phase 1 exported CSV
3. Client OAuth and Google Sheets connection
4. Incremental sync/reconciliation and ownership verification
5. Weekly delivery with retries, permissions and observability
6. Threat model, edge cases, UAT and production cutover
