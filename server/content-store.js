import {randomBytes} from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import {displayMeaning,themes} from '../src/library.js';
import {routeLabel} from '../src/routeStops.js';
import * as cloud from './cloud-desk.js';
import {registerContributions,reviewContribution} from './register-queue.js';
import {supabaseConfigured} from './supabase-rest.js';

let root=process.cwd();
let storeMode='auto';
let queue=Promise.resolve();
const themeNames=Object.keys(themes);
const emptyPublished=()=>({journeys:[],words:[],removedWordIds:[],removedWords:[],recipes:[]});
const emptyInbox=()=>({journeyRequests:[],recipeSubmissions:[]});

export function setContentRoot(directory){root=directory;storeMode='local'}
export function setStoreMode(mode){storeMode=mode}
function useCloud(){return storeMode==='auto'&&supabaseConfigured()}

function fail(status,message){const error=new Error(message);error.status=status;return error}
function clip(value,max){
  if(typeof value!=='string')return '';
  return value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g,'').trim().slice(0,max);
}
function lines(value,maxLines,maxLength){
  return clip(value,maxLength).split(/\n/).map(line=>line.trim()).filter(Boolean).slice(0,maxLines);
}
function stopsFrom(input){
  const listed=Array.isArray(input?.stops)?input.stops.map(stop=>({name:clip(stop?.name,80),year:clip(stop?.year,40)})).filter(stop=>stop.name).slice(0,6):[];
  if(listed.length)return listed;
  const from=clip(input?.from,80);
  const to=clip(input?.to,80);
  const stops=from?[{name:from,year:''}]:[];
  if(to&&to!==from)stops.push({name:to,year:''});
  return stops;
}
function enqueue(task){
  const run=queue.then(task,task);
  queue=run.then(()=>{},()=>{});
  return run;
}
async function readJson(file,fallback){
  try{return {...fallback(),...JSON.parse(await fs.readFile(file,'utf8'))}}
  catch(error){if(error.code==='ENOENT')return fallback();throw error}
}
async function writeJson(file,value){
  await fs.mkdir(path.dirname(file),{recursive:true});
  const temporary=file+'.tmp';
  await fs.writeFile(temporary,JSON.stringify(value,null,2)+'\n');
  await fs.rename(temporary,file);
}
function publishedFile(){return path.join(root,'public','data','site-content.json')}
function inboxFile(){return path.join(root,'data','inbox.json')}
function readPublished(){return useCloud()?cloud.readPublished():readJson(publishedFile(),emptyPublished)}
function readInbox(){return useCloud()?cloud.readInbox():readJson(inboxFile(),emptyInbox)}
function savePublished(published){return useCloud()?cloud.writePublished(published):writeJson(publishedFile(),published)}
function saveInbox(inbox){return useCloud()?cloud.writeInbox(inbox):writeJson(inboxFile(),inbox)}

async function sourceEntries(){
  try{return JSON.parse(await fs.readFile(path.join(root,'content','dictionary.json'),'utf8'))}
  catch(error){if(error.code==='ENOENT')return [];throw error}
}

function sniff(buffer){
  if(buffer.length>3&&buffer[0]===0xff&&buffer[1]===0xd8&&buffer[2]===0xff)return 'jpg';
  if(buffer.length>8&&buffer[0]===0x89&&buffer[1]===0x50&&buffer[2]===0x4e&&buffer[3]===0x47)return 'png';
  if(buffer.length>12&&buffer.toString('ascii',0,4)==='RIFF'&&buffer.toString('ascii',8,12)==='WEBP')return 'webp';
  return '';
}

function decodeImage(dataUrl){
  if(!dataUrl)return null;
  const match=/^data:image\/(?:jpeg|png|webp);base64,([A-Za-z0-9+/=\r\n]+)$/.exec(String(dataUrl));
  if(!match)throw fail(400,'Please use a JPG, PNG or WebP image.');
  const buffer=Buffer.from(match[1].replace(/\s/g,''),'base64');
  const ext=sniff(buffer);
  if(!ext||buffer.length>1200000)throw fail(400,'Please use a JPG, PNG or WebP image under 1.2 MB.');
  return {buffer,ext};
}

async function writeUpload(buffer,ext,folder,name){
  if(useCloud())return cloud.writeUpload(buffer,ext,folder,name);
  const directory=path.join(root,'public','uploads',folder);
  await fs.mkdir(directory,{recursive:true});
  const filename=`${name}.${ext}`;
  await fs.writeFile(path.join(directory,filename),buffer);
  return `/uploads/${folder}/${filename}`;
}

async function writePrivate(buffer,ext,name){
  if(useCloud())return cloud.writePrivate(buffer,ext,name);
  const directory=path.join(root,'data','uploads');
  await fs.mkdir(directory,{recursive:true});
  const filename=`${name}.${ext}`;
  await fs.writeFile(path.join(directory,filename),buffer);
  return `data/uploads/${filename}`;
}

function privatePath(relative){
  if(!relative)return '';
  const uploads=path.resolve(root,'data','uploads');
  const absolute=path.resolve(root,relative);
  if(absolute!==uploads&&!absolute.startsWith(uploads+path.sep))throw fail(400,'The image could not be used.');
  return absolute;
}

async function removePrivate(relative){
  if(!relative)return;
  if(useCloud())return cloud.removePrivate(relative);
  const absolute=privatePath(relative);
  if(absolute)await fs.unlink(absolute).catch(()=>{});
}

async function removePublic(urlPath){
  if(useCloud())return cloud.removePublic(urlPath);
  const image=savedUpload(urlPath);
  if(image)await fs.unlink(image).catch(()=>{});
}

function savedUpload(urlPath){
  if(!/^\/uploads\/(journeys|recipes)\/[\w.-]+$/.test(urlPath||''))return '';
  return path.join(root,'public',urlPath.slice(1));
}

async function preview(entry){
  if(!entry?.imagePath)return entry;
  try{
    const buffer=useCloud()?await cloud.readPrivate(entry.imagePath):await fs.readFile(privatePath(entry.imagePath));
    const ext=path.extname(entry.imagePath).slice(1);
    const mime=ext==='jpg'?'jpeg':ext;
    const {imagePath,...rest}=entry;
    return {...rest,imageData:`data:image/${mime};base64,${buffer.toString('base64')}`};
  }catch{
    const {imagePath,...rest}=entry;
    return rest;
  }
}

async function deskFrom(published,inbox){
  return {
    published,
    inbox:{
      journeyRequests:await Promise.all(inbox.journeyRequests.map(preview)),
      recipeSubmissions:await Promise.all(inbox.recipeSubmissions.map(preview))
    }
  };
}

async function deskWithRegister(){
  const desk=await deskFrom(await readPublished(),await readInbox());
  desk.contributions=await registerContributions();
  return desk;
}

export function readDesk(){
  return enqueue(deskWithRegister);
}

export function reviewRegisterEntry(reference,status){
  return enqueue(async()=>{
    await reviewContribution(reference,status);
    return deskWithRegister();
  });
}

function journeyFrom(input,image){
  const title=clip(input.title,140);
  const body=clip(input.body,4000);
  if(!title||!body)throw fail(400,'Please add a title and the journey itself.');
  return {
    id:'family-'+randomBytes(4).toString('hex'),
    year:clip(input.year,60)||'Family record',
    title,
    place:clip(input.place,500)||'A family route',
    body,
    source:clip(input.source,240)||'Added by the curator',
    credit:clip(input.credit,120)||'A family',
    ...(image?{image}:{})
  };
}

function recipeFrom(input,image,id){
  const name=clip(input.name,140);
  const method=Array.isArray(input.method)?input.method.map(step=>clip(step,500)).filter(Boolean).slice(0,40):lines(input.method,40,8000);
  const ingredients=Array.isArray(input.ingredients)?input.ingredients.map(item=>clip(item,200)).filter(Boolean).slice(0,60):lines(input.ingredients,60,4000);
  if(!name||!method.length)throw fail(400,'Please add the dish name and at least one step.');
  return {
    id,
    community:true,
    name,
    devanagari:clip(input.devanagari,80),
    credit:clip(input.credit,120)||'Anonymous',
    description:clip(input.description,500),
    ingredients,
    method,
    image:image||'',
    wordIds:[],
    status:'published',
    source:'Family kitchen'
  };
}

async function nextWordId(words){
  const entries=await sourceEntries();
  const nums=[...entries,...words].map(entry=>Number(String(entry.id||'').replace(/\D/g,''))||0);
  return 'RAAH-'+String(Math.max(641,...nums)+1).padStart(4,'0');
}

function nextRecipeId(recipes){
  const nums=recipes.map(recipe=>Number(String(recipe.id||'').replace(/\D/g,''))||0);
  return 'RAAH-CR-'+String(Math.max(0,...nums)+1).padStart(4,'0');
}

export function addJourney(input){
  return enqueue(async()=>{
    const journey=journeyFrom(input||{},'');
    const imageData=decodeImage(input?.imageData);
    if(imageData)journey.image=await writeUpload(imageData.buffer,imageData.ext,'journeys','journey-'+randomBytes(4).toString('hex'));
    const published=await readPublished();
    published.journeys.push(journey);
    const saved=await savePublished(published);
    return deskFrom(saved||published,await readInbox());
  });
}

export function deleteJourney(id){
  return enqueue(async()=>{
    const published=await readPublished();
    const journey=published.journeys.find(item=>item.id===id);
    if(!journey)throw fail(404,'That journey is no longer on the site.');
    await removePublic(journey.image);
    published.journeys=published.journeys.filter(item=>item.id!==id);
    const saved=await savePublished(published);
    return deskFrom(saved||published,await readInbox());
  });
}

export function addWord(input){
  return enqueue(async()=>{
    const headword=clip(input?.headword,80);
    const meaning=clip(input?.meaning,500);
    if(!headword||!meaning)throw fail(400,'Please add the word and its meaning.');
    if(!themeNames.includes(input?.theme))throw fail(400,'Please choose a theme from the list.');
    const published=await readPublished();
    const hindi=clip(input.hindiMeaning,300);
    published.words.push({
      id:await nextWordId(published.words),
      headword,
      devanagari:clip(input.devanagari,80),
      meaning:displayMeaning(meaning),
      example:clip(input.example,300),
      translation:clip(input.translation,300),
      theme:input.theme,
      hindiMeaning:hindi||null,
      ...(hindi?{hindiProvenance:'Added by the archive curator'}:{}),
      notes:[],
      status:'verified',
      source:'community-curator'
    });
    const saved=await savePublished(published);
    return deskFrom(saved||published,await readInbox());
  });
}

export function removeWord(id){
  return enqueue(async()=>{
    const published=await readPublished();
    const added=published.words.some(word=>word.id===id);
    if(added)published.words=published.words.filter(word=>word.id!==id);
    else{
      const source=(await sourceEntries()).find(word=>word.id===id);
      if(!source)throw fail(404,'That word is not in the dictionary.');
      if(!published.removedWordIds.includes(id)){
        published.removedWordIds.push(id);
        published.removedWords.push({id,headword:source.headword});
      }
    }
    const saved=await savePublished(published);
    return deskFrom(saved||published,await readInbox());
  });
}

export function restoreWord(id){
  return enqueue(async()=>{
    const published=await readPublished();
    published.removedWordIds=published.removedWordIds.filter(item=>item!==id);
    published.removedWords=published.removedWords.filter(item=>item.id!==id);
    const saved=await savePublished(published);
    return deskFrom(saved||published,await readInbox());
  });
}

export function addRecipe(input){
  return enqueue(async()=>{
    const published=await readPublished();
    const id=nextRecipeId(published.recipes);
    const recipe=recipeFrom(input||{},'',id);
    const imageData=decodeImage(input?.imageData);
    if(imageData)recipe.image=await writeUpload(imageData.buffer,imageData.ext,'recipes',id);
    published.recipes.push(recipe);
    const saved=await savePublished(published);
    return deskFrom(saved||published,await readInbox());
  });
}

export function deleteRecipe(id){
  return enqueue(async()=>{
    const published=await readPublished();
    const recipe=published.recipes.find(item=>item.id===id);
    if(!recipe)throw fail(404,'That recipe is no longer on the site.');
    await removePublic(recipe.image);
    published.recipes=published.recipes.filter(item=>item.id!==id);
    const saved=await savePublished(published);
    return deskFrom(saved||published,await readInbox());
  });
}

function guardInbox(inbox){
  if(inbox.journeyRequests.length+inbox.recipeSubmissions.length>=200)throw fail(429,'The review queue is full. Please try again after the curator has cleared some entries.');
}

export function addJourneyRequest(input){
  return enqueue(async()=>{
    if(input?.website)throw fail(400,'The form could not be sent.');
    if(input?.consent!==true)throw fail(400,'Please confirm you have permission to share this journey.');
    const story=clip(input?.story,4000);
    if(!story)throw fail(400,'Please tell the journey in a few sentences.');
    const stops=stopsFrom(input);
    const inbox=await readInbox();
    guardInbox(inbox);
    const imageData=decodeImage(input.imageData);
    const id='JR-'+randomBytes(4).toString('hex');
    inbox.journeyRequests.push({
      id,
      name:clip(input.name,120),
      contact:clip(input.contact,200),
      from:stops[0]?.name||'',
      to:stops.at(-1)?.name||'',
      stops,
      years:clip(input.years,60),
      story,
      shareName:input.shareName===true,
      imagePath:imageData?await writePrivate(imageData.buffer,imageData.ext,id):'',
      createdAt:new Date().toISOString()
    });
    await saveInbox(inbox);
    return {id,status:'pending'};
  });
}

export function addRecipeSubmission(input){
  return enqueue(async()=>{
    if(input?.website)throw fail(400,'The form could not be sent.');
    if(input?.consent!==true)throw fail(400,'Please confirm you have permission to share this recipe.');
    const name=clip(input?.name,140);
    const method=lines(input?.method,40,8000);
    if(!name||!method.length)throw fail(400,'Please add the dish name and at least one step.');
    const inbox=await readInbox();
    guardInbox(inbox);
    const imageData=decodeImage(input.imageData);
    const id='RS-'+randomBytes(4).toString('hex');
    inbox.recipeSubmissions.push({
      id,
      name,
      devanagari:clip(input.devanagari,80),
      credit:input.shareName===true?clip(input.credit,120):'',
      description:clip(input.description,500),
      ingredients:lines(input.ingredients,60,4000),
      method,
      contact:clip(input.contact,200),
      imagePath:imageData?await writePrivate(imageData.buffer,imageData.ext,id):'',
      createdAt:new Date().toISOString()
    });
    await saveInbox(inbox);
    return {id,status:'pending'};
  });
}

export function dismissJourneyRequest(id){
  return enqueue(async()=>{
    const inbox=await readInbox();
    const request=inbox.journeyRequests.find(item=>item.id===id);
    if(!request)throw fail(404,'That journey request has already been cleared.');
    await removePrivate(request.imagePath);
    inbox.journeyRequests=inbox.journeyRequests.filter(item=>item.id!==id);
    await saveInbox(inbox);
    return deskFrom(await readPublished(),inbox);
  });
}

export function publishJourneyRequest(id,overrides={}){
  return enqueue(async()=>{
    const inbox=await readInbox();
    const request=inbox.journeyRequests.find(item=>item.id===id);
    if(!request)throw fail(404,'That journey request has already been cleared.');
    const published=await readPublished();
    const named=request.shareName&&request.name;
    const journey=journeyFrom({
      title:overrides.title||(named?`${named}’s journey`:'A family journey'),
      year:overrides.year||request.years,
      place:overrides.place||routeLabel(request.stops)||[request.from,request.to].filter(Boolean).join(' → '),
      body:overrides.body||request.story,
      source:overrides.source||(named?`Offered to the archive by ${named}`:'Offered to the archive'),
      credit:named?request.name:'A family'
    },'');
    if(request.imagePath){
      const buffer=useCloud()?await cloud.readPrivate(request.imagePath):await fs.readFile(privatePath(request.imagePath));
      journey.image=await writeUpload(buffer,path.extname(request.imagePath).slice(1),'journeys','journey-'+randomBytes(4).toString('hex'));
      await removePrivate(request.imagePath);
    }
    published.journeys.push(journey);
    inbox.journeyRequests=inbox.journeyRequests.filter(item=>item.id!==id);
    const saved=await savePublished(published);
    await saveInbox(inbox);
    return deskFrom(saved||published,inbox);
  });
}

export function rejectRecipeSubmission(id){
  return enqueue(async()=>{
    const inbox=await readInbox();
    const submission=inbox.recipeSubmissions.find(item=>item.id===id);
    if(!submission)throw fail(404,'That recipe has already been cleared.');
    await removePrivate(submission.imagePath);
    inbox.recipeSubmissions=inbox.recipeSubmissions.filter(item=>item.id!==id);
    await saveInbox(inbox);
    return deskFrom(await readPublished(),inbox);
  });
}

export function approveRecipeSubmission(id){
  return enqueue(async()=>{
    const inbox=await readInbox();
    const submission=inbox.recipeSubmissions.find(item=>item.id===id);
    if(!submission)throw fail(404,'That recipe has already been cleared.');
    const published=await readPublished();
    const recipeId=nextRecipeId(published.recipes);
    const recipe=recipeFrom({...submission,credit:submission.credit||'Anonymous'},'',recipeId);
    if(submission.imagePath){
      const buffer=useCloud()?await cloud.readPrivate(submission.imagePath):await fs.readFile(privatePath(submission.imagePath));
      recipe.image=await writeUpload(buffer,path.extname(submission.imagePath).slice(1),'recipes',recipeId);
      await removePrivate(submission.imagePath);
    }
    published.recipes.push(recipe);
    inbox.recipeSubmissions=inbox.recipeSubmissions.filter(item=>item.id!==id);
    const saved=await savePublished(published);
    await saveInbox(inbox);
    return deskFrom(saved||published,inbox);
  });
}
