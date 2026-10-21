# CardFlow v2: implementation plan and review

## Client outcomes
One-tap camera capture, gallery/document upload, and manual entry; daily searchable and categorized contacts; editable CSV/Google Sheet; weekly email collateral.

## Architecture and staged acceptance criteria
### Phase 1: Mobile capture and local workflow
- Camera capture with rear camera, optional file picker, and manual contact entry
- Reuse vision extraction with review before retaining records
- Duplicate checking, sortable/searchable list, follow-up status, dated records, CSV and VCF export
- **Acceptance:** camera and gallery work on mobile, keyboard accessible forms, previous contacts survive page refresh on the same device, exports preserve edits
- **Important limitation:** device-local browser storage is not an encrypted multi-device CRM. Shared devices, private browsing, browser resets and XSS are risks. No cloud data persistence is claimed.

### Phase 2: Production persistence
- User authentication and account isolation before saving contact data centrally
- Database tables for users, organizations, contacts, contact sources, event and follow-up status; indexes and unique keys
- Verified server-side validation, row-level access, idempotent imports and audit history
- Background queue for scan batches; retry and error tracking
- **Acceptance:** cross-device access, duplicate control, unauthorized-access tests, safe data deletion, backups and restore test
- **Dependency:** choose project database and authentication tenancy, provisioning/credentials

### Phase 3: Google Sheets and weekly delivery
- Destination Sheet owned or shared by the client, with scoped OAuth or service account access
- Upsert semantics, conflict resolution when spreadsheet rows are edited, status tracking and reconciliation
- Scheduled weekly aggregation, email recipient authorization, opt-in and unsubscribe for marketing separately
- **Acceptance:** rows update in the correct sheet, editing remains possible, no duplicate delivery, scheduled delivery with failure retries
- **Dependencies:** client's authorized Google Sheet and recipient email, and permission to schedule the weekly digest

### Phase 4: Edge cases, privacy, security and production readiness
- Test images with many cards, duplicate cards across photos, cropped/blurred cards, unusual name/phone/email formats, non-Latin scripts, false positives, provider timeouts and malformed JSON
- Test camera permissions, device compatibility, offline behavior, oversized images, session persistence, CSV injection, vCard escaping, search/filter, export/import
- Test contact authorization, rate limiting, API billing caps, audit logs, backup restoration, secret rotation and access-control isolation
- Compare extraction precision/recall and field-level accuracy with a labeled card dataset. No quality claim without measured results.

## Review findings
Current app had no durable backend contacts database or Google integration. Introducing automatic Sheet/email writes without client authorization would be inappropriate. The demo can offer device-local persistence, but must not be labeled production-ready.

## Definition of done
All critical paths tested on a real mobile device, extraction benchmark meets an agreed accuracy threshold, persistent secure contact store enabled, client-owned Google integration verified, scheduled weekly delivery proven, and security checks passed.
