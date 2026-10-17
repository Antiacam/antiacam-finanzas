'use strict';
(() => {
  const el=id=>document.getElementById(id);
  async function validar() {
    const usuario=await obtenerUsuarioActualBase();
    if(!usuario){location.replace('index.html');return false;}
    const nivel=await sb.auth.mfa.getAuthenticatorAssuranceLevel();
    if(nivel.error)throw nivel.error;
    if(nivel.data.currentLevel!=='aal2'){location.replace('seguridad.html');return false;}
    const perfil=await DB.tabla('app_sys_usuario').select('activo,eliminado').eq('usuario_id',usuario.id).single();
    if(perfil.error||!perfil.data?.activo||perfil.data.eliminado)throw new Error('Usuario sin acceso activo.');
    return true;
  }
  el('cambio').addEventListener('submit',async event=>{
    event.preventDefault();el('guardar').disabled=true;el('mensaje').textContent='';
    try {
      if(!await validar())return;
      const nueva=el('nueva').value;
      if(nueva!==el('confirmar').value)throw new Error('Las nuevas contraseñas no coinciden.');
      if(nueva.length<12||!/[a-z]/.test(nueva)||!/[A-Z]/.test(nueva)||!/[0-9]/.test(nueva)||!/[!@#$%^&*()_+\-=\[\]{};'\\:"|<>?,./`~]/.test(nueva))throw new Error('Use 12 caracteres o más con mayúsculas, minúsculas, números y símbolos.');
      const datos={password:nueva,currentPassword:el('actual').value};
      if(el('nonce').value.trim())datos.nonce=el('nonce').value.trim();
      const {error}=await sb.auth.updateUser(datos);
      if(error?.code==='reauthentication_needed'){
        const envio=await sb.auth.reauthenticate();if(envio.error)throw envio.error;
        el('reautenticar').hidden=false;el('nonce').required=true;
        el('mensaje').textContent='Ingrese el código enviado a su correo y vuelva a confirmar el cambio.';return;
      }
      if(error)throw error;
      el('cambio').reset();
      const cierre=await sb.auth.signOut();
      el('cambio').hidden=true;
      el('mensaje').textContent=cierre.error?'Contraseña actualizada. Cierre la sesión y vuelva a entrar.':'Contraseña actualizada. Vuelva a iniciar sesión con su nueva contraseña.';
      const acceso=document.createElement('a');acceso.href='index.html';acceso.textContent='Ir al acceso';el('mensaje').after(acceso);
    }catch(error){el('mensaje').textContent=error.message||'No se pudo cambiar la contraseña.';}
    finally{el('guardar').disabled=false;}
  });
  void validar().then(ok=>{if(ok){el('cambio').hidden=false;el('mensaje').textContent='Confirme su contraseña actual para guardar la nueva.';}}).catch(error=>{
    if(error.name==='AuthSessionMissingError'||error.status===401){location.replace('index.html');return;}
    el('mensaje').textContent=error.message;
  });
})();
