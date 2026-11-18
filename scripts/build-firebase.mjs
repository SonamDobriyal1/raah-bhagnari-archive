// Public deployment settings only; never load server credentials into Vite.
process.env.SITE_URL='https://raah-bhagnari-archive.web.app';
process.env.VITE_ARCHIVE_API_URL='https://raah-bhagnari-archive.vercel.app';
await import('./build.mjs');
