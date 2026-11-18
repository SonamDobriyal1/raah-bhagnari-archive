import {allowedOrigins,corsHeaders} from './site-origin.js';

export function sameOrigin(req){
  const origin=req.headers?.origin;
  if(!origin)return true;
  try{return new URL(origin).host===String(req.headers['x-forwarded-host']||req.headers.host||'')}
  catch{return false}
}

export function requestAllowed(req){
  if(sameOrigin(req))return true;
  const origin=req.headers?.origin;
  return Boolean(origin&&allowedOrigins().includes(origin));
}

export function writeCors(req,res){
  const origin=req.headers?.origin;
  if(!origin)return;
  const headers=corsHeaders(origin);
  for(const [key,value] of Object.entries(headers))res.setHeader(key,value);
  if(headers['Access-Control-Allow-Origin'])res.setHeader('Access-Control-Allow-Headers','Content-Type, Authorization');
}

export function readJson(req){
  if(req.body==null||req.body==='')return {};
  if(typeof req.body==='object')return req.body;
  try{return JSON.parse(req.body)}catch{return null}
}
