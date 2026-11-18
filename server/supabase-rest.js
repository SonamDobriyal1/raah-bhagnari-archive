function fail(status,message){const error=new Error(message);error.status=status;return error}

export function supabaseConfigured(){
  return Boolean((process.env.SUPABASE_URL||'').trim()&&(process.env.SUPABASE_SERVICE_ROLE_KEY||'').trim());
}

export async function supabaseRest(table,{method='GET',query='',body,prefer}={}){
  const root=(process.env.SUPABASE_URL||'').trim().replace(/\/$/,'');
  let url;
  try{url=new URL(`/rest/v1/${table}${query?`?${query}`:''}`,root)}
  catch{throw fail(503,'Supabase is not configured yet. Add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY on the server.')}
  if(url.protocol!=='https:')throw fail(503,'Supabase is not configured yet. Add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY on the server.');
  const headers={apikey:process.env.SUPABASE_SERVICE_ROLE_KEY,Authorization:`Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,'Content-Type':'application/json'};
  if(prefer)headers.Prefer=prefer;
  const response=await fetch(url,{method,headers,body:body===undefined?undefined:JSON.stringify(body),signal:AbortSignal.timeout(15000)});
  if(!response.ok){
    const detail=await response.text().catch(()=>'');
    console.error('Supabase',method,table,response.status,detail.slice(0,300));
    throw fail(502,'The archive database could not save that change.');
  }
  if(method==='GET')return response.json();
  return null;
}
