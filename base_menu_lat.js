'use strict';
document.addEventListener('DOMContentLoaded', async () => {
  if (!await window.authReady) return;
  const nav = document.createElement('nav'); nav.className = 'antiacam-nav'; nav.setAttribute('aria-label','Finanzas');
  nav.innerHTML = '<strong>Antiacam</strong><span>Finanzas</span><a href="8010-fact_prov.html">Registrar factura</a><a href="8011-fact_prov_mod.html">Consultar y modificar</a><button type="button">Cerrar sesión</button>';
  nav.querySelectorAll('a').forEach(link => {
    if (!window.APP_FORMULARIOS.includes(window.APP_RUTAS[link.getAttribute('href')])) link.remove();
  });
  const seguridad = document.createElement('a'); seguridad.href='seguridad.html'; seguridad.textContent='Seguridad y equipos';
  nav.insertBefore(seguridad,nav.querySelector('button'));
  const clave = document.createElement('a'); clave.href='cambiar-clave.html'; clave.textContent='Cambiar contraseña';
  nav.insertBefore(clave,nav.querySelector('button'));
  nav.querySelector('button').addEventListener('click', async () => {
    const {error} = await window.sb.auth.signOut();
    if (error) { alert(error.message); return; }
    location.replace('index.html');
  });
  document.body.prepend(nav);
  for (const [id,catalogo] of [['vehiculo','VEHICULO'],['proyecto','PROYECTO']]) {
    const select=document.getElementById(id);
    if(!select) continue;
    const button=document.createElement('button');button.type='button';button.textContent='Agregar opción';button.className='btn-mini';
    button.addEventListener('click',async()=>{
      const value=prompt('Nueva opción para '+select.previousElementSibling?.textContent);
      if(!value?.trim()) return;
      button.disabled=true;
      try {
        const clean=value.trim();
        if(clean.length>150) throw new Error('Máximo 150 caracteres.');
        const {error}=await DB.tabla('mt_cat_opcion').insert({formulario_cod:'FIN10_FACT_PROVEEDOR',formulario_codigo:'FIN10_FACT_PROVEEDOR',catalogo_codigo:catalogo,opcion_codigo:crypto.randomUUID(),opcion_nombre:clean,valor:clean});
        if(error) throw error;
        select.add(new Option(clean,clean,true,true));
      }catch(error){alert(error.message);}finally{button.disabled=false;}
    });
    select.parentElement.append(button);
  }
});
