function originOf(value){
 const text=String(value||'').trim();
 if(!text)return '';
 try{return new URL(text).origin}catch{return ''}
}

// A request from the site the visitor is actually using is allowed.
// Vercel also publishes a deployment hostname that can differ from that address.
export function allowedOrigins(env=process.env){
 const values=[
  env.ARCHIVE_SITE_URL,
  env.SITE_URL,
  env.VERCEL_URL&&`https://${env.VERCEL_URL}`,
  env.VERCEL_PROJECT_PRODUCTION_URL&&`https://${env.VERCEL_PROJECT_PRODUCTION_URL}`,
  ...(String(env.ARCHIVE_ALLOWED_ORIGINS||'').split(','))
 ];
 return [...new Set(values.map(originOf).filter(Boolean))];
}
export function acceptsOrigin(origin,host,env=process.env){
 try{
  const url=new URL(origin);
  const requestHost=String(host||'').split(',')[0].trim();
  if(requestHost&&url.host===requestHost)return true;
  return allowedOrigins(env).includes(url.origin);
 }catch{return false}
}
export function corsHeaders(origin,env=process.env){
 if(!origin||!allowedOrigins(env).includes(origin))return {};
 return {'Access-Control-Allow-Origin':origin,'Access-Control-Allow-Methods':'GET, POST, OPTIONS','Access-Control-Allow-Headers':'Content-Type','Vary':'Origin'};
}
export function withCors(response,request,env=process.env){
 const headers=new Headers(response.headers);for(const [key,value]of Object.entries(corsHeaders(request?.headers.get('origin'),env)))headers.set(key,value);
 return new Response(response.body,{status:response.status,headers});
}
export function preflight(request){return withCors(new Response(null,{status:204}),request)}
