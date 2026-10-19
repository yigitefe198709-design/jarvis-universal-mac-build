import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const web=path.join(root,'web');
const port=Number(process.env.PORT||8787);
const host=process.env.HOST||'127.0.0.1';
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.webp':'image/webp','.json':'application/json; charset=utf-8','.webmanifest':'application/manifest+json; charset=utf-8'};
const readBody=req=>new Promise((resolve,reject)=>{let data='';req.on('data',chunk=>{data+=chunk;if(data.length>20000){reject(new Error('Too large'));req.destroy();}});req.on('end',()=>resolve(data));req.on('error',reject);});
function send(res,status,data,type='application/json; charset=utf-8'){res.writeHead(status,{'Content-Type':type,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(typeof data==='string'?data:JSON.stringify(data));}
const server=http.createServer(async(req,res)=>{
 try{
 const url=new URL(req.url,`http://${host}:${port}`);
 if(url.pathname==='/api/health')return send(res,200,{ok:true,service:'jarvis-ai'});
 if(url.pathname==='/api/chat'&&req.method==='POST'){
  const body=JSON.parse(await readBody(req));const message=String(body.message||'').trim().slice(0,5000);
  if(!message)return send(res,400,{error:'Boş mesaj'});
  const key=process.env.OPENAI_API_KEY;
  if(!key)return send(res,503,{error:'OpenAI API anahtarı ayarlanmamış. Bu sürümde yerel AI bağlı değil.'});
  const upstream=await fetch('https://api.openai.com/v1/chat/completions',{method:'POST',headers:{'Authorization':`Bearer ${key}`,'Content-Type':'application/json'},body:JSON.stringify({model:process.env.OPENAI_MODEL||'gpt-4.1-mini',messages:[{role:'system',content:'Sen Jarvis adlı Türkçe konuşan yardımcı asistansın. Yapamadığın işlemleri yaptım deme.'},{role:'user',content:message}]})});
  const payload=await upstream.json();if(!upstream.ok)return send(res,502,{error:payload.error?.message||'AI hizmet hatası'});
  return send(res,200,{reply:payload.choices?.[0]?.message?.content||'Yanıt alınamadı'});
 }
 if(req.method!=='GET')return send(res,405,{error:'Method not allowed'});
 const pathname=decodeURIComponent(url.pathname==='/'?'/index.html':url.pathname);
 const file=path.resolve(web,'.'+pathname);
 if(!file.startsWith(web+path.sep))return send(res,403,{error:'Forbidden'});
 fs.readFile(file,(err,data)=>{if(err)return send(res,404,{error:'Not found'});send(res,200,data,types[path.extname(file)]||'application/octet-stream');});
 }catch(err){send(res,500,{error:String(err.message||err)});}
});
server.listen(port,host,()=>console.log(`Jarvis AI listening on http://${host}:${port}`));
