import {supabaseConfigured,supabaseRest} from './supabase-rest.js';

const columns='reference,created_at,reviewed_at,type,title,message,source,name,contact,record,credit,access,status,storage_bucket,storage_path';

function fail(status,message){const error=new Error(message);error.status=status;return error}

function previewOf(row){
  const preview=row.storage_bucket==='archive-photos'&&row.storage_path?'photo':row.storage_bucket==='archive-recordings'&&row.storage_path?'audio':'';
  const {storage_bucket,storage_path,...rest}=row;
  return {...rest,preview};
}

export async function registerContributions(){
  if(!supabaseConfigured())return [];
  try{
    const rows=await supabaseRest('contributions',{query:`select=${columns}&status=in.(pending,in_review,declined)&order=created_at.desc&limit=300`});
    return Array.isArray(rows)?rows.map(previewOf):[];
  }catch(error){
    console.error('Register queue',error.message);
    return [];
  }
}

export async function contributionRecord(reference){
  if(!supabaseConfigured())throw fail(503,'Supabase is not configured yet. Add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY on the server.');
  if(!/^RAAH-C-[0-9a-f-]{36}$/i.test(reference||''))throw fail(400,'That register entry could not be found.');
  const rows=await supabaseRest('contributions',{query:`select=reference,type,title,message,name,credit,access,record,status,storage_bucket,storage_path&reference=eq.${encodeURIComponent(reference)}&limit=1`});
  return Array.isArray(rows)?rows[0]:null;
}

export async function reviewContribution(reference,status){
  if(!supabaseConfigured())throw fail(503,'Supabase is not configured yet. Add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY on the server.');
  if(!/^RAAH-C-[0-9a-f-]{36}$/i.test(reference||''))throw fail(400,'That register entry could not be found.');
  if(!['in_review','declined','approved'].includes(status))throw fail(400,'Choose whether to mark the entry as read or reject it.');
  await supabaseRest('contributions',{method:'PATCH',query:`reference=eq.${encodeURIComponent(reference)}`,body:{status,reviewed_at:new Date().toISOString()},prefer:'return=minimal'});
}
