import {acceptsOrigin,corsHeaders} from '../server/site-origin.js';
import {relayConfigured,relayContribution} from '../server/private-ingest.js';
import {randomUUID} from 'node:crypto';

export function validateContribution(input) {
  if(!input||typeof input!=='object'||Array.isArray(input))return {error:'Please send a contribution form.'};
  const types=['memory','word','translation','recipe','photograph','voice'];
  const credit=['Name me as entered','Use my family name only','Keep me anonymous'];
  const access=['Public after review','Ask me before any publication','Private research only'];
  if(!types.includes(input.type))return {error:'Please choose a contribution type.'};
  if(input.consent!==true)return {error:'Please confirm you have permission to offer this material.'};
  if(!credit.includes(input.credit)||!access.includes(input.access))return {error:'Please choose how your material can be credited and used.'};
  const limits={title:200,message:12000,source:2000,name:120,contact:200,record:40};
  const fields={};
  for(const [key,max] of Object.entries(limits)){
    if(input[key]!=null&&typeof input[key]!=='string')return {error:'Please use text for '+key+'.'};
    const text=(input[key]||'').trim();
    if(text.length>max)return {error:`Please shorten ${key} to ${max} characters.`};
    fields[key]=text;
  }
  if(!fields.title||!fields.message)return {error:'Please add a title and tell us about your contribution.'};
  return {value:{...fields,type:input.type,credit:input.credit,access:input.access,consent:true}};
}

export default async function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  for(const [key,value]of Object.entries(corsHeaders(req.headers.origin)))res.setHeader(key,value);
  if(req.method==='OPTIONS')return res.status(204).end();
  const enabled=process.env.ARCHIVE_SUBMISSIONS_ENABLED!=='false' && (Boolean(process.env.SUPABASE_URL&&process.env.SUPABASE_SERVICE_ROLE_KEY)||relayConfigured());
  if(req.method==='GET')return res.status(200).json({enabled});
  if(req.method!=='POST'){res.setHeader('Allow','GET, POST');return res.status(405).json({error:'Method not allowed.'})}
  if(!enabled)return res.status(503).json({error:'Online submissions are not open yet. Please keep or download your draft.'});
  // Browser text submissions must originate on this deployed site.
  const origin=req.headers.origin;
  const forwardedHost=req.headers['x-forwarded-host']||req.headers.host;
  if(!acceptsOrigin(origin,forwardedHost))return res.status(403).json({error:'Please submit using the archive form.'});
  if(!String(req.headers['content-type']||'').includes('application/json'))return res.status(415).json({error:'Please submit using the archive form.'});
  if(Number(req.headers['content-length']||0)>65536)return res.status(413).json({error:'This contribution is too long. Please shorten it and keep a full local copy.'});
  let body;try{body=typeof req.body==='string'?JSON.parse(req.body):req.body}catch{return res.status(400).json({error:'The contribution could not be read.'})}
  if(body?.website||typeof body?.elapsed!=='number'||body.elapsed<1500)return res.status(400).json({error:'Please take a moment to check your contribution before sending.'});
  const {value,error}=validateContribution(body);if(error)return res.status(400).json({error});
  if(relayConfigured()){try{const response=await relayContribution(new Request('https://'+forwardedHost+'/api/contributions',{method:'POST',headers:req.headers,body:JSON.stringify(body)}),'text');return res.status(response.status).json(await response.json())}catch{return res.status(502).json({error:'The archive could not receive the contribution. Please keep your draft.'})}}
  const reference='RAAH-C-'+randomUUID();
  try{
    const url=new URL('/rest/v1/contributions',process.env.SUPABASE_URL);
    if(url.protocol!=='https:')throw new Error('Invalid storage configuration');
    const result=await fetch(url,{method:'POST',signal:AbortSignal.timeout(10000),headers:{apikey:process.env.SUPABASE_SERVICE_ROLE_KEY,Authorization:'Bearer '+process.env.SUPABASE_SERVICE_ROLE_KEY,'Content-Type':'application/json',Prefer:'return=minimal'},body:JSON.stringify({...value,reference,status:'pending',consent_version:'2026-11-03'})});
    if(!result.ok)throw new Error('Storage request failed');
    return res.status(201).json({reference,status:'pending'});
  }catch{return res.status(502).json({error:'The archive could not receive the contribution. Your draft is still here; save it and try again later.'})}
}
