import {routeLabel,routeStops} from './routeStops.js';

function text(value){return value||''}

function requestStops(row){
  const named=routeStops(row.from_place);
  const destination=text(row.to_place);
  if(!named.length)return destination?[{name:destination,year:''}]:[];
  if(destination&&!String(row.from_place||'').includes('→')&&named.at(-1).name!==destination)return [...named,{name:destination,year:''}];
  return named;
}

export function journeyRow(journey){
  return {id:journey.id,year:text(journey.year),title:journey.title,place:text(journey.place),body:journey.body,source:text(journey.source),credit:text(journey.credit),image:text(journey.image)};
}

export function journeyFromRow(row){
  return {id:row.id,year:row.year,title:row.title,place:row.place,body:row.body,source:row.source,credit:row.credit,...(row.image?{image:row.image}:{})};
}

export function wordRow(word){
  return {id:word.id,headword:word.headword,devanagari:text(word.devanagari),meaning:word.meaning,example:text(word.example),translation:text(word.translation),theme:word.theme,hindi_meaning:word.hindiMeaning||null,hindi_provenance:word.hindiProvenance||null,notes:Array.isArray(word.notes)?word.notes:[],status:word.status||'verified',source:word.source||'community-curator'};
}

export function wordFromRow(row){
  return {id:row.id,headword:row.headword,devanagari:text(row.devanagari),meaning:row.meaning,example:text(row.example),translation:text(row.translation),theme:row.theme,hindiMeaning:row.hindi_meaning||null,...(row.hindi_provenance?{hindiProvenance:row.hindi_provenance}:{}),notes:Array.isArray(row.notes)?row.notes:[],status:row.status||'verified',source:row.source||'community-curator'};
}

export function recipeRow(recipe){
  return {id:recipe.id,community:recipe.community!==false,name:recipe.name,devanagari:text(recipe.devanagari),credit:text(recipe.credit),description:text(recipe.description),ingredients:recipe.ingredients||[],method:recipe.method||[],image:text(recipe.image),word_ids:recipe.wordIds||[],status:recipe.status||'published',source:recipe.source||'Family kitchen'};
}

export function recipeFromRow(row){
  return {id:row.id,community:row.community!==false,name:row.name,devanagari:text(row.devanagari),credit:text(row.credit),description:text(row.description),ingredients:row.ingredients||[],method:row.method||[],image:text(row.image),wordIds:row.word_ids||[],status:row.status||'published',source:row.source||'Family kitchen'};
}

export function journeyRequestRow(request){
  const stops=Array.isArray(request.stops)&&request.stops.length?request.stops:routeStops([request.from,request.to].filter(Boolean).join(' → '));
  return {id:request.id,name:text(request.name),contact:text(request.contact),from_place:routeLabel(stops)||text(request.from),to_place:text(stops.at(-1)?.name||request.to),years:text(request.years),story:request.story,share_name:request.shareName===true,image_path:text(request.imagePath),created_at:request.createdAt};
}

export function journeyRequestFromRow(row){
  const stops=requestStops(row);
  return {id:row.id,name:text(row.name),contact:text(row.contact),from:stops[0]?.name||text(row.from_place),to:stops.at(-1)?.name||text(row.to_place),stops,years:text(row.years),story:row.story,shareName:row.share_name===true,imagePath:text(row.image_path),createdAt:row.created_at};
}

export function recipeSubmissionRow(submission){
  return {id:submission.id,name:submission.name,devanagari:text(submission.devanagari),credit:text(submission.credit),description:text(submission.description),ingredients:submission.ingredients||[],method:submission.method||[],contact:text(submission.contact),image_path:text(submission.imagePath),created_at:submission.createdAt};
}

export function recipeSubmissionFromRow(row){
  return {id:row.id,name:row.name,devanagari:text(row.devanagari),credit:text(row.credit),description:text(row.description),ingredients:row.ingredients||[],method:row.method||[],contact:text(row.contact),imagePath:text(row.image_path),createdAt:row.created_at};
}

export function publishedFromRows({journeys=[],words=[],removed=[],recipes=[]}){
  return {
    journeys:journeys.map(journeyFromRow),
    words:words.map(wordFromRow),
    removedWordIds:removed.map(row=>row.id),
    removedWords:removed.map(row=>({id:row.id,headword:row.headword})),
    recipes:recipes.map(recipeFromRow)
  };
}

export function rowsFromPublished(published){
  return {
    journeys:(published.journeys||[]).map(journeyRow),
    words:(published.words||[]).map(wordRow),
    removed:(published.removedWords||[]).map(word=>({id:word.id,headword:word.headword})),
    recipes:(published.recipes||[]).map(recipeRow)
  };
}
