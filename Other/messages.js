(async()=>{
  const $=id=>document.getElementById(id), api=window.UNILINK_API;
  let me, conversations=[],selected=null,busy=false;
  const status=message=>$('message-status').textContent=message;
  const name=c=>c.members.filter(m=>m.id!==me.id).map(m=>m.name).join(', ');
  async function loadMessages(){
    if(!selected)return;
    const id=selected;const {data}=await api.get('/messages?conversationId='+encodeURIComponent(id));if(selected!==id)return;
    const history=$('chat-history');history.replaceChildren();
    for(const m of data){const article=document.createElement('article');article.className='message'+(m.ownerId===me.id?' sent':'');const bubble=document.createElement('div');bubble.className='bubble';bubble.textContent=m.text;const time=document.createElement('small');time.textContent=new Date(m.createdAt).toLocaleString();article.append(bubble,time);history.append(article);}
    history.scrollTop=history.scrollHeight;
  }
  function render(){
    const query=$('conversation-search').value.toLowerCase();$('conversation-list').replaceChildren();
    for(const c of conversations.filter(c=>name(c).toLowerCase().includes(query))){const button=document.createElement('button');button.className='conversation'+(selected===c.id?' active':'');button.textContent=name(c);button.onclick=async()=>{selected=c.id;$('chat-name').textContent=name(c);$('message-text').disabled=false;$('send-message').disabled=false;render();try{await loadMessages();}catch(e){status(e.message);}};$('conversation-list').append(button);}
    $('conversation-count').textContent=conversations.length;$('no-conversations').hidden=conversations.length>0;
  }
  $('message-text').disabled=true;$('send-message').disabled=true;
  document.querySelector('#message-form p').textContent='Messages are delivered to conversation members.';
  document.querySelector('.chat-header p').textContent='Private conversation';
  $('chat-name').textContent='Choose a conversation';
  const form=document.createElement('form');form.innerHTML='<label>Start a conversation<input name="query" placeholder="Search registered users" required maxlength="100"></label><button type="submit">Search</button><div></div>';
  document.querySelector('.inbox>header').append(form);
  form.onsubmit=async event=>{event.preventDefault();try{const {data}=await api.get('/users?q='+encodeURIComponent(form.elements.query.value));const list=form.querySelector('div');list.replaceChildren();if(!data.length)list.textContent='No users found.';for(const u of data){const button=document.createElement('button');button.type='button';button.textContent=u.name+' · '+u.university;button.onclick=async()=>{try{const {data:c}=await api.post('/conversations',{recipientId:u.id});selected=c.id;await refresh();$('chat-name').textContent=u.name;$('message-text').disabled=false;$('send-message').disabled=false;await loadMessages();list.replaceChildren();}catch(e){status(e.message);}};list.append(button);}}catch(e){status(e.message);}};
  async function refresh(){({data:conversations}=await api.get('/conversations'));render();}
  $('conversation-search').oninput=render;
  $('message-form').onsubmit=async event=>{event.preventDefault();if(busy||!selected)return;const value=$('message-text').value.trim();if(!value)return;busy=true;$('send-message').disabled=true;try{await api.post('/messages',{conversationId:selected,text:value});$('message-text').value='';status('Sent');await loadMessages();}catch(e){status(e.message);}finally{busy=false;$('send-message').disabled=false;}};
  try{({user:me}=await api.get('/auth/me'));await refresh();setInterval(()=>{if(!document.hidden)loadMessages().catch(e=>status(e.message));},5000);}catch(e){status(e.message+' — please log in.');}
})();
