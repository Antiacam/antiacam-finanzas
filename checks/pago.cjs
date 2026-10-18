const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const html=fs.readFileSync('8011-fact_prov_mod.html','utf8');
const source=html.slice(html.indexOf('async function persistirCambiosFactura'),html.indexOf('async function guardarGasto'));
let result, payload;
const context={Object,String,Error,TABLA_FIN10:'facturas',CAMPO_ID:'factura_prov_id',SELECT_FIN10:'*',DB:{tabla:()=>({update:p=>{payload=p;return{eq:()=>({select:()=>({single:async()=>result})})}}})}};
vm.createContext(context);vm.runInContext(source,context);
(async()=>{
result={data:{factura_prov_id:2,forma_pago:'03'},error:null};
assert.equal((await context.persistirCambiosFactura(2,{forma_pago:'03'})).forma_pago,'03');assert.equal(payload.forma_pago,'03');
result={data:null,error:null};await assert.rejects(()=>context.persistirCambiosFactura(2,{forma_pago:'03'}),/no se confirmó/);
result={data:{factura_prov_id:2,forma_pago:null},error:null};await assert.rejects(()=>context.persistirCambiosFactura(2,{forma_pago:'03'}),/Forma de pago/);
result={data:null,error:new Error('Permiso denegado')};await assert.rejects(()=>context.persistirCambiosFactura(2,{forma_pago:'03'}),/Permiso denegado/);
assert.match(html,/setValor\(clave,guardado\[clave\]/);assert.match(html,/el.value=anterior/);
console.log('Forma de pago: respuesta confirmada, cero filas, valor rechazado, permisos y sincronización verificados.');
})().catch(e=>{console.error(e);process.exitCode=1});
