'use strict';
window.DGII606 = (() => {
  const numericos=['itbis_retenido','itbis_proporcionalidad','itbis_costo','itbis_adelantar','itbis_percibido','retencion_renta','isr_percibido'];
  const campos=['ncf_modificado','fecha_pago','tipo_retencion_isr',...numericos];
  const nombres={numero_ncf:'NCF / e-NCF',fecha_factura:'Fecha de factura',rnc_proveedor:'RNC / Cédula',nombre_proveedor:'Nombre del proveedor',tipo_compra:'Tipo de bienes y servicios / 606',forma_pago:'Forma de pago',fecha_pago:'Fecha de pago',tipo_retencion_isr:'Tipo de retención en ISR',subtotal_servicios_locales:'Servicios locales',subtotal_bienes_locales:'Bienes locales',itbis_total:'ITBIS total',itbis_retenido:'ITBIS retenido',itbis_proporcionalidad:'ITBIS sujeto a proporcionalidad',itbis_costo:'ITBIS llevado al costo',itbis_adelantar:'ITBIS por adelantar',itbis_percibido:'ITBIS percibido en compras',retencion_renta:'Monto retención renta',isr_percibido:'ISR percibido en compras',impuesto_selectivo_consumo:'Impuesto selectivo al consumo',otros_impuestos_tasas:'Otros impuestos/tasas',monto_propina_legal:'Propina legal'};
  const obligatorios=['numero_ncf','fecha_factura','rnc_proveedor','nombre_proveedor','tipo_compra','forma_pago'];
  function problema(campo,texto){return {campo,codigo:'VAL_'+campo.toUpperCase(),mensaje:(nombres[campo]||campo)+': '+texto};}
  function problemas(r,{guardar=false}={}) {
    const lista=[],agregar=(campo,texto)=>lista.push(problema(campo,texto));
    for(const c of obligatorios)if((guardar||c!=='nombre_proveedor')&&!String(r[c]??'').trim())agregar(c,'campo obligatorio.');
    if(r.rnc_proveedor&&!/^(?:\d{9}|\d{11})$/.test(String(r.rnc_proveedor).trim()))agregar('rnc_proveedor','ingrese 9 dígitos para RNC u 11 para cédula, sin guiones.');
    for(const [campo,max] of [['tipo_compra',11],['forma_pago',7],['tipo_retencion_isr',9]]) {
      const v=String(r[campo]??'').trim();if(!v||(campo==='tipo_retencion_isr'&&v==='00'))continue;
      try{codigo(v,max,campo==='forma_pago'?{EFECTIVO:1,CHEQUE:2,TRANSFERENCIA:2,DEPOSITO:2,'DEPÓSITO':2,TARJETA:3}:{});}catch{agregar(campo,'el valor «'+v+'» no es un código DGII válido. Seleccione una opción del catálogo (01–'+String(max).padStart(2,'0')+').');}
    }
    for(const c of ['fecha_factura','fecha_pago'])if(r[c])try{fecha(r[c]);}catch{agregar(c,'ingrese una fecha válida.');}
    for(const c of [...numericos,'subtotal_servicios_locales','subtotal_bienes_locales','itbis_total','impuesto_selectivo_consumo','otros_impuestos_tasas','monto_propina_legal'])if(r[c]!==null&&r[c]!==undefined&&r[c]!=='')try{monto(r[c]);}catch{agregar(c,'ingrese un monto válido, igual o mayor que cero; no se permiten negativos.');}
    const isr=String(r.tipo_retencion_isr??'').trim();
    if((isr&&isr!=='00'||Number(r.itbis_retenido)>0||Number(r.retencion_renta)>0)&&!r.fecha_pago)agregar('fecha_pago','obligatoria porque indicó retenciones de ITBIS o ISR.');
    if(Number(r.retencion_renta)>0&&(!isr||isr==='00'))agregar('tipo_retencion_isr','Seleccione el tipo de retención correspondiente al monto retenido.');
    return lista;
  }
  function marcar(lista) {
    document.querySelectorAll?.('[aria-invalid="true"]').forEach(el=>{el.removeAttribute?.('aria-invalid');el.classList?.remove('campo-invalido');});
    for(const p of lista){const el=document.getElementById(p.campo);el?.setAttribute?.('aria-invalid','true');el?.classList?.add('campo-invalido');}
    if(lista.length)document.getElementById(lista[0].campo)?.focus?.();
  }
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
    const pendientes=registros.flatMap((r,index)=>problemas(r).map(p=>'Factura '+(r.factura_prov_id??index+1)+' — '+p.mensaje));
    if(pendientes.length)throw new Error(pendientes.join('\n'));
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
  const descripciones={"TIPO_COMPRA":{"10":"ADQUISICIONES DE ACTIVOS","11":"GASTOS DE SEGUROS","01":"GASTOS DE PERSONAL","02":"GASTOS POR TRABAJOS, SUMINISTROS Y SERVICIOS","03":"ARRENDAMIENTOS","04":"GASTOS DE ACTIVOS FIJO","05":"GASTOS DE REPRESENTACIÓN","06":"OTRAS DEDUCCIONES ADMITIDAS","07":"GASTOS FINANCIEROS","08":"GASTOS EXTRAORDINARIOS","09":"COMPRAS Y GASTOS QUE FORMARAN PARTE DEL COSTO DE VENTA"},"TIPO_RETENCION_ISR":{"00":"SIN RETENCIÓN","01":"ALQUILERES","02":"HONORARIOS POR SERVICIOS","03":"OTRAS RENTAS","04":"OTRAS RENTAS (Rentas Presuntas)","05":"INTERESES PAGADOS A PERSONAS JURIDICAS RESIDENTES","06":"INTERESES PAGADOS A PERSONAS FISICAS RESIDENTES","07":"RETENCION POR PROVEEDORES DEL ESTADO","08":"JUEGOS TELEFONICOS","09":"RETENCIONES SUBSECTOR DE GANADERÍA DE CARNE BOVINA"},"FORMA_PAGO":{"01":"EFECTIVO","02":"CHEQUES/TRANSFERENCIAS/DEPÓSITO","03":"TARJETA CRÉDITO/DÉBITO","04":"COMPRA A CREDITO","05":"PERMUTA","06":"NOTA DE CREDITO","07":"MIXTO"}};
  function codigoDescripcion(catalogo,valor) {
    if(valor===''||valor===null||valor===undefined)return '';
    const cod=String(valor).padStart(2,'0');
    return cod+' - '+descripciones[catalogo][cod];
  }
  function libro(registros,XLSX) {
    const datos=filas(registros).map(fila=>{
      const salida=[...fila];
      for(const [indice,catalogo] of [[3,'TIPO_COMPRA'],[19,'TIPO_RETENCION_ISR'],[25,'FORMA_PAGO']])salida[indice]=codigoDescripcion(catalogo,salida[indice]);
      return salida;
    }),ws=XLSX.utils.aoa_to_sheet([encabezados,...datos]);
    ws['!cols']=encabezados.map(titulo=>({wch:Math.max(16,titulo.length+2)}));
    for(const indice of [3,19,25])ws['!cols'][indice]={wch:55};
    ws['!autofilter']={ref:'A1:AA'+(datos.length+1)};
    for(let fila=2;fila<=datos.length+1;fila++)for(let col=10;col<=24;col++) {
      if(col===19)continue;
      const celda=ws[XLSX.utils.encode_cell({r:fila-1,c:col})];if(celda?.t==='n')celda.z='#,##0.00';
    }
    const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,ws,'606 DGII');return wb;
  }
  document.addEventListener?.('DOMContentLoaded',()=>{
    function condicionales(){
      const valor=id=>document.getElementById(id)?.value||'';
      const isr=valor('tipo_retencion_isr');
      const pago=document.getElementById('fecha_pago'),tipo=document.getElementById('tipo_retencion_isr');
      if(pago)pago.required=!!(isr&&isr!=='00'||Number(valor('itbis_retenido'))>0||Number(valor('retencion_renta'))>0);
      if(tipo)tipo.required=Number(valor('retencion_renta'))>0;
    }
    for(const id of [...campos,...obligatorios])document.getElementById(id)?.addEventListener('input',event=>{
      event.target.removeAttribute('aria-invalid');event.target.classList.remove('campo-invalido');condicionales();
    });
    condicionales();
  });
  return {campos,numericos,encabezados,leer,cargar,fecha,filas,libro,nombres,obligatorios,problemas,marcar};
})();
