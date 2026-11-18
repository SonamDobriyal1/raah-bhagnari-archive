import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
const walk=async dir=>(await Promise.all((await fs.readdir(dir,{withFileTypes:true})).map(e=>e.isDirectory()?walk(path.join(dir,e.name)):path.join(dir,e.name)))).flat();
const files=await walk('dist');const html=files.filter(f=>f.endsWith('.html'));
let links=0;const missing=new Set();
for(const file of html){
 const text=await fs.readFile(file,'utf8');
 assert.ok(text.includes('<h1>'),`Missing readable heading: ${file}`);
 assert.ok(text.includes('id="main"'),`Missing main landmark: ${file}`);
 assert.ok(!text.includes('SUPABASE_SERVICE_ROLE_KEY'),`Server configuration exposed in ${file}`);
 for(const [,raw]of text.matchAll(/(?:href|src)="(\/[^"#]*)"/g)){
  const route=decodeURIComponent(raw.split(/[?#]/)[0]);
  const exact=path.join('dist',route);let exists=false;
  for(const candidate of [exact,path.join(exact,'index.html')]){try{const st=await fs.stat(candidate);if(st.isFile())exists=true}catch{}}
  links++;if(!exists)missing.add(raw);
 }
}
assert.equal(missing.size,0,'Broken internal references: '+[...missing].join(', '));
const home=await fs.readFile('dist/index.html','utf8');assert.match(home,/What we carried/);
const entry=await fs.readFile('dist/words/RAAH-0372/index.html','utf8');assert.match(entry,/Come to my house/);assert.match(entry,/घर; निवास/);
const recipe=await fs.readFile('dist/dishes/RAAH-0027/index.html','utf8');assert.match(recipe,/Kanika Dudeja/);assert.match(recipe,/#page=29/);
console.log(`Verified ${html.length} HTML files and ${links} local references. All records render as HTML; no broken internal links or asset references.`);
