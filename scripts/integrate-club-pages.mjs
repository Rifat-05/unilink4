import {readFile,writeFile} from 'node:fs/promises';
for(const [file,kind,array,render] of [['Club/Club-events.html','clubEvents','events','renderEvents'],['Club/Club notice.html','clubNotices','notices','renderNotices']]){
  let html=await readFile(file,'utf8');const pos=html.indexOf('const club='),start=html.lastIndexOf('<script>',pos)+8,end=html.indexOf('</script>',pos);let js=html.slice(start,end);
  js=js.replace(/const club=\{[^\n]+\};/,`const api=UNILINK_API;const allClubs=(await api.get('/clubs')).data;const clubId=new URLSearchParams(location.search).get('club');const club=allClubs.find(c=>c.id===clubId)||allClubs[0];if(!club)throw new Error('No clubs yet. Create a club first.');
const selector=document.createElement('select');selector.setAttribute('aria-label','Select club');for(const c of allClubs){const option=new Option(c.name,c.id);selector.add(option);}selector.value=club.id;selector.onchange=()=>location.search='?club='+encodeURIComponent(selector.value);document.getElementById('club-name').after(selector);`);
  js=js.replace(new RegExp('const '+array+'=\\[[\\s\\S]*?\\n\\];'),`let ${array}=[]; async function reload(){const {data}=await api.get('/${kind}');${array}=data.filter(r=>r.parentId===club.id).map(r=>({registered:0,attendance:0,color:'',draft:'',planning:false,views:0,date:'',...r}));}await reload();`);
  js=js.replaceAll("Number(button.closest('[data-id]').dataset.id)","button.closest('[data-id]').dataset.id");
  js=js.replaceAll("form.addEventListener('submit',event=>","form.addEventListener('submit',async event=>");
  if(kind==='clubEvents')js=js.replace("if(existing)Object.assign(existing,data);else events.unshift({...data,id:Date.now(),registered:0,attendance:0,draft:'',color:'',planning:false});","try{if(existing)await api.patch('/clubEvents/'+existing.id,data);else await api.post('/clubEvents',{...data,clubId:club.id});await reload();}catch(e){toast(e.message);return;}");
  else js=js.replace(/if\(existing\)Object.assign\(existing,data\);else notices.unshift\(\{[\s\S]*?views:0\}\);/,"try{if(existing)await api.patch('/clubNotices/'+existing.id,data);else await api.post('/clubNotices',{...data,clubId:club.id});await reload();}catch(e){toast(e.message);return;}");
  js=js.replace("'confirm-delete').addEventListener('click',()=>","'confirm-delete').addEventListener('click',async()=>");
  const removal=kind==='clubEvents'?"const index=events.findIndex(e=>e.id===selectedEvent.id);if(index>=0)events.splice(index,1);":"const index=notices.findIndex(n=>n.id===deletingId);if(index>=0)notices.splice(index,1);";
  js=js.replace(removal,`try{await api.remove('/${kind}/'+${kind==='clubEvents'?'selectedEvent.id':'deletingId'});await reload();}catch(e){toast(e.message);return;}`);
  js=js.replace(/document.getElementById\('edit-form'\)\.addEventListener\('submit',event=>\{[^\n]+/,`document.getElementById('edit-form').addEventListener('submit',async event=>{event.preventDefault();try{await api.patch('/clubs/'+club.id,{name:document.getElementById('edit-name').value,year:Number(document.getElementById('edit-year').value)});location.reload();}catch(e){toast(e.message);}});`);
  // Unsupported attendance/broadcast actions must not claim a successful save.
  if(kind==='clubEvents')js=js.replace("if(button.dataset.action==='attendance'){","if(button.dataset.action==='attendance'){toast('Attendance registration is not available yet.');return;").replace("if(button.dataset.action==='message'){","if(button.dataset.action==='message'){toast('Event broadcasts are not available yet.');return;");
  js=js.replaceAll('৮৫ জন সদস্য','').replaceAll('ঘোষণা ডেমো তালিকায় প্রকাশিত হয়েছে।','Notice published.');
  html=html.slice(0,start)+'\n(async()=>{\n'+js+`\n})().catch(error=>{const target=document.getElementById('${kind==='clubEvents'?'event-empty':'notice-empty'}');target.hidden=false;target.textContent=error.message;});\n`+html.slice(end);
  await writeFile(file,html,'utf8');
}
