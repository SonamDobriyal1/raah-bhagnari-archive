import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {searchEntries,chapterAtReadingLine} from '../src/library.js';
const entries=JSON.parse(fs.readFileSync('content/dictionary.json'));
test('exact English meanings rank before example-only matches',()=>{const results=searchEntries(entries,'mother');assert.equal(results[0].headword,'Maa');assert.ok(results.findIndex(e=>e.headword==='Dharkaa')>results.findIndex(e=>e.headword==='Maa'))});
test('the active chapter follows the reading line, including the last chapter',()=>{const bounds=[{top:-300,bottom:-200},{top:-150,bottom:-100},{top:0,bottom:100},{top:120,bottom:200},{top:240,bottom:400}];assert.equal(chapterAtReadingLine(bounds,150),3);assert.equal(chapterAtReadingLine(bounds,250),4);assert.equal(chapterAtReadingLine([{top:200,bottom:400}],150),0)});
