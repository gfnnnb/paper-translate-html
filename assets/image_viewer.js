(()=>{
 const dialog=document.createElement('dialog');dialog.className='image-viewer';dialog.setAttribute('aria-label','查看高清原图');
 dialog.innerHTML='<div class="viewer-toolbar"><strong></strong><button data-action="fit">适合窗口</button><button data-action="original">原始尺寸</button><button data-action="minus" aria-label="缩小">−</button><span class="viewer-scale"></span><button data-action="plus" aria-label="放大">＋</button><button data-action="close">关闭</button></div><div class="viewer-viewport"><img alt=""></div>';
 document.body.append(dialog);
 const view=dialog.querySelector('.viewer-viewport'),img=view.querySelector('img'),label=dialog.querySelector('strong'),scaleLabel=dialog.querySelector('.viewer-scale');let scale=1,origin=null;
 function resize(s){scale=Math.min(4,Math.max(.03,s));img.style.width=Math.round(img.naturalWidth*scale)+'px';scaleLabel.textContent=Math.round(scale*100)+'%';}
 function fit(){resize(Math.min(1,(view.clientWidth-42)/img.naturalWidth,(view.clientHeight-42)/img.naturalHeight));view.scrollTo(0,0);}
 async function open(source){origin=source;img.src=source.src;img.alt=source.alt;label.textContent=source.alt;dialog.showModal();await img.decode();fit();document.body.style.overflow='hidden';}
 document.querySelectorAll('.figure img').forEach(source=>{source.tabIndex=0;source.setAttribute('role','button');source.setAttribute('aria-label',source.alt+'，点击查看高清原图');source.addEventListener('click',()=>open(source));source.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();open(source);}});});
 dialog.addEventListener('click',e=>{const action=e.target.dataset.action;if(action==='close')dialog.close();if(action==='fit')fit();if(action==='original')resize(1);if(action==='plus')resize(scale*1.4);if(action==='minus')resize(scale/1.4);});
 dialog.addEventListener('close',()=>{document.body.style.overflow='';origin?.focus({preventScroll:true});});
 dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
})();
