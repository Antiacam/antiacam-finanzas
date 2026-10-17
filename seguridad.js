'use strict';
(() => {
  const el = id => document.getElementById(id);
  let usuario, factor, ocupado = false;
  const informar = texto => { el('mensaje').textContent = texto; };
  async function operar(fn) {
    if (ocupado) return;
    ocupado = true;
    document.querySelectorAll('button').forEach(b => { b.disabled = true; });
    try { await fn(); } catch (error) {
      if(error.name==='AuthSessionMissingError'||error.status===401){location.replace('index.html');return;}
      informar(error.message || 'No se pudo completar la operación.');
    }
    finally { ocupado = false; document.querySelectorAll('button').forEach(b => { b.disabled = false; }); }
  }
  async function rpc(args) {
    const {data,error} = await sb.schema(APP_SCHEMA).rpc('fn_equipo',args);
    if(error) throw error;
    return data;
  }
  async function listar() {
    const equipos = await rpc({accion:'listar'});
    el('lista').replaceChildren();
    if(!equipos.length) el('lista').textContent='Todavía no hay equipos registrados.';
    for(const equipo of equipos) {
      const fila=document.createElement('div'),texto=document.createElement('span');
      texto.textContent=equipo.nombre+' · '+(equipo.revocado?'Revocado':'Vence: '+new Date(equipo.vence).toLocaleDateString());
      fila.append(texto);
      if(!equipo.revocado) {
        const boton=document.createElement('button');boton.type='button';boton.textContent='Revocar';
        boton.addEventListener('click',()=>operar(async()=>{
          await rpc({accion:'revocar',equipo_id:equipo.id});
          await listar();informar('Equipo revocado. Ya no puede autorizar sesiones.');
        }));fila.append(boton);
      }
      el('lista').append(fila);
    }
  }
  async function revisar() {
    const {data,error}=await sb.auth.mfa.getAuthenticatorAssuranceLevel();if(error) throw error;
    el('mfa').hidden=false;
    if(data.currentLevel==='aal2') {
      el('instruccion').textContent='Segundo factor verificado.';
      el('verificar').hidden=true;el('enrolamiento').hidden=true;el('configurar').hidden=true;
      el('qr').removeAttribute('src');el('secreto').textContent='';el('codigo').value='';
      el('equipos').hidden=false;el('continuar').hidden=false;
      informar('Sesión protegida. Puede continuar o registrar este equipo.');await listar();return;
    }
    el('equipos').hidden=true;el('continuar').hidden=true;
    const factores=await sb.auth.mfa.listFactors();if(factores.error) throw factores.error;
    factor=factores.data.totp.find(f=>f.status==='verified')?.id;
    el('instruccion').textContent=factor?'Ingrese el código de su autenticador para continuar.':'Configure su autenticador antes de acceder a Finanzas.';
    el('configurar').hidden=!!factor;el('verificar').hidden=!factor;
  }
  el('configurar').addEventListener('click',()=>operar(async()=>{
    const {data,error}=await sb.auth.mfa.enroll({factorType:'totp',friendlyName:'Antiacam '+new Date().toISOString(),issuer:'Antiacam'});
    if(error) throw error;factor=data.id;
    el('qr').src=data.totp.qr_code.startsWith('data:')?data.totp.qr_code:'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(data.totp.qr_code);
    el('secreto').textContent=data.totp.secret;el('enrolamiento').hidden=false;el('verificar').hidden=false;el('configurar').hidden=true;
    informar('Escanee el QR e ingrese el código para activar el doble factor.');
  }));
  el('verificar').addEventListener('submit',event=>{event.preventDefault();void operar(async()=>{
    const codigo=el('codigo').value.trim();if(!/^[0-9]{6}$/.test(codigo)||!factor) throw new Error('Ingrese seis dígitos.');
    const reto=await sb.auth.mfa.challenge({factorId:factor});if(reto.error) throw reto.error;
    const respuesta=await sb.auth.mfa.verify({factorId:factor,challengeId:reto.data.id,code:codigo});
    el('codigo').value='';if(respuesta.error) throw new Error('Código incorrecto o vencido. Intente con el código actual.');
    await revisar();
  });});
  el('registrar').addEventListener('submit',event=>{event.preventDefault();void operar(async()=>{
    const nombre=el('nombre').value.trim();if(!nombre) throw new Error('Indique un nombre para el equipo.');
    const nivel=await sb.auth.mfa.getAuthenticatorAssuranceLevel();if(nivel.error||nivel.data.currentLevel!=='aal2') throw new Error('Verifique el segundo factor antes de registrar el equipo.');
    const registro=await sb.auth.registerPasskey();if(registro.error) throw registro.error;
    const token=Array.from(crypto.getRandomValues(new Uint8Array(32)),v=>v.toString(16).padStart(2,'0')).join('');
    await rpc({accion:'registrar',token,llave:registro.data.id,nombre});
    localStorage.setItem('antiacam.equipo.'+usuario.id,token);
    informar('Equipo registrado por 30 días. La próxima vez puede usar Entrar con equipo de confianza.');await listar();
  });});
  el('salir').addEventListener('click',()=>operar(async()=>{
    const {error}=await sb.auth.signOut();if(error) throw error;location.replace('index.html');
  }));
  void operar(async()=>{
    usuario=await obtenerUsuarioActualBase();if(!usuario){location.replace('index.html');return;}
    const perfil=await DB.tabla('app_sys_usuario').select('activo,eliminado').eq('usuario_id',usuario.id).single();
    if(perfil.error||!perfil.data?.activo||perfil.data.eliminado) throw new Error('Usuario sin acceso activo.');
    el('cuenta').textContent=usuario.email;await revisar();
  });
})();
