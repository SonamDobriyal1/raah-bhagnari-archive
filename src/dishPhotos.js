const recordId=/^RAAH-(?:RC-|CR-)?\d{4}$/;

function plain(value){
  return String(value||'').replace(/^dish photo:\s*/i,'').replace(/\s+/g,' ').trim().toLowerCase();
}

export function dishPhotoLinks({record='',title=''}={},recipes=[]){
  const ids=[];
  const recordValue=String(record||'').trim();
  if(recordId.test(recordValue)){
    ids.push(recordValue);
    const linked=recipes.find(recipe=>recipe.id===recordValue);
    if(linked?.wordId)ids.push(linked.wordId);
  }
  const name=plain(title);
  const named=name&&recipes.find(recipe=>plain(recipe.name)===name);
  if(named){
    ids.push(named.id);
    if(named.wordId)ids.push(named.wordId);
  }
  return [...new Set(ids)];
}

export function photosUnderRecipe(photos,recipeId){
  return (photos||[]).filter(photo=>photo?.image&&(photo.wordIds||[]).includes(recipeId));
}

export function photosForDish(photos,entryId){
  return (photos||[]).filter(photo=>{
    const ids=photo?.wordIds||[];
    if(!photo?.image||!ids.includes(entryId))return false;
    return !ids.some(id=>id.startsWith('RAAH-RC-')||id.startsWith('RAAH-CR-'));
  });
}
