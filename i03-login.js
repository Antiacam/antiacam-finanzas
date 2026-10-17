'use strict';
document.getElementById('login').addEventListener('submit',async event=>{
  event.preventDefault();
  const button=document.getElementById('entrar'),message=document.getElementById('mensaje');
  button.disabled=true;message.textContent='';
  try{
    const {error}=await window.sb.auth.signInWithPassword({email:document.getElementById('correo').value.trim(),password:document.getElementById('clave').value});
    if(error)throw error;
    document.getElementById('clave').value='';
    location.assign('seguridad.html');
  }catch(error){message.textContent='No se pudo iniciar sesión. Revise sus credenciales e intente de nuevo.';}finally{button.disabled=false;}
});
document.getElementById('equipo').addEventListener('click',async()=>{
  const button=document.getElementById('equipo'),message=document.getElementById('mensaje');
  button.disabled=true;message.textContent='Confirme su llave de acceso en el dispositivo.';
  try {
    const {data,error}=await sb.auth.signInWithPasskey();if(error)throw error;
    const token=localStorage.getItem('antiacam.equipo.'+data.user.id);
    if(!token)throw new Error('Este navegador no está registrado. Use contraseña y doble factor.');
    const acceso=await sb.schema(APP_SCHEMA).rpc('fn_equipo',{accion:'validar',token});
    if(acceso.error)throw new Error('Equipo vencido o revocado. Use contraseña y doble factor.');
    location.assign('8010-fact_prov.html');
  }catch(error){
    await sb.auth.signOut({scope:'local'});
    message.textContent=error.message||'Use contraseña y doble factor.';
  }finally{button.disabled=false;}
});
