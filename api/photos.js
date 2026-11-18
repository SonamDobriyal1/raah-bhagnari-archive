import {acceptsOrigin,withCors,preflight} from '../server/site-origin.js';
import {relayConfigured,relayContribution} from '../server/private-ingest.js';
import {Buffer} from 'node:buffer';
import {randomUUID} from 'node:crypto';
const MAX_BYTES=3_000_000;
const TYPES={'image/jpeg':'jpg','image/png':'png','image/webp':'webp'};
export function validPhoto(bytes,type){
 const b=Buffer.from(bytes);if(b.length<12)return false;
 if(type==='image/jpeg')return b[0]===255&&b[1]===216&&b[2]===255;
 if(type==='image/png')return b.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
 if(type==='image/webp')return b.toString('ascii',0,4)==='RIFF'&&b.toString('ascii',8,12)==='WEBP';
 return false;
}
export function validatePhotoMetadata(value){
 if(!value||typeof value!=='object'||Array.isArray(value))return {error:'The photograph details could not be read.'};
 if(value.photoConsent!==true||value.consent!==true)return {error:'Please confirm the you have permission to offer this photograph for private archive review.'};
 const fields={};const limits={title:200,record:40,photographer:120,location:1000,photographedOn:10,name:120,contact:200,message:4000};
 for(const [key,max]of Object.entries(limits)){if(value[key]!=null&&typeof value[key]!=='string')return {error:'Please use text for '+key+'.'};fields[key]=(value[key]||'').trim();if(fields[key].length>max)return {error:'Please shorten '+key+'.'}}
 if(!fields.title)return {error:'Please name the photograph.'};
 if(fields.record&&!/^RAAH-\d{4}$/.test(fields.record))return {error:'The word record ID is not recognised.'};
 if(fields.photographedOn&&!/^\d{4}-\d{2}-\d{2}$/.test(fields.photographedOn))return {error:'Please choose a valid photograph date.'};
 if(!['Keep me anonymous','Name me as entered','Use my family name only'].includes(value.credit))return {error:'Please choose a credit preference.'};
 if(!['Ask me before any publication','Private research only','Public after review'].includes(value.access))return {error:'Please choose how the photograph may be used.'};
 return {value:{...fields,credit:value.credit,access:value.access,photoConsent:true,consent:true}};
}
function configured(env){return env.ARCHIVE_PHOTOS_ENABLED==='true'&&(!!(env.SUPABASE_URL&&env.SUPABASE_SERVICE_ROLE_KEY)||relayConfigured(env))}
function result(status,data){return Response.json(data,{status,headers:{'Cache-Control':'no-store'}})}
export async function GET(request){return withCors(result(200,{enabled:configured(process.env),maxBytes:MAX_BYTES,acceptedTypes:Object.keys(TYPES)}),request)}
export async function handlePhoto(request,{env=process.env,fetcher=fetch}={}){
 if(!configured(env))return result(503,{error:'Private uploads are not connected yet. Your photograph stays on this device.'});
 const host=request.headers.get('x-forwarded-host')||request.headers.get('host')||new URL(request.url).host;
 if(!acceptsOrigin(request.headers.get('origin'),host,env))return result(403,{error:'Please use the archive photograph form.'});
 if(Number(request.headers.get('content-length')||0)>MAX_BYTES+50_000)return result(413,{error:'Please keep the photo under 3 MB. Try a smaller photograph.'});
 if(!request.headers.get('content-type')?.startsWith('multipart/form-data'))return result(415,{error:'Please use the photograph form to choose a photo.'});
 let form;try{form=await request.formData()}catch{return result(400,{error:'The upload could not be read. Keep a local copy and try again.'})}
 if(form.get('website')||Number(form.get('elapsed'))<1500||!Number.isFinite(Number(form.get('elapsed'))))return result(400,{error:'Please check the photograph before sending it.'});
 let details;try{details=JSON.parse(form.get('metadata'))}catch{return result(400,{error:'The photograph details could not be read.'})}
 const checked=validatePhotoMetadata(details);if(checked.error)return result(400,{error:checked.error});
 const file=form.get('photo');if(!file||typeof file.arrayBuffer!=='function')return result(400,{error:'Please choose a photo first.'});
 const type=file.type.split(';')[0].toLowerCase();if(!TYPES[type])return result(415,{error:'Please use a JPEG, PNG or WebP photograph.'});
 if(!file.size||file.size>MAX_BYTES)return result(413,{error:'Please keep the photo under 3 MB. Try a smaller photograph.'});
 const bytes=Buffer.from(await file.arrayBuffer());if(!validPhoto(bytes,type))return result(415,{error:'This file does not match its image format. Please export it again or choose another photograph.'});
 if(relayConfigured(env)){try{return await relayContribution(new Request(request.url,{method:'POST',headers:Object.fromEntries([...request.headers].filter(([key])=>!['content-type','content-length'].includes(key))),body:form}),'photo',{env,fetcher})}catch{return result(502,{error:'The archive could not receive this photograph. Keep your local copy and try again later.'})}}
 const reference='RAAH-C-'+randomUUID();const bucket=env.SUPABASE_PHOTO_BUCKET||'archive-photos';const storagePath=reference+'/photo.'+TYPES[type];
 const base=new URL(env.SUPABASE_URL);if(base.protocol!=='https:')return result(503,{error:'Archive storage needs configuration. Your photograph is still here.'});
 const headers={apikey:env.SUPABASE_SERVICE_ROLE_KEY,Authorization:'Bearer '+env.SUPABASE_SERVICE_ROLE_KEY};
 const storageUrl=new URL('/storage/v1/object/'+encodeURIComponent(bucket)+'/'+storagePath,base);let uploaded=false;
 try{
  const sent=await fetcher(storageUrl,{method:'POST',headers:{...headers,'Content-Type':type,'x-upsert':'false'},body:bytes,signal:AbortSignal.timeout(20000)});if(!sent.ok)throw new Error();uploaded=true;
  const m=checked.value;const row={reference,type:'photograph',title:m.title,message:m.message||'Photograph: '+m.title,source:'Direct photograph contribution',name:m.name,contact:m.contact,record:m.record,credit:m.credit,access:m.access,consent:true,consent_version:'2026-11-04-photograph',status:'pending',photographer_credit:m.photographer,photograph_location:m.location,photographed_on:m.photographedOn||null,photo_consent:true,storage_bucket:bucket,storage_path:storagePath,photo_mime:type,photo_bytes:bytes.length};
  const saved=await fetcher(new URL('/rest/v1/contributions',base),{method:'POST',headers:{...headers,'Content-Type':'application/json',Prefer:'return=minimal'},body:JSON.stringify(row),signal:AbortSignal.timeout(10000)});if(!saved.ok)throw new Error();
  return result(201,{reference,status:'pending',message:'Received for private curator review. Nothing has been published.'});
 }catch{
  if(uploaded){try{await fetcher(new URL('/storage/v1/object/'+encodeURIComponent(bucket),base),{method:'DELETE',headers:{...headers,'Content-Type':'application/json'},body:JSON.stringify({prefixes:[storagePath]}),signal:AbortSignal.timeout(5000)})}catch{}}
  return result(502,{error:'The archive could not receive this photograph. Keep your local copy and try again later.'});
 }
}
export async function POST(request){return withCors(await handlePhoto(request),request)}
export const OPTIONS=preflight;
