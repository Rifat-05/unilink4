(async()=>{
  const $=id=>document.getElementById(id), form=$('settings-form');
  const status=message=>$('save-status').textContent=message;
  const fields={'phone':'phone','university':'university','department':'department','year':'year','skills':'skills','recruiter-visible':'recruiterVisible','matching-visible':'matchingVisible'};
  let user;
  async function load(){({user}=await UNILINK_API.get('/auth/me'));$('full-name').value=user.firstName+' '+user.lastName;$('email').value=user.email;for(const [id,key] of Object.entries(fields)){const el=$(id);if(el.type==='checkbox')el.checked=Boolean(user[key]);else el.value=Array.isArray(user[key])?user[key].join(', '):user[key]||'';}status('Loaded from your account.');}
  for(const el of form.querySelectorAll('input,select,textarea'))if(!['full-name',...Object.keys(fields)].includes(el.id)){el.disabled=true;el.title='This setting is not available yet';}
  document.querySelector('.local-badge').textContent='Account settings';
  form.onsubmit=async event=>{event.preventDefault();const names=$('full-name').value.trim().split(/\s+/);if(names.length<2){status('Enter first and last name.');return;}const values={firstName:names.shift(),lastName:names.join(' ')};for(const [id,key] of Object.entries(fields)){const el=$(id);values[key]=el.type==='checkbox'?el.checked:key==='skills'?el.value.split(',').map(s=>s.trim()).filter(Boolean):el.value;}
    try{await UNILINK_API.patch('/profile',values);await load();status('Saved to your account.');}catch(e){status(e.message);}
  };
  $('discard-settings').onclick=()=>load().catch(e=>status(e.message));
  document.querySelectorAll('[data-action]').forEach(button=>{button.disabled=true;button.title='This account action is not available yet';});
  try{await load();}catch(e){status(e.message);form.querySelectorAll('button,input,select').forEach(el=>el.disabled=true);}
})();
