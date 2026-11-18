export const normalise = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
export function searchEntries(entries, query='', theme='All themes') {
  const q=normalise(query);const terms=q.split(/\s+/).filter(Boolean);
  const selected=entries.filter(e=>(theme==='All themes'||e.theme===theme)&&terms.every(t=>normalise([e.headword,e.devanagari,e.meaning,e.hindiMeaning,e.id,e.example,e.translation].join(' ')).includes(t)));
  if(!q)return selected;
  const clean=s=>normalise(s).replace(/[.!?]+$/,'').trim();
  function rank(e){
    const names=[e.headword,e.devanagari,e.id].map(clean);const meanings=[e.meaning,e.hindiMeaning].filter(Boolean).map(clean);
    if(names.includes(q))return 0;
    if(meanings.includes(q)||meanings.some(m=>m.split(/;\s*/).includes(q)))return 1;
    if(names.some(n=>n.startsWith(q)))return 2;
    if(meanings.some(m=>m.startsWith(q)))return 3;
    if(meanings.some(m=>m.includes(q)))return 4;
    return 8;
  }
  return selected.map((entry,index)=>({entry,index,score:rank(entry)})).sort((a,b)=>a.score-b.score||a.index-b.index).map(x=>x.entry);
}
export function chapterAtReadingLine(bounds,line=150){
  if(!bounds.length)return 0;
  let selected=0;
  bounds.forEach((b,i)=>{if(b.top<=line)selected=i});
  return selected;
}
export function readDraft() {
  if (typeof document === 'undefined') return null;
  try { return JSON.parse(localStorage.getItem('raah-contribution-v1')||'null'); } catch { return null; }
}
export function downloadFile(filename, data, type='application/json') {
  const url=URL.createObjectURL(data instanceof Blob?data:new Blob([data],{type}));
  const a=document.createElement('a');a.href=url;a.download=filename;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
export const themes = {
  'Actions and Processes':'Doing & making',
  'Body Health and Care':'Body & care',
  'Community History and Migration':'History & migration',
  'Description and Sensory Language':'Senses & description',
  'Everyday Life and Expressions':'Everyday words',
  'Family and Kinship':'Family & kinship',
  'Food and Drink':'Food & drink',
  'Grammar Pronouns and Reference':'Grammar & pronouns',
  'Home Objects and Places':'Home & objects',
  'Numbers':'Numbers',
  'Oral Expression Belief and Ritual':'Belief & ritual',
  'People Feelings and Social Values':'People & feelings',
  'Time and Calendar':'Time & calendar',
  'Trade Work and Economy':'Work & trade'
};
export const historySource='/documents/bhagnari-history.pdf';
export const cookbookSource='/documents/bhagnari-kitchen.pdf';
export const chapters=[
  {id:'origins',year:'Before migration',title:'Bhag & Nar',place:'Kachhi plain, Balochistan',material:'ledger',body:'The community history traces the Bhagnari name to families from Bhag and Nar, in the former state of Kalat. Trade connected the Kachhi plain with Sindh and the highlands.',source:'History booklet, printed pp. 1–2',object:'A shop ledger or a family record from Bhag or Nar',position:0},
  {id:'sindh',year:'1800s',title:'Making a home in Sindh',place:'Hyderabad · Karachi',material:'telegram',body:'The booklet describes a gradual migration during the nineteenth century. Families moved to towns in Sindh, with a community later centred on Bhagnari Pada in Karachi.',source:'History booklet, printed pp. 3–4',object:'A photograph or document from Bhagnari Pada',position:1},
  {id:'partition',year:'1947–48',title:'Across the sea',place:'Karachi → Bombay',material:'ticket',body:'Partition interrupted established lives in Sindh. Families left by sea, most from Karachi. Each family’s journey has its own story.',source:'History booklet, printed pp. 5–6',object:'A passage ticket, permit or first-hand journey account',position:2},
  {id:'bombay',year:'1948–54',title:'A neighbourhood, rebuilt',place:'Mahim · Bombay',material:'ration',body:'The booklet dates the first organised post-migration Panchayat meeting to 24 April 1948. In 1954 the first building of what became Kataria Colony was completed.',source:'History booklet, printed pp. 7–8',object:'A first address, meeting record or housing document',position:3},
  {id:'beyond',year:'1960s–today',title:'More places. Shared words.',place:'Mumbai · the Gulf · beyond',material:'album',body:'Later migrations carried families to Kuwait, Dubai and other places. A living archive makes room for these journeys, alongside the words and food still shared at home.',source:'History booklet, printed pp. 11–13; present-day collecting is ongoing',object:'A family photograph or a recording made today',position:4}
];
export const resources=[
  {id:'history',type:'History · 18 pages',title:'History of “We Bhagnaris”',author:'Hari K. Nasta',description:'Origins in Bhag and Nar, nineteenth-century movement into Sindh, Partition and life in Bombay. A history told from within the community.',url:historySource,number:'01'},
  {id:'panchayat',type:'Community records · 11 pages',title:'The Panchayat after Partition',author:'Published through Shree Bhagnari Panchayat',description:'Records of how the community organised and rebuilt after Partition.',url:'/documents/panchayat-after-partition.pdf',number:'02'},
  {id:'cookbook',type:'Food · 60 pages',title:'From Bhagnari Kitchen',author:'Ramesh Poplay, with collection work credited to Rishika Nasta',description:'Recipes from community kitchens, with the cooks’ names kept alongside their dishes.',url:cookbookSource,number:'03'},
  {id:'aarti',type:'Belief & ritual · 36 pages',title:'Aarti book',author:'Nasta Foundation, as listed by the community archive',description:'Prayers and songs for community gatherings and family worship.',url:'/documents/aarti-book.pdf',number:'04'}
];

export const familiarWordIds=['RAAH-0372','RAAH-0081','RAAH-0089','RAAH-0130','RAAH-0095','RAAH-0063','RAAH-0060','RAAH-0127','RAAH-0137','RAAH-0342','RAAH-0027','RAAH-0001'];
export function displayMeaning(text){return text?text.charAt(0).toUpperCase()+text.slice(1):text}
export const recordingWordIds=familiarWordIds.slice(0,10);
export const chapterArtifacts=[
 {image:'history-04',page:4,caption:'Hari K. Nasta’s community history · page 4.',label:'Origins · Bhag & Nar',note:'Ledger-inspired layout; the pictured page is a later history booklet.'},
 {image:'history-06',page:6,caption:'Hari K. Nasta’s community history · page 6.',label:'Life in Sindh',note:'Correspondence-inspired layout, not a surviving telegram.'},
 {image:'history-08',page:8,caption:'Hari K. Nasta’s community history · page 8.',label:'Passage · 1947–48',note:'Ticket-inspired layout; a family passage ticket is still sought.'},
 {image:'history-10',page:10,caption:'Hari K. Nasta’s community history · page 10.',label:'Rebuilding in Bombay',note:'Ration-card-inspired layout, not a surviving ration card.'},
 {image:'history-14',page:14,caption:'Hari K. Nasta’s community history · page 14.',label:'Family journeys',note:'Album-inspired layout; consented family photographs are still sought.'}
];

export function recipeMatchesWord(recipe,id){return recipe.wordId===id||Boolean(recipe.wordIds?.includes(id))}
