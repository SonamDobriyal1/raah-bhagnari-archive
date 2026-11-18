# Editing and extending the living archive

## Record lifecycle

Use Placeholder for an object sought but not supplied, Demo for illustrative writing, In review for actual supplied/located material awaiting checks, and Verified only after a named source and permission have been confirmed. Do not convert a demonstration person, quote or family anecdote into evidence by changing a stamp.

The website currently uses In review and Demo, with sought-object placeholders in the journey. It does not present any record as Verified.

## Dictionary and Hindi meanings

Keep stable RAAH IDs. Maintain separate homonyms and documented spelling variants. Add pronunciation only with speaker consent, credit, date and a preserved original recording. Prefer a community recording to a synthetic pronunciation.

The generated source file is `content/dictionary.json`; the importer reads the supplied DOCX and will overwrite this file. Its source forms must not be silently regularised. For substantive corrections, document the original, proposed form, source/speaker and reviewer, then update the upstream edition or establish a versioned correction layer before reimporting.

Hindi meanings live in `content/hindi-glosses.json`. The current 60 are editorial English-to-Hindi glosses, all In review. Review them with fluent speakers before representing them as community-confirmed translations. The source Devanagari is a separate field that represents Bhagnari; it must never be used as an implicit Hindi gloss. The frontend combines these layers while the downloadable source dictionary remains intact.

To add a new publicly approved dictionary record, assign the next unused ID, add headword, Devanagari access form, English meaning, theme, source, review status, examples where supplied and explicit permissions. Update the corpus-count expectations and introductory totals deliberately if the collection grows beyond the supplied 641-entry edition. The import script’s strict 641 check is intentional for that edition, not a permanent limit on the future archive.

## Recipes

`content/recipes.json` holds two cookbook-derived summaries with cook credit, linked dictionary ID, exact PDF page, ingredients, method, notes and review status. New recipes should retain the contributor’s order, family variant and the measurements actually provided. Mark quantities as unspecified when they are unspecified; do not turn a memory into a standardised recipe without the cook’s agreement.

For a family recipe, record who taught it, who is contributing it, where and when it was made, associated occasions and words, and whether the family approves text, images and audio for public use. Cross-link by stable dictionary and journey IDs. Add photographs only when their depicted household and credit are known.

## Contributions and publication

Without the configured queue, browser drafts are local and downloads are the durable handover. Voice recordings are separate downloadable files and should be transferred through an agreed curator channel. A saved browser draft is not an archive accession.

With the private queue enabled, text submissions receive a `RAAH-C-…` reference and remain Pending. Review in Supabase, honour the selected access preference, and contact the contributor using their private contact details. Approval does not automatically publish. Add only an approved, suitably credited public record to the content files and redeploy; never copy contact details or curator notes into those files.

Set a real correction/withdrawal contact on the About page before opening the public queue. Ask the contributor again if a proposed institutional deposit exceeds the original permission, and retain the consent version and correspondence in the controlled research record.

## Preparing a Partition Museum deposit

The build is a presentation and collection foundation, not an accession agreement. Before submission, work with the Museum and community on the required deposit format and permissions. The existing site already distinguishes this intention from actual affiliation.

For each deposited object, prepare a stable accession, title, contributor/creator, date/place with uncertainty, language/script, description, transcript or translation with translator credit, source citation, rights holder, permitted access, consent evidence and any restrictions. Keep preservation masters and access derivatives separate, retain checksums, and include a change history.

Replace demo testimony with consented interviews. Resolve publication rights for the dictionary edition and the community PDFs; the history booklet notes private circulation. Review historical claims, the Hindi editorial layer and Devanagari with appropriate speakers and scholars. Museum staff should confirm the final interface, accessibility needs, delivery format and retention/withdrawal arrangements before institutional publication.

## Useful next collecting sessions

Prioritise a genuine object for each era: a ledger or family record from Bhag/Nar; a Karachi address or photograph; a passage/permit; an early Bombay housing document; and a recent family image or voice note. Ten interview prompts and a short consent-first recording guide are already available in the site’s listening room.
