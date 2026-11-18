// Server-only relay. The ingest key can submit, never list or read contributions.
import {allowedOrigins} from './site-origin.js';
export function relayConfigured(env=process.env){return Boolean(env.SUPABASE_INGEST_URL&&env.ARCHIVE_INGEST_KEY)}
export async function relayContribution(request,kind,{env=process.env,fetcher=fetch}={}){
 const target=new URL(env.SUPABASE_INGEST_URL);if(target.protocol!=='https:')throw new Error('Invalid ingest configuration');
 target.searchParams.set('kind',kind);
 const incoming=request.headers.get('origin')||'';
 const requestHost=new URL(request.url).host;
 // The private ingest endpoint trusts the existing API host. Only explicitly
 // approved additional archive origins may be relayed under that host.
 let origin=incoming,host=requestHost;
 if(incoming&&new URL(incoming).host!==requestHost){
  if(!allowedOrigins(env).includes(incoming)||!env.ARCHIVE_SITE_URL)throw new Error('Untrusted archive origin');
  const canonical=new URL(env.ARCHIVE_SITE_URL);origin=canonical.origin;host=canonical.host;
 }
 const response=await fetcher(target,{method:'POST',headers:{'Authorization':'Bearer '+env.ARCHIVE_INGEST_KEY,'Content-Type':request.headers.get('content-type')||'application/json','Origin':origin,'X-Archive-Origin':origin,'X-Archive-Host':host,'X-Forwarded-Host':host},body:await request.arrayBuffer(),signal:AbortSignal.timeout(40000)});
 return new Response(await response.arrayBuffer(),{status:response.status,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});
}
