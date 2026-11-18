# Raah contributions: Supabase plan

Decision: a new Supabase project for contribution records and private media. Public archive pages and preserved public documents continue to be served by Vercel. This avoids a database request on each public page view.

## Planning assumptions

These are scenarios, not measured traffic or a forecast. Compressed pronunciation clips average 2 MB; photographs average 3 MB. Audio uploads are limited to 3 MB per file, with two-minute browser recordings. Photograph intake prepares a JPEG access copy on-device at up to 2,400 pixels on the longest edge and 3 MB, retaining the original on the contributor’s device.

| Scenario | Monthly audio / photos | Media added monthly | Added in 12 months |
| --- | --- | --- | --- |
| Pilot | 10 / 5 | 35 MB | 420 MB |
| Community participation | 50 / 20 | 160 MB | 1.92 GB |
| Active collection campaign | 200 / 100 | 700 MB | 8.4 GB |

Metadata is small relative to audio. At an assumed 5 KB per record, 1,000 contributions add roughly 5 MB of row content, before indexes and database overhead. Curator playback and downloads determine storage egress; public website visits do not automatically consume Supabase media bandwidth in this design.

## Capacity and costs

Official pricing checked November 4, 2026: https://supabase.com/pricing

Free includes a 500 MB database and 1 GB file storage. Free projects may pause after a week of inactivity. It suits an initial pilot; at the community-participation assumption, media alone would fill 1 GB in approximately six months. It is not a dependable unattended museum service without accounting for pausing.

Pro starts at $25/month and includes 8 GB database disk, 100 GB file storage, and larger egress allowances. The actual incremental project quote depends on the selected organization's plan and existing projects. No paid upgrade or nonzero project cost is authorized by the storage selection alone. Obtain the account-specific quote before creation.

## Privacy and review

- Contributions table has row-level security enabled; anonymous and signed-in browser roles have no access.
- The recording bucket is private, with no public read/write policies.
- An authenticated, upload-only relay sends media to a Supabase Edge Function and creates a pending contribution record. Its private key is held only by the site server; the database service-role key stays inside Supabase. The function verifies the private relay key itself (gateway JWT checks are replaced by this authentication). Never place these credentials in a VITE_ variable or browser bundle.
- Speaker recording consent, intended use, credit preference, date, pronunciation variant and contact details stay with the review record.
- A receipt is returned without a public media URL. The public album only shows photographs explicitly marked approved AND Public after review, with photo permission recorded. Private research and Ask me before any publication entries stay excluded. Approved photos receive temporary signed links; contact details and internal notes are never returned. A previously issued image link may remain usable for up to an hour after withdrawal.
- Failed metadata creation triggers an attempt to remove its own new audio object; curators should periodically check for orphaned uploads after service failures.
- Curators initially use the Supabase dashboard. A separate curator application and publication workflow are outside this implementation.

## Preservation

Existing public source backups remain local and independent of Supabase. New private contributions require a separate encrypted export of records AND original media to an archive-owner-controlled location, with checksums and a restore check. Do not put contacts or unpublished recordings in the public site's preservation ZIP. A database-only export is not a media backup.

## Setup status

Created November 4, 2026: Raah Bhagnari Archive, project glbtdvioiclffdfmcrco, Mumbai (ap-south-1), in msadani-debug's Org. The account-specific creation quote was $0/month; no paid upgrade was made.

The private contributions table and archive-recordings / archive-photos buckets are configured. Local preview receives recordings, photographs and text through the authenticated archive-ingest Edge Function. Server credentials are in ignored .env.local; no service-role key was downloaded. Production was updated on November 4, 2026, and its server-only environment is configured. A live private photo submission was verified successfully. See DEPLOYMENT-2026-11-04.md.

Verified real disposable audio/photo uploads, private pending records, browser gallery selection and image preparation, rejection of unauthenticated ingest, no anonymous or authenticated table reads, and denial of public access to the private photo bucket. A temporary approved test photograph appeared in the public-feed response and its signed image loaded. All three setup fixtures were then withdrawn and excluded from publication.

Supabase's security advisor reports one informational “RLS enabled, no policy” notice for contributions. This is intentional: browser roles have all table privileges revoked; only the service-side intake and curated public-feed operations access it. Guidance: https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy

Real phone camera capture still needs a check on a physical phone after an HTTPS preview/deployment is approved. The camera input requests environment-facing capture; unsupported browsers fall back to their file chooser.
