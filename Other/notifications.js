window.installLiveNotifications = function () {
  const triggers=[...document.querySelectorAll('#notifications,.notifications,.notification-btn,.bell,[data-notifications]')];
  if(!triggers.length)return;
  document.querySelectorAll('.popover,.notification-panel,#notification-panel').forEach(el=>{el.hidden=true;el.replaceChildren();});
  const panel=document.createElement('aside');panel.className='unilink-notification-center';panel.setAttribute('aria-label','Notifications');panel.setAttribute('aria-hidden','true');
  panel.innerHTML='<div class="unilink-notification-head"><h2>Notifications</h2><button type="button" aria-label="Close notifications">×</button></div><div class="unilink-notification-list"></div><button type="button" class="unilink-notification-read">Mark all as read</button>';
  document.body.append(panel);const list=panel.querySelector('.unilink-notification-list');
  async function refresh(){list.textContent='Loading…';try{const {data}=await UNILINK_API.get('/notifications');list.replaceChildren();if(!data.length)list.textContent='No notifications yet.';for(const n of data){const item=document.createElement('article');item.className='unilink-notification'+(n.read_at?'':' unread');const title=document.createElement('strong'),body=document.createElement('p'),time=document.createElement('time');title.textContent=n.title;body.textContent=n.body;time.textContent=new Date(n.created_at).toLocaleString();item.append(title,body,time);list.append(item);}}catch(e){list.textContent=e.message;}}
  const close=()=>{panel.classList.remove('open');panel.setAttribute('aria-hidden','true');triggers.forEach(t=>t.setAttribute('aria-expanded','false'));};
  for(const trigger of triggers)trigger.addEventListener('click',event=>{event.preventDefault();event.stopImmediatePropagation();if(panel.classList.contains('open'))close();else{panel.classList.add('open');panel.setAttribute('aria-hidden','false');trigger.setAttribute('aria-expanded','true');refresh();}},true);
  panel.querySelector('.unilink-notification-head button').onclick=close;
  panel.querySelector('.unilink-notification-read').onclick=async()=>{try{await UNILINK_API.post('/notifications/read',{});await refresh();}catch(e){list.textContent=e.message;}};
  document.addEventListener('keydown',event=>{if(event.key==='Escape')close();});
};
