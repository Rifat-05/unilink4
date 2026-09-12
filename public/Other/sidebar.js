(() => {
'use strict';
function initializeSidebar(){
const sidebar=document.querySelector('.sidebar[data-unilink-sidebar]');if(!sidebar)return;
const backdrop=document.querySelector('.sidebar-backdrop[data-unilink-sidebar]');const trigger=document.getElementById('menu-btn')||document.getElementById('menu');const closeButton=sidebar.querySelector('.sidebar-close');if(!backdrop||!trigger||!closeButton)return;
const links=Array.from(sidebar.querySelectorAll('.sidebar-item'));const bn=sidebar.querySelector('#lang-bn');const en=sidebar.querySelector('#lang-en');let previousFocus=null;let previousOverflow='';let opened=false;
let page=decodeURIComponent(location.pathname.split('/').pop()||'demo.html').toLowerCase();let active=page==='settings.html'?6:page.startsWith('admin-')?5:/^(club|club-)/.test(page)?2:page==='recruiter search.html'?3:/^(live bid|hackathon bounty|exclusive candidate access bid)/.test(page)?4:/^(study-|my-partner)/.test(page)?1:0;
links.forEach((link,index)=>{link.classList.toggle('active',index===active);if(index===active)link.setAttribute('aria-current','page');else link.removeAttribute('aria-current');});
trigger.setAttribute('aria-controls',sidebar.id);trigger.setAttribute('aria-expanded','false');trigger.setAttribute('aria-label','Open navigation');sidebar.setAttribute('aria-label','Main navigation');sidebar.hidden=true;backdrop.hidden=true;
let currentLanguage='bn';
function readLanguage(){try{const settings=JSON.parse(localStorage.getItem('unilink.settings.v1')||'{}');return settings?.language==='en'?'en':'bn';}catch(error){return currentLanguage;}}
function setLanguage(language,persist){
currentLanguage=language==='en'?'en':'bn';const english=currentLanguage==='en';
const setText=(selector,text)=>{const element=sidebar.querySelector(selector);if(element)element.textContent=text;};
links.forEach(link=>{const label=link.querySelector('[data-nav-label]');if(label)label.textContent=english?link.dataset.labelEn:link.dataset.labelBn;});
[bn,en].forEach(button=>{if(button)button.type='button';});
if(bn){bn.classList.toggle('active',!english);bn.setAttribute('aria-pressed',String(!english));}if(en){en.classList.toggle('active',english);en.setAttribute('aria-pressed',String(english));}
sidebar.lang=currentLanguage;
setText('.sb-sub',english?'Bangladesh':'বাংলাদেশ');setText('[data-tier-label]',english?'Free Tier':'ফ্রি টায়ার');setText('.sidebar-upgrade p',english?'Upgrade for verified badges, unlimited bids, and premium matching.':'ভেরিফাইড ব্যাজ, আনলিমিটেড বিড এবং প্রিমিয়াম ম্যাচিং পেতে আপগ্রেড করুন।');setText('.sidebar-upgrade-btn',english?'Upgrade Profile →':'প্রোফাইল আপগ্রেড করুন →');setText('.sidebar-home',english?'← Home / All pages':'← হোম / সকল পৃষ্ঠা');
trigger.setAttribute('aria-label',english?'Open navigation':'মেনু খুলুন');closeButton.setAttribute('aria-label',english?'Close navigation':'মেনু বন্ধ করুন');
if(persist){try{let settings=JSON.parse(localStorage.getItem('unilink.settings.v1')||'{}');if(!settings||typeof settings!=='object'||Array.isArray(settings))settings={};settings.language=currentLanguage;localStorage.setItem('unilink.settings.v1',JSON.stringify(settings));}catch(error){}}
window.dispatchEvent(new CustomEvent('unilink:language',{detail:{language:currentLanguage}}));
}
setLanguage(readLanguage(),false);
window.addEventListener('storage',event=>{if(event.key==='unilink.settings.v1')setLanguage(readLanguage(),false);});
window.addEventListener('unilink:language-preference',event=>setLanguage(event.detail.language,true));
window.addEventListener('pageshow',()=>setLanguage(readLanguage(),false));
function open(){if(opened)return;opened=true;previousFocus=document.activeElement;previousOverflow=document.body.style.overflow;sidebar.hidden=false;backdrop.hidden=false;sidebar.classList.add('open');backdrop.classList.add('open');document.body.style.overflow='hidden';trigger.setAttribute('aria-expanded','true');closeButton.focus();}
function close(){if(!opened)return;opened=false;sidebar.classList.remove('open');backdrop.classList.remove('open');sidebar.hidden=true;backdrop.hidden=true;document.body.style.overflow=previousOverflow;trigger.setAttribute('aria-expanded','false');(previousFocus?.isConnected?previousFocus:trigger).focus();}
// Capture drawer interactions before old page-specific handlers; keep native links.
document.addEventListener('click',event=>{const target=event.target;if(!(target instanceof Element))return;if(target.closest('#'+trigger.id)){event.preventDefault();event.stopImmediatePropagation();opened?close():open();return;}if(target===backdrop||target.closest('#'+closeButton.id)){event.preventDefault();event.stopImmediatePropagation();close();return;}if(!sidebar.contains(target))return;if(target.closest('#lang-bn,#lang-en')){event.preventDefault();event.stopImmediatePropagation();setLanguage(target.closest('#lang-en')?'en':'bn',true);return;}if(target.closest('a')){event.stopImmediatePropagation();return;}},true);
document.addEventListener('keydown',event=>{if(!opened)return;if(event.key==='Escape'&&!document.querySelector('dialog[open]')){event.preventDefault();event.stopImmediatePropagation();close();return;}if(event.key!=='Tab')return;const focusable=Array.from(sidebar.querySelectorAll('a[href],button:not([disabled])'));const first=focusable[0],last=focusable[focusable.length-1];if(event.shiftKey&&(document.activeElement===first||!sidebar.contains(document.activeElement))){event.preventDefault();event.stopImmediatePropagation();last.focus();}else if(!event.shiftKey&&(document.activeElement===last||!sidebar.contains(document.activeElement))){event.preventDefault();event.stopImmediatePropagation();first.focus();}},true);
window.addEventListener('pageshow',()=>{if(opened)close();});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initializeSidebar,{once:true});else initializeSidebar();
})();