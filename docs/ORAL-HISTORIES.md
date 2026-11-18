# Oral histories

The homepage now introduces an oral-history space, linked to `/voices#oral-histories`. It takes its editorial reference from the Partition Museum’s speaker-led videos and short contextual summaries: https://www.partitionmuseum.org/oral-history. No museum media or testimony has been copied, and this does not imply affiliation.

The initial state honestly invites the first interviews. No fictional speakers, thumbnails, dates or playable recordings are displayed. Interview offers use the existing private memory contribution form, with the title prefilled. Long video files are not uploaded by this form: contributors can describe the recording and supply a viewing link for private review. Existing short-audio upload remains separate.

## Adding an approved recording

`content/oral-histories.json` holds the public catalogue. Keep contacts, private viewing links, unpublished transcripts and consent documents out of this file. Publish only media explicitly cleared for public access; a private storage object must not be made public merely to populate this section.

Each public record uses `id`, `status: "published"`, `publicationConsent: true`, `kind: "video"` or `"audio"`, `speaker`, `summary`, `language`, `languageCode`, `duration`, `recordedOn`, `place`, `interviewer`, `mediaUrl` and `mimeType`. Optional `poster`, WebVTT `captionsUrl`, and plain-text `transcript` are supported. Dates, durations and places should reflect the recording, not estimates invented for presentation. Use public-cleared local media paths where practical, and preserve originals separately.

The homepage shows the first published interview; the listening room shows the full catalogue. Players use native controls, no autoplay and no initial media download. Video captions and an expandable transcript can accompany each interview.

Validation: 30 tests passed; static build and 16,999 local-reference checks passed. Browser navigation from the homepage to the listening room and then to the prefilled interview-offer form was verified. This change is preview-only.
