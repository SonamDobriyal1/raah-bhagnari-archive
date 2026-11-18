const PUBLIC_BUCKET='archive-desk';
const PENDING_BUCKET='archive-desk-pending';
const MIME={jpg:'image/jpeg',png:'image/png',webp:'image/webp'};

function fail(status,message){const error=new Error(message);error.status=status;return error}

function projectUrl(){
  let url;
  try{url=new URL((process.env.SUPABASE_URL||'').trim())}
  catch{throw fail(503,'Supabase is not configured yet. Add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY on the server.')}
  if(url.protocol!=='https:'||!(process.env.SUPABASE_SERVICE_ROLE_KEY||'').trim())throw fail(503,'Supabase is not configured yet. Add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY on the server.');
  return url;
}

function headers(extra={}){
  const key=process.env.SUPABASE_SERVICE_ROLE_KEY;
  return {apikey:key,Authorization:`Bearer ${key}`,...extra};
}

async function upload(bucket,objectName,buffer,ext){
  const response=await fetch(new URL(`/storage/v1/object/${bucket}/${objectName}`,projectUrl()),{method:'POST',headers:headers({'Content-Type':MIME[ext]||'application/octet-stream','x-upsert':'false'}),body:buffer,signal:AbortSignal.timeout(20000)});
  if(!response.ok){
    const detail=await response.text().catch(()=>'');
    console.error('Supabase Storage',response.status,detail.slice(0,300));
    throw fail(502,'The photograph could not be stored. Run scripts/desk-schema.sql in Supabase so the archive-desk buckets exist.');
  }
}

export async function storePublicImage(buffer,ext,folder,name){
  const objectName=`${folder}/${name}.${ext}`;
  await upload(PUBLIC_BUCKET,objectName,buffer,ext);
  return `${projectUrl().origin}/storage/v1/object/public/${PUBLIC_BUCKET}/${objectName}`;
}

export async function storePrivateImage(buffer,ext,name){
  const objectName=`${name}.${ext}`;
  await upload(PENDING_BUCKET,objectName,buffer,ext);
  return `pending/${objectName}`;
}

export async function readStoredImage(objectName){
  if(!/^pending\/[\w.-]+$/.test(objectName||''))throw fail(400,'The image could not be used.');
  const response=await fetch(new URL(`/storage/v1/object/${PENDING_BUCKET}/${objectName.slice('pending/'.length)}`,projectUrl()),{headers:headers(),signal:AbortSignal.timeout(20000)});
  if(!response.ok)throw fail(404,'The image could not be used.');
  return Buffer.from(await response.arrayBuffer());
}

export async function deleteStoredImage(objectName){
  const pending=/^pending\/([\w.-]+)$/.exec(objectName||'');
  const published=/^((?:journeys|recipes)\/[\w.-]+)$/.exec(objectName||'');
  const bucket=pending?PENDING_BUCKET:published?PUBLIC_BUCKET:'';
  const path=pending?pending[1]:published?published[1]:'';
  if(!bucket)return;
  const response=await fetch(new URL(`/storage/v1/object/${bucket}`,projectUrl()),{method:'DELETE',headers:headers({'Content-Type':'application/json'}),body:JSON.stringify({prefixes:[path]}),signal:AbortSignal.timeout(15000)});
  if(!response.ok&&response.status!==404)throw fail(502,'The photograph could not be removed.');
}

export function objectNameFromPublicUrl(url){
  const match=/^https:\/\/[a-z0-9-]+\.supabase\.co\/storage\/v1\/object\/public\/archive-desk\/((?:journeys|recipes)\/[\w.-]+)$/.exec(url||'');
  return match?match[1]:'';
}
