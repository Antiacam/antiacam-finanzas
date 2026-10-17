const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const tick=()=>new Promise(resolve=>setImmediate(resolve));
async function seguridad(aal='aal1') {
  const nodes=new Map(),calls=[];
  const node=id=>{if(!nodes.has(id))nodes.set(id,{hidden:true,value:'',textContent:'',listeners:{},addEventListener(t,fn){this.listeners[t]=fn},replaceChildren(){},append(){},removeAttribute(){}});return nodes.get(id)};
  const sb={schema:()=>({rpc:async(name,args)=>{calls.push(args);return {data:args.accion==='listar'?[]:{registrado:true}}}}),auth:{
    mfa:{getAuthenticatorAssuranceLevel:async()=>({data:{currentLevel:aal}}),listFactors:async()=>({data:{totp:[{id:'factor1',status:'verified'}]}}),
      challenge:async()=>{calls.push('challenge');return {data:{id:'reto1'}}},verify:async args=>{calls.push(args);aal='aal2';return {data:{}}}},
    registerPasskey:async()=>{calls.push('passkey');return {data:{id:'llave1'}}},signOut:async()=>({})}};
  const context={sb,APP_SCHEMA:'dev_v2',DB:{tabla:()=>({select(){return this},eq(){return this},single:async()=>({data:{activo:true,eliminado:false}})})},
    document:{getElementById:node,querySelectorAll:()=>[],createElement:()=>node(Math.random())},location:{replace(){}},
    obtenerUsuarioActualBase:async()=>({id:'u1',email:'example@example.test'}),crypto:require('crypto').webcrypto,localStorage:{setItem(...args){calls.push(args)}},Uint8Array,Date};
  vm.runInNewContext(fs.readFileSync('seguridad.js','utf8'),context);await tick();
  return {node,calls,fire:async(id,t)=>{node(id).listeners[t]({preventDefault(){}});await tick()}};
}
(async()=>{
  let app=await seguridad();
  assert.equal(app.node('equipos').hidden,true);
  app.node('nombre').value='Equipo prueba';await app.fire('registrar','submit');
  assert(!app.calls.includes('passkey'),'No registrar llave con AAL1');
  app.node('codigo').value='123456';await app.fire('verificar','submit');
  assert(app.calls.some(x=>x.challengeId==='reto1'&&x.factorId==='factor1'));
  assert.equal(app.node('equipos').hidden,false);
  await app.fire('registrar','submit');
  const registro=app.calls.find(x=>x.accion==='registrar');
  assert.equal(registro.llave,'llave1');assert.match(registro.token,/^[a-f0-9]{64}$/);
  assert(app.calls.some(x=>Array.isArray(x)&&x[0]==='antiacam.equipo.u1'));
  console.log('Seguridad: AAL1 bloquea registro; TOTP eleva sesión; llave y token aleatorio se registran tras AAL2.');
})().catch(error=>{console.error(error);process.exitCode=1});
