import fs from 'node:fs';
const words=JSON.parse(fs.readFileSync('content/dictionary.json')).filter(w=>w.theme==='Food and Drink');const recipes=JSON.parse(fs.readFileSync('content/recipes.json'));
const json=data=>"'"+JSON.stringify(data).replaceAll("'","''")+"'::jsonb";
const food=words.map(w=>({id:w.id,headword:w.headword,devanagari:w.devanagari,english_meaning:w.meaning,source_record:w}));
const rows=recipes.map(r=>({id:r.id,name:r.name,cook_credit:r.credit,pdf_pages:r.pdfPages,source_url:r.sourceUrl,source_record:r}));
const links=recipes.flatMap(r=>r.wordIds.map(word_id=>({recipe_id:r.id,word_id,match_note:r.matchNote})));
const sql=`begin;
insert into archive_catalogue.food_words(id,headword,devanagari,english_meaning,source_record)
select id,headword,devanagari,english_meaning,source_record from jsonb_to_recordset(${json(food)}) as x(id text,headword text,devanagari text,english_meaning text,source_record jsonb)
on conflict(id) do update set headword=excluded.headword,devanagari=excluded.devanagari,english_meaning=excluded.english_meaning,source_record=excluded.source_record;
insert into archive_catalogue.recipes(id,name,cook_credit,pdf_pages,source_url,source_record)
select id,name,cook_credit,pdf_pages,source_url,source_record from jsonb_to_recordset(${json(rows)}) as x(id text,name text,cook_credit text,pdf_pages integer[],source_url text,source_record jsonb)
on conflict(id) do update set name=excluded.name,cook_credit=excluded.cook_credit,pdf_pages=excluded.pdf_pages,source_url=excluded.source_url,source_record=excluded.source_record,updated_at=now();
insert into archive_catalogue.recipe_words(recipe_id,word_id,match_note)
select recipe_id,word_id,match_note from jsonb_to_recordset(${json(links)}) as x(recipe_id text,word_id text,match_note text)
on conflict(recipe_id,word_id) do update set match_note=excluded.match_note;
commit;`;
fs.mkdirSync('tmp',{recursive:true});fs.writeFileSync('tmp/recipe-catalogue-seed.sql',sql);console.log('Prepared '+food.length+' food words, '+rows.length+' recipes and '+links.length+' links.');
