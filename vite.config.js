import {defineConfig,loadEnv} from 'vite';
import {Readable} from 'node:stream';

const envKeys=['ARCHIVE_PHOTOS_ENABLED','ARCHIVE_SUBMISSIONS_ENABLED','SUPABASE_INGEST_URL','ARCHIVE_INGEST_KEY','ARCHIVE_RECORDINGS_ENABLED','SUPABASE_URL','SUPABASE_SERVICE_ROLE_KEY','SUPABASE_PRIVATE_BUCKET','ARCHIVE_SITE_URL','ARCHIVE_ALLOWED_ORIGINS','ADMIN_EMAIL','ADMIN_PASSWORD','ADMIN_SESSION_SECRET'];

function copyEnv(env){
  for(const key of envKeys)if(env[key]&&!process.env[key])process.env[key]=env[key];
}

function jsonEndpoint(server,route,modulePath){
  server.middlewares.use(route,async(req,res)=>{
    try{
      const handler=await server.ssrLoadModule(modulePath);
      const chunks=[];
      for await(const chunk of req)chunks.push(chunk);
      const body=Buffer.concat(chunks);
      if(body.length>2000000){res.statusCode=413;res.setHeader('Content-Type','application/json');res.end(JSON.stringify({error:'This upload is too large. Please use an image under 1.2 MB.'}));return}
      req.body=body.toString();
      res.status=code=>{res.statusCode=code;return res};
      res.json=value=>{res.setHeader('Content-Type','application/json');res.end(JSON.stringify(value));return res};
      await handler.default(req,res);
    }catch(error){
      console.error(error);
      if(!res.headersSent){res.statusCode=500;res.setHeader('Content-Type','application/json');res.end(JSON.stringify({error:'The archive service could not respond.'}))}
    }
  });
}

function attach(server){
  server.middlewares.use('/api/photographs',async(req,res)=>{try{const handler=await server.ssrLoadModule('/api/photographs.js');const response=await handler.GET();res.statusCode=response.status;response.headers.forEach((v,k)=>res.setHeader(k,v));res.end(Buffer.from(await response.arrayBuffer()))}catch{res.statusCode=503;res.end('{}')}});
  server.middlewares.use('/api/contributions',async(req,res)=>{try{const handler=await server.ssrLoadModule('/api/contributions.js');const chunks=[];for await(const c of req)chunks.push(c);req.body=Buffer.concat(chunks).toString();res.status=code=>{res.statusCode=code;return res};res.json=value=>{res.setHeader('Content-Type','application/json');res.end(JSON.stringify(value));return res};await handler.default(req,res)}catch{res.statusCode=500;res.end('{}')}});
  server.middlewares.use('/api/recordings',async(req,res)=>{try{
    const handler=await server.ssrLoadModule('/api/recordings.js');
    const request=new Request('http://'+req.headers.host+'/api/recordings',{method:req.method,headers:req.headers,...(req.method==='POST'?{body:Readable.toWeb(req),duplex:'half'}:{})});
    const response=req.method==='GET'?await handler.GET():req.method==='POST'?await handler.POST(request):new Response('Method not allowed',{status:405});
    res.statusCode=response.status;response.headers.forEach((v,k)=>res.setHeader(k,v));res.end(Buffer.from(await response.arrayBuffer()));
  }catch{res.statusCode=500;res.setHeader('Content-Type','application/json');res.end(JSON.stringify({error:'The local recording service could not respond.'}))}});
  server.middlewares.use('/api/photos',async(req,res)=>{try{
    const handler=await server.ssrLoadModule('/api/photos.js');
    const request=new Request('http://'+req.headers.host+'/api/photos',{method:req.method,headers:req.headers,...(req.method==='POST'?{body:Readable.toWeb(req),duplex:'half'}:{})});
    const response=req.method==='GET'?await handler.GET():req.method==='POST'?await handler.POST(request):new Response('Method not allowed',{status:405});
    res.statusCode=response.status;response.headers.forEach((v,k)=>res.setHeader(k,v));res.end(Buffer.from(await response.arrayBuffer()));
  }catch{res.statusCode=500;res.setHeader('Content-Type','application/json');res.end(JSON.stringify({error:'The local recording service could not respond.'}))}});
  jsonEndpoint(server,'/api/admin','/api/admin/[...path].js');
  jsonEndpoint(server,'/api/community','/api/community/[...path].js');
}

export default defineConfig(({mode})=>({plugins:[{name:'archive-local-api',configureServer(server){
  copyEnv(loadEnv(mode,process.cwd(),''));
  attach(server);
}}]}));
