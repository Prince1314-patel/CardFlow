# CardFlow

A Vercel-hosted business card digitization MVP. Upload up to four photographs containing multiple business cards, review extracted contact data, and export CSV or VCF contacts.

## Deployment

1. Connect this repository to a Vercel project.
2. Set these environment variables in Vercel: `KRUTRIM_API_KEY` (encrypted), `KRUTRIM_MODEL` (the actual supported model identifier), and `KRUTRIM_ENDPOINT` (the chat completions endpoint).
3. Deploy to production.

No secret keys belong in Git. The provider/model are not displayed on the UI. Images are processed in memory and forwarded to the configured inference provider. Review contact information before export.

## Local development

Run `npx vercel dev` with the Vercel CLI and configured environment variables. The app uses a static frontend in `public/` and the `/api/scan` serverless endpoint.

## Limitations

Model compatibility and accuracy must be confirmed with real photos. Import the VCF into your phone or contacts provider. CSV spreadsheet editing is supported. Bulk marketing campaigns and automated contact favorites are out of scope.
