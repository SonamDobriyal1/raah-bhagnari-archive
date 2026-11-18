import handler from '../../server/community-handler.js';
export const config={api:{bodyParser:{sizeLimit:'2mb'}}};
export default function entry(req,res){
  const raw=String(req.url||'');
  const query=raw.includes('?')?raw.slice(raw.indexOf('?')):'';
  req.url='/api/community/recipe'+query;
  return handler(req,res);
}
