import {useEffect,useState} from 'react';
import sourceDictionary from '../content/dictionary.json';
import hindiGlosses from '../content/hindi-glosses.json';
import sourceRecipes from '../content/recipes.json';
import {displayMeaning} from './library.js';
import {publishedFromRows} from './deskRecords.js';
import {mergeSiteContent} from './mergeSiteContent.js';

const baseWords=sourceDictionary.map(entry=>({
  ...entry,
  meaning:displayMeaning(entry.meaning),
  hindiMeaning:hindiGlosses.meanings[entry.id]||null,
  ...(hindiGlosses.meanings[entry.id]?{hindiProvenance:hindiGlosses.provenance}:{})
}));

const state={words:baseWords,recipes:sourceRecipes,journeys:[],dishPhotos:[],albumPhotos:[],pronunciations:[],stories:[]};

function liveArray(read){
  return new Proxy([],{
    get(_target,prop){
      const list=read();
      if(prop===Symbol.iterator)return list[Symbol.iterator].bind(list);
      const value=list[prop];
      return typeof value==='function'?value.bind(list):value;
    },
    has(_target,prop){return prop in read()},
    ownKeys(){return Reflect.ownKeys(read())},
    getOwnPropertyDescriptor(_target,prop){
      const description=Object.getOwnPropertyDescriptor(read(),prop);
      if(description)description.configurable=true;
      return description;
    }
  });
}

export function applyPublished(published){
  const next=mergeSiteContent({baseWords,baseRecipes:sourceRecipes,published});
  state.words=next.words;
  state.recipes=next.recipes;
  state.journeys=next.journeys;
  state.dishPhotos=next.dishPhotos||[];
  state.albumPhotos=next.albumPhotos||[];
  state.pronunciations=next.pronunciations||[];
  state.stories=next.stories||[];
}

export const dictionary=liveArray(()=>state.words);
export const recipes=liveArray(()=>state.recipes);
export const word=id=>state.words.find(entry=>entry.id===id);
export const publishedJourneys=()=>state.journeys;
export const dishPhotos=liveArray(()=>state.dishPhotos);
export const albumPhotos=liveArray(()=>state.albumPhotos);
export const pronunciations=liveArray(()=>state.pronunciations);
export const stories=liveArray(()=>state.stories);

async function loadPublished(){
  const root=import.meta.env?.VITE_SUPABASE_URL;
  const key=import.meta.env?.VITE_SUPABASE_ANON_KEY;
  if(root&&key){
    const headers={apikey:key,Authorization:`Bearer ${key}`};
    const tables=['desk_journeys','desk_words','desk_removed_words','desk_recipes'];
    const [journeys,words,removed,recipes]=await Promise.all(tables.map(async table=>{
      const response=await fetch(`${String(root).replace(/\/$/,'')}/rest/v1/${table}?select=*&order=created_at.asc`,{headers,cache:'no-store'});
      if(!response.ok)throw new Error('The published archive could not be loaded.');
      return response.json();
    }));
    return publishedFromRows({journeys,words,removed,recipes});
  }
  const response=await fetch('/data/site-content.json',{cache:'no-store'});
  if(!response.ok)return null;
  return response.json();
}

export function usePublishedContent(){
  const [revision,setRevision]=useState(0);
  useEffect(()=>{
    let active=true;
    async function load(){
      try{
        const published=await loadPublished();
        if(!published||!active)return;
        applyPublished(published);
        setRevision(value=>value+1);
      }catch{/* The built-in archive remains available when the extra file is missing. */}
    }
    load();
    window.addEventListener('raah-site-content',load);
    return ()=>{active=false;window.removeEventListener('raah-site-content',load)};
  },[]);
  return revision;
}
