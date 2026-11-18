# Cookbook and food-word catalogue

Completed November 4, 2026 in Supabase project glbtdvioiclffdfmcrco.

- 55 source food dictionary records.
- 44 cookbook recipes, covering every recipe page from PDF pages 10–57 (48 pages).
- 45 links: the separate Khati Dal and Khatti Dal dictionary records share one recipe spanning pages 26–27.
- 10 unmatched ingredient, utensil or general food entries remain available without an invented standalone recipe. Their IDs and reasons are in content/recipe-catalogue-review.json.

## Database

Schema `archive_catalogue` contains `food_words`, `recipes` and the many-to-many `recipe_words` table. Recipe rows keep names, cook credits, full source records, page arrays, original and local source URLs, scan filenames, checksums and a clearly labelled machine reading aid. The two pre-existing editorial summaries retain their ingredient and method arrays. Every recipe also has structured readingParts for the main text view. Raw sourceText and source scans are preserved separately. The text layout retains source wording; logged recognition corrections were checked against source images.

The schema is separate from private community contributions. Anonymous and signed-in browser roles have no access. The site uses the matching local catalogue snapshot, keeping public reading available if Supabase pauses or the source community website goes down.

## Site

Every matched food entry opens a recipe-first page with plain-text Ingredients and Method, a cropped dish photograph, its cook credit and an exact-page cookbook link. Full page screenshots are not shown in the reading view. Homepage Koki, Khatti Dal, Bori Roti and Seyal Roti go directly to `#recipe`. Both dal spellings work. The kitchen search covers all matched words; six recipe cards are initially shown with an option to show all 44. Dictionary entries link to their recipes, and non-recipe entries retain an honest recipe-sought fallback.

## Provenance and review

Cookbook title and page matches were checked against the page images and index. Anonymous credits are retained where that is the printed index credit. Name spelling differences between recipe pages are preserved (for example Saanya/Sanya Hingoo); these are not silently merged as identities. The source's own quantities and omissions are retained in its page images. Rights and credits remain under editorial review; catalogue inclusion is not a claim of museum clearance.

`archive/derivatives/cookbook-machine-reading.json` is a machine-generated aid, not a verified transcription. Fractions and small quantities may contain recognition errors. The site labels the reading aid and asks readers to check the original page.

## Maintenance

`content/recipes.json` and public/data/recipes.json hold the versioned catalogue. `scripts/catalogue-cookbook.mjs` reproduces the catalogue from its curated title/page/credit map, preserved machine reading and source scans. Preserve any later editorial summaries separately before regenerating. `scripts/recipe-catalogue-sql.mjs` prepares an idempotent SQL upsert in tmp/recipe-catalogue-seed.sql; apply through the authorized database connection after reviewing changes. Updating Supabase alone does not update an already-built public site: keep the local snapshot in sync and rebuild/deploy after approval.

All new source scans and catalogue records are included by the existing preservation backup script. Credentials and private community uploads are excluded.

## Verification

26 automated tests pass, including 48-page coverage and scan checksums, alias links, absent ingredient-only matches, and all four homepage dishes. The static build and local-reference check pass. Database verification returns 55 words, 44 recipes, 45 links and 48 recipe pages. Browser checked homepage Bori Roti → recipe, the Khatti Dal alias, and catalogue search. This is a local preview update; no Vercel redeployment has been performed.

Supabase's advisor lists informational RLS-with-no-policy notices for these server-only catalogue tables. This is intentional: schema and table privileges are revoked from browser roles. No public read/write policy is required for the static site. Reference: https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy

## Plain-text and photograph follow-up

All 44 recipes now share the same plain-text Ingredients / Method layout. Recipe photo crops are recorded in content/recipe-photo-crops.json and in the Supabase recipe source_record. The site displays the cropped dish area of the original local scan; it does not generate replacement food images or modify the source master. Photo captions retain the cookbook page reference. Source scans remain accessible through Open the cookbook.

The CTA reads “Add your family's recipe or dish photo”; the recipe contribution form includes a direct dish-photo upload choice. The requested dictionary disclaimer was removed from every dish page. In review badges were removed from recipe cards, the homepage food feature and exported dish cards; archival metadata is retained without assigning a new verification status.

Run scripts/prepare-recipe-reading.mjs to reproduce readingParts and the logged text corrections. The unchanged raw extraction stays in sourceText. This uses the preserved original PDF pages for checking fractions and quantities, rather than interpreting ambiguous recognition output as authoritative.
