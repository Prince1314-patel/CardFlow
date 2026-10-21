# CardFlow mobile QA results

**Test date:** 2026-10-21  
**Production:** https://cardflow-contacts-mvp.vercel.app  
**Latest UI fix:** commit `2476617e1c91083afaaf11de141e27813703d706`  
**Runner:** [qa/mobile-browser.cjs](../qa/mobile-browser.cjs)

## Scope and environment

Tested the **live deployed application** in Vercel Sandbox using headless Chromium in:
- iPhone 13 viewport (390 × 844), touch enabled, iPhone Safari user-agent.
- Google Pixel 7 viewport (412 × 915), touch enabled, Android Chrome user-agent.

These are **browser emulations**. The iPhone test does **not** use Safari WebKit or native iOS Contacts. The Android test does **not** open the native Android Contacts app. Do not present them as physical-device or native-import verification.

For determinism the `/api/scan` extraction response was **mocked** with two contacts, containing mixed phone types, a duplicated phone, multiple emails, Unicode characters, and spreadsheet formula-like text. Real Krutrim vision inference was not part of this test.

## Automated results

**38 / 38 checks passed** against the updated production deployment, confirmed by rerunning the test script checked into the main branch.

Checks covered:
- No client-side JavaScript exceptions on load and no horizontal overflow on mobile viewports.
- Camera file-chooser activation and image upload/preview.
- Mocked extraction and rendering of two contacts.
- Optional details collapsed by default; name editing and search.
- CSV download with edited values, event name and formula-injection neutralization.
- Per-contact VCF download with one VCARD entry.
- Separate mobile, office and fax TEL entries.
- Deduplication of identical numbers with different punctuation.
- Two distinct EMAIL entries and correct escaping of a comma in a contact name.
- Browser-local persistence of contacts, corrected fields and original capture event after reload.
- Clearing local data with native confirmation dialog.
- No JavaScript exceptions in tested flows.

## Independent vCard parse

Using Python's `vobject` library, independently parsed the generated `Alice-Smith.vcf` file from both mobile browser profiles:
- 1 vCard entry with `FN: Alice, Smith`.
- `CELL`: +44 7700 900123.
- `WORK`: 020 7946 0911.
- `FAX`: 020 7946 0912.
- Emails: alice@example.co.uk and contact@acme.com.

Both parsed successfully without errors.

## Defect fixed while testing

**Capture event lost after reload.** Previously CSV/VCF export depended on the current event field, which resets after reload. Each new contact now retains the event captured when it was created, and CSV/VCF reuse the stored value. Individual VCF filenames now use a sanitized contact name, and Blob URL cleanup is delayed for mobile download reliability.

## Remaining native-device acceptance (not verified)

1. **iPhone Safari:** camera permissions, genuine photo capture, VCF download → Files/Share → Contacts preview → Create New Contact → verify separate CELL/WORK/FAX and emails.
2. **Android Chrome/Samsung Internet:** capture, download and open `.vcf` using Google/Samsung Contacts; verify same fields and labels.
3. **iOS/Android edge cases:** share-sheet behavior, duplicate-existing-contact prompt, download permission denied, HEIC photographs, keyboard overlap, low-memory device, browser in private mode, and device-local storage eviction.
4. **Full real provider test:** run a high-resolution multi-card client image through Krutrim and compare field-level results with hand-labeled ground truth.
5. **Security:** external data collection, rate limiting, storage privacy, content-security restrictions and client-authenticated cloud storage remain separate hardening items. Client-owned Sheets/email remain Phase 2.

## Reproduction

Install Puppeteer as a local test-only package (`npm install --no-save puppeteer@24.31.0`), ensure the Chrome runtime dependencies are present, then run:

```bash
node qa/mobile-browser.cjs
```

The suite uses synthetic contact data and a generated image fixture. It does not use the real API key or transmit private contacts during mocked extraction.

**Release assessment:** Ready for a supervised cross-device demo; **native iPhone/Android contact-import acceptance and full production-grade testing remain open**.
