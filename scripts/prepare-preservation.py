"""Build local access-copy metadata, an offline catalogue, and a portable backup."""
from pathlib import Path
from html import escape
from html.parser import HTMLParser
import hashlib,json,shutil
from zipfile import ZipFile,ZIP_DEFLATED
ROOT=Path(__file__).resolve().parents[1]
items=[('history','bhagnari-history.pdf','BHAGNARIS-History-PDF-1.pdf','History of We Bhagnaris',18),('cookbook','bhagnari-kitchen.pdf','From-Bhagnari-Kitchen.compressed.pdf','From Bhagnari Kitchen',60),('panchayat','panchayat-after-partition.pdf','History-of-panchayat-immediately-after-partition-1.pdf','Panchayat after Partition',11),('aarti','aarti-book.pdf','Aarti-book-by-Moti-Jham.pdf','Aarti book',36)]
manifest=json.loads((ROOT/'archive/download-manifest.json').read_text());documents=[]
for id,access,original,title,pages in items:
 source=ROOT/'archive/community-source'/original;dest=ROOT/'public/documents'/access
 assert source.read_bytes()==dest.read_bytes(),access
 origin=next(x['url'] for x in manifest if x['path'].endswith('/'+original))
 documents.append(dict(id=id,title=title,pages=pages,localUrl='/documents/'+access,originalUrl=origin,sha256=hashlib.sha256(source.read_bytes()).hexdigest(),bytes=source.stat().st_size,retrieved='2026-11-03',status='in-review',rights='Original rights and credits retained. Access copy; no claim of institutional clearance.'))
(ROOT/'content/documents.json').write_text(json.dumps(documents,indent=2)+'\n')
(ROOT/'public/data/document-register.json').write_text(json.dumps(documents,indent=2)+'\n')
class Links(HTMLParser):
 def __init__(self):super().__init__();self.links=set()
 def handle_starttag(self,tag,attrs):
  for key,value in attrs:
   if key in ('href','src') and value and any(x in value for x in ('youtube.com','youtu.be','/wp-content/uploads/')):self.links.add(value)
leads=[]
for page in (ROOT/'archive/community-source').glob('*.html'):
 parser=Links();parser.feed(page.read_text());
 for url in sorted(parser.links):
  preserved=any(x['url']==url for x in manifest)
  leads.append(dict(foundIn=page.name,url=url,status='preserved' if preserved else 'external-reference-not-preserved',note='Individual recordings/articles need separate cataloguing; navigation images are not archive evidence.'))
(ROOT/'archive/external-reference-inventory.json').write_text(json.dumps(leads,indent=2)+'\n')
supplied=ROOT/'archive/supplied';supplied.mkdir(exist_ok=True)
for name in ['RAAH Bhagnari Dictionary - with Devanagari.docx','RAAH — Design Review.md']:shutil.copy2(ROOT/name,supplied/name)
rows=[]
for item in manifest:
 p=ROOT/item['path'];assert p.exists() and hashlib.sha256(p.read_bytes()).hexdigest()==item['sha256'],p
 rel=p.relative_to(ROOT/'archive');rows.append(f'<li><a href="{escape(str(rel),quote=True)}">{escape(p.name)}</a><small>{escape(item["url"])}<br>SHA-256: {item["sha256"]}</small></li>')
html='''<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>RAAH offline preservation catalogue</title><style>body{max-width:900px;margin:40px auto;padding:0 24px;font:18px/1.7 Georgia,serif;background:#efe6d2;color:#1e1a16}a{color:#8e2a1e}li{margin:20px 0;overflow-wrap:anywhere}small{display:block;font:12px/1.8 monospace}h1,h2{font-weight:400}</style><h1>RAAH · Offline preservation catalogue</h1><p>This catalogue and the linked originals work without ebhagnaris.in. Open files directly from this folder. Source availability is not permission to republish or evidence of verification.</p><h2>Supplied material</h2><ul>'''+''.join(f'<li><a href="supplied/{escape(p.name,quote=True)}">{escape(p.name)}</a></li>' for p in supplied.iterdir())+'</ul><h2>Preserved public sources</h2><ul>'+''.join(rows)+'</ul><p><a href="../content/dictionary.json">Structured dictionary</a> · <a href="../content/recipes.json">Recipe summaries</a> · <a href="external-reference-inventory.json">Outstanding external references</a></p></html>'
(ROOT/'archive/index.html').write_text(html)
# Preserve the access derivatives as well as their PDF masters.
derivatives=ROOT/'archive/derivatives';derivatives.mkdir(exist_ok=True)
shutil.copytree(ROOT/'public/assets/scans',derivatives/'scans',dirs_exist_ok=True)
shutil.copytree(ROOT/'public/data',derivatives/'data',dirs_exist_ok=True)
# Include originals, source snapshots, structured records and editorial documentation; never credentials.
out=ROOT/'deliverables/raah-preservation-backup.zip';out.parent.mkdir(exist_ok=True)
with ZipFile(out,'w',ZIP_DEFLATED) as z:
 for folder in ['archive','content','docs']:
  for p in (ROOT/folder).rglob('*'):
   if p.is_file():z.write(p,str(p.relative_to(ROOT)))
 z.writestr('OPEN-ME.txt','Open archive/index.html for the offline catalogue. Original sources, supplied documents, data and editorial documentation are included. External video/blog leads are inventoried separately and are not claimed as complete backups. No credentials are included.\n')
print(json.dumps({'verifiedOriginals':len(manifest),'localDocumentCopies':len(documents),'externalReferencesInventoried':len(leads),'backup':str(out),'bytes':out.stat().st_size},indent=2))
