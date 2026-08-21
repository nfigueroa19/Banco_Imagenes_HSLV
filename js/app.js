/* ══════════════════════════════════════════════════
   CONFIGURACIÓN — EDITA ESTOS VALORES
   ══════════════════════════════════════════════════
   La carpeta de Drive está restringida a cuentas del dominio del hospital,
   por eso el acceso es con login OAuth (no con API Key anónima).

   CLIENT_ID: DE PRUEBA — proyecto de Google Cloud personal del desarrollador,
   pantalla de consentimiento en modo "Pruebas". Al entregar el proyecto,
   comunicaciones debe generar su propio Client ID desde un proyecto de
   Google Cloud institucional (idealmente pantalla de consentimiento
   "Interno" si el proyecto queda bajo el Workspace del hospital), y
   reemplazar el valor de abajo. Ver checklist de credenciales en
   _Segundo_Cerebro/01 Proyectos/banco-imagenes-hslv.md
   ══════════════════════════════════════════════════ */
var CONFIG = {
  CLIENT_ID: '1020267220447-rebduv63t3qntjruv6lbmh29vhnualsf.apps.googleusercontent.com', // ← DE PRUEBA, reemplazar en entrega final
  FOLDER_ID: '14dBvsP4SU8qNdIJvjYrzx_FR_oWVyYb7', // ← carpeta real del banco de imágenes en Drive
};
/* Mientras la pantalla de consentimiento OAuth esté en modo "Pruebas", solo pueden iniciar
   sesión las cuentas agregadas como "Usuarios de prueba" en Google Cloud Console — sin importar
   que ya tengan acceso a la carpeta de Drive. El acceso real a la carpeta no es solo por dominio:
   hay 2 cuentas @gmail.com con acceso individual además de las del dominio del hospital. Hay que
   agregar TODAS esas cuentas (dominio + las 2 @gmail) a la lista de testers. */
var SCOPES = 'https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/userinfo.email';
/* ══════════════════════════════════════════════════ */

/* Íconos de línea (Lucide, ISC License) — mismo lenguaje visual que el resto de la UI.
   Fuente de cada uno en Assets/Icons/*.svg. No mezclar con emoji. */
var ICONS = {
  images:'<svg viewBox="0 0 24 24"><path d="m22 11-1.296-1.296a2.4 2.4 0 0 0-3.408 0L11 16"/><path d="M4 8a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2"/><circle cx="13" cy="7" r="1" fill="currentColor"/><rect x="8" y="2" width="14" height="14" rx="2"/></svg>',
  users:'<svg viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><path d="M16 3.128a4 4 0 0 1 0 7.744"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><circle cx="9" cy="7" r="4"/></svg>',
  stethoscope:'<svg viewBox="0 0 24 24"><path d="M11 2v2"/><path d="M5 2v2"/><path d="M5 3H4a2 2 0 0 0-2 2v4a6 6 0 0 0 12 0V5a2 2 0 0 0-2-2h-1"/><path d="M8 15a6 6 0 0 0 12 0v-3"/><circle cx="20" cy="10" r="2"/></svg>',
  building:'<svg viewBox="0 0 24 24"><path d="M10 12h4"/><path d="M10 8h4"/><path d="M14 21v-3a2 2 0 0 0-4 0v3"/><path d="M6 10H4a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-2"/><path d="M6 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16"/></svg>',
  calendar:'<svg viewBox="0 0 24 24"><path d="M8 2v3"/><path d="M16 2v3"/><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M8 13h.01"/><path d="M12 13h.01"/><path d="M16 13h.01"/><path d="M8 17h.01"/><path d="M12 17h.01"/><path d="M16 17h.01"/></svg>',
  handshake:'<svg viewBox="0 0 24 24"><path d="m11 17 2 2a1 1 0 1 0 3-3"/><path d="m14 14 2.5 2.5a1 1 0 1 0 3-3l-3.88-3.88a3 3 0 0 0-4.24 0l-.88.88a1 1 0 1 1-3-3l2.81-2.81a5.79 5.79 0 0 1 7.06-.87l.47.28a2 2 0 0 0 1.42.25L21 4"/><path d="m21 3 1 11h-2"/><path d="M3 3 2 14l6.5 6.5a1 1 0 1 0 3-3"/><path d="M3 4h8"/></svg>',
  leaf:'<svg viewBox="0 0 24 24"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></svg>',
  briefcase:'<svg viewBox="0 0 24 24"><path d="M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/><rect width="20" height="14" x="2" y="6" rx="2"/></svg>',
  sparkles:'<svg viewBox="0 0 24 24"><path d="M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z"/><path d="M20 2v4"/><path d="M22 4h-4"/><circle cx="4" cy="20" r="2"/></svg>',
  plug:'<svg viewBox="0 0 24 24"><path d="M12 22v-5"/><path d="M15 8V2"/><path d="M17 8a1 1 0 0 1 1 1v4a4 4 0 0 1-4 4h-4a4 4 0 0 1-4-4V9a1 1 0 0 1 1-1z"/><path d="M9 8V2"/></svg>',
  eye:'<svg viewBox="0 0 24 24"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/></svg>',
  triangleAlert:'<svg viewBox="0 0 24 24"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>',
  folderOpen:'<svg viewBox="0 0 24 24"><path d="m6 14 1.5-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.54 6a2 2 0 0 1-1.95 1.5H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H18a2 2 0 0 1 2 2v2"/></svg>',
  search:'<svg viewBox="0 0 24 24"><path d="m21 21-4.34-4.34"/><circle cx="11" cy="11" r="8"/></svg>',
  link:'<svg viewBox="0 0 24 24"><path d="M9 17H7A5 5 0 0 1 7 7h2"/><path d="M15 7h2a5 5 0 1 1 0 10h-2"/><line x1="8" y1="12" x2="16" y2="12"/></svg>',
};

var CATS = [
  {id:'all',    label:'Todas las imágenes', icon:ICONS.images},
  {id:'talento',label:'Talento Humano',     icon:ICONS.users},
  {id:'servicios',label:'Servicios Asistenciales',icon:ICONS.stethoscope},
  {id:'infra',  label:'Infraestructura',    icon:ICONS.building},
  {id:'eventos',label:'Eventos Institucionales',icon:ICONS.calendar},
  {id:'comunidad',label:'Comunidad y Pacientes',icon:ICONS.handshake},
  {id:'rse',    label:'Responsabilidad Social',icon:ICONS.leaf},
  {id:'gestion',label:'Gestión y Adm.',     icon:ICONS.briefcase},
  {id:'especial',label:'Material Especial', icon:ICONS.sparkles},
];
var TYPES=[{id:'all',label:'Todos los formatos'},{id:'jpg',label:'JPG / JPEG'},{id:'png',label:'PNG'},{id:'webp',label:'WEBP'}];
var TAGS=['Humanización','Jornada de salud','Vacunación','Acreditación','Bienestar laboral','Urgencias','Comunidad','Formación','Prevención','Calidad'];
var CAT_KW={
  talento:['talento','personal','enfermera','medico','médico','bienestar','capacitacion','formacion','auxiliar','profesional'],
  servicios:['urgencias','laboratorio','farmacia','cirugia','hospitaliz','consulta','triage','medicamento'],
  infra:['fachada','edificio','sala','instalacion','señalizacion','infraestructura','remodelacion','sede'],
  eventos:['evento','ceremonia','lanzamiento','celebracion','dia del','graduacion','acto','reconocimiento'],
  comunidad:['comunidad','paciente','jornada','vacunacion','barrio','usuario','extramural'],
  rse:['ambiental','social','voluntariado','sostenib','arbol','reciclaje','responsabilidad'],
  gestion:['reunion','comite','directiva','gestion','rendicion','mipg','calidad','acreditacion'],
  especial:['redes','prensa','banner','diseño','portada','publicidad','institucional'],
};

var allFiles=[], activeCat='all', activeType='all', activeTag=null, viewMode='g', currentFile=null;
var folderId=CONFIG.FOLDER_ID;
var accessToken=null, tokenClient=null, userEmail=null;
var currentFolders=[], breadcrumb=[], searchMode=false, searchDebounceTimer=null;

/* Clasificación por carpeta contenedora (no por nombre de archivo): los nombres de archivo
   reales de Drive son tipo IMG_20260815_143022.jpg y nunca coinciden con las palabras clave,
   así que todo caía en el fallback "especial". La carpeta donde comunicaciones ya organiza
   las fotos (eventos/, personal/, etc.) es la señal real. pathParts es la cadena de nombres
   de carpeta desde la raíz del banco hasta la carpeta que contiene la imagen (sin incluir la
   raíz). Una imagen puede coincidir con varias categorías a la vez si su ruta menciona varias
   palabras clave (ej. "Eventos/Jornada de vacunación" → eventos + comunidad). Solo cae en
   "especial" si la ruta no coincide con ninguna palabra clave de ninguna categoría. */
function detectCatsFromPath(pathParts){
  var text=(pathParts||[]).join(' ').toLowerCase();
  var matches=[];
  for(var cat in CAT_KW){ if(CAT_KW[cat].some(function(k){return text.indexOf(k)>-1;})) matches.push(cat); }
  return matches.length?matches:['especial'];
}

function buildSidebar(){
  var cl=document.getElementById('catList'); cl.innerHTML='';
  CATS.forEach(function(c){
    var count=c.id==='all'?allFiles.length:allFiles.filter(function(f){return f.cats.indexOf(c.id)>-1;}).length;
    var d=document.createElement('div');
    d.className='cat-item'+(activeCat===c.id?' active':'');
    d.innerHTML='<span class="cat-icon">'+c.icon+'</span><span>'+c.label+'</span><span class="cat-badge">'+count+'</span>';
    d.onclick=(function(cid){return function(){activeCat=cid;activeTag=null;buildSidebar();buildTags();filterImages();};})(c.id);
    cl.appendChild(d);
  });
  var tl=document.getElementById('typeList'); tl.innerHTML='';
  TYPES.forEach(function(t){
    var d=document.createElement('div');
    d.className='cat-item'+(activeType===t.id?' active':'');
    d.innerHTML='<span style="font-size:11px;flex:1">'+t.label+'</span>';
    d.onclick=(function(tid){return function(){activeType=tid;buildSidebar();filterImages();};})(t.id);
    tl.appendChild(d);
  });
}

function buildTags(){
  var tc=document.getElementById('tagCloud'); tc.innerHTML='';
  TAGS.forEach(function(t){
    var s=document.createElement('span');
    s.className='tag'+(activeTag===t?' active':'');
    s.textContent=t;
    s.onclick=(function(tag){return function(){activeTag=activeTag===tag?null:tag;activeCat='all';buildSidebar();buildTags();filterImages();};})(t);
    tc.appendChild(s);
  });
}

function buildStats(){
  var sb=document.getElementById('statsBar'); sb.style.display='grid';
  var total=allFiles.length;
  var catSet=new Set();
  allFiles.forEach(function(f){ f.cats.forEach(function(c){catSet.add(c);}); });
  var cats=catSet.size;
  var mb=(allFiles.reduce(function(a,f){return a+(parseInt(f.size)||0);},0)/1048576).toFixed(1);
  var hoy=new Date().toISOString().slice(0,7);
  var recent=allFiles.filter(function(f){return f.modifiedTime&&f.modifiedTime.startsWith(hoy);}).length;
  var folders=currentFolders.length;
  sb.innerHTML='<div class="stat"><div class="stat-num">'+total+'</div><div class="stat-lbl">Imágenes</div></div>'+
    '<div class="stat"><div class="stat-num">'+folders+'</div><div class="stat-lbl">Carpetas</div></div>'+
    '<div class="stat"><div class="stat-num">'+cats+'</div><div class="stat-lbl">Categorías</div></div>'+
    '<div class="stat"><div class="stat-num">'+mb+' MB</div><div class="stat-lbl">Almacenamiento</div></div>'+
    '<div class="stat"><div class="stat-num">'+recent+'</div><div class="stat-lbl">Este mes</div></div>';
}

/* ── GRID CON SCROLL INFINITO + MINIATURAS DIFERIDAS ─
   Con miles de imágenes no se pueden renderizar todas las tarjetas ni pedir todas las
   miniaturas de una vez. filteredAll guarda el resultado del filtro actual; solo se
   renderiza de a PAGE_SIZE tarjetas, y las miniaturas (que requieren el token OAuth, no
   pueden ir en un <img src> normal) se piden de a poco según entran en pantalla. */
var PAGE_SIZE=60, filteredAll=[], visibleCount=0;

function filterImages(){
  var q=document.getElementById('searchInput').value.toLowerCase();
  var sort=document.getElementById('sortSel').value;
  var filtered=allFiles.filter(function(f){
    var matchCat=activeCat==='all'||f.cats.indexOf(activeCat)>-1;
    var ext=(f.name.split('.').pop()||'').toLowerCase();
    var matchType=activeType==='all'||(activeType==='jpg'&&(ext==='jpg'||ext==='jpeg'))||(activeType===ext);
    var matchQ=!q||f.name.toLowerCase().indexOf(q)>-1;
    var matchTag=!activeTag||f.tags.indexOf(activeTag)>-1;
    return matchCat&&matchType&&matchQ&&matchTag;
  });
  if(sort==='name') filtered.sort(function(a,b){return a.name.localeCompare(b.name);});
  else filtered.sort(function(a,b){return (b.modifiedTime||'').localeCompare(a.modifiedTime||'');});

  filteredAll=filtered;
  visibleCount=0;
  var grid=document.getElementById('imageGrid');
  grid.className='grid'+(viewMode==='l'?' lv':'');
  grid.innerHTML='';

  var foldersToShow=searchMode?[]:currentFolders.filter(function(fo){
    return !q||fo.name.toLowerCase().indexOf(q)>-1;
  });
  var folderList=document.getElementById('folderList');
  if(!foldersToShow.length){
    folderList.innerHTML='';
  } else {
    folderList.innerHTML=
      '<div class="folder-row folder-head" aria-hidden="true">'+
        '<span class="fc-name">Nombre de carpeta</span>'+
        '<span class="fc-owner">Creado por</span>'+
        '<span class="fc-date">Última modificación</span>'+
      '</div>'+
      foldersToShow.map(function(fo){
        return '<div class="folder-row" onclick="enterFolder(\''+fo.id+'\')" tabindex="0" role="button" aria-label="Carpeta '+escHtml(fo.name)+'">'+
          '<span class="fc-name">'+ICONS.folderOpen+'<span class="fc-name-txt">'+escHtml(fo.name)+'</span></span>'+
          '<span class="fc-owner">'+escHtml(fo.owner||'—')+'</span>'+
          '<span class="fc-date">'+formatDate(fo.modifiedTime)+'</span>'+
        '</div>';
      }).join('');
  }

  if(!filteredAll.length){
    if(!foldersToShow.length){
      grid.innerHTML='<div class="empty"><span class="empty-icon">'+ICONS.search+'</span><p>'+(searchMode?'No se encontraron imágenes con ese criterio.':'Esta carpeta está vacía.')+'</p></div>';
    }
    return;
  }
  loadMoreCards();
}

function loadMoreCards(){
  if(visibleCount>=filteredAll.length) return;
  var next=filteredAll.slice(visibleCount, visibleCount+PAGE_SIZE);
  visibleCount+=next.length;
  var grid=document.getElementById('imageGrid');
  var isLi=viewMode==='l';
  grid.insertAdjacentHTML('beforeend', next.map(function(f){
    var catObj=CATS.find(function(c){return c.id===f.cat;})||CATS[CATS.length-1];
    var fullUrl='https://www.googleapis.com/drive/v3/files/'+f.id+'?alt=media';
    var thumb='<span class="ph">'+catObj.icon+'</span><img data-full="'+fullUrl+'"'+(f.thumbnailLink?' data-thumb="'+escHtml(f.thumbnailLink)+'"':'')+' alt="'+escHtml(f.name)+'" class="lazy-img" onerror="this.style.display=\'none\'">';
    var catPills=f.cats.map(function(cid){
      var co=CATS.find(function(c){return c.id===cid;})||CATS[CATS.length-1];
      return '<span class="tag-pill">'+co.label.split(' ')[0]+'</span>';
    }).join('');
    return '<div class="img-card'+(isLi?' li':'')+'" onclick="openModal(\''+f.id+'\')" tabindex="0" role="button" aria-label="'+escHtml(f.name)+'">'+
      '<div class="img-thumb">'+thumb+
      '<div class="overlay">'+
        '<div class="ov-btn" title="Ver"><svg viewBox="0 0 24 24" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg></div>'+
        '<div class="ov-btn" title="Descargar"><svg viewBox="0 0 24 24" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg></div>'+
      '</div></div>'+
      '<div class="img-info">'+
        '<div class="img-name">'+escHtml(f.name)+'</div>'+
        '<div class="img-meta">'+
          '<span class="img-date">'+formatDate(f.modifiedTime)+'</span>'+
          catPills+
        '</div>'+
      '</div></div>';
  }).join(''));
  observeLazyThumbs();
}

/* Carga miniaturas solo cuando la tarjeta entra en pantalla, con un límite de solicitudes
   simultáneas para no saturar el navegador ni la cuota de la API. Se prioriza thumbnailLink
   (miniatura liviana que Drive ya genera, cargable en un <img src> normal sin token) y solo
   si falla se recurre al archivo completo vía fetch autenticado. */
var THUMB_CONCURRENCY=12, thumbQueue=[], thumbActive=0;
var thumbObserver=new IntersectionObserver(function(entries){
  entries.forEach(function(entry){
    if(entry.isIntersecting){
      thumbObserver.unobserve(entry.target);
      thumbQueue.push(entry.target);
      pumpThumbQueue();
    }
  });
},{rootMargin:'400px'});

function observeLazyThumbs(){
  document.querySelectorAll('#imageGrid img.lazy-img').forEach(function(img){
    thumbObserver.observe(img);
  });
}

function pumpThumbQueue(){
  while(thumbActive<THUMB_CONCURRENCY && thumbQueue.length){
    var img=thumbQueue.shift();
    thumbActive++;
    loadThumb(img).finally(function(){thumbActive--;pumpThumbQueue();});
  }
}

async function loadThumb(img){
  var thumbUrl=img.getAttribute('data-thumb');
  if(thumbUrl){
    var ok=await new Promise(function(resolve){
      var probe=new Image();
      probe.onload=function(){ resolve(true); };
      probe.onerror=function(){ resolve(false); };
      probe.src=thumbUrl;
    });
    if(ok){
      img.src=thumbUrl;
      img.classList.add('loaded');
      return;
    }
  }
  var fullUrl=img.getAttribute('data-full');
  try{
    var res=await fetch(fullUrl,{headers:{Authorization:'Bearer '+accessToken}});
    if(!res.ok) throw new Error('thumb '+res.status);
    var blob=await res.blob();
    img.src=URL.createObjectURL(blob);
    img.classList.add('loaded');
  }catch(e){
    img.style.display='none';
  }
}

/* Sentinela de scroll infinito: cuando entra en pantalla, pide la siguiente página. */
var gridSentinelObserver=new IntersectionObserver(function(entries){
  if(entries[0].isIntersecting) loadMoreCards();
},{rootMargin:'600px'});

function escHtml(s){return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}

function formatDate(d){
  if(!d) return '—';
  var dt=new Date(d);
  var m=['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
  return dt.getDate()+' '+m[dt.getMonth()]+' '+dt.getFullYear();
}

function formatSize(b){
  if(!b) return '—';
  var n=parseInt(b);
  return n>1048576?(n/1048576).toFixed(1)+' MB':Math.round(n/1024)+' KB';
}

function openModal(id){
  currentFile=allFiles.find(function(f){return f.id===id;});
  if(!currentFile) return;
  var wrap=document.getElementById('modalImgInner');
  var mCatObj=CATS.find(function(c){return c.id===currentFile.cat;})||CATS[CATS.length-1];
  wrap.innerHTML='<div class="loader"><div class="spinner"></div></div>';
  fetch('https://www.googleapis.com/drive/v3/files/'+currentFile.id+'?alt=media',{headers:{Authorization:'Bearer '+accessToken}})
    .then(function(res){ if(!res.ok) throw new Error(); return res.blob(); })
    .then(function(blob){
      wrap.innerHTML='<img src="'+URL.createObjectURL(blob)+'" alt="'+escHtml(currentFile.name)+'" style="width:100%;height:100%;object-fit:contain">';
    })
    .catch(function(){ wrap.innerHTML='<span class="ph-lg">'+mCatObj.icon+'</span>'; });
  var catLabels=currentFile.cats.map(function(cid){
    return (CATS.find(function(c){return c.id===cid;})||CATS[CATS.length-1]).label;
  });
  document.getElementById('mTitle').textContent=currentFile.name;
  document.getElementById('mTags').innerHTML=catLabels.map(function(l){return '<span class="tag-pill">'+l+'</span>';}).join('');
  document.getElementById('mCat').textContent=catLabels.join(', ');
  document.getElementById('mType').textContent=(currentFile.mimeType||'').replace('image/','').toUpperCase();
  document.getElementById('mSize').textContent=formatSize(currentFile.size);
  document.getElementById('mDate').textContent=formatDate(currentFile.modifiedTime);
  var lnk=document.getElementById('mLink');
  lnk.href=currentFile.webViewLink||'#';
  document.getElementById('detailModal').classList.add('open');
}

function closeModal(){document.getElementById('detailModal').classList.remove('open');}
function closeModalBg(e){if(e.target.id==='detailModal') closeModal();}
function openInDrive(){if(currentFile&&currentFile.webViewLink) window.open(currentFile.webViewLink,'_blank');}
function downloadFile(){
  if(!currentFile) return;
  var url=currentFile.webContentLink||'https://drive.google.com/uc?export=download&id='+currentFile.id;
  window.open(url,'_blank');
}
function setView(v){
  viewMode=v;
  document.getElementById('btnG').className='vbtn'+(v==='g'?' active':'');
  document.getElementById('btnL').className='vbtn'+(v==='l'?' active':'');
  filterImages();
}

/* ── LOGIN GOOGLE (OAuth) ─────────────────────────── */
function initTokenClient(){
  if(!window.google||!google.accounts||!google.accounts.oauth2||tokenClient) return;
  tokenClient=google.accounts.oauth2.initTokenClient({
    client_id:CONFIG.CLIENT_ID,
    scope:SCOPES,
    callback:function(resp){
      if(resp.error){
        document.getElementById('gateAlert').innerHTML='<div class="error-box"><span class="ib-icon">'+ICONS.triangleAlert+'</span> No se pudo iniciar sesión: '+resp.error+'</div>';
        return;
      }
      document.getElementById('gateAlert').innerHTML='';
      accessToken=resp.access_token;
      fetchUserEmail().then(function(){ unlockApp(); loadFromDrive(); });
    }
  });
}

function signIn(){
  if(!tokenClient) initTokenClient();
  if(!tokenClient){
    document.getElementById('alertBox').innerHTML='<div class="error-box"><span class="ib-icon">'+ICONS.triangleAlert+'</span> La librería de login de Google no cargó. Revisa tu conexión e intenta de nuevo.</div>';
    return;
  }
  tokenClient.requestAccessToken({prompt:'select_account'});
}

function signOut(){
  if(accessToken&&window.google) google.accounts.oauth2.revoke(accessToken);
  accessToken=null; userEmail=null; allFiles=[];
  document.getElementById('toolbar').style.display='none';
  document.getElementById('statsBar').style.display='none';
  document.getElementById('searchInput').disabled=true;
  var badge=document.getElementById('driveBadge');
  badge.classList.remove('ok');
  badge.innerHTML='<span id="driveBadgeText">Sin conectar</span>';
  lockApp();
}

function lockApp(){
  document.getElementById('appShell').style.display='none';
  document.getElementById('authGate').style.display='flex';
}
function unlockApp(){
  document.getElementById('authGate').style.display='none';
  document.getElementById('appShell').style.display='block';
}

async function fetchUserEmail(){
  try{
    var res=await fetch('https://www.googleapis.com/oauth2/v3/userinfo',{headers:{Authorization:'Bearer '+accessToken}});
    var data=await res.json();
    userEmail=data.email||null;
  }catch(e){ userEmail=null; }
}

/* ── CONEXIÓN DRIVE ───────────────────────────────── */
var IMAGE_MIMES=['image/jpeg','image/png','image/webp','image/gif','image/bmp','image/tiff'];
var FOLDER_MIME='application/vnd.google-apps.folder';

async function listChildren(parentId){
  var fields='nextPageToken,files(id,name,mimeType,thumbnailLink,webViewLink,webContentLink,size,modifiedTime,owners(displayName))';
  var q="'"+parentId+"' in parents and trashed=false";
  var out=[], pageToken='';
  do{
    var url='https://www.googleapis.com/drive/v3/files?q='+encodeURIComponent(q)+'&fields='+encodeURIComponent(fields)+'&pageSize=1000'+(pageToken?'&pageToken='+pageToken:'');
    var res=await fetch(url,{headers:{Authorization:'Bearer '+accessToken}});
    var data=await res.json();
    if(data.error){ var err=new Error(data.error.message); err.code=data.error.code; throw err; }
    out=out.concat(data.files||[]);
    pageToken=data.nextPageToken||'';
  }while(pageToken);
  return out;
}

/* Recorrido del árbol completo de carpetas, en lotes paralelos (no una por una) — se usa solo
   para la búsqueda global, que sí necesita mirar todas las subcarpetas. matchFn(name) filtra
   qué imágenes se conservan sin dejar de recorrer todas las carpetas. Tope de 600 carpetas
   visitadas como salvaguarda. Cada carpeta en la cola arrastra su "path" (nombres de carpeta
   desde la raíz) para que las imágenes encontradas sepan en qué carpeta viven y así puedan
   clasificarse por ruta (ver detectCatsFromPath). */
async function collectImagesRecursive(rootId, onProgress, matchFn){
  var images=[], queue=[{id:rootId,path:[]}], visited=0, foldersSeen=1, CONCURRENCY=8;
  while(queue.length && visited<600){
    var batch=queue.splice(0, Math.min(CONCURRENCY, queue.length, 600-visited));
    visited+=batch.length;
    if(onProgress) onProgress(images.length, foldersSeen);
    var results=await Promise.all(batch.map(function(item){
      return listChildren(item.id).then(function(children){return {children:children,path:item.path};});
    }));
    results.forEach(function(res){
      res.children.forEach(function(f){
        if(f.mimeType===FOLDER_MIME){ queue.push({id:f.id,path:res.path.concat([f.name])}); foldersSeen++; }
        else if(IMAGE_MIMES.indexOf(f.mimeType)>-1 && (!matchFn||matchFn(f.name))){ images.push(Object.assign({},f,{__path:res.path})); }
      });
    });
  }
  return images;
}

function toFileEntry(f, pathParts){
  var cats=detectCatsFromPath(pathParts||f.__path);
  return Object.assign({},f,{cat:cats[0],cats:cats,tags:[]});
}

/* Navegación tipo explorador de archivos: cada carpeta se carga solo al entrar en ella
   (una sola llamada a listChildren), no se recorre todo el árbol por adelantado. */
async function openFolder(fid){
  searchMode=false;
  folderId=fid;
  syncUrl(fid);
  var grid=document.getElementById('imageGrid');
  document.getElementById('toolbar').style.display='flex';
  document.getElementById('searchInput').disabled=false;
  grid.innerHTML='<div class="loader"><div class="spinner"></div><p>Cargando carpeta...</p></div>';
  buildBreadcrumb();
  try{
    var children=await listChildren(fid);
    currentFolders=children.filter(function(f){return f.mimeType===FOLDER_MIME;})
      .map(function(f){return {id:f.id,name:f.name,owner:(f.owners&&f.owners[0]&&f.owners[0].displayName)||'—',modifiedTime:f.modifiedTime};})
      .sort(function(a,b){return a.name.localeCompare(b.name);});
    var pathParts=breadcrumb.slice(1).map(function(b){return b.name;});
    allFiles=children.filter(function(f){return IMAGE_MIMES.indexOf(f.mimeType)>-1;}).map(function(f){return toFileEntry(f,pathParts);});
    buildStats(); buildSidebar(); buildTags(); filterImages();
    var badge=document.getElementById('driveBadge');
    badge.classList.add('ok');
    badge.innerHTML='<span class="dot"></span> '+allFiles.length+' imágenes'+(userEmail?' · '+userEmail:'');
    document.getElementById('alertBox').innerHTML='';
  } catch(e){
    handleDriveError(e, grid);
  }
}

function enterFolder(fid){
  var fo=currentFolders.find(function(x){return x.id===fid;});
  breadcrumb.push({id:fid,name:fo?fo.name:'Carpeta'});
  openFolder(fid);
}

function buildBreadcrumb(){
  var bar=document.getElementById('breadcrumbBar');
  var backBtn=breadcrumb.length>1?
    '<span class="back-btn" onclick="goToBreadcrumb('+(breadcrumb.length-2)+')"><svg viewBox="0 0 24 24"><path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></svg> Atrás</span>':'';
  bar.innerHTML=backBtn+breadcrumb.map(function(b,i){
    var isLast=i===breadcrumb.length-1;
    return (i>0?'<span class="sep">/</span>':'')+
      '<span class="crumb'+(isLast?' current':'')+'"'+(isLast?'':' onclick="goToBreadcrumb('+i+')"')+'>'+escHtml(b.name)+'</span>';
  }).join('');
}

/* URL compartible: refleja la carpeta actual en ?folder= para poder copiar el enlace y para
   que, si alguien lo abre directo, loadFromDrive() pueda reconstruir el breadcrumb hasta ahí. */
function syncUrl(fid){
  var url=new URL(location.href);
  if(fid && fid!==CONFIG.FOLDER_ID) url.searchParams.set('folder', fid);
  else url.searchParams.delete('folder');
  history.replaceState(null, '', url.toString());
}

function goToBreadcrumb(idx){
  breadcrumb=breadcrumb.slice(0, idx+1);
  document.getElementById('searchInput').value='';
  openFolder(breadcrumb[idx].id);
}

function handleDriveError(e, grid){
  if(e.code===401){
    accessToken=null;
    document.getElementById('gateAlert').innerHTML='<div class="error-box"><span class="ib-icon">'+ICONS.triangleAlert+'</span> Tu sesión expiró, inicia sesión de nuevo.</div>';
    lockApp();
    return;
  }
  grid.innerHTML='';
  document.getElementById('toolbar').style.display='none';
  document.getElementById('statsBar').style.display='none';
  document.getElementById('alertBox').innerHTML='<div class="error-box"><span class="ib-icon">'+ICONS.triangleAlert+'</span><div><strong>Error al conectar:</strong> '+e.message+'</div></div>';
}

/* ── BÚSQUEDA GLOBAL ──────────────────────────────────
   A diferencia de navegar carpetas (una llamada, instantáneo), buscar sí recorre todo el árbol
   desde la raíz porque el resultado puede estar en cualquier subcarpeta. Se dispara con un
   pequeño debounce para no lanzar un recorrido completo en cada tecla. */
function scheduleSearch(){
  clearTimeout(searchDebounceTimer);
  searchDebounceTimer=setTimeout(runSearch, 500);
}

async function runSearch(){
  var q=document.getElementById('searchInput').value.trim();
  if(!q){
    if(searchMode) openFolder(breadcrumb[breadcrumb.length-1].id);
    return;
  }
  searchMode=true;
  var grid=document.getElementById('imageGrid');
  var lower=q.toLowerCase();
  try{
    var files=await collectImagesRecursive(CONFIG.FOLDER_ID, function(found,folders){
      grid.innerHTML='<div class="loader"><div class="spinner"></div><p>Buscando en todas las carpetas... '+folders+' revisadas, '+found+' coincidencia'+(found!==1?'s':'')+'</p></div>';
    }, function(name){ return name.toLowerCase().indexOf(lower)>-1; });
    currentFolders=[];
    allFiles=files.map(function(f){return toFileEntry(f);});
    buildStats(); buildSidebar(); buildTags(); filterImages();
  } catch(e){
    handleDriveError(e, grid);
  }
}

/* Trae solo id/nombre/parents de una carpeta (no sus hijos) — se usa para subir por la cadena
   de "parents" y reconstruir el breadcrumb cuando se entra por un link directo a una subcarpeta. */
async function getFolderMeta(fid){
  var url='https://www.googleapis.com/drive/v3/files/'+fid+'?fields='+encodeURIComponent('id,name,parents');
  var res=await fetch(url,{headers:{Authorization:'Bearer '+accessToken}});
  var data=await res.json();
  if(data.error){ var err=new Error(data.error.message); err.code=data.error.code; throw err; }
  return data;
}

/* Sube desde targetId por sus "parents" hasta encontrar CONFIG.FOLDER_ID (la raíz del banco) y
   arma el breadcrumb completo en el camino. Si nunca llega a la raíz (la carpeta del link está
   fuera del banco, o algún nivel intermedio no es accesible) devuelve null y quien llama decide
   el fallback. Tope de 30 saltos como salvaguarda ante datos inconsistentes. */
async function resolveBreadcrumbForFolder(targetId){
  var chain=[], fid=targetId, hops=0;
  while(fid && hops<30){
    hops++;
    var meta=await getFolderMeta(fid);
    chain.unshift({id:meta.id,name:meta.name});
    if(meta.id===CONFIG.FOLDER_ID) break;
    fid=meta.parents&&meta.parents[0];
  }
  if(!chain.length||chain[0].id!==CONFIG.FOLDER_ID) return null;
  chain[0].name='Banco de Imágenes';
  return chain;
}

async function loadFromDrive(){
  var target=new URLSearchParams(location.search).get('folder');
  if(target&&target!==CONFIG.FOLDER_ID){
    try{
      var chain=await resolveBreadcrumbForFolder(target);
      if(chain){
        breadcrumb=chain;
        await openFolder(target);
        return;
      }
      document.getElementById('alertBox').innerHTML='<div class="error-box"><span class="ib-icon">'+ICONS.triangleAlert+'</span> El enlace apunta a una carpeta fuera del banco de imágenes. Se cargó la carpeta raíz.</div>';
    }catch(e){
      if(e.code===401){
        accessToken=null;
        document.getElementById('gateAlert').innerHTML='<div class="error-box"><span class="ib-icon">'+ICONS.triangleAlert+'</span> Tu sesión expiró, inicia sesión de nuevo.</div>';
        lockApp();
        return;
      }
      document.getElementById('alertBox').innerHTML='<div class="error-box"><span class="ib-icon">'+ICONS.triangleAlert+'</span> No se pudo abrir la carpeta del enlace ('+e.message+'). Se cargó la carpeta raíz.</div>';
    }
  }
  breadcrumb=[{id:CONFIG.FOLDER_ID,name:'Banco de Imágenes'}];
  await openFolder(CONFIG.FOLDER_ID);
}

/* ── INICIO ───────────────────────────────────────── */
buildSidebar(); buildTags();
gridSentinelObserver.observe(document.getElementById('gridSentinel'));
window.addEventListener('load',initTokenClient);
