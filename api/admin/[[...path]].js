import {acceptLogin,adminConfigError,clearCookie,sessionCookie,sessionFrom} from '../../server/admin-auth.js';
import {readJson,requestAllowed,sameOrigin,writeCors} from '../../server/same-origin.js';
import * as store from '../../server/content-store.js';

export const config={api:{bodyParser:{sizeLimit:'2mb'}}};

function routeOf(req){
  const path=String(req.url||'/').split('?')[0];
  const stripped=path.replace(/^\/api\/admin/,'')||'/';
  return stripped.length>1?stripped.replace(/\/$/,''):stripped;
}

export default async function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  writeCors(req,res);
  if(req.method==='OPTIONS')return res.status(204).json({});
  if(!requestAllowed(req))return res.status(403).json({error:'Please use the curator desk on this site.'});
  const route=routeOf(req);
  if(req.method==='GET'&&route==='/session'){
    const session=sessionFrom(req);
    const configError=adminConfigError();
    return res.status(200).json({authenticated:Boolean(session),configured:!configError,...(session?{email:session.email}:{}),...(configError?{configError}:{})});
  }
  if(req.method==='POST'&&route==='/login'){
    const body=readJson(req);
    if(!body)return res.status(400).json({error:'The sign-in form could not be read.'});
    const result=acceptLogin(req,body.email,body.password);
    if(result.token)res.setHeader('Set-Cookie',sessionCookie(result.token,req));
    const token=result.token&&req.headers?.origin&&!sameOrigin(req)?result.token:undefined;
    return res.status(result.status).json(result.token?{authenticated:true,...(token?{token}:{})}:{error:result.error});
  }
  if(req.method==='POST'&&route==='/logout'){
    res.setHeader('Set-Cookie',clearCookie());
    return res.status(200).json({authenticated:false});
  }
  if(!sessionFrom(req))return res.status(401).json({error:'Please sign in to the curator desk.'});
  try{
    if(req.method==='GET'&&route==='/desk')return res.status(200).json(await store.readDesk());
    if(req.method!=='POST')return res.status(405).json({error:'That action is not available.'});
    const body=readJson(req);
    if(!body)return res.status(400).json({error:'The form could not be read.'});
    const actions={
      '/journeys':()=>store.addJourney(body),
      '/journeys/delete':()=>store.deleteJourney(body.id),
      '/words':()=>store.addWord(body),
      '/words/remove':()=>store.removeWord(body.id),
      '/words/restore':()=>store.restoreWord(body.id),
      '/recipes':()=>store.addRecipe(body),
      '/recipes/delete':()=>store.deleteRecipe(body.id),
      '/journey-requests/publish':()=>store.publishJourneyRequest(body.id,body),
      '/journey-requests/dismiss':()=>store.dismissJourneyRequest(body.id),
      '/recipe-submissions/approve':()=>store.approveRecipeSubmission(body.id),
      '/recipe-submissions/reject':()=>store.rejectRecipeSubmission(body.id),
      '/contributions/review':()=>store.reviewRegisterEntry(body.reference,body.status)
    };
    const action=actions[route];
    if(!action)return res.status(404).json({error:'That curator action does not exist.'});
    return res.status(200).json(await action());
  }catch(error){
    return res.status(error.status||500).json({error:error.status?error.message:'The archive could not save that change.'});
  }
}
