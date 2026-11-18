import {handlePhoto} from '../../../api/photos.js';
import {handleRecording} from '../../../api/recordings.js';
import {validateContribution} from '../../../api/contributions.js';
const TOKEN_DIGEST=Deno.env.get('ARCHIVE_INGEST_TOKEN_DIGEST');
const env={...Deno.env.toObject(),ARCHIVE_PHOTOS_ENABLED:'true',ARCHIVE_RECORDINGS_ENABLED:'true'};
Deno.serve(async(request:Request)=>{
 const token=request.headers.get('authorization')?.replace(/^Bearer /,'')||'';
 const digest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(token)))).map(b=>b.toString(16).padStart(2,'0')).join('');
 if(digest!==TOKEN_DIGEST)return Response.json({error:'Unauthorized'},{status:401});
 const verifiedHeaders=new Headers(request.headers);verifiedHeaders.set('origin',request.headers.get('x-archive-origin')||'');verifiedHeaders.set('x-forwarded-host',request.headers.get('x-archive-host')||'');request=new Request(request,{headers:verifiedHeaders});
 if(request.method!=='POST')return new Response(null,{status:405});
 const kind=new URL(request.url).searchParams.get('kind');
 if(kind==='published_photos'){
  const headers={apikey:env.SUPABASE_SERVICE_ROLE_KEY,Authorization:'Bearer '+env.SUPABASE_SERVICE_ROLE_KEY};
  const query=new URL(env.SUPABASE_URL+'/rest/v1/contributions');
  query.search=new URLSearchParams({select:'reference,title,message,photographer_credit,photograph_location,photographed_on,storage_bucket,storage_path,credit',type:'eq.photograph',status:'eq.approved',access:'eq.Public after review',photo_consent:'eq.true',storage_bucket:'eq.archive-photos',order:'created_at.desc',limit:'48'}).toString();
  const response=await fetch(query,{headers});if(!response.ok)return Response.json({error:'Album unavailable'},{status:503});
  const photos=[];for(const row of await response.json()){
   if(!row.storage_path?.startsWith(row.reference+'/'))continue;
   const signed=await fetch(env.SUPABASE_URL+'/storage/v1/object/sign/archive-photos/'+row.storage_path,{method:'POST',headers:{...headers,'Content-Type':'application/json'},body:JSON.stringify({expiresIn:3600})});
   if(!signed.ok)continue;const data=await signed.json();if(!data.signedURL)continue;
   photos.push({reference:row.reference,title:row.title,caption:row.message,credit:row.credit==='Keep me anonymous'?'':row.credit==='Use my family name only'?'Family contribution':row.photographer_credit,location:row.photograph_location,date:row.photographed_on,imageUrl:env.SUPABASE_URL+'/storage/v1'+data.signedURL});
  }
  return Response.json({photos});
 }
 if(kind==='photo')return handlePhoto(request,{env});
 if(kind==='recording')return handleRecording(request,{env});
 if(kind!=='text')return Response.json({error:'Unknown contribution type'},{status:400});
 if(Number(request.headers.get('content-length')||0)>65536)return Response.json({error:'Contribution too long'},{status:413});
 let input;try{input=await request.json()}catch{return Response.json({error:'Invalid contribution'},{status:400})}
 if(input.website||typeof input.elapsed!=='number'||input.elapsed<1500)return Response.json({error:'Please check your contribution before sending.'},{status:400});
 const checked=validateContribution(input);if(checked.error)return Response.json({error:checked.error},{status:400});
 const reference='RAAH-C-'+crypto.randomUUID();
 const saved=await fetch(env.SUPABASE_URL+'/rest/v1/contributions',{method:'POST',headers:{'apikey':env.SUPABASE_SERVICE_ROLE_KEY,'Authorization':'Bearer '+env.SUPABASE_SERVICE_ROLE_KEY,'Content-Type':'application/json','Prefer':'return=minimal'},body:JSON.stringify({...checked.value,reference,status:'pending',consent_version:'2026-11-03'})});
 return saved.ok?Response.json({reference,status:'pending'},{status:201}):Response.json({error:'The archive could not receive the contribution. Please keep your draft.'},{status:502});
});
