(function(){
  const SCOPE='ortopedia_v4';
  const $=s=>document.querySelector(s);
  const els=(s)=>Array.from(document.querySelectorAll(s));
  const store={get:(k,f)=>{try{return JSON.parse(localStorage.getItem(SCOPE+':'+k))||f}catch(e){return f}},
               set:(k,v)=>{try{localStorage.setItem(SCOPE+':'+k,JSON.stringify(v))}catch(e){}}};

  let modules = store.get('modules', []);
  let currentId = null;

  const listEl = $('#list');
  const countEl = $('#count');
  const editor = $('#editorPanel');
  const titleEdit = $('#modTitleEdit');
  const descEdit = $('#modDescEdit');
  const contentEdit = $('#modContent');
  const editorTitle = $('#editorTitle');

  function uid(){ return 'm_'+Math.random().toString(36).slice(2,10); }
  function escapeHtml(s){ return (s||'').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
