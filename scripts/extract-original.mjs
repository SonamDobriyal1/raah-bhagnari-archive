import fs from 'node:fs';
import vm from 'node:vm';
const text = fs.readFileSync('archive/original-site/assets/index-CBwaI9MS.js','utf8');
// Read only the five data-array literals, never execute the application bundle.
function arrayAfter(marker) {
  const pos=text.indexOf(marker,257000), start=text.indexOf('[',pos);
  if(pos<0) throw new Error(`Missing data marker: ${marker}`);
  let depth=0, quote=null, escaped=false;
  for(let i=start;i<text.length;i++) {
    const ch=text[i];
    if(quote) { if(escaped) escaped=false; else if(ch==='\\') escaped=true; else if(ch===quote) quote=null; continue; }
    if(['`','"',"'"].includes(ch)){quote=ch;continue;}
    if(ch==='[')depth++;
    if(ch===']' && --depth===0)return text.slice(start,i+1);
  }
  throw new Error('Unterminated data array');
}
const context={
  Kn:(id,date,language)=>[{label:'Accession',value:id},{label:'Recorded',value:date},{label:'Language',value:language},{label:'Place',value:'Mumbai'}],
  Jn:x=>x,
  er:x=>Object.entries(x).map(([label,value])=>({label,value})),
  $n:x=>`https://commons.wikimedia.org/wiki/File:${encodeURIComponent(x)}`
};
const out={};
for(const [key,marker] of Object.entries({chapters:'var k=[{id:`stage-1`',voices:'A=[{id:`voice-1`',dishes:'Yn=[{id:`dish-1`',words:'Zn=[{id:`word-1`',photographs:'tr=[{id:`photo-1`'}))
  out[key]=vm.runInNewContext('('+arrayAfter(marker)+')',context,{timeout:1000});
fs.writeFileSync('content/original-records.json',JSON.stringify(out,null,2));
console.log(Object.fromEntries(Object.entries(out).map(([k,v])=>[k,v.length])));
