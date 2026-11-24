export function readyWord(word){
  return {
    notes:[],
    example:'',
    translation:'',
    status:'verified',
    source:'community-curator',
    hindiMeaning:null,
    ...word,
    devanagari:word.devanagari||word.headword,
    notes:Array.isArray(word.notes)?word.notes:[]
  };
}

export function mergeSiteContent({baseWords,baseRecipes,published}){
  const removed=new Set(published?.removedWordIds||[]);
  const words=[
    ...baseWords.filter(word=>!removed.has(word.id)),
    ...(published?.words||[]).filter(word=>word?.id&&!removed.has(word.id)).map(readyWord)
  ];
  const added=(published?.recipes||[]).filter(recipe=>recipe?.community&&recipe.id);
  const held=new Set(['shared-photo','album-photo','pronunciation','story']);
  const recipes=[...baseRecipes,...added.filter(recipe=>!held.has(recipe.status))];
  const dishPhotos=added.filter(recipe=>recipe.status==='shared-photo'&&recipe.image);
  const albumPhotos=added.filter(recipe=>recipe.status==='album-photo'&&recipe.image);
  const pronunciations=added.filter(recipe=>recipe.status==='pronunciation'&&recipe.image);
  const stories=added.filter(recipe=>recipe.status==='story');
  const journeys=(published?.journeys||[]).filter(journey=>journey?.id);
  return {words,recipes,journeys,dishPhotos,albumPhotos,pronunciations,stories};
}
