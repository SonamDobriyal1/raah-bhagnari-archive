import fs from 'node:fs';
// Corrections checked against the preserved page images. Raw sourceText stays unchanged.
const edits={
10:[['/4 tsp','¼ tsp'],['/2 tsp','½ tsp'],['12 tsp','½ tsp'],['1½ tsp ambchur','½ tsp ambchur']],
12:[['/½ tsp','½ tsp']],13:[['I2 tsp','½ tsp']],14:[['1 large. 2 medium','1 large, 2 medium'],['in o\npressure cooker','in a\npressure cooker'],['l"ginger','1" ginger']],
15:[['15 cups','1.5 cups']],16:[['/2 kg','½ kg'],['/½ kg','½ kg'],['/4 tbsp','¼ tbsp'],['1½ litre','½ litre']],17:[['12 liter','½ liter'],['I2 tsp','½ tsp'],['/½ tsp','½ tsp']],
19:[['25 cup','2.5 cup']],20:[['/2 tsp','½ tsp'],['14 tsp','¼ tsp'],['4 tsp garam','¼ tsp garam']],21:[['+bsps','tbsps'],['1 hanaful','1 handful'],['/2 tsp','½ tsp'],['I tsp','1 tsp'],['I2 tsp','½ tsp']],
22:[['+bsp','tbsp'],['2tbsp','2 tbsp'],['1 2 teaspoon','½ teaspoon']],24:[['14 onion','¼ onion']],28:[['/½ Cup','½ Cup']],29:[['/2 tea-spoon','½ tea-spoon'],['12 tea-spoon','½ tea-spoon']],
30:[['4 tspn turmeric','¼ tspn turmeric'],['/½ tspn','½ tspn'],['I tspn','1 tspn'],['12 tspn','½ tspn']],32:[['14 tsp','¼ tsp']],33:[['I2 teaspoon','½ teaspoon']],34:[['200 g\nflour','200 g gram flour'],['/½ teaspoon','½ teaspoon']],
35:[['12 kg mutton','½ kg mutton'],['1 /½ inch','1½ inch'],['I inch','1 inch'],['+blsp','tblsp'],['I2 tsp','½ tsp']],37:[['I2 dal-chini','½ dal-chini']],39:[['Garlic 4 kg','Garlic ¼ kg']],40:[['1/2 garlic','1½ garlic']],41:[['14 kg','¼ kg']],42:[['I" ginger','1" ginger'],['Iz teaspoon','½ teaspoon']],
43:[['+bsp','tbsp']],44:[['4 kg tomato','¼ kg tomato']],48:[['I2 tbsp','½ tbsp'],['/2 tsp','½ tsp'],['4 tsp haldi','¼ tsp haldi']],52:[['/4 kg','¼ kg'],['/2 tsp','½ tsp']],53:[['/2 kg','½ kg']],54:[['12kg tomatoes','½ kg tomatoes']],55:[['I tbsp','1 tbsp']]
};
const log=[];
function clean(page,text){for(const [from,to] of edits[page]||[]){if(text.includes(from)){text=text.split(from).join(to);log.push({page,from,to})}}return text.replace(/\s*\+bsp/g,' tbsp')}
function wrapIngredients(lines){
 const joined=[];let balance=0;
 for(const line of lines){
  const prev=joined.at(-1)||'';const fresh=/^[0-9¼½¾]/.test(line);if(fresh)balance=0;const continuation=joined.length&&!fresh&&(balance>0||/[-,]$/.test(prev)||/^\(|^[a-z]/.test(line)||/\b(?:of|and|to|for|the|with|grated|chopped|cooking)$/i.test(prev)||/^\d+(?:[.,]\d+)?\s*(?:gms?|kg|ml|tspn?|tbsp|teaspoons?|tablespoons?|cup|cups|liters?)?$/.test(prev));
  if(continuation)joined[joined.length-1]+=' '+line;else joined.push(line);
  balance+=(line.match(/\(/g)||[]).length-(line.match(/\)/g)||[]).length;
 }
 return joined;
}
function paragraphs(lines){return lines.join(' ').replace(/\s+/g,' ').trim().split(/(?<=[.!?])\s+(?=[A-Z])/).filter(Boolean)}
function readPart(chunks,title){
 const result={title,introduction:[],ingredientGroups:[],steps:[],notes:[]};let mode='intro',group=null,method=[];
 const newGroup=title=>{group={title,lines:[]};result.ingredientGroups.push(group)};
 for(const {page,lines}of chunks){
  for(const original of lines){let line=original.trim();if(!line||/^Credits\s*:/i.test(line))continue;
   if(/^Ingredients\s*$/i.test(line)){mode='ingredients';if(!group)newGroup('');continue}
   if(/^Method\s*$/i.test(line)){mode='method';continue}
   if(mode==='ingredients'&&/^(?:For\s.+:|Other Spices)$/i.test(line)){newGroup(line.replace(/:$/,''));continue}
   if(mode==='ingredients'&&title==='Khati dal masala'&&line==='Khati dal masala')continue;
   if(mode==='ingredients'){if(!group)newGroup('');group.lines.push(line)}else if(mode==='method')method.push(line);else result.introduction.push(line);
  }
 }
 result.introduction=paragraphs(result.introduction);result.steps=paragraphs(method);result.ingredientGroups=result.ingredientGroups.filter(g=>g.lines.length).map(g=>({title:g.title,items:wrapIngredients(g.lines)}));
 return result;
}
const records=JSON.parse(fs.readFileSync('content/recipes.json'));
for(const r of records){
 const chunks=r.sourceText.split(/PDF page (\d+)\n/).slice(1);const pages=[];
 for(let i=0;i<chunks.length;i+=2){const page=Number(chunks[i]);let lines=clean(page,chunks[i+1]).split('\n').filter(l=>l.trim());
  if(page===r.pdfPage||page===27)lines.shift();
  // Keep post-credit source notes out of cooking instructions; the archival text retains them.
  const credits=lines.findIndex(l=>/^Credits\s*:/i.test(l));if(credits>=0&&lines.slice(0,credits).some(l=>/^Method$/i.test(l)))lines=lines.slice(0,credits);
  pages.push({page,lines});
 }
 r.readingParts=r.wordId==='RAAH-0024'?[readPart(pages.filter(p=>p.page===26),'Khati dal masala'),readPart(pages.filter(p=>p.page===27),'Khati dal')]:[readPart(pages,'')];
 r.readingStatus='Source wording with reading layout and logged OCR corrections; original extraction retained.';r.format='text-with-source-link';
}
fs.writeFileSync('content/recipes.json',JSON.stringify(records,null,2)+'\n');fs.writeFileSync('public/data/recipes.json',JSON.stringify(records,null,2)+'\n');fs.writeFileSync('content/recipe-text-edits.json',JSON.stringify({basis:'Corrections checked against preserved cookbook page images; sourceText is never overwritten.',changes:log},null,2)+'\n');console.log(`Prepared ${records.length} text recipes; logged ${log.length} source-checked corrections.`);
