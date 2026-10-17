'use strict';
document.getElementById('login').addEventListener('submit',async event=>{
  event.preventDefault();
  const button=document.getElementById('entrar'),message=document.getElementById('mensaje');
  button.disabled=true;message.textContent='';
  try{
    const {error}=await window.sb.auth.signInWithPassword({email:document.getElementById('correo').value.trim(),password:document.getElementById('clave').value});
    if(error)throw error;
    const {data,error:mfaError}=await window.sb.auth.mfa.getAuthenticatorAssuranceLevel();
    if(mfaError)throw mfaError;
    if(data.nextLevel==='aal2' && data.currentLevel!=='aal2') {
      await window.sb.auth.signOut();
      throw new Error('Este usuario requiere segundo factor. Debe habilitarse ese flujo antes de entrar.');
    }
    location.assign('8010-fact_prov.html');
  }catch(error){message.textContent=error.message;}finally{button.disabled=false;}
});
