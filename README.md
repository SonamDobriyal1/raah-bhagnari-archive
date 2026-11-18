# RAAH / राह

The Bhagnari living archive: community history, 641 dictionary entries, 44 cookbook recipes, photographs and oral histories.

- Deploy the website and the curator API together on Vercel.
- Records, review queues and photographs are stored in Supabase.
- The service role key stays in the Vercel environment. The public site build only receives the Supabase URL and anon key.

## Local preview

Use Node.js 22.12+ and npm.

```sh
npm ci
npm run dev
```

The preview address is printed in the terminal. The dictionary, recipes and source documents work without database access. For a local preview using the existing public API, add the development origin to the server allow-list first; otherwise leave uploads disconnected locally. Never put private keys in browser configuration.

## Build and verify

```sh
npm test
npm run build
node scripts/verify-build.mjs
```

This produces the readable routes plus a 404 page in `dist/`. Fonts, cookbook photographs, scans and core PDFs are hosted with the site. Vercel serves those pre-rendered pages and the `/api` routes from the same project.

## Deploy on Vercel

Connect the repository to one Vercel project. The build command is `npm run build` and the output directory is `dist`, as set in `vercel.json`. Set these environment variables on that project before deploying:

- `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` for the database and photograph storage
- `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` so the public pages can read published journeys, words and recipes
- `ADMIN_EMAIL`, `ADMIN_PASSWORD` and `ADMIN_SESSION_SECRET` for the curator desk
- `SITE_URL` as the production address, such as `https://your-project.vercel.app`, when you want canonical links and a sitemap

Run `scripts/desk-schema.sql` once in the Supabase SQL editor before the first publish. It creates the desk tables and the `archive-desk` and `archive-desk-pending` storage buckets. Published photographs are public. Photographs waiting for review stay in the private bucket.

Leave `VITE_ARCHIVE_API_URL` empty. The pages then call `/api` on the same Vercel address. The curator desk is `/admin`.

## Contributions and privacy

Family journey requests, recipe submissions and published curator changes are stored in Supabase. Contact details remain in the private review tables. Older contribution, photograph and recording intake can use the same Supabase project when those environment flags are enabled. See `docs/CURATOR-GUIDE.md` and `docs/STORAGE-PLAN.md` for the earlier intake. Nothing from the review queue is published until the curator approves it.

## Editing content

- `content/dictionary.json`: supplied dictionary. Keep source spellings and distinct record IDs unless a documented speaker correction is approved.
- `content/hindi-glosses.json`: separate editorial Hindi meanings.
- `content/recipes.json`: recipe readings, cook credits, exact cookbook page links and photograph crops.
- `content/oral-histories.json`: public-cleared interviews only; currently empty. See `docs/ORAL-HISTORIES.md` for fields and consent requirements.
- `src/`: page components and styling.
- `public/documents/` and `public/assets/scans/`: local source access copies.

The fictional transcripts, demonstration dossiers and stand-in imagery have been retired from public pages. Real recording prompts and hero contribution placeholders remain. Speaker spelling checks and real oral histories still require community participation.

## Preservation and sharing

Original research and preservation masters remain locally in `archive/`; `archive/index.html` opens the offline catalogue. There are 34 registered original downloads and four identical PDF access copies. `deliverables/raah-preservation-backup.zip` is the separate preservation package. External video/article leads are inventoried, not claimed as fully backed up.

The colleague source package excludes `.env*`, login credentials, deployment caches, private submissions and debug logs. It contains the website source and public assets, not the full preservation archive. Share access through the Vercel and Supabase projects; do not share account passwords or private server keys.

The archive is intended for community use and potential museum deposit. It does not claim Partition Museum affiliation or endorsement.

## Private intake function

The Edge Function source uses the Supabase secret `ARCHIVE_INGEST_TOKEN_DIGEST`, set to the SHA-256 hex digest of the server-side Vercel ingest key. Configure the secret before deploying the Edge Function. The public website builds independently of this secret.
