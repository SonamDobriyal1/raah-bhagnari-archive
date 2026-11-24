const local={journeys:/^\/uploads\/journeys\/[\w.-]+$/,recipes:/^\/uploads\/recipes\/[\w.-]+$/};
const remote=/^https:\/\/[a-z0-9-]+\.supabase\.co\/storage\/v1\/object\/public\/archive-desk\/(journeys|recipes)\/[\w.-]+$/;

export function publicAudio(url){
  if(/^\/uploads\/audio\/[\w.-]+$/.test(url||''))return url;
  if(/^https:\/\/[a-z0-9-]+\.supabase\.co\/storage\/v1\/object\/public\/archive-audio\/pronunciations\/[\w.-]+$/.test(url||''))return url;
  return '';
}

export function publicImage(url,folder){
  if(local[folder]?.test(url||''))return url;
  const match=remote.exec(url||'');
  if(match&&match[1]===folder)return url;
  return '';
}
