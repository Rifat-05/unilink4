import {readFile,writeFile} from 'node:fs/promises';
const file='Recruiter Search/Recruiter search.html';
let html=await readFile(file,'utf8');
const start=html.indexOf('const candidates=['), end=html.indexOf('</script>',start);
if(start<0)throw Error('Recruiter script not found');
let js=html.slice(start,end);
js=js.replace(/const candidates=\[[\s\S]*?\n\];/,`let candidates=[]; const api=UNILINK_API;
async function reloadCandidates(){ const {data}=await api.get('/candidates'); candidates=data.map(c=>({id:c.id,name:esc(c.name),initials:esc(c.name.split(/\\s+/).map(p=>p[0]).slice(0,2).join('')),subject:esc(c.department||''),subjectLabel:esc(c.department||''),university:esc(c.university||''),universityName:esc(c.university||''),cgpa:Number(c.cgpa||0),city:esc(c.city||''),year:esc(c.year||''),availability:esc(c.availability||''),availableLabel:esc(c.availability||''),skills:(c.skills||[]).map(esc),bio:esc(c.bio||''),work:[],top:false,color:'#8239ed'})); }
await reloadCandidates();
async function sendMessage(id,value){const {data:c}=await api.post('/conversations',{recipientId:id});await api.post('/messages',{conversationId:c.id,text:value});}
`);
js=js.replace('const saved=new Set([2,5]);','const savedRows=(await api.get("/savedCandidates")).data; const saved=new Set(savedRows.map(r=>r.userId));');
js=js.replaceAll("Number(button.closest('[data-id]').dataset.id)","button.closest('[data-id]').dataset.id");
js=js.replace("'candidate-grid').addEventListener('click',event=>","'candidate-grid').addEventListener('click',async event=>");
js=js.replace("const wasSaved=saved.has(c.id);wasSaved?saved.delete(c.id):saved.add(c.id);",`const wasSaved=saved.has(c.id);try{if(wasSaved){const rows=(await api.get('/savedCandidates')).data;for(const r of rows.filter(r=>r.userId===c.id))await api.remove('/savedCandidates/'+r.id);}else await api.post('/savedCandidates',{userId:c.id});const rows=(await api.get('/savedCandidates')).data;saved.clear();rows.forEach(r=>saved.add(r.userId));}catch(e){toast(e.message);return;}`);
js=js.replace("'message-form').addEventListener('submit',event=>","'message-form').addEventListener('submit',async event=>");
js=js.replace("drafts.set(selected.id,input.value.trim());", "try{await sendMessage(selected.id,input.value.trim());}catch(e){toast(e.message);return;}");
js=js.replace("'outreach-form').addEventListener('submit',event=>","'outreach-form').addEventListener('submit',async event=>");
js=js.replace("recipients.forEach(el=>drafts.set(Number(el.value),input.value.trim()));","try{for(const el of recipients)await sendMessage(el.value,input.value.trim());}catch(e){toast(e.message);return;}");
js=js.replace(/document.getElementById\('confirm-partnership'\)\.addEventListener\('click',[^\n]+/,"document.getElementById('confirm-partnership').disabled=true;document.getElementById('confirm-partnership').textContent='Partnership workflow unavailable';");
js=js.replaceAll('বার্তার খসড়া সংরক্ষিত হয়েছে।','Message sent.').replaceAll(' জন প্রার্থীর জন্য খসড়া সংরক্ষিত হয়েছে।',' recipients messaged.');
html=html.slice(0,start)+'(async()=>{\n'+js+'\n})().catch(error=>{document.getElementById("recruit-empty").hidden=false;document.getElementById("recruit-empty").textContent=error.message;});\n'+html.slice(end);
html=html.replaceAll('@.edu যাচাইকৃত','Profile information').replaceAll('যাচাইকৃত দক্ষতা','Listed skills');
await writeFile(file,html,'utf8');
