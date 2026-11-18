// Firebase serves the archive; the existing private API remains on Vercel.
const base=(import.meta.env?.VITE_ARCHIVE_API_URL||'').replace(/\/$/,'');
export const apiUrl=path=>base+path;
