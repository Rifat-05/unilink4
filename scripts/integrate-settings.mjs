import {readFile,writeFile} from 'node:fs/promises';
const file='Other/Settings.html';let html=await readFile(file,'utf8');
html=html.replace(/<script>([\s\S]*?)<\/script>/g,(all,body)=>body.includes('const defaults=')?'<script src="/Other/account-settings.js" defer></script>':all);
await writeFile(file,html,'utf8');
