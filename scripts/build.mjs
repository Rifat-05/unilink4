import { mkdir, cp, readdir, readFile, writeFile } from 'node:fs/promises';
await mkdir('public', { recursive: true });
for (const path of ['index.html','Other','Admin','Club','Study Partner','Recruiter Search','Live Bid']) await cp(path, `public/${path}`, { recursive: true });
async function inject(dir) {
  for (const entry of await readdir(dir,{withFileTypes:true})) {
    const file=`${dir}/${entry.name}`;
    if(entry.isDirectory()) await inject(file);
    else if(entry.name.endsWith('.html')) { let html=await readFile(file,'utf8'); if(!html.includes('/Other/api.js')) html=html.replace('</head>','<link rel="stylesheet" href="/Other/theme.css"><script src="/Other/api.js"></script><script src="/Other/global-ui.js" defer></script></head>'); await writeFile(file,html); }
  }
}
await inject('public');
console.log('Website assets copied to public/.');
