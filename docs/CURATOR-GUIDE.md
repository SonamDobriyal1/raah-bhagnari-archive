# Reviewing contributions

Open the Raah Bhagnari Archive project in the Supabase dashboard:
https://supabase.com/dashboard/project/glbtdvioiclffdfmcrco

The website does not provide a public administration screen. Only appointed Supabase project members can review records and private files. Never share project credentials with contributors.

1. In Table Editor, open `contributions` and filter `status` to `pending`.
2. Read the caption, source, credit and use preferences. Check consent with the contributor where necessary. Contact fields and curator notes are private.
3. For media, open Storage and the bucket named in `storage_bucket`. The matching file is at `storage_path`. Both buckets are private.
4. For photographs intended for publication, edit the title, caption (`message`), photographer credit, location and date into an appropriate public form. Do not leave personal contact details or private addresses in these public caption fields.
5. Publish only after permissions are settled: set `status` to `approved`, `access` to `Public after review`, and confirm `photo_consent` is true. Record the decision in `curator_notes` and `reviewed_at`. The community album then shows the photograph, title, caption and permitted credit. Anonymous credit preferences suppress the public credit.
6. `Ask me before any publication` and `Private research only` entries never enter the public album, even when their status is approved. Obtain and document permission before changing an access preference. Do not infer consent from silence.
7. To withdraw a published photograph, set its status to `withdrawn`. It drops out of the album on refresh after the short cache expires; already issued signed image links may remain usable for up to an hour.

Voice recordings currently enter private review; setting a recording approved does not attach it to dictionary entries. Review and public voice playback require a separate publication step.

Three clearly labelled SYSTEM VERIFICATION ONLY fixtures were used to test setup. They are withdrawn and excluded from the public album. They are not community contributions or research evidence.

Keep encrypted exports of private media and corresponding records in an owner-controlled backup location. The public preservation ZIP contains public source material, not these private contributions.
