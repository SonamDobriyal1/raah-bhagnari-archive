import {Resvg} from '@resvg/resvg-js';
import fs from 'node:fs/promises';
import path from 'node:path';
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function lines(text,max=48,count=2){const words=String(text).split(/\s+/),out=[];let line='';for(const w of words){if((line+' '+w).trim().length>max&&line){out.push(line);line=w}else line=(line+' '+w).trim()}if(line)out.push(line);return out.slice(0,count).map((x,i)=>i===count-1&&out.length>count?x.slice(0,-1)+'…':x)}
export async function generateSocialImages(entries,destination='dist/og'){
 await fs.mkdir(destination,{recursive:true});
 const fonts=['Spectral-Regular.ttf','TiroDevanagariHindi-Regular.ttf'].map(f=>path.resolve('assets/og-fonts',f));
 for(const e of [...entries,{id:'archive',devanagari:'राह',headword:'What we carried. What we keep.',meaning:'The Bhagnari Living Archive'}]){
  const nativeSize=e.devanagari.length>25?56:e.devanagari.length>14?72:104;
  const roman=lines(e.headword,45,2),meaning=lines(e.meaning,65,2);
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630"><rect width="1200" height="630" fill="#f3ecdd"/><rect x="32" y="32" width="1136" height="566" fill="none" stroke="#a99b83"/><path d="M72 104H1128" stroke="#a99b83"/><text x="72" y="80" font-family="Spectral" font-size="26" fill="#293d51">RAAH / THE BHAGNARI LIVING ARCHIVE</text><text x="72" y="238" font-family="Tiro Devanagari Hindi" font-size="${nativeSize}" fill="#293d51">${escape(e.devanagari)}</text>${roman.map((l,i)=>`<text x="72" y="${318+i*48}" font-family="Spectral" font-size="42" fill="#293d51">${escape(l)}</text>`).join('')}${meaning.map((l,i)=>`<text x="72" y="${430+i*36}" font-family="Spectral" font-size="29" fill="#5f5447">${escape(l)}</text>`).join('')}<path d="M72 518H1128" stroke="#a99b83"/><text x="72" y="562" font-family="Spectral" font-size="23" fill="#833e34">${e.id==='archive'?'WORDS · KITCHENS · JOURNEYS':'BHAGNARI WORDS &amp; MEANINGS'}</text></svg>`;
  const png=new Resvg(svg,{font:{fontFiles:fonts,loadSystemFonts:false}}).render().asPng();
  await fs.writeFile(path.join(destination,e.id+'.png'),png);
 }
}
