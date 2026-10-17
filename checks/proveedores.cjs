const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
let calls=[],result={data:[{proveedor_id:250000,rnc:'123456789',proveedor:'Proveedor remoto'}],error:null};
const query=new Proxy({}, {get(_,method){
  if(method==='then') return resolve=>resolve(result);
  return (...args)=>{calls.push([method,...args]);return query;};
}});
const context={window:{},document:{addEventListener(){}},DB:{tabla(name){calls.push(['tabla',name]);return query;}},Map,console};
vm.createContext(context);vm.runInContext(fs.readFileSync('proveedores.js','utf8'),context);
(async()=>{
  const api=context.window.Proveedores;
  assert.equal((await api.buscar('proveedor','ab')).length,0);
  assert.equal(calls.length,0);
  const rows=await api.buscar('rnc','123456789',true);
  assert.equal(rows[0].proveedor_id,250000);
  assert.ok(calls.some(call=>call[0]==='eq'&&call[1]==='rnc'&&call[2]==='123456789'));
  assert.ok(calls.some(call=>call[0]==='limit'&&call[1]===15));
  for(const flag of [['activo',true],['eliminado',false],['estado',true]])
    assert.ok(calls.some(call=>call[0]==='eq'&&call[1]===flag[0]&&call[2]===flag[1]));
  calls=[];await api.buscar('proveedor','Empresa_100%');
  assert.ok(calls.some(call=>call[0]==='ilike'&&call[2]==='%Empresa\\_100\\%%'));
  result={data:null,error:new Error('Consulta bloqueada')};
  await assert.rejects(()=>api.buscar('rnc','123'),/Consulta bloqueada/);
  console.log('Proveedores: consulta remota fuera de la primera página, filtros, límite y errores correctos.');
})().catch(error=>{console.error(error);process.exitCode=1;});
