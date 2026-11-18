import {withCors,preflight} from '../server/site-origin.js';
// Public reads are restricted to the curated, explicitly shareable photo feed.
async function getPhotos(){
 const env=process.env;
 if(!env.SUPABASE_INGEST_URL||!env.ARCHIVE_INGEST_KEY)return Response.json({photos:[]},{headers:{'Cache-Control':'no-store'}});
 try{const url=new URL(env.SUPABASE_INGEST_URL);url.searchParams.set('kind','published_photos');const response=await fetch(url,{method:'POST',headers:{Authorization:'Bearer '+env.ARCHIVE_INGEST_KEY},signal:AbortSignal.timeout(15000)});if(!response.ok)throw new Error();const data=await response.json();return Response.json(data,{headers:{'Cache-Control':'public, max-age=60'}})}catch{return Response.json({error:'The community album could not be loaded.'},{status:503})}
}

export async function GET(request){return withCors(await getPhotos(),request)}
export const OPTIONS=preflight;
