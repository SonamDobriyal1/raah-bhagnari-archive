import {supabaseConfigured,supabaseRest} from './supabase-rest.js';

const columns='reference,created_at,reviewed_at,type,title,message,source,name,contact,record,credit,access,status';

function fail(status,message){const error=new Error(message);error.status=status;return error}

export async function registerContributions(){
  if(!supabaseConfigured())return [];
  try{
    const rows=await supabaseRest('contributions',{query:`select=${columns}&status=in.(pending,in_review,declined)&order=created_at.desc&limit=300`});
    return Array.isArray(rows)?rows:[];
  }catch(error){
    console.error('Register queue',error.message);
    return [];
  }
}

export async function reviewContribution(reference,status){
  if(!supabaseConfigured())throw fail(503,'Supabase is not configured yet. Add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY on the server.');
  if(!/^RAAH-C-[0-9a-f-]{36}$/i.test(reference||''))throw fail(400,'That register entry could not be found.');
  if(!['in_review','declined'].includes(status))throw fail(400,'Choose whether to mark the entry as read or reject it.');
  await supabaseRest('contributions',{method:'PATCH',query:`reference=eq.${encodeURIComponent(reference)}`,body:{status,reviewed_at:new Date().toISOString()},prefer:'return=minimal'});
}
