# VCF multi-value export fix

## Reported defect
On Samsung Contacts, a business card with two telephone numbers was imported as one Work phone value. A client-provided .vcf showed one TEL record containing two full numbers separated by " / ". This is an exporter parsing bug, not an Android Contacts setting.

## Root cause
The prior phone splitter recognized semicolons, line breaks and select comma patterns but did not recognize slashes or adjacent country-coded numbers. The email splitter likewise rejected slash-separated strings as a single invalid address. A phone number in one TEL field is treated as a single phone value by mobile contacts apps.

## Fix (commit 84d33a1)
- Split phone values on " / ", pipes, line breaks, semicolons, supported comma patterns and adjacent international + codes.
- Retain mobile/cell/WhatsApp => CELL, fax => FAX, home => HOME and remaining types => WORK.
- Deduplicate digit-equivalent values within a contact.
- Emit one TEL property per recovered number.
- Extract each email address into its own EMAIL property, case-insensitive deduplication.
- Preserve one BEGIN:VCARD/END:VCARD per unique person.
- Changes affect exports of previously saved local contacts immediately after page refresh; no rescan necessary.

## Verification
- 12 focused Node regression tests: all passed; script: qa/vcf-export.test.cjs.
- Production frontend /app.js returns HTTP 200 and contains the updated parser.
- Corrected the uploaded VCF locally: one contact, two TEL records, one EMAIL record. Raw client VCF is intentionally *not* committed to the public repository.
- Native Samsung Contacts and iOS Contacts import still require device-level acceptance and are not claimed verified.

## How to retest
1. Reload https://cardflow-contacts-mvp.vercel.app and export saved contact again using Save to phone or Download all contacts.
2. Inspect the new VCF text: separate TEL lines, and separate EMAIL lines if there are multiple addresses.
3. Import to Samsung Contacts or Apple Contacts as a **new** contact. Previous imported records will not automatically update.
4. Confirm each phone number appears as a separate item and that all email addresses remain separately actionable.
5. If any number is still combined, capture its exact string in the review input and the resulting VCF line so we can extend parsing for that delimiter.

## Limitation
Unmarked concatenations of local phone numbers with no delimiter or country-code + prefix are inherently ambiguous; the application deliberately avoids guessing split points. Neither extraction accuracy nor real-device contact import is proven by these parser tests alone.
