"""Import the supplied review edition without regularising spellings or merging homonyms."""
from pathlib import Path
from zipfile import ZipFile
import xml.etree.ElementTree as E
import json, re, collections

ROOT=Path(__file__).resolve().parents[1]
SOURCE=ROOT/'RAAH Bhagnari Dictionary - with Devanagari.docx'
NS={'w':'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
with ZipFile(SOURCE) as z: root=E.fromstring(z.read('word/document.xml'))
paragraphs=[]
for p in root.findall('.//w:p',NS):
    text=''.join('\n' if n.tag.endswith('}br') else (n.text or '') for n in p.iter() if n.tag.endswith('}t') or n.tag.endswith('}br'))
    paragraphs.append(text)
entries=[]; theme=None
for i,text in enumerate(paragraphs):
    if i+1<len(paragraphs) and re.match(r'^\d+ entries\. Alphabetised',paragraphs[i+1]): theme=text
    match=re.match(r'^(.*?)\s{2,}(.*?)\s{2,}(RAAH-\d{4})\s{2,}(.+)$',text,re.S)
    if not theme or not match: continue
    roman,dev,id,tail=match.groups()
    if any(e['id']==id for e in entries): continue
    definition,_,usage=tail.partition('\nUsage  ')
    example,_,translation=usage.partition('  ·  English  ')
    meaning,*notes=definition.split(' Note: ')
    entries.append(dict(id=id,headword=roman.strip(),devanagari=dev.strip(),meaning=meaning.strip(),notes=notes,example=example.strip(),translation=translation.strip(),theme=theme,status='in-review',source='dictionary-review-edition',hindiMeaning=None))
assert len(entries)==641, f'Expected 641 full entries, got {len(entries)}'
assert len({x['id'] for x in entries})==641
assert len({x['theme'] for x in entries})==14
for e in entries: assert re.search(r'[\u0900-\u097f]',e['devanagari']),e
out=ROOT/'content/dictionary.json';out.write_text(json.dumps(entries,ensure_ascii=False,indent=2)+'\n')
(ROOT/'public/data').mkdir(exist_ok=True)
(ROOT/'public/data/dictionary.json').write_text(out.read_text())
print(json.dumps({'entries':len(entries),'themes':dict(collections.Counter(x['theme'] for x in entries))},indent=2))
