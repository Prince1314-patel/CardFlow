# Video feedback implementation and QA matrix

Source: timestamped client-video review, 03:41. Visual evidence only; audio not transcribed. Do not treat hypotheses as confirmed client requirements.

| Timestamp | Video evidence | Action taken | Verification |
| --- | --- | --- | --- |
| 00:00-00:29 | Mobile upload and scan workflow | Existing camera, upload, compression and progress preserved | Production static route tested; actual iOS/Android tests pending |
| 00:29-01:10 | Extracted details and keyboard editing | Named contact review, collapsible optional fields, editable inputs retained | Live site UI verified; mobile keyboard test pending |
| 01:10-01:32 | Long review form | Primary save action shown before optional fields | Source and deployed asset verified |
| 01:32-01:51 | CSV and VCF downloads | CSV export retained; primary per-contact save VCF added; all-contact VCF retained | File format round-trip in native iOS pending |
| 01:51-02:29 | iPhone native contact preview, possible combined numbers | Split semicolon/newline-separated phone values, assign TEL;TYPE=WORK/CELL/FAX, dedupe digit-equivalent numbers; split email entries | Static code inspection passed; iPhone interoperability test pending |
| 02:29-03:31 | Native edit steps | Prominent Save to phone button, collapsible review form | Device tap-count comparison pending |
| 03:31-03:41 | Messaging app shown | No additional marketing feature inferred | Out of scope until clarified |

## Regression test cases
1. Single contact with 'Mobile: +44 7000 123456; Office: 020 7000 1234; Fax: 020 7000 1235' must produce three distinct TEL entries with CELL/WORK/FAX types.
2. Duplicate phone number with punctuation differences must export once.
3. Multiple emails separated by semicolons must become separate EMAIL entries.
4. Names with accents, apostrophes, commas, backslashes and newlines must be escaped correctly in VCF and CSV.
5. Exported CSV with formula prefixes (=, +, -, @) must not execute formulas in spreadsheet import.
6. Verify iOS Contacts contact creation from individual VCF and multi-contact VCF, with distinct numbers and email.
7. Verify Android Contacts import and browser download behavior.
8. Verify contact field edits persist locally and are reflected in VCF/CSV.
9. Verify editing/removing under each sort/filter affects the intended record.
10. Verify camera permission denied, cancel, invalid image, oversized batch, provider timeout, malformed JSON, and duplicate cards.

## Known limits
- This release does not offer direct silent contact insertion. iOS/Android require native confirmation and appropriate permission/UI.
- A browser-initiated .vcf download may lead to native app chooser or share sheet depending on device/browser.
- Automated Google Drive/Sheets and weekly email are deferred to Phase 2.
- Production deployment verified, but independent end-to-end mobile/contact-import testing and measured accuracy are incomplete.
