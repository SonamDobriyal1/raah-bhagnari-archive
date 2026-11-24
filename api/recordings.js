import {acceptsOrigin,withCors,preflight} from '../server/site-origin.js';
import {relayConfigured,relayContribution} from '../server/private-ingest.js';
import {Buffer} from 'node:buffer';
import {randomUUID} from 'node:crypto';
const MAX_BYTES=3_000_000;
const TYPES={'audio/webm':'webm','audio/mp4':'m4a','audio/x-m4a':'m4a','audio/m4a':'m4a','audio/ogg':'ogg','audio/wav':'wav','audio/x-wav':'wav','audio/mpeg':'mp3','audio/mp3':'mp3','video/mp4':'m4a'};
export function validAudio(bytes,type){
 const b=Buffer.from(bytes);if(b.length<12)return false;
 if(type==='audio/webm')return b.subarray(0,4).equals(Buffer.from([0x1a,0x45,0xdf,0xa3]));
 if(type==='audio/mp4')return b.toString('ascii',4,8)==='ftyp';
 if(type==='audio/ogg')return b.toString('ascii',0,4)==='OggS';
 if(type==='audio/wav'||type==='audio/x-wav')return b.toString('ascii',0,4)==='RIFF'&&b.toString('ascii',8,12)==='WAVE';
 if(type==='audio/mpeg')return b.toString('ascii',0,3)==='ID3'||(b[0]===255&&(b[1]&224)===224);
 return false;
}
export function validateRecordingMetadata(value){
 if(!value||typeof value!=='object'||Array.isArray(value))return {error:'The recording details could not be read.'};
 if(value.recordingConsent!==true||value.consent!==true)return {error:'Please confirm the speaker agrees to recording and private archive review.'};
 const fields={};const limits={title:200,record:40,speaker:120,variant:1000,recordedOn:10,name:120,contact:200,message:4000};
 for(const [key,max]of Object.entries(limits)){if(value[key]!=null&&typeof value[key]!=='string')return {error:'Please use text for '+key+'.'};fields[key]=(value[key]||'').trim();if(fields[key].length>max)return {error:'Please shorten '+key+'.'}}
 if(!fields.title)return {error:'Please name the word or recording.'};
 if(fields.record&&!/^RAAH-\d{4}$/.test(fields.record))return {error:'The word record ID is not recognised.'};
 if(fields.recordedOn&&!/^\d{4}-\d{2}-\d{2}$/.test(fields.recordedOn))return {error:'Please choose a valid recording date.'};
 if(!['Keep me anonymous','Name me as entered','Use my family name only'].includes(value.credit))return {error:'Please choose a credit preference.'};
 if(!['Ask me before any publication','Private research only','Public after review'].includes(value.access))return {error:'Please choose how the recording may be used.'};
 const kind=value.kind==='memory'?'memory':'voice';
 return {value:{...fields,kind,credit:value.credit,access:value.access,recordingConsent:true,consent:true}};
}
function configured(env){if(env.ARCHIVE_RECORDINGS_ENABLED==='false')return false;return !!(env.SUPABASE_URL&&env.SUPABASE_SERVICE_ROLE_KEY)||relayConfigured(env)}
function result(status,data){return Response.json(data,{status,headers:{'Cache-Control':'no-store'}})}
export async function GET(request){return withCors(result(200,{enabled:configured(process.env),maxBytes:MAX_BYTES,maxSeconds:120}),request)}
export async function handleRecording(request,{env=process.env,fetcher=fetch}={}){
 if(!configured(env))return result(503,{error:'Private uploads are not connected yet. Your recording stays on this device.'});
 const host=request.headers.get('x-forwarded-host')||request.headers.get('host')||new URL(request.url).host;
 if(!acceptsOrigin(request.headers.get('origin'),host,env))return result(403,{error:'Please use the archive recording form.'});
 if(Number(request.headers.get('content-length')||0)>MAX_BYTES+50_000)return result(413,{error:'Please keep the audio under 3 MB. Try a shorter recording.'});
 if(!request.headers.get('content-type')?.startsWith('multipart/form-data'))return result(415,{error:'Please use the recording form to choose an audio file.'});
 let form;try{form=await request.formData()}catch{return result(400,{error:'The upload could not be read. Keep a local copy and try again.'})}
 if(form.get('website')||Number(form.get('elapsed'))<400||!Number.isFinite(Number(form.get('elapsed'))))return result(400,{error:'Please check the recording before sending it.'});
 let details;try{details=JSON.parse(form.get('metadata'))}catch{return result(400,{error:'The recording details could not be read.'})}
 const checked=validateRecordingMetadata(details);if(checked.error)return result(400,{error:checked.error});
 const file=form.get('audio');if(!file||typeof file.arrayBuffer!=='function')return result(400,{error:'Please record or choose an audio file first.'});
 const declared=String(file.type||'').split(';')[0].toLowerCase();
 if(!file.size||file.size>MAX_BYTES)return result(413,{error:'Please keep the audio under 3 MB. Try a shorter recording.'});
 const bytes=Buffer.from(await file.arrayBuffer());
 const sniffed=Object.keys(TYPES).find(name=>validAudio(bytes,name));
 const type=TYPES[declared]&&validAudio(bytes,declared)?declared:sniffed;
 if(!type||!validAudio(bytes,type))return result(415,{error:'Please use WebM, M4A/MP4, Ogg, WAV or MP3 audio.'});
 if(relayConfigured(env)){try{return await relayContribution(new Request(request.url,{method:'POST',headers:Object.fromEntries([...request.headers].filter(([key])=>!['content-type','content-length'].includes(key))),body:form}),'recording',{env,fetcher})}catch{return result(502,{error:'The archive could not receive this recording. Keep your local copy and try again later.'})}}
 const reference='RAAH-C-'+randomUUID();const bucket=env.SUPABASE_PRIVATE_BUCKET||'archive-recordings';const storagePath=reference+'/recording.'+TYPES[type];
 const base=new URL(env.SUPABASE_URL);if(base.protocol!=='https:')return result(503,{error:'Archive storage needs configuration. Your recording is still here.'});
 const headers={apikey:env.SUPABASE_SERVICE_ROLE_KEY,Authorization:'Bearer '+env.SUPABASE_SERVICE_ROLE_KEY};
 const storageUrl=new URL('/storage/v1/object/'+encodeURIComponent(bucket)+'/'+storagePath,base);let uploaded=false;
 try{
  const sent=await fetcher(storageUrl,{method:'POST',headers:{...headers,'Content-Type':type,'x-upsert':'false'},body:bytes,signal:AbortSignal.timeout(20000)});if(!sent.ok)throw new Error();uploaded=true;
  const m=checked.value;const row={reference,type:m.kind,title:m.title,message:m.message||(m.kind==='memory'?m.title:'Pronunciation recording: '+m.title),source:m.kind==='memory'?'Direct memory recording':'Direct audio contribution',name:m.name,contact:m.contact,record:m.record,credit:m.credit,access:m.access,consent:true,consent_version:'2026-11-04-recording',status:'pending',speaker_credit:m.speaker,pronunciation_variant:m.variant,recorded_on:m.recordedOn||null,recording_consent:true,storage_bucket:bucket,storage_path:storagePath,audio_mime:type,audio_bytes:bytes.length};
  const saved=await fetcher(new URL('/rest/v1/contributions',base),{method:'POST',headers:{...headers,'Content-Type':'application/json',Prefer:'return=minimal'},body:JSON.stringify(row),signal:AbortSignal.timeout(10000)});if(!saved.ok)throw new Error();
  return result(201,{reference,status:'pending',message:'Received for private curator review. Nothing has been published.'});
 }catch{
  if(uploaded){try{await fetcher(new URL('/storage/v1/object/'+encodeURIComponent(bucket),base),{method:'DELETE',headers:{...headers,'Content-Type':'application/json'},body:JSON.stringify({prefixes:[storagePath]}),signal:AbortSignal.timeout(5000)})}catch{}}
  return result(502,{error:'The archive could not receive this recording. Keep your local copy and try again later.'});
 }
}
export async function POST(request){return withCors(await handleRecording(request),request)}
export const OPTIONS=preflight;
