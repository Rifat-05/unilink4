import 'dotenv/config';
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { handler } from './lib/app.js';
const root=fileURLToPath(new URL('.',import.meta.url));
const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.png':'image/png','.svg':'image/svg+xml'};
export async function localHandler(req,res) {
  const path=new URL(req.url,'http://localhost').pathname;
  if(path.startsWith('/api/'))return handler(req,res);
  try {
    const decoded=decodeURIComponent(path==='/'?'/index.html':path), file=resolve(root,'.'+decoded);
    const allowed=decoded==='/index.html'||/^\/(Other|Admin|Club|Study Partner|Recruiter Search|Live Bid)\//.test(decoded);
    if(!allowed||relative(root,file).startsWith('..')||!mime[extname(file)]){res.writeHead(404);return res.end('Not found');}
    if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);return res.end();}
    const bytes=await readFile(file);res.writeHead(200,{'Content-Type':mime[extname(file)],'X-Content-Type-Options':'nosniff'});res.end(req.method==='HEAD'?undefined:bytes);
  }catch{res.writeHead(404);res.end('Not found');}
}
export function createApp(){return http.createServer(localHandler);}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))createApp().listen(Number(process.env.PORT||3000),()=>console.log(`UniLink running at http://localhost:${process.env.PORT||3000}`));
