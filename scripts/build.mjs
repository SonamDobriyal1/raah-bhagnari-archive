import {generateSocialImages} from './social-images.mjs';
import {pageMetadata} from '../src/pageMetadata.js';
import {build,loadEnv} from 'vite';
import fs from 'node:fs/promises';
import path from 'node:path';
await build({logLevel:'warn',build:{rollupOptions:{output:{manualChunks:{react:['react','react-dom/client']}}}}});
await build({logLevel:'warn',build:{ssr:'src/server.jsx',outDir:'tmp/server',emptyOutDir:true}});
const {render,applyPublished}=await import('../tmp/server/server.js');
const template=await fs.readFile('dist/index.html','utf8');
let site={journeys:[],words:[],removedWordIds:[],recipes:[]};
try{site={...site,...JSON.parse(await fs.readFile('public/data/site-content.json','utf8'))}}catch{}
applyPublished(site);
const removed=new Set(site.removedWordIds||[]);
const entries=JSON.parse(await fs.readFile('content/dictionary.json','utf8')).filter(entry=>!removed.has(entry.id)).concat((site.words||[]).filter(entry=>entry?.id&&!removed.has(entry.id)));
const recipes=JSON.parse(await fs.readFile('content/recipes.json','utf8')).concat((site.recipes||[]).filter(entry=>entry?.community));
const routes=['/','/about','/community','/journey','/migration','/words','/dishes','/collections','/voices','/photographs','/contribute','/admin'];
for(const e of entries){routes.push('/words/'+e.id);if(e.theme==='Food and Drink')routes.push('/dishes/'+e.id)}
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const productionOrigin=process.env.VERCEL_PROJECT_PRODUCTION_URL?`https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`:'';
const configured=(process.env.SITE_URL||loadEnv('production',process.cwd(),'').SITE_URL||productionOrigin)?.replace(/\/$/,'');
const origin=configured&&/^https:\/\/[^/]+$/.test(configured)?configured:null;
await generateSocialImages(entries);
function htmlFor(route){const meta=pageMetadata(route,{entries,recipes}),imageOrigin=origin||'https://raah-bhagnari-archive.vercel.app';
 const tags=`<meta property="og:title" content="${escape(meta.title)}"/><meta property="og:description" content="${escape(meta.description)}"/><meta property="og:type" content="website"/><meta property="og:image" content="${imageOrigin}/og/${meta.imageId}.png"/><meta property="og:image:width" content="1200"/><meta property="og:image:height" content="630"/><meta property="og:image:type" content="image/png"/><meta property="og:image:alt" content="${escape(meta.title)}"/><meta name="twitter:card" content="summary_large_image"/>${meta.noindex?'<meta name="robots" content="noindex, follow"/>':''}${origin?`<link rel="canonical" href="${escape(origin+meta.canonicalPath)}"/><meta property="og:url" content="${escape(origin+meta.canonicalPath)}"/>`:''}`;
 return template.replace(/<title>.*?<\/title>/,`<title>${escape(meta.title)}</title>`).replace(/<meta name="description"[^>]*>/,`<meta name="description" content="${escape(meta.description)}"/>`).replace('<div id="root"></div>',`<div id="root">${render(route)}</div>`).replace('</head>',tags+'</head>');
}
for(const route of routes){const destination=path.join('dist',route,'index.html');await fs.mkdir(path.dirname(destination),{recursive:true});await fs.writeFile(destination,htmlFor(route))}
await fs.writeFile('dist/404.html',htmlFor('/not-found'));
await fs.writeFile('dist/robots.txt',`User-agent: *\nAllow: /\nDisallow: /api/\nDisallow: /dossiers/\n${origin?`Sitemap: ${origin}/sitemap.xml\n`:''}`);
if(origin){const canonical=[...new Set(routes.map(r=>pageMetadata(r,{entries,recipes})).filter(m=>!m.noindex&&m.canonicalPath!=='/contribute').map(m=>m.canonicalPath))];await fs.writeFile('dist/sitemap.xml',`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${canonical.map(r=>`<url><loc>${escape(origin+r)}</loc></url>`).join('')}</urlset>`)}
console.log(`Built ${routes.length} readable HTML pages. ${origin?'Canonical URLs and sitemap included.':'Set SITE_URL to add canonical URLs and a sitemap.'}`);
