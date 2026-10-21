# Dense Business-Card Scan Failure: Investigation & Fix

Date: 2026-10-21
Project: CardFlow
Production: https://cardflow-contacts-mvp.vercel.app

## User-reported symptom
A mobile browser uploaded a tall photograph containing many business cards and displayed: "Extraction failed. Please retry with a clearer photo." The supplied image included small type, several cards per column and glare. The displayed message was not evidence that poor photo quality was the cause.

## Root cause and limitations of evidence
The prior backend caught any exception from the provider request, JSON parsing, truncated responses or schema validation and returned the same generic image-quality message. Historical production logs did not provide the underlying cause of the exact user attempt, so that specific original failure cannot be attributed conclusively to provider truncation, timeout or malformed output.

## Implemented
1. Backend now returns distinct safe error codes for invalid input, provider throttling, provider authentication/errors, provider timeouts, truncated output, malformed/schema-invalid AI responses and no contacts. It logs short diagnostic metadata (status, duration, response character count, finish reason), not contact content or images.
2. Client preserves photo quality up to 2200px long edge with JPEG quality 0.83 instead of 1500/0.78.
3. Tall portrait sheets are divided into three overlapping slices (48% of height, beginning/middle/end) and scanned in separate requests. The app shows per-section progress and continues processing even when one section fails.
4. The review database keeps contacts successfully extracted from other sections and reports partial failure without discarding them.
5. Contacts extracted from overlapping sections are matched using exact normalized names and organizations, email addresses or phone numbers. Missing fields are filled from later extractions, but populated fields and user edits are never overwritten. Explicitly distinct named people remain separate even when sharing a corporate phone or email address.
6. Added a Replace photos button to retry different photos without reloading the page.

## Verification
- JavaScript syntax checks: pass.
- 14 backend error-handling and response tests: pass.
- 12 existing vCard/phone-email interoperability tests: pass.
- 5 overlap-dedup test cases, including two different people sharing one work number/email: pass.
- **Total unit/regression tests: 31/31 passed**.
- Mobile-sized Chromium synthetic dense board: 9/9 checks passed; verified 3 requests, partial failure message, retained successful contacts and photo replacement.
- Real Krutrim 4-card synthetic test: HTTP 200, 4 contacts, ~3.3 seconds.
- Real Krutrim dense sheet with 12 synthetic cards: three HTTP 200 responses; after dedup fix, **12 unique contacts saved from 12 synthetic cards**, ~11.3 seconds.
- Production deployment: Vercel ready.

## Remaining verification
- The specific uploaded real business-card photograph was **not** retransmitted in the automated provider test. Real text extraction and accuracy for that photo are not guaranteed. Re-upload it to the new production deployment, and inspect each contact in the review UI.
- Real-world glare, partially visible cards, unusual layouts, and model inaccuracies can still require manual review.
- Native iPhone and Android Contacts import remains a separate mobile-device acceptance test.
- Rate limiting, authentication and server-side tenant isolation remain future hardening work.

## Re-test instructions
1. Reload https://cardflow-contacts-mvp.vercel.app to get the new frontend.
2. Tap Replace photos to clear old upload state; select the tall card-sheet photo again.
3. Tap Extract & review. Watch the status cycle through "Scanning section 1 of 3…" to 3 of 3.
4. Confirm the number of contacts, inspect missing fields, and export CSV/VCF.
5. For any failed section, share the exact new message and the approximate section number. The new logs and error codes will help identify the cause.

Do not send or publish the client's original unredacted business-card images in public repositories.
