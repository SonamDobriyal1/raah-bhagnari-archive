import test from 'node:test';
import assert from 'node:assert/strict';
import {acceptsOrigin,corsHeaders,withCors} from '../server/site-origin.js';
import {relayContribution} from '../server/private-ingest.js';

const env={ARCHIVE_SITE_URL:'https://archive.vercel.app',ARCHIVE_ALLOWED_ORIGINS:'https://archive.web.app,https://archive.firebaseapp.com',SUPABASE_INGEST_URL:'https://private.example/ingest',ARCHIVE_INGEST_KEY:'test-only'};
test('only exact approved hosting origins receive submission access and CORS headers',()=>{
 assert.equal(acceptsOrigin('https://archive.web.app','archive.vercel.app',env),true);
 for(const origin of ['https://evil.example','https://archive.web.app.evil.example','http://archive.web.app','null']){
  assert.equal(acceptsOrigin(origin,'archive.vercel.app',env),false);assert.deepEqual(corsHeaders(origin,env),{});
 }
 const response=withCors(Response.json({enabled:true}),new Request('https://archive.vercel.app/api/contributions',{headers:{Origin:'https://archive.web.app'}}),env);
 assert.equal(response.headers.get('Access-Control-Allow-Origin'),'https://archive.web.app');
 assert.equal(response.headers.get('Access-Control-Allow-Credentials'),null);
});
test('only an approved alternate site is relayed under the canonical private API identity',async()=>{
 let sent;
 const request=origin=>new Request('https://archive.vercel.app/api/contributions',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:'{"title":"Test"}'});
 await relayContribution(request('https://archive.web.app'),'text',{env,fetcher:async(url,options)=>{sent=options;return Response.json({status:'pending'})}});
 assert.equal(sent.headers['X-Archive-Origin'],'https://archive.vercel.app');assert.equal(sent.headers['X-Archive-Host'],'archive.vercel.app');
 await assert.rejects(()=>relayContribution(request('https://evil.example'),'text',{env,fetcher:()=>{throw Error('Must not fetch')}}),/Untrusted archive origin/);
});
