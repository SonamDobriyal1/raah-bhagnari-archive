import test from 'node:test';
import assert from 'node:assert/strict';
import handler from '../api/contributions.js';
function response(){return {headers:{},code:0,data:null,setHeader(k,v){this.headers[k]=v},status(c){this.code=c;return this},json(d){this.data=d;return this}}}
test('a configured Supabase project opens the community register without a separate switch',async()=>{
 const keys=['ARCHIVE_SUBMISSIONS_ENABLED','SUPABASE_URL','SUPABASE_SERVICE_ROLE_KEY'];const old=Object.fromEntries(keys.map(k=>[k,process.env[k]]));
 delete process.env.ARCHIVE_SUBMISSIONS_ENABLED;process.env.SUPABASE_URL='https://example.supabase.co';process.env.SUPABASE_SERVICE_ROLE_KEY='test-only-secret';
 try{const get=response();await handler({method:'GET',headers:{}},get);assert.deepEqual(get.data,{enabled:true});}
 finally{for(const k of keys){if(old[k]===undefined)delete process.env[k];else process.env[k]=old[k]}}
});
test('disabled deployments state their status and never accept a submission',async()=>{
 const previous=process.env.ARCHIVE_SUBMISSIONS_ENABLED;process.env.ARCHIVE_SUBMISSIONS_ENABLED='false';
 try{const get=response();await handler({method:'GET',headers:{}},get);assert.deepEqual(get.data,{enabled:false});const post=response();await handler({method:'POST',headers:{}},post);assert.equal(post.code,503);}finally{if(previous===undefined)delete process.env.ARCHIVE_SUBMISSIONS_ENABLED;else process.env.ARCHIVE_SUBMISSIONS_ENABLED=previous}
});
test('a valid online contribution stores only pending data and preserves restrictions',async()=>{
 const keys=['ARCHIVE_SUBMISSIONS_ENABLED','SUPABASE_URL','SUPABASE_SERVICE_ROLE_KEY','ARCHIVE_SITE_URL'];const old=Object.fromEntries(keys.map(k=>[k,process.env[k]]));const oldFetch=globalThis.fetch;let stored;
 Object.assign(process.env,{ARCHIVE_SUBMISSIONS_ENABLED:'true',SUPABASE_URL:'https://example.supabase.co',SUPABASE_SERVICE_ROLE_KEY:'test-only-secret',ARCHIVE_SITE_URL:'https://archive.example'});
 globalThis.fetch=async(url,options)=>{assert.equal(url.href,'https://example.supabase.co/rest/v1/contributions');stored=JSON.parse(options.body);return {ok:true}};
 try{
  const headers={origin:'https://archive.example',host:'archive.example','content-type':'application/json'};
  const body={type:'word',title:'A word',message:'A meaning',source:'A family note',name:'',contact:'',record:'RAAH-0372',credit:'Keep me anonymous',access:'Private research only',consent:true,elapsed:5000,website:'',status:'verified'};
  const result=response();await handler({method:'POST',headers,body},result);
  assert.equal(result.code,201);assert.match(result.data.reference,/^RAAH-C-/);assert.equal(stored.status,'pending');assert.equal(stored.access,'Private research only');assert.equal(stored.credit,'Keep me anonymous');assert.equal(stored.consent_version,'2026-11-03');
  const blocked=response();await handler({method:'POST',headers:{...headers,origin:'https://other.example'},body},blocked);assert.equal(blocked.code,403);
  const bot=response();await handler({method:'POST',headers,body:{...body,website:'spam'}},bot);assert.equal(bot.code,400);
 }finally{globalThis.fetch=oldFetch;for(const k of keys){if(old[k]===undefined)delete process.env[k];else process.env[k]=old[k]}}
});
