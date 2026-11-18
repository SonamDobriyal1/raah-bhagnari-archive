import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {searchEntries,normalise,chapters,resources} from '../src/library.js';
import {validateContribution} from '../api/contributions.js';
const entries=JSON.parse(fs.readFileSync('content/dictionary.json','utf8'));
test('the complete review edition retains distinct IDs and theme totals',()=>{
 assert.equal(entries.length,641);assert.equal(new Set(entries.map(e=>e.id)).size,641);
 assert.equal(new Set(entries.map(e=>e.theme)).size,14);
 assert.equal(entries.filter(e=>e.theme==='Food and Drink').length,55);
 assert.ok(entries.every(e=>/[\u0900-\u097f]/u.test(e.devanagari)&&e.status==='in-review'));
 assert.ok(entries.every(e=>e.hindiMeaning===null));
});
test('homonyms and source variations are preserved',()=>{
 const homonyms=entries.filter(e=>e.headword==='Bhee');assert.equal(homonyms.length,2);
 assert.ok(homonyms.some(e=>e.meaning.includes('Lotus root')));
 assert.ok(homonyms.some(e=>e.meaning.includes('Stop')));
 assert.ok(entries.some(e=>e.headword==='Khati dal'));assert.ok(entries.some(e=>e.headword==='Khatti Dal'));
});
test('search supports Roman forms, English meanings, Devanagari, IDs, themes and diacritics',()=>{
 assert.equal(searchEntries(entries,'RAAH-0372')[0].headword,'Gharr');
 assert.ok(searchEntries(entries,'घर').some(e=>e.id==='RAAH-0372'));
 assert.ok(searchEntries(entries,'home').some(e=>e.id==='RAAH-0372'));
 assert.ok(searchEntries(entries,'koki','Food and Drink').some(e=>e.id==='RAAH-0027'));
 assert.equal(searchEntries(entries,'koki','Numbers').length,0);
 assert.equal(normalise('Tawā'),'tawa');
 assert.equal(searchEntries(entries,'no_such_record').length,0);
});
test('editorial Hindi glosses remain separate from the supplied corpus and can be searched',()=>{
 const hindi=JSON.parse(fs.readFileSync('content/hindi-glosses.json','utf8'));
 assert.equal(Object.keys(hindi.meanings).length,60);assert.equal(hindi.status,'in-review');
 assert.match(hindi.provenance,/English glosses/);
 assert.ok(Object.keys(hindi.meanings).every(id=>entries.some(e=>e.id===id)));
 const merged=entries.map(e=>({...e,hindiMeaning:hindi.meanings[e.id]||null}));
 assert.ok(searchEntries(merged,'माता').some(e=>e.id==='RAAH-0081'));
 assert.equal(entries.find(e=>e.id==='RAAH-0081').hindiMeaning,null);
});
test('source corrections describe an earlier migration into Sindh',()=>{
 assert.equal(chapters[1].year,'1800s');assert.match(chapters[2].body,/sea, most from Karachi/);
 assert.equal(resources.length,4);assert.ok(resources.every(r=>r.url.startsWith('/documents/')));
});
const form={type:'word',title:'A family word',message:'Meaning and source',source:'Family notebook',name:'',contact:'',record:'',credit:'Keep me anonymous',access:'Private research only',consent:true};
test('contributions require consent, text fields and explicit use preferences',()=>{
 assert.equal(validateContribution({...form,consent:false}).error,'Please confirm you have permission to offer this material.');
 assert.ok(validateContribution({...form,access:'Everyone'}).error);
 assert.ok(validateContribution({...form,message:''}).error);
 assert.ok(validateContribution({...form,title:[]}).error);
 assert.ok(validateContribution({...form,message:'x'.repeat(12001)}).error);
 const valid=validateContribution({...form,status:'verified',privateSecret:'not accepted'}).value;
 assert.equal(valid.access,'Private research only');assert.equal(valid.credit,'Keep me anonymous');
 assert.equal(valid.status,undefined);assert.equal(valid.privateSecret,undefined);
});
