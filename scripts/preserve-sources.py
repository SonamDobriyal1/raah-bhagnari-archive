"""Preserve public source files; write a checksum and URL for each download."""
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
import json, hashlib, urllib.request, datetime

ROOT = Path(__file__).resolve().parents[1]
site = 'https://raah-one.vercel.app'
paths = json.loads((ROOT/'archive/original-site/asset-paths.json').read_text())
items = [(site+p, ROOT/'archive/original-site'/p.lstrip('/')) for p in paths]
community = 'https://ebhagnaris.in'
for slug in ['the-bhagnari-archives', 'the-bhagnari-dictionary', 'history', 'the-bhagnari-youtube-playlist', 'the-community-blog']:
    items.append((f'{community}/{slug}/', ROOT/f'archive/community-source/{slug}.html'))
for filename in ['BHAGNARIS-History-PDF-1.pdf', 'History-of-panchayat-immediately-after-partition-1.pdf', 'From-Bhagnari-Kitchen.compressed.pdf']:
    items.append((f'{community}/wp-content/uploads/2020/01/{filename}', ROOT/'archive/community-source'/filename))
items.append((f'{community}/wp-content/uploads/2023/12/Aarti-book-by-Moti-Jham.pdf', ROOT/'archive/community-source/Aarti-book-by-Moti-Jham.pdf'))

def download(item):
    url, dest = item
    try:
        req = urllib.request.Request(url, headers={'User-Agent':'RAAH archive research/1.0'})
        with urllib.request.urlopen(req, timeout=45) as response: data = response.read()
        dest.parent.mkdir(parents=True, exist_ok=True)
        dest.write_bytes(data)
        return {'url':url, 'path':str(dest.relative_to(ROOT)), 'bytes':len(data), 'sha256':hashlib.sha256(data).hexdigest(), 'retrieved':'2026-11-03', 'use':'Preserved research source; original attribution and rights apply.'}
    except Exception as exc: return {'url':url, 'error':str(exc)}

with ThreadPoolExecutor(max_workers=6) as pool: records=list(pool.map(download,items))
(ROOT/'archive/download-manifest.json').write_text(json.dumps(records,indent=2))
print(json.dumps({'saved':sum('path' in x for x in records),'failures':[x for x in records if 'error' in x]},indent=2))
