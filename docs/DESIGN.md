# RAAH design and implementation

## Direction

“The Bundle” combines the original site’s warm writing, connected records, considered pacing and quiet movement with the review’s family-ledger metaphor. This is a contemporary archive that feels collected over time, rather than a generic heritage brand or a simulated antique.

The original project used Fraunces, Instrument Sans, navy, gold, full-bleed landscape photography, staggered fade reveals, a drawing route and a museum-style plate system. The new site keeps the literary tone, record relationships, plate numbers and gentle sense of movement. It changes the visual materials, page length and treatment of evidence.

## Visual system

| Role | Implementation |
| --- | --- |
| Undyed cotton | `#EFE6D2`, page ground |
| Ledger buff | `#E2D2AE`, record surfaces and earlier chapters |
| Lamp-black | `#1E1A16`, body text |
| Madder red | `#8E2A1E`, masthead, rules, key actions and headings |
| Ajrak indigo | `#1F2A55`, the word section and drawn cloth |
| Reading type | Spectral 400–600, paired with locally hosted Instrument Sans |
| Devanagari | Tiro Devanagari Hindi, Roman form alongside; native spelling is an access layer, not a claim that Bhagnari is Hindi |
| Catalogue type | IBM Plex Mono for IDs, dates and limited metadata |

No archival object has been fabricated as evidence. The cloth pattern and recipe illustration are interface artwork. The door is an existing licensed stand-in with an explicit label and full credit in the album. No stock portrait is presented as a real speaker.

## Information structure

| Page | Reader’s task |
| --- | --- |
| Home | Understand the community in a minute; choose a strand |
| Our story | Read the on-ramp, sources, provenance method, consent and institutional intent |
| The journey | Follow the full nineteenth-century-to-present sequence and see what objects are still sought |
| Dictionary | Search by Bhagnari Roman form, Devanagari, English meaning, editorial Hindi meaning or record ID; filter 14 themes |
| Word record | Read meaning and example; distinguish the Hindi editorial layer; save a word image or export JSON; suggest a correction or recording |
| Our kitchens | Find food vocabulary, read credited recipe summaries, open the source cookbook and inspect clearly separated demo dossiers |
| Collections | Open the history booklet, Panchayat scans, cookbook and aarti book at their community source |
| Photograph album | Inspect nine labelled stand-ins and their precise credits in a lightbox |
| Listening room | Read the preserved demo transcripts honestly; download questions and record a real elder with consent |
| Add your page | Keep a draft, export it, record a local voice note, or submit text to a private configured queue |

The homepage is an introduction, not a full dump of the collection. Full records have permanent ID routes. The build produces readable HTML for all 710 known pages, with interactive enhancement after loading.

## Material and motion

The opening spreads out three records over a drawn indigo textile: a photograph, dictionary slip and food note. A small rotation settles during loading; text and images never begin hidden. Hover gestures lift paper slightly. Reduced-motion settings remove these effects and smooth scrolling.

The journey starts with red-ruled ledger paper, passes through telegram-like and ticket-like surfaces, and finishes on a contemporary album page. Dates and the north-up locator replace the old growth-chart-shaped route. Chapters change the map only on selection. The map is explicitly a regional locator, not a reconstructed family itinerary or surveyed historical map.

The dictionary slip pairs large native form, Roman headword, English gloss, usage and stable ID. Downloaded square cards retain the provisional-review notice. The recipe summaries use ruled sheets with ingredients, a paraphrased method and the printed cook’s credit. The album uses a compact dark surface with photo margins and captions; its larger images live in an accessible modal.

## Responsive and accessible implementation

The phone layout uses a readable single-column narrative, 17px body text, explicit labels and a menu button with expanded state. Collection grids reduce to two columns, then one on smaller screens. Long headwords wrap. The sticky header does not obscure anchor targets. Information is available without motion. A skip link, landmarks, visible focus styles, form labels, status announcements, native audio controls, modal focus restoration and keyboard-operated dossier tabs are included.

Desktop and phone QA found an intrinsic-width issue in the opening collage; the grid was changed to `minmax(0, 1fr)` so the fixed decorative artwork could not force body copy beyond the phone viewport. Source captions and catalogue labels were increased after the first visual pass.

## Next design additions when material arrives

Replace stand-ins with consented family photographs, and replace fictional transcripts with real oral histories. One genuine ledger, passage document, housing record and family object per chapter will deepen the material system more than additional decoration. A scanned family cloth or paper texture can replace the current drawn patterns after provenance and reuse permission are documented.
