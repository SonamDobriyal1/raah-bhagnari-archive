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
  const recipes=[
    ...baseRecipes,
    ...(published?.recipes||[]).filter(recipe=>recipe?.community&&recipe.id)
  ];
  const journeys=(published?.journeys||[]).filter(journey=>journey?.id);
  return {words,recipes,journeys};
}
