import {journeyRequestFromRow,journeyRequestRow,publishedFromRows,recipeSubmissionFromRow,recipeSubmissionRow,rowsFromPublished} from '../src/deskRecords.js';
import {deletePublicAudio,deleteStoredImage,objectNameFromPublicUrl,readStoredImage,storePrivateImage,storePublicAudio,storePublicImage} from './supabase-storage.js';
import {supabaseRest} from './supabase-rest.js';

const publishedTables=[['desk_journeys','journeys'],['desk_words','words'],['desk_removed_words','removed'],['desk_recipes','recipes']];

function quoted(ids){
  return ids.map(id=>`"${String(id).replace(/"/g,'')}"`).join(',');
}

async function replaceRows(table,rows){
  const current=await supabaseRest(table,{query:'select=id'});
  const next=new Set(rows.map(row=>row.id));
  const stale=current.map(row=>row.id).filter(id=>!next.has(id));
  if(rows.length)await supabaseRest(table,{method:'POST',body:rows,prefer:'resolution=merge-duplicates,return=minimal'});
  if(stale.length)await supabaseRest(table,{method:'DELETE',query:`id=in.(${quoted(stale)})`});
}

export async function readPublished(){
  const [journeys,words,removed,recipes]=await Promise.all(publishedTables.map(([table])=>supabaseRest(table,{query:'select=*&order=created_at.asc'})));
  return publishedFromRows({journeys,words,removed,recipes});
}

export async function writePublished(published){
  const rows=rowsFromPublished(published);
  await Promise.all(publishedTables.map(([table,key])=>replaceRows(table,rows[key])));
  return readPublished();
}

export async function readInbox(){
  const [journeyRequests,recipeSubmissions]=await Promise.all([
    supabaseRest('desk_journey_requests',{query:'select=*&order=created_at.asc'}),
    supabaseRest('desk_recipe_submissions',{query:'select=*&order=created_at.asc'})
  ]);
  return {journeyRequests:journeyRequests.map(journeyRequestFromRow),recipeSubmissions:recipeSubmissions.map(recipeSubmissionFromRow)};
}

export async function writeInbox(inbox){
  await Promise.all([
    replaceRows('desk_journey_requests',inbox.journeyRequests.map(journeyRequestRow)),
    replaceRows('desk_recipe_submissions',inbox.recipeSubmissions.map(recipeSubmissionRow))
  ]);
}

export const writeUpload=(buffer,ext,folder,name)=>storePublicImage(buffer,ext,folder,name);
export const writeAudio=(buffer,ext,name)=>storePublicAudio(buffer,ext,name);
export const writePrivate=(buffer,ext,name)=>storePrivateImage(buffer,ext,name);
export const readPrivate=objectName=>readStoredImage(objectName);
export async function removePrivate(objectName){if(objectName)await deleteStoredImage(objectName)}
export async function removePublic(url){
  const name=objectNameFromPublicUrl(url);
  if(name)await deleteStoredImage(name);
  else await deletePublicAudio(url);
}
