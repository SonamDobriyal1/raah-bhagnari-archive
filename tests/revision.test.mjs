import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {chapters,chapterArtifacts,familiarWordIds,recordingWordIds,displayMeaning} from '../src/library.js';
const entries=JSON.parse(fs.readFileSync('content/dictionary.json','utf8'));
test('all complete access PDFs match their preserved originals and retain provenance',()=>{
 const docs=JSON.parse(fs.readFileSync('content/documents.json','utf8'));
 assert.equal(docs.length,4);
 for(const d of docs){assert.ok(d.originalUrl.startsWith('https://ebhagnaris.in/'));const bytes=fs.readFileSync('public'+d.localUrl);assert.equal(createHash('sha256').update(bytes).digest('hex'),d.sha256);assert.ok(d.pages>0)}
});
test('discovery and ten recording slots refer to real distinct source entries',()=>{
 assert.equal(new Set(familiarWordIds).size,12);assert.equal(recordingWordIds.length,10);
 for(const id of familiarWordIds)assert.ok(entries.find(e=>e.id===id));
 assert.equal(entries.find(e=>e.id===familiarWordIds[2]).headword,'Naani');
});
test('five era treatments have real source pages, without masquerading as period objects',()=>{
 assert.equal(new Set(chapters.map(c=>c.material)).size,5);assert.equal(chapterArtifacts.length,5);
 for(const a of chapterArtifacts){assert.ok(fs.existsSync('public/assets/scans/'+a.image+'.jpg'));assert.ok(a.note.length>30);assert.ok(a.page>0)}
});
test('capitalisation is a display layer and homonyms are not merged',()=>{
 assert.equal(displayMeaning('obey.'),'Obey.');assert.equal(entries.find(e=>e.id==='RAAH-0113').meaning,'obey.');
 assert.equal(entries.filter(e=>e.meaning==='Stop.').length,2);assert.equal(entries.find(e=>e.id==='RAAH-0372').headword,'Gharr');
});
test('derived recipe sources are local while original URLs survive',()=>{
 const recipes=JSON.parse(fs.readFileSync('content/recipes.json','utf8'));
 assert.ok(recipes.every(r=>r.sourceUrl.startsWith('/documents/')&&r.originalSourceUrl.startsWith('https://ebhagnaris.in/')));
});
