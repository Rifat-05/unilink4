(() => {
'use strict';
// Keep page links native and bypass old visual-only tab handlers.
document.addEventListener('click',event=>{
 const target=event.target instanceof Element?event.target.closest('a[data-page-link]'):null;
 if(target)event.stopImmediatePropagation();
},true);
})();
