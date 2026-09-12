(function () {
  'use strict';
  if (['127.0.0.1','localhost'].includes(location.hostname) && location.port && location.port !== '3000') {
    location.replace('http://localhost:3000' + location.pathname + location.search + location.hash);
    return;
  }
  const bangla = /[\u0980-\u09FF]+/g;
  function english(value) {
    return value.replace(/[\u09E6-\u09EF]/g, digit => String(digit.charCodeAt(0) - 0x09E6)).replace(bangla, '').replace(/\s{2,}/g, ' ');
  }
  function clean(root) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT); let node;
    while ((node = walker.nextNode())) if (/[\u0980-\u09FF]/.test(node.nodeValue)) node.nodeValue = english(node.nodeValue);
    root.querySelectorAll?.('*').forEach(element => ['aria-label','title','placeholder','value'].forEach(name => { const value=element.getAttribute(name); if(value && /[\u0980-\u09FF]/.test(value)) element.setAttribute(name,english(value)); }));
    root.querySelectorAll?.('button,a,[role="button"],input,select,textarea').forEach(control=>{const meaningful=/[A-Za-z0-9]/.test(control.textContent||control.value||control.placeholder||'');const raw=control.getAttribute('aria-label')||control.id||control.getAttribute('data-action')||control.className||control.getAttribute('href')||'Action';let label=String(raw).split(/[/#?]/).pop().replace(/\.html$/i,'').replace(/[-_]+/g,' ').replace(/\b(btn|button|icon|primary|secondary|active|selected|outline|red|input|field|bn)\b/gi,' ').replace(/\s+/g,' ').trim();if(!label)label=control.matches('input,textarea')?'Search':control.matches('select')?'Choose an option':control.matches('a')?'Open link':'Open options';if(!meaningful&&control.matches('button.primary')){const form=control.closest('form')?.id;label=form==='partner-form'?'Save partnership':form==='contact-form'?'Save message draft':form==='announcement-form'?'Save announcement draft':'Save changes';control.textContent=label;}if(!meaningful&&label){const name=label.replace(/\b\w/g,char=>char.toUpperCase());control.setAttribute('aria-label',name);control.title=name;if(control.matches('input,textarea')&&!/[A-Za-z0-9]/.test(control.placeholder||''))control.placeholder=name;if(control.matches('button[data-action]')&&!control.querySelector('.unilink-control-label')){const caption=document.createElement('span');caption.className='unilink-control-label';caption.textContent=name;control.appendChild(caption);}}});
  }
  function installNotifications() { window.installLiveNotifications?.(); }
  function set(selector, text, index = 0) { const element = document.querySelectorAll(selector)[index]; if (element) element.textContent = text; }
  function applyPageCopy() {
    const page = decodeURIComponent(location.pathname.split('/').pop() || 'index.html').toLowerCase();
    if (page === 'login.html') {
      set('.quote-text','UNILINK helped me turn campus experience into an internship at Google Bangladesh.'); set('.person-role','CSE, 4th Year · BUET');
      set('.welcome','Welcome back'); set('.welcome-sub','Sign in to continue to your UNILINK workspace.');
      ['Student','Recruiter','University'].forEach((text,index)=>set('.role-tab span',text,index));
      set('label[for="email"]','Email address'); set('label[for="password"]','Password'); set('.forgot-link','Forgot password?');
      set('#error-msg','The email or password is incorrect.'); set('#submit-btn','Log in →'); set('.divider','Or'); set('#google-btn','Continue with Google');
      const signup=document.querySelector('.below-links'); if(signup) signup.innerHTML='New to UNILINK? <a href="register.html">Create an account →</a>';
      set('.back-link','Explore the demo without signing in →',0); set('.back-link','← Back to the homepage',1);
    }
    if (page === 'register.html') {
      ['Choose your role','Tell us about yourself','Secure your account'].forEach((text,index)=>set('.title',text,index));
      ['Student account','Club account','Recruiter account','University account'].forEach((text,index)=>set('.role-name-bn',text,index));
      set('#to-step-2','Continue →'); set('#back-to-1','← Back'); set('#to-step-3','Continue →'); set('#back-to-2','← Back'); set('#finish-btn','Create account →');
      set('.terms-text','I agree to the UNILINK Terms of Service and Privacy Policy.');
      document.querySelectorAll('.below-links').forEach(element=>element.innerHTML='Already have an account? <a href="login.html">Log in →</a>');
      document.querySelectorAll('.back-link').forEach(element=>element.textContent='← Back to the homepage');
    }
    if (page === 'index.html' || location.pathname === '/') {
      set('.login-link','Log in'); set('header .btn-primary','Create account'); set('.pill',"● Bangladesh's university opportunity network");
      set('.hero-actions .btn-primary','Get started free →'); set('.hero-actions .btn-ghost','▷ Explore the demo');
      set('.hero-sub','Connect with trusted peers, prove your skills, discover opportunities, and move your career forward—all in one university network.');
      set('#features .section-desc','Everything you need to learn collaboratively, build credibility, and connect with the right opportunities.');
      set('#universities .section-title','Get started in three simple steps');
      set('#pricing .section-title','Straightforward plans for every ambition'); set('#pricing .section-desc','Free for students, with practical tools for clubs and recruiting teams.');
      set('.testi-quote','“UNILINK connected me with the right opportunities and helped me secure an internship at Google Bangladesh.”',0); set('.person-role','CSE, 4th Year · BUET',0); set('.testi-quote','“Managing our robotics club membership, events, and communications is finally simple and organized.”',2);
      const pricing=[
        {tag:'Student',price:'৳0 forever',desc:'The essentials for building your campus network.',features:['✓ Study partner matching','✓ Personalized campus feed','✓ Student profile','✓ 3 opportunity bids per month','✓ Notes and resources'],button:'Start free →'},
        {tag:'Most popular · Pro Student',price:'৳199 / month',desc:'More visibility and unlimited access for ambitious students.',features:['✓ Unlimited opportunity bids','✓ 5 verified SkillCheck badges','✓ Priority candidate visibility','✓ Direct recruiter messaging','✓ Priority support'],button:'Upgrade to Pro →'},
        {tag:'Recruiter',price:'৳2,499 / month',desc:'Find verified university talent and manage hiring campaigns.',features:['✓ Unlimited candidate search','✓ Live opportunity postings','✓ Verified-skill filters','✓ University partnership tools','✓ Hiring analytics'],button:'Start recruiter trial →'}
      ];
      document.querySelectorAll('.price-card').forEach((card,index)=>{const copy=pricing[index]; if(!copy)return; const tag=card.querySelector('.plan-tag'); if(tag)tag.textContent=copy.tag; const badge=card.querySelector('.badge-popular'); if(badge)badge.remove(); const price=card.querySelector('.plan-price');if(price)price.textContent=copy.price; const desc=card.querySelector('.plan-desc');if(desc)desc.textContent=copy.desc; card.querySelectorAll('.plan-features li').forEach((item,i)=>item.textContent=copy.features[i]||''); const button=card.querySelector('.plan-btn');if(button)button.textContent=copy.button;});
      set('.cta-title','Turn university connections into lasting opportunities'); set('.cta-sub','Join a trusted network of students, clubs, universities, and employers building the next generation of talent.'); set('.cta-fine','No credit card required · Verify instantly with an academic email');
      set('.cta-section .btn','Join UNILINK free →');
      document.querySelectorAll('.feature-title-bn,.step-title-bn,.stat-label small').forEach(element=>element.remove());
    }
    if (page === 'admin-portal.html') {
      const search=document.getElementById('search');if(search){search.placeholder='Search students, clubs, skills, or companies…';search.setAttribute('aria-label','Search platform records');}
      const role=document.querySelector('.role');if(role){role.setAttribute('aria-label','Current workspace role');['Student','Administrator','Club','Recruiter'].forEach((text,index)=>{if(role.options[index])role.options[index].textContent=text;});}
      set('.verified','✓ Academic account verified'); set('.hero .eyebrow','UNILINK ADMINISTRATION · BANGLADESH'); set('.hero h1','University Partnership & Student Success Hub'); set('.hero p','A unified view of six universities, campus organizations, recruiting outcomes, and student support.');
      set('#add-partner','＋ Add partner'); set('.hero-actions .export','Export report'); ['Overview','Partnerships','Analytics','Announcements','Reports'].forEach((text,index)=>set('.hero .tab',text,index));
      const metrics=[['Verified student accounts','Across 6 universities','+342 this month'],['Active club partners','37 university clubs','+12 this month'],['Graduate placement rate','2026 graduating cohort','+8% year over year'],['Students requiring support','Immediate review recommended','Attention needed']];
      document.querySelectorAll('.metric').forEach((card,index)=>{const copy=metrics[index];if(!copy)return;const h=card.querySelector('h2'),p=card.querySelector('p'),trend=card.querySelector('.trend');if(h)h.textContent=copy[0];if(p)p.textContent=copy[1];if(trend)trend.textContent=copy[2];});
      const totals=[['৳6.2 crore','Total partnership value'],['284','Active job listings'],['৳42 lakh','Bids completed this month'],['3.61','Average platform CGPA']];document.querySelectorAll('.total').forEach((card,index)=>{const copy=totals[index];if(!copy)return;card.querySelector('strong').textContent=copy[0];card.querySelector('p').textContent=copy[1];});
      set('#alerts-title','Student support alerts'); set('.alert-heading p','Identified through engagement and academic signals'); set('#all-alerts','View all 23 alerts →');
      set('#chart-title','Graduate placement rate · 2026'); set('.chart-panel .panel-head p','Monthly placement rate compared with the 75% target');
      const studentCopy=[['No login activity for 3+ weeks; CGPA is declining','High risk'],['Assignments are overdue and club engagement has declined','Medium risk'],['Absent from two consecutive examinations','Medium risk']];document.querySelectorAll('#student-list .student').forEach((row,index)=>{const copy=studentCopy[index];if(!copy)return;const p=row.querySelector('p'),risk=row.querySelector('.risk'),button=row.querySelector('.contact');if(p)p.textContent=copy[0];if(risk)risk.textContent=copy[1];if(button)button.textContent='Contact';});
    }
  }
  function wireRegistration() {
    const finish=document.getElementById('finish-btn'); if(!finish || finish.dataset.apiReady) return; finish.dataset.apiReady='true';
    finish.addEventListener('click',async event=>{
      event.preventDefault(); event.stopImmediatePropagation();
      const password=document.getElementById('reg-password').value, confirm=document.getElementById('reg-password-confirm').value;
      if(password.length<8)return alert('Password must be at least 8 characters.'); if(password!==confirm)return alert('Passwords do not match.'); if(!document.getElementById('terms-check').checked)return alert('Please agree to the Terms of Service and Privacy Policy.');
      finish.disabled=true; finish.textContent='Creating account…';
      try{const role=document.querySelector('.role-card.selected')?.dataset.role||'student';await UNILINK_API.post('/auth/register',{role,firstName:document.getElementById('first-name').value.trim(),lastName:document.getElementById('last-name').value.trim(),email:document.getElementById('reg-email').value.trim(),university:document.getElementById('reg-university').value,department:document.getElementById('reg-dept').value,year:document.getElementById('reg-year').value,password});location.href=role==='recruiter'?'../Recruiter Search/Recruiter search.html':role==='university'?'../Admin/dashboard.html':'demo.html';}
      catch(error){alert(error.message||'Account creation failed.');finish.disabled=false;finish.textContent='Create account →';}
    },true);
  }
  function useEnglish() {
    document.documentElement.lang = 'en';
    document.title = english(document.title) || 'UNILINK Bangladesh';
    document.querySelectorAll('.unilink-language-toggle,.sidebar-lang').forEach(element => element.remove());
    document.querySelectorAll('select#language option:not([value="en"])').forEach(option => option.remove());
    const language = document.getElementById('language');
    if (language) { language.value = 'en'; language.disabled = true; }
    try {
      const settings = JSON.parse(localStorage.getItem('unilink.settings.v1') || '{}');
      localStorage.setItem('unilink.settings.v1', JSON.stringify({...(settings && typeof settings === 'object'? settings: {}), language: 'en' }));
    } catch {}
    window.dispatchEvent(new CustomEvent('unilink:language', { detail: { language: 'en' } }));
    applyPageCopy();
    wireRegistration();
    clean(document.body);
    installNotifications();
    new MutationObserver(records => records.forEach(record => clean(record.target.nodeType === 1 ? record.target : record.target.parentElement))).observe(document.body,{subtree:true,childList:true,characterData:true});
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', useEnglish, { once: true }); else useEnglish();
}());
