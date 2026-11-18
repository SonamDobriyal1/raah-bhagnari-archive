import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import handler from '../api/admin/[...path].js';
import {clearLoginAttempts} from '../server/admin-auth.js';
import {addWord,setContentRoot,setStoreMode} from '../server/content-store.js';
import {publishedFromRows,wordRow} from '../src/deskRecords.js';
import {publicImage} from '../src/publicImage.js';

const keys=['SUPABASE_URL','SUPABASE_SERVICE_ROLE_KEY','ARCHIVE_SITE_URL','ADMIN_EMAIL','ADMIN_PASSWORD','ADMIN_SESSION_SECRET'];

test('published rows and photograph addresses keep their public shape',()=>{
  const published=publishedFromRows({journeys:[{id:'family-1',year:'1948',title:'Across',place:'Mahim',body:'A crossing.',source:'Told',credit:'A family',image:''}],words:[wordRow({id:'RAAH-0642',headword:'Zariya',meaning:'A way through.',theme:'Everyday Life and Expressions',hindiMeaning:null,notes:[]})],removed:[{id:'RAAH-0002',headword:'Hidden'}],recipes:[]});
  assert.equal(published.journeys[0].title,'Across');
  assert.equal(published.journeys[0].image,undefined);
  assert.equal(published.words[0].hindiMeaning,null);
  assert.deepEqual(published.removedWordIds,['RAAH-0002']);
  const stored='https://project.supabase.co/storage/v1/object/public/archive-desk/journeys/journey-1.jpg';
  assert.equal(publicImage(stored,'journeys'),stored);
  assert.equal(publicImage(stored,'recipes'),'');
  assert.equal(publicImage('/uploads/recipes/RAAH-CR-0001.jpg','recipes'),'/uploads/recipes/RAAH-CR-0001.jpg');
  assert.equal(publicImage('https://example.com/photo.jpg','journeys'),'');
});

test('configured Supabase receives dictionary changes and a cross-site desk can sign in',async()=>{
  const previous=Object.fromEntries(keys.map(key=>[key,process.env[key]]));
  const previousFetch=globalThis.fetch;
  const root=await fs.mkdtemp(path.join(os.tmpdir(),'raah-cloud-'));
  const tables={desk_journeys:[],desk_words:[],desk_removed_words:[],desk_recipes:[],desk_journey_requests:[],desk_recipe_submissions:[],contributions:[]};
  process.env.SUPABASE_URL='https://project.supabase.co';
  process.env.SUPABASE_SERVICE_ROLE_KEY='service-role-test';
  process.env.ARCHIVE_SITE_URL='https://raah-bhagnari-archive.web.app';
  process.env.ADMIN_EMAIL='curator@example.com';
  process.env.ADMIN_PASSWORD='correct-horse';
  process.env.ADMIN_SESSION_SECRET='test-signing-key';
  clearLoginAttempts();
  setContentRoot(root);
  setStoreMode('auto');
  await fs.mkdir(path.join(root,'content'),{recursive:true});
  await fs.writeFile(path.join(root,'content','dictionary.json'),JSON.stringify([{id:'RAAH-0001',headword:'Gharr',meaning:'Home.'}]));
  globalThis.fetch=async(url,options={})=>{
    const href=String(url);
    const table=Object.keys(tables).find(name=>href.includes(`/${name}`));
    if(!table)return {ok:false,status:500,json:async()=>({}),text:async()=>'unexpected'};
    assert.equal(options.headers.Authorization,'Bearer service-role-test');
    const method=options.method||'GET';
    if(method==='GET')return {ok:true,json:async()=>tables[table].slice(),text:async()=>''};
    if(method==='POST'){
      for(const row of JSON.parse(options.body)){
        const index=tables[table].findIndex(item=>item.id===row.id);
        const next={...row,created_at:tables[table][index]?.created_at||'2026-11-18T00:00:00.000Z'};
        if(index>=0)tables[table][index]=next;else tables[table].push(next);
      }
      return {ok:true,json:async()=>null,text:async()=>''};
    }
    if(method==='DELETE'){
      const ids=[...href.matchAll(/"([^"]+)"/g)].map(match=>match[1]);
      tables[table]=tables[table].filter(row=>!ids.includes(row.id));
      return {ok:true,json:async()=>null,text:async()=>''};
    }
    return {ok:false,status:500,json:async()=>({}),text:async()=>'unsupported'};
  };
  try{
    const added=await addWord({headword:'Zariya',meaning:'a way through.',theme:'Everyday Life and Expressions'});
    assert.equal(added.published.words[0].id,'RAAH-0642');
    assert.equal(added.published.words[0].meaning,'A way through.');
    assert.equal(tables.desk_words[0].headword,'Zariya');
    assert.equal(JSON.stringify(tables).includes('service-role-test'),false);

    setStoreMode('local');
    const response={headers:{},code:0,data:null,setHeader(key,value){this.headers[key]=value},status(code){this.code=code;return this},json(data){this.data=data;return this}};
    await handler({method:'POST',url:'/login',headers:{origin:'https://raah-bhagnari-archive.web.app',host:'raah-bhagnari-archive.vercel.app','content-type':'application/json'},body:{email:'curator@example.com',password:'correct-horse'}},response);
    assert.equal(response.code,200);
    assert.ok(response.data.token);
    const desk={headers:{},code:0,data:null,setHeader(){},status(code){this.code=code;return this},json(data){this.data=data;return this}};
    await handler({method:'GET',url:'/desk',headers:{origin:'https://raah-bhagnari-archive.web.app',host:'raah-bhagnari-archive.vercel.app',authorization:`Bearer ${response.data.token}`}},desk);
    assert.equal(desk.code,200);
    assert.deepEqual(desk.data.published.journeys,[]);
  }finally{
    globalThis.fetch=previousFetch;
    setContentRoot(process.cwd());
    clearLoginAttempts();
    for(const [key,value] of Object.entries(previous)){if(value===undefined)delete process.env[key];else process.env[key]=value}
    await fs.rm(root,{recursive:true,force:true});
  }
});
