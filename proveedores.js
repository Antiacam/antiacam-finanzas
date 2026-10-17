'use strict';
window.Proveedores = (() => {
  const pendientes = new Map();
  async function buscar(campo, texto, exacto = false) {
    const limpio = campo === 'rnc' ? String(texto).replace(/\D/g, '') : String(texto).trim();
    if (limpio.length < 2) return [];
    let query = DB.tabla('mt_opr_proveedor').select('proveedor_id,rnc,proveedor')
      .eq('activo', true).eq('eliminado', false).eq('estado', true);
    if (campo === 'rnc') query = exacto ? query.eq('rnc', limpio) : query.like('rnc', limpio + '%');
    else query = query.ilike('proveedor', '%' + limpio.replace(/[\\%_]/g, '\\$&') + '%');
    const { data, error } = await query.order('proveedor').limit(15);
    if (error) throw error;
    return data || [];
  }
  function agendar(campo, texto, listaId, mostrar, demora = 250) {
    const anterior = pendientes.get(campo);
    if (anterior) clearTimeout(anterior.timer);
    const solicitud = {};
    pendientes.set(campo, solicitud);
    const lista = document.getElementById(listaId);
    lista?.classList.remove('visible');
    solicitud.timer = setTimeout(async () => {
      try {
        const rows = await buscar(campo, texto);
        if (pendientes.get(campo) !== solicitud) return;
        mostrar(listaId, rows);
        if (!rows.length && String(texto).trim().length >= 2 && lista) {
          lista.replaceChildren();
          const aviso = document.createElement('div');
          aviso.className = 'autocomplete-item';
          aviso.textContent = 'Sin coincidencias. Puede crear el proveedor debajo.';
          lista.append(aviso); lista.classList.add('visible');
        }
      } catch (error) {
        if (pendientes.get(campo) !== solicitud || !lista) return;
        lista.replaceChildren();
        const aviso = document.createElement('div');
        aviso.className = 'autocomplete-item';
        aviso.textContent = 'No se pudieron consultar proveedores. Intente nuevamente.';
        lista.append(aviso); lista.classList.add('visible');
        console.error('Consulta de proveedores:', error);
      }
    }, demora);
  }
  function configurarEnter(input, campo, listaId, mostrar) {
    input.addEventListener('keydown', event => {
      if (event.key !== 'Enter') return;
      event.preventDefault();
      event.stopImmediatePropagation();
      agendar(campo, input.value, listaId, mostrar, 0);
    });
  }
  return { buscar, agendar, configurarEnter };
})();

document.addEventListener('DOMContentLoaded', async () => {
  if (!await window.authReady) return;
  const nombre = document.getElementById('nombre_proveedor');
  if (!nombre) return;
  Proveedores.configurarEnter(nombre, 'proveedor', 'listaProveedor', mostrarListaProveedores);
  Proveedores.configurarEnter(document.getElementById('rnc_proveedor'), 'rnc', 'listaRnc', mostrarListaProveedores);
  nombre.placeholder = 'Escriba 2 letras o más y pulse Enter';
  if (!window.APP_PERMISOS.some(p => p.puede_insert)) return;
  const button = document.createElement('button');
  button.type = 'button'; button.id = 'btnCrearProveedor';
  button.className = 'btn-mini proveedor-crear'; button.textContent = 'Crear proveedor';
  nombre.closest('.field-wrap').append(button);
  const dialog = document.createElement('dialog');
  dialog.className = 'proveedor-dialog'; dialog.setAttribute('aria-labelledby', 'proveedorTitulo');
  dialog.innerHTML = '<form id="nuevoProveedorForm"><h2 id="proveedorTitulo">Crear proveedor</h2><label for="nuevoProveedorRnc">RNC (9 dígitos)</label><input id="nuevoProveedorRnc" inputmode="numeric" maxlength="9" pattern="[0-9]{9}" required autocomplete="off"><label for="nuevoProveedorNombre">Nombre o razón social</label><input id="nuevoProveedorNombre" maxlength="200" required autocomplete="off"><p id="nuevoProveedorError" role="alert"></p><div class="proveedor-acciones"><button type="button" id="cancelarNuevoProveedor">Cancelar</button><button type="submit" id="guardarNuevoProveedor">Guardar proveedor</button></div></form>';
  document.body.append(dialog);
  const rncInput = dialog.querySelector('#nuevoProveedorRnc');
  const nombreInput = dialog.querySelector('#nuevoProveedorNombre');
  const message = dialog.querySelector('#nuevoProveedorError');
  const save = dialog.querySelector('#guardarNuevoProveedor');
  button.addEventListener('click', () => {
    rncInput.value = document.getElementById('rnc_proveedor').value.replace(/\D/g, '').slice(0, 9);
    nombreInput.value = nombre.value.trim(); message.textContent = '';
    dialog.showModal(); rncInput.focus();
  });
  dialog.querySelector('#cancelarNuevoProveedor').addEventListener('click', () => dialog.close());
  dialog.querySelector('form').addEventListener('submit', async event => {
    event.preventDefault(); message.textContent = '';
    const rnc = rncInput.value.trim(), proveedor = nombreInput.value.trim();
    if (!/^[0-9]{9}$/.test(rnc)) { message.textContent = 'Escriba un RNC de 9 dígitos.'; return; }
    if (!proveedor || proveedor.length > 200) { message.textContent = 'Escriba el nombre o razón social (máximo 200 caracteres).'; return; }
    save.disabled = true;
    try {
      const { data, error } = await DB.tabla('mt_opr_proveedor')
        .insert({ rnc, proveedor, estado: true }).select('proveedor_id,rnc,proveedor').single();
      if (error) throw error;
      seleccionarProveedor(data); dialog.close();
    } catch (error) {
      message.textContent = error.code === '23505'
        ? 'Este RNC ya existe. Cancele y búsquelo en el campo de proveedor.'
        : 'No se pudo crear el proveedor. ' + error.message;
    } finally { save.disabled = false; }
  });
});
