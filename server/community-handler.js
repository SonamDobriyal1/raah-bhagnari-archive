import {addJourneyRequest,addRecipeSubmission,addRegisterRecipe} from './content-store.js';
import {readJson,requestAllowed,writeCors} from './same-origin.js';

export const config={api:{bodyParser:{sizeLimit:'2mb'}}};

function routeOf(req){
  const raw=String(req.url||'/');
  const hinted=new URLSearchParams(raw.split('?')[1]||'').get('route')||(typeof req.query?.route==='string'?req.query.route:'');
  const path=hinted?`/${hinted.replace(/^\/+/,'')}`:raw.split('?')[0].replace(/^\/api\/community/,'')||'/';
  return path.length>1?path.replace(/\/$/,''):path;
}

export default async function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  writeCors(req,res);
  if(req.method==='OPTIONS')return res.status(204).json({});
  if(req.method!=='POST')return res.status(405).json({error:'Please use the form on this page.'});
  if(!requestAllowed(req))return res.status(403).json({error:'Please use the form on this site.'});
  if(!String(req.headers['content-type']||'').includes('application/json'))return res.status(415).json({error:'Please use the form on this page.'});
  const body=readJson(req);
  if(!body)return res.status(400).json({error:'The form could not be read.'});
  try{
    const route=routeOf(req);
    if(route==='/journey-request')return res.status(201).json(await addJourneyRequest(body));
    if(route==='/recipe')return res.status(201).json(await addRecipeSubmission(body));
    if(route==='/register-recipe')return res.status(201).json(await addRegisterRecipe(body));
    return res.status(404).json({error:'That form is not available.'});
  }catch(error){
    return res.status(error.status||500).json({error:error.status?error.message:'The archive could not receive this. Please keep a copy and try again.'});
  }
}
