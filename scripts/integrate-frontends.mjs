import {readFile,writeFile,readdir} from 'node:fs/promises';
async function edit(file,fn){const source=await readFile(file,'utf8');const next=fn(source);await writeFile(file,next,'utf8');}
await edit('Study Partner/Message.html',s=>s.replace(/<script>\(\(\) => \{[\s\S]*?\}\)\(\);<\/script>/,'<script src="/Other/messages.js" defer></script>'));
await edit('Other/global-ui.js',s=>s.replace(/  function installNotifications\(\) \{[\s\S]*?\n  function set\(/,'  function installNotifications() { window.installLiveNotifications?.(); }\n  function set('));
// Shared dependencies are explicit in source so local and Vercel builds agree.
async function walk(dir){for(const entry of await readdir(dir,{withFileTypes:true})){const file=`${dir}/${entry.name}`;if(entry.isDirectory())await walk(file);else if(entry.name.endsWith('.html'))await edit(file,s=>{if(!s.includes('/Other/api.js'))s=s.replace('</head>','<script src="/Other/api.js"></script></head>');if(!s.includes('/Other/notifications.js'))s=s.replace('</head>','<script src="/Other/notifications.js"></script></head>');if(!s.includes('/Other/global-ui.js'))s=s.replace('</head>','<script src="/Other/global-ui.js" defer></script></head>');return s;});}}
for(const folder of ['Other','Study Partner','Club','Admin','Recruiter Search','Live Bid'])await walk(folder);
console.log('Messages and notifications integrated; shared dependencies added.');
