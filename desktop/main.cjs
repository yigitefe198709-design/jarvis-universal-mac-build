'use strict';
const {app,BrowserWindow,dialog,session}=require('electron');
const {spawn}=require('node:child_process');
const path=require('node:path');
const net=require('node:net');
let backend=null;
let quitting=false;
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
function freePort(){return new Promise((resolve,reject)=>{const s=net.createServer();s.once('error',reject);s.listen(0,'127.0.0.1',()=>{const p=s.address().port;s.close(()=>resolve(p));});});}
async function start(){
 const port=await freePort();
 const root=app.getAppPath();
 const entry=path.join(root,'server','index.mjs');
 const base=`http://127.0.0.1:${port}`;
 const userData=app.getPath('userData');
 backend=spawn(process.execPath,[entry],{cwd:root,env:{...process.env,ELECTRON_RUN_AS_NODE:'1',PORT:String(port),HOST:'127.0.0.1',JARVIS_USER_DATA:userData},stdio:'ignore',windowsHide:true});
 backend.on('error',err=>{if(!quitting)dialog.showErrorBox('Jarvis AI',`Yerel sunucu başlatılamadı: ${err.message}`);});
 session.defaultSession.setPermissionRequestHandler((contents,permission,callback)=>{
  let trusted=false;
  try{const url=new URL(contents.getURL());trusted=url.origin===base;}catch{}
  callback(trusted&&permission==='media');
 });
 const win=new BrowserWindow({width:1200,height:820,show:false,webPreferences:{contextIsolation:true,nodeIntegration:false,sandbox:true,webSecurity:true}});
 win.webContents.setWindowOpenHandler(()=>({action:'deny'}));
 win.webContents.on('will-navigate',(event,url)=>{try{if(new URL(url).origin!==base)event.preventDefault();}catch{event.preventDefault();}});
 let ready=false;
 for(let i=0;i&lt;80;i++){
  if(backend.exitCode!==null||backend.signalCode!==null)break;
  try{const response=await fetch(`${base}/api/health`,{signal:AbortSignal.timeout(1000)});if(response.ok){ready=true;break;}}catch{}
  await sleep(250);
 }
 if(!ready){dialog.showErrorBox('Jarvis AI','Yerel sunucu başlatılamadı. Uygulama kapatılıyor.');app.quit();return;}
 await win.loadURL(base+'/');
 win.show();
}
app.whenReady().then(start).catch(error=>{dialog.showErrorBox('Jarvis AI',String(error));app.quit();});
app.on('before-quit',()=>{quitting=true;if(backend&&backend.exitCode===null)backend.kill();});
app.on('window-all-closed',()=>app.quit());
