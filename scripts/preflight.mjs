import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const pkg=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'));
const required=['desktop/main.cjs','server/index.mjs','web/index.html','web/app.js','web/avatar-portrait.webp','web/avatar.js','web/voice-meter.js','web/style.css'];
const missing=required.filter(f=>!fs.existsSync(path.join(root,f)));
if(missing.length){console.error('Eksik paket dosyaları:',missing.join(', '));process.exitCode=1;}
else if(!pkg.build?.files?.some(p=>p==='server/**')||!pkg.build?.files?.some(p=>p==='web/**')){console.error('Backend veya web paketlenmiyor');process.exitCode=1;}
else console.log('Paket ön kontrolü başarılı:',required.length,'dosya, server ve web dahil.');
