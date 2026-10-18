'use strict';
window.DGII606 = (() => {
  const numericos=['itbis_retenido','itbis_proporcionalidad','itbis_costo','itbis_adelantar','itbis_percibido','retencion_renta','isr_percibido'];
  const campos=['ncf_modificado','fecha_pago','tipo_retencion_isr',...numericos];
  const encabezados=['Líneas','RNC o Cédula','Tipo Id','Tipo Bienes y Servicios Comprados','NCF','NCF o Documento Modificado','Fecha Comprobante (Año mes)','Fecha Comprobante (Día)','Fecha Pago (Año mes)','Fecha Pago (Día)','Monto Facturado en Servicios','Monto Facturado en Bienes','Total Monto Facturado','ITBIS Facturado','ITBIS Retenido','ITBIS sujeto a Proporcionalidad (Art. 349)','ITBIS llevado al Costo','ITBIS por Adelantar','ITBIS percibido en compras','Tipo de Retención en ISR','Monto Retención Renta','ISR Percibido en compras','Impuesto Selectivo al Consumo','Otros Impuesto/Tasas','Monto Propina Legal','Forma de Pago','Estatus'];
  function leer() {
    return Object.fromEntries(campos.map(c=>{
      const valor=document.getElementById(c)?.value?.trim() || '';
      return [c,valor===''?null:numericos.includes(c)?Number(valor):valor];
    }));
  }
  function cargar(registro) {
    campos.forEach(c=>{const el=document.getElementById(c);if(el)el.value=registro[c]??'';});
    for(const campo of ['tipo_compra','forma_pago']) {
      const el=document.getElementById(campo),valor=String(registro[campo]??'');
      if(!el||!valor)continue;
      if(!Array.from(el.options||[]).some(op=>op.value===valor)) {
        const opcion=document.createElement('option');opcion.value=valor;
        opcion.textContent=valor+' (histórico: revisar para DGII)';el.append(opcion);
      }
      el.value=valor;
    }
  }
  function fecha(valor,opcional=false) {
    if(!valor&&opcional)return ['',''];
    const m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(String(valor||''));
    if(!m)throw new Error('Fecha inválida: use año-mes-día.');
    const d=new Date(Date.UTC(Number(m[1]),Number(m[2])-1,Number(m[3])));
    if(d.getUTCFullYear()!==Number(m[1])||d.getUTCMonth()+1!==Number(m[2])||d.getUTCDate()!==Number(m[3]))throw new Error('Fecha inexistente.');
    return [m[1]+m[2],m[3]];
  }
  function codigo(valor,max,alias={}) {
    const texto=String(valor??'').trim();
    if(alias[texto.toUpperCase()])return alias[texto.toUpperCase()];
    if(!/^\d{1,2}$/.test(texto)||Number(texto)<1||Number(texto)>max)throw new Error('Seleccione un código válido del catálogo DGII.');
    return Number(texto);
  }
  function monto(valor,opcional=false) {
    if((valor===null||valor===undefined||valor==='')&&opcional)return '';
    const n=Number(valor??0);if(!Number.isFinite(n)||n<0)throw new Error('Hay un monto inválido o negativo.');
    return Math.round((n+Number.EPSILON)*100)/100;
  }
  function filas(registros) {
    return registros.map((r,index)=>{
      try {
        const documento=String(r.rnc_proveedor??'').trim();
        const tipo=/^\d{9}$/.test(documento)?1:/^\d{11}$/.test(documento)?2:null;
        if(!tipo)throw new Error('El RNC debe tener 9 dígitos o la cédula 11.');
        if(!String(r.numero_ncf||'').trim())throw new Error('Falta el NCF.');
        const comprobante=fecha(r.fecha_factura),pago=fecha(r.fecha_pago,true);
        const retencion=String(r.tipo_retencion_isr??'').trim();
        const tipoIsr=!retencion||retencion==='00'?'':codigo(retencion,9);
        if((tipoIsr!==''||Number(r.itbis_retenido)>0||Number(r.retencion_renta)>0)&&!r.fecha_pago)throw new Error('Complete la fecha de pago para las retenciones.');
        if(Number(r.retencion_renta)>0&&tipoIsr==='')throw new Error('Seleccione el tipo de retención ISR.');
        const servicios=monto(r.subtotal_servicios_locales),bienes=monto(r.subtotal_bienes_locales);
        return [index+1,documento,tipo,codigo(r.tipo_compra,11),String(r.numero_ncf).trim().toUpperCase(),String(r.ncf_modificado||'').trim().toUpperCase(),...comprobante,...pago,
          servicios,bienes,monto(servicios+bienes),monto(r.itbis_total),monto(r.itbis_retenido,true),monto(r.itbis_proporcionalidad,true),monto(r.itbis_costo,true),monto(r.itbis_adelantar,true),monto(r.itbis_percibido,true),tipoIsr,monto(r.retencion_renta,true),monto(r.isr_percibido,true),monto(r.impuesto_selectivo_consumo),monto(r.otros_impuestos_tasas),monto(r.monto_propina_legal),codigo(r.forma_pago,7,{EFECTIVO:1,CHEQUE:2,TRANSFERENCIA:2,DEPOSITO:2,'DEPÓSITO':2,TARJETA:3}),''];
      }catch(error){throw new Error('Factura '+(r.factura_prov_id??index+1)+': '+error.message);}
    });
  }
  function libro(registros,XLSX) {
    const datos=filas(registros),ws=XLSX.utils.aoa_to_sheet([encabezados,...datos]);
    ws['!cols']=encabezados.map(titulo=>({wch:Math.max(16,titulo.length+2)}));
    ws['!autofilter']={ref:'A1:AA'+(datos.length+1)};
    for(let fila=2;fila<=datos.length+1;fila++)for(let col=10;col<=24;col++) {
      if(col===19)continue;
      const celda=ws[XLSX.utils.encode_cell({r:fila-1,c:col})];if(celda?.t==='n')celda.z='#,##0.00';
    }
    const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,ws,'606 DGII');return wb;
  }
  return {campos,numericos,encabezados,leer,cargar,fecha,filas,libro};
})();
