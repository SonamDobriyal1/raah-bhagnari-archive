// Only explicitly configured archive sites may submit through the shared API.
export function allowedOrigins(env=process.env){
 return [...new Set([env.ARCHIVE_SITE_URL,env.VERCEL_URL&&'https://'+env.VERCEL_URL,...(env.ARCHIVE_ALLOWED_ORIGINS||'').split(',')].filter(Boolean).flatMap(value=>{try{return [new URL(value.trim()).origin]}catch{return []}}))];
}
export function acceptsOrigin(origin,host,env=process.env){
 try{const url=new URL(origin),known=allowedOrigins(env);return known.length?known.includes(url.origin):url.host===host}catch{return false}
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
