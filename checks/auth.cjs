const fs = require('fs'), vm = require('vm'), assert = require('assert/strict');
const source = fs.readFileSync('i02-auth.js', 'utf8');
async function run({user = {id:'u1'}, allowed = true, mfa = false} = {}) {
  let redirected = false, ready = false, authCallback;
  const tables = {
    app_sys_usuario: {data:{usuario_id:'u1',activo:true,eliminado:false}},
    app_sys_usuario_permiso_formulario: {data:[{formulario_id:1,puede_select:allowed}]},
    mt_cfg_modulo_formulario: {data:[{formulario_id:1,formulario_codigo:'8010'}]}
  };
  const panel = {append(){}};
  const ctx = {
    location:{pathname:'/8010-fact_prov.html',replace(){redirected=true},reload(){}},
    document:{body:{classList:{add(){ready=true},remove(){ready=false}},replaceChildren(){},append(){}},createElement:()=>({...panel}),addEventListener(){}},
    obtenerUsuarioActualBase:async()=>user,
    DB:{tabla(name){const result = tables[name]; const query={select(){return query},eq(){return query},single:async()=>result,then(resolve){resolve(result)}};return query}},
    window:{addEventListener(){},sb:{auth:{onAuthStateChange(cb){authCallback=cb},mfa:{getAuthenticatorAssuranceLevel:async()=>({data:{nextLevel:mfa?'aal2':'aal1',currentLevel:'aal1'}})}}}}
  };
  vm.runInNewContext(source,ctx);
  const ok = await ctx.window.authReady;
  return {ok,redirected,ready,signOut(){authCallback('SIGNED_OUT');return {redirected,ready}}};
}
(async()=>{
  const authorized=await run();assert.equal(authorized.ok,true);
  assert.deepEqual(authorized.signOut(),{redirected:true,ready:false});
  assert.equal((await run({user:null})).redirected,true);
  assert.equal((await run({allowed:false})).ok,false);
  assert.equal((await run({mfa:true})).ok,false);
  console.log('Auth: authorized route, missing session, denied permission, MFA and sign-out checks passed.');
})().catch(error=>{console.error(error);process.exitCode=1});
