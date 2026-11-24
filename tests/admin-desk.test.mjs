import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import handler from '../server/admin-handler.js';
import community from '../server/community-handler.js';
import {clearLoginAttempts} from '../server/admin-auth.js';
import {setContentRoot} from '../server/content-store.js';
import {mergeSiteContent} from '../src/mergeSiteContent.js';

const png='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
const headers={origin:'http://127.0.0.1:5173',host:'127.0.0.1:5173','content-type':'application/json'};

function response(){return {headers:{},code:0,data:null,setHeader(key,value){this.headers[key]=value},status(code){this.code=code;return this},json(data){this.data=data;return this}}}
const call=(fn,url,body,extra)=>fn({method:body===undefined?'GET':'POST',url,headers:{...headers,...extra},body},response());

test('published words, journeys and recipes merge without exposing removals twice',()=>{
  const merged=mergeSiteContent({
    baseWords:[{id:'RAAH-0001',headword:'A',notes:['kept']},{id:'RAAH-0002',headword:'B',notes:[]}],
    baseRecipes:[{id:'book'}],
    published:{removedWordIds:['RAAH-0002'],words:[{id:'RAAH-0642',headword:'Naya',meaning:'New.'}],recipes:[{id:'RAAH-CR-0001',community:true,name:'Koki'},{id:'RAAH-CR-0002',community:true,name:'Aloo Tuk',image:'/uploads/recipes/aloo.jpg',status:'shared-photo',wordIds:['RAAH-RC-0002']},{id:'RAAH-CR-0003',community:true,name:'Heard',image:'/uploads/audio/a.webm',status:'pronunciation',wordIds:['RAAH-0001']},{id:'RAAH-CR-0004',community:true,name:'Album',image:'/uploads/recipes/album.jpg',status:'album-photo'},{id:'RAAH-CR-0005',community:true,name:'A memory',description:'A story',status:'story'}],journeys:[{id:'family-1',title:'Across'}]}
  });
  assert.deepEqual(merged.words.map(word=>word.id),['RAAH-0001','RAAH-0642']);
  assert.deepEqual(merged.words[0].notes,['kept']);
  assert.deepEqual(merged.words[1].notes,[]);
  assert.equal(merged.recipes.length,2);
  assert.equal(merged.dishPhotos[0].id,'RAAH-CR-0002');
  assert.equal(merged.pronunciations[0].id,'RAAH-CR-0003');
  assert.equal(merged.albumPhotos[0].id,'RAAH-CR-0004');
  assert.equal(merged.stories[0].id,'RAAH-CR-0005');
  assert.equal(merged.journeys[0].title,'Across');
});

test('the curator desk signs in, publishes, and keeps private contact off the public record',async()=>{
  const previous={ADMIN_EMAIL:process.env.ADMIN_EMAIL,ADMIN_PASSWORD:process.env.ADMIN_PASSWORD,ADMIN_SESSION_SECRET:process.env.ADMIN_SESSION_SECRET};
  const root=await fs.mkdtemp(path.join(os.tmpdir(),'raah-desk-'));
  process.env.ADMIN_EMAIL='curator@example.com';
  process.env.ADMIN_PASSWORD='correct-horse';
  process.env.ADMIN_SESSION_SECRET='test-signing-key';
  clearLoginAttempts();
  setContentRoot(root);
  await fs.mkdir(path.join(root,'content'),{recursive:true});
  await fs.writeFile(path.join(root,'content','dictionary.json'),JSON.stringify([{id:'RAAH-0001',headword:'Gharr',meaning:'Home.'}]));
  try{
    const blocked=await call(handler,'/login',{email:'curator@example.com',password:'correct-horse'},{origin:'https://elsewhere.example',host:'127.0.0.1:5173'});
    assert.equal(blocked.code,403);
    const wrong=await call(handler,'/login',{email:'curator@example.com',password:'not-the-password'});
    assert.equal(wrong.code,401);
    const login=await call(handler,'/login',{email:'Curator@Example.com',password:'correct-horse'});
    assert.equal(login.code,200);
    const cookie=login.headers['Set-Cookie'].split(';')[0];
    const authed={cookie};

    const added=await call(handler,'/words',{headword:'Zariya',devanagari:'ज़रिया',meaning:'a way through.',theme:'Community History and Migration'},authed);
    assert.equal(added.data.published.words[0].id,'RAAH-0642');
    assert.equal(added.data.published.words[0].meaning,'A way through.');
    const hidden=await call(handler,'/words/remove',{id:'RAAH-0001'},authed);
    assert.deepEqual(hidden.data.published.removedWordIds,['RAAH-0001']);
    const restored=await call(handler,'/words/restore',{id:'RAAH-0001'},authed);
    assert.deepEqual(restored.data.published.removedWordIds,[]);
    await call(handler,'/words/remove',{id:'RAAH-0642'},authed);

    const request=await call(community,'/journey-request',{name:'Meera',contact:'meera@example.com',from:'Karachi',to:'Mahim',years:'1948',story:'We crossed with a trunk of photographs.',shareName:false,consent:true,imageData:png,website:''});
    assert.equal(request.code,201);
    const desk=await call(handler,'/desk',undefined,authed);
    assert.equal(desk.data.inbox.journeyRequests[0].contact,'meera@example.com');
    assert.match(desk.data.inbox.journeyRequests[0].imageData,/^data:image\/png/);
    const published=await call(handler,'/journey-requests/publish',{id:request.data.id},authed);
    const journey=published.data.published.journeys[0];
    assert.equal(journey.title,'A family journey');
    assert.equal(journey.place,'Karachi → Mahim');
    assert.equal(journey.credit,'A family');
    assert.equal(JSON.stringify(published.data.published).includes('meera@example.com'),false);
    assert.match(journey.image,/^\/uploads\/journeys\//);
    await fs.access(path.join(root,'public',journey.image.slice(1)));

    const recipe=await call(community,'/recipe',{name:'Meera’s koki',credit:'Meera',description:'A thick flatbread.',ingredients:'Flour\nGhee',method:'Mix the flour.\nCook it on a tawa.',shareName:true,consent:true,contact:'meera@example.com',website:''});
    assert.equal(recipe.code,201);
    const approved=await call(handler,'/recipe-submissions/approve',{id:recipe.data.id},authed);
    const dish=approved.data.published.recipes[0];
    assert.equal(dish.community,true);
    assert.equal(dish.credit,'Meera');
    assert.deepEqual(dish.method,['Mix the flour.','Cook it on a tawa.']);
    assert.equal(JSON.stringify(dish).includes('meera@example.com'),false);
    const removed=await call(handler,'/recipes/delete',{id:dish.id},authed);
    assert.equal(removed.data.published.recipes.length,0);
    const removedJourney=await call(handler,'/api/desk?route=journeys/delete',{id:journey.id},authed);
    assert.equal(removedJourney.data.published.journeys.length,0);

    const spam=await call(community,'/journey-request',{name:'Spam',story:'A story long enough.',consent:true,website:'https://spam.example'});
    assert.equal(spam.code,400);
    const quiet=await call(handler,'/desk',undefined,{});
    assert.equal(quiet.code,401);
  }finally{
    setContentRoot(process.cwd());
    clearLoginAttempts();
    for(const [key,value] of Object.entries(previous)){if(value===undefined)delete process.env[key];else process.env[key]=value}
    await fs.rm(root,{recursive:true,force:true});
  }
});
