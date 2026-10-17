
/****************************************************************************************
 * ARCHIVO: base_funcion.js
 * --------------------------------------------------------------------------------------
 * OBJETIVO:
 * Biblioteca base de funciones genéricas reutilizables para dev_v2.
 *
 * CRITERIO:
 * - Este archivo NO debe contener reglas exclusivas de una pantalla.
 * - Aquí van funciones comunes: modal, mensaje, formulario, select, catálogo,
 *   búsqueda, tabla, validación, formato y operaciones básicas con Supabase.
 * - La lógica de negocio debe quedarse en el JS específico de cada pantalla.
 *   ejemplo: 2010-aten_clie.js, 3020-eval.js, 3030-coti.js.
 *
 * DEPENDENCIAS OPCIONALES:
 * - window.sb desde base_conexion.js para consultas Supabase.
 * - SweetAlert2 para alertas bonitas. Si no está cargado, usa alert/confirm.
 *
 * USO:
 * <script src="base_conexion.js"></script>
 * <script src="i02-auth.js"></script>
 * <script src="base_menu_lat.js"></script>
 * <script src="base_funcion.js"></script>
 * <script src="2010-aten_clie.js"></script>
 ****************************************************************************************/

(function () {
  'use strict';

  const APP_SCHEMA_DEFAULT = window.APP_SCHEMA || 'dev_v2';

  // ============================================================
  // 1. UTILIDAD DOM
  // ============================================================

  function obtenerElemento(ref) {
    if (!ref) return null;
    if (ref instanceof HTMLElement || ref === window || ref === document) return ref;
    if (typeof ref !== 'string') return null;
    return document.getElementById(ref) || document.querySelector(ref);
  }

  function existeElemento(ref) {
    return !!obtenerElemento(ref);
  }

  function on(ref, evento, funcion, opciones) {
    const el = obtenerElemento(ref);
    if (!el || typeof funcion !== 'function') return false;
    el.addEventListener(evento, funcion, opciones || false);
    return true;
  }

  function onClick(ref, funcion) {
    return on(ref, 'click', funcion);
  }

  function mostrarElemento(ref, display = '') {
    const el = obtenerElemento(ref);
    if (el) el.style.display = display;
  }

  function ocultarElemento(ref) {
    const el = obtenerElemento(ref);
    if (el) el.style.display = 'none';
  }

  function alternarClase(ref, clase, activo) {
    const el = obtenerElemento(ref);
    if (!el) return;
    el.classList.toggle(clase, !!activo);
  }

  function enfocarCampo(ref) {
    const el = obtenerElemento(ref);
    if (el && typeof el.focus === 'function') el.focus();
  }

  // ============================================================
  // 2. VALOR DE CAMPO
  // ============================================================

  function getValor(id) {
    const el = obtenerElemento(id);
    if (!el) return null;

    if (el.type === 'checkbox') return el.checked;
    if (el.type === 'radio') {
      const checked = document.querySelector(`input[name="${el.name}"]:checked`);
      return checked ? checked.value : null;
    }

    const valor = el.value;
    return valor === '' ? null : valor;
  }

  function setValor(id, valor) {
    const el = obtenerElemento(id);
    if (!el) return;

    if (el.type === 'checkbox') {
      el.checked = valor === true || valor === 'true' || valor === 1 || valor === '1';
      return;
    }

    el.value = valor ?? '';
  }

  function getTexto(id) {
    const el = obtenerElemento(id);
    return el ? String(el.value || '').trim() : '';
  }

  function getNumero(id) {
    const valor = getValor(id);
    if (valor === null || valor === undefined || valor === '') return null;
    const num = Number(String(valor).replace(/,/g, ''));
    return Number.isFinite(num) ? num : null;
  }

  function setTexto(id, texto) {
    setValor(id, texto ?? '');
  }

  function setCheck(id, valor) {
    setValor(id, !!valor);
  }

  function limpiarCampo(id) {
    setValor(id, '');
  }

  // ============================================================
  // 3. MENSAJE Y CONFIRMACIÓN
  // ============================================================

  function mostrarMensaje(texto, tipo = 'info', opciones = {}) {
    const idMensaje = opciones.idMensaje || 'mensajeFormulario';
    const el = obtenerElemento(idMensaje);

    if (el) {
      el.className = `mensaje ${tipo}`;
      el.textContent = texto || '';
      el.style.display = texto ? 'block' : 'none';
    }

    const usarSwal = opciones.swal !== false && typeof window.Swal !== 'undefined';
    if (!usarSwal) return;

    if (tipo === 'error') {
      window.Swal.fire({
        icon: 'error',
        title: opciones.titulo || 'Error',
        text: texto || 'Ha ocurrido un error.',
        confirmButtonText: opciones.textoBoton || 'OK',
        confirmButtonColor: opciones.colorBoton || '#2563eb'
      });
      return;
    }

    if (tipo === 'ok') {
      window.Swal.fire({
        icon: 'success',
        title: opciones.titulo || '¡Listo!',
        text: texto || 'Proceso completado.',
        confirmButtonText: opciones.textoBoton || 'OK',
        confirmButtonColor: opciones.colorBoton || '#2563eb',
        timer: opciones.timer ?? null,
        timerProgressBar: !!opciones.timer
      });
    }
  }

  function limpiarMensaje(idMensaje = 'mensajeFormulario') {
    const el = obtenerElemento(idMensaje);
    if (!el) return;
    el.className = 'mensaje';
    el.textContent = '';
    el.style.display = 'none';
  }

  async function confirmarAccion(opciones = {}) {
    const titulo   = opciones.titulo        || 'Confirmar acción';
    const mensaje  = opciones.mensaje       || '¿Está seguro que desea continuar?';
    const textoOk  = opciones.textoConfirmar || 'OK';
    const textoCan = opciones.textoCancelar  || 'Cancelar';

    if (typeof window.Swal !== 'undefined') {
      const r = await window.Swal.fire({
        icon: opciones.icono || 'question',
        title: titulo,
        text: mensaje,
        showCancelButton: true,
        confirmButtonText: textoOk,
        cancelButtonText: textoCan,
        confirmButtonColor: opciones.colorConfirmar || '#2563eb',
        cancelButtonColor:  opciones.colorCancelar  || '#64748b',
        customClass: { container: 'swal-sobre-modal' }
      });
      return r.isConfirmed === true;
    }

    return window.confirm(`${titulo}\n\n${mensaje}`);
  }

  // ============================================================
  // 4. MODAL
  // ============================================================

  function abrirModal(idModal, opciones = {}) {
    const modal = obtenerElemento(idModal);
    if (!modal) return false;

    modal.style.display = opciones.display || 'flex';
    modal.setAttribute('aria-hidden', 'false');

    if (opciones.bloquearScroll !== false) document.body.style.overflow = 'hidden';
    if (opciones.enfocar) setTimeout(() => enfocarCampo(opciones.enfocar), 50);

    return true;
  }

  function cerrarModal(idModal, opciones = {}) {
    const modal = obtenerElemento(idModal);
    if (!modal) return false;

    modal.style.display = 'none';
    modal.setAttribute('aria-hidden', 'true');

    if (opciones.restaurarScroll !== false) document.body.style.overflow = '';
    return true;
  }

  function alternarModal(idModal, mostrar, opciones = {}) {
    return mostrar ? abrirModal(idModal, opciones) : cerrarModal(idModal, opciones);
  }

  function configurarModal(idModal, opciones = {}) {
    const modal = obtenerElemento(idModal);
    if (!modal) return false;

    if (opciones.cerrarAlFondo !== false) {
      modal.addEventListener('click', function (e) {
        if (e.target === modal) cerrarModal(idModal);
      });
    }

    if (opciones.btnCerrar) {
      onClick(opciones.btnCerrar, () => cerrarModal(idModal));
    }

    return true;
  }

  // ============================================================
  // 5. FORMULARIO
  // ============================================================

  function limpiarFormulario(idFormulario = 'formPrincipal', opciones = {}) {
    const form = obtenerElemento(idFormulario);
    if (!form) return false;

    form.querySelectorAll('input, select, textarea').forEach(el => {
      if (el.type === 'hidden' && opciones.limpiarOculto === false) return;
      if (el.type === 'checkbox' || el.type === 'radio') el.checked = false;
      else el.value = '';
    });

    return true;
  }

  function habilitarFormulario(idFormulario = 'formPrincipal', habilitar = true, opciones = {}) {
    const form = obtenerElemento(idFormulario);
    if (!form) return false;

    const excluir = new Set(opciones.excluir || []);

    form.querySelectorAll('input, select, textarea, button').forEach(el => {
      if (el.type === 'hidden') return;
      if (el.dataset.siempreBloqueado === 'true') return;
      if (excluir.has(el.id) || excluir.has(el.name)) return;
      el.disabled = !habilitar;
    });

    return true;
  }

  function obtenerDatosFormulario(config = {}) {
    const form = obtenerElemento(config.formulario || 'formPrincipal');
    if (!form) return {};

    const datos = {};
    form.querySelectorAll('input, select, textarea').forEach(el => {
      if (!el.id && !el.name) return;
      const clave = el.name || el.id;
      if (config.excluir && config.excluir.includes(clave)) return;
      datos[clave] = getValor(el);
    });

    return datos;
  }

  function llenarFormulario(datos = {}, config = {}) {
    const prefijo = config.prefijo || '';
    Object.keys(datos || {}).forEach(campo => {
      const id = prefijo ? `${prefijo}${campo}` : campo;
      setValor(id, datos[campo]);
    });
  }

  function validarRequerido(campos = []) {
    for (const campo of campos) {
      const id     = typeof campo === 'string' ? campo : campo.id;
      const nombre = typeof campo === 'string' ? campo : (campo.nombre || campo.id);
      const valor  = getValor(id);

      if (valor === null || valor === undefined || String(valor).trim() === '') {
        mostrarMensaje(`El campo ${nombre} es requerido.`, 'error');
        enfocarCampo(id);
        return false;
      }
    }
    return true;
  }

  function crearPayload(campos = []) {
    const payload = {};
    campos.forEach(campo => {
      if (typeof campo === 'string') {
        payload[campo] = getValor(campo);
        return;
      }

      const id     = campo.id || campo.campo;
      const nombre = campo.nombreBD || campo.nombre || id;
      let valor    = getValor(id);

      if (campo.tipo === 'numero')  valor = valor === null ? null : Number(valor);
      if (campo.tipo === 'boolean') valor = !!valor;
      if (campo.tipo === 'texto')   valor = valor === null ? null : String(valor).trim();

      payload[nombre] = valor;
    });
    return payload;
  }



  // ============================================================
  // 5.1. CONTROL GENÉRICO DE MODIFICACIÓN
  // ============================================================

  /**
   * puedeModificarRegistro
   *
   * Solo el valor booleano true permite modificar.
   * false, null, undefined, 1, "true" o la ausencia del campo
   * se consideran bloqueados.
   */
  function puedeModificarRegistro(registro, campoPermiso = 'modificar') {
    return !!registro && registro[campoPermiso] === true;
  }

  /**
   * controlarModificacionFormulario
   *
   * Aplica el estado visual y funcional del formulario según
   * el campo modificar devuelto por la vista vw_form_*.
   *
   * Estados:
   * - nuevo:     formulario habilitado, Modificar oculto, Guardar habilitado.
   * - consulta:  formulario bloqueado, Modificar habilitado, Guardar bloqueado.
   * - edicion:   formulario habilitado, Modificar oculto, Guardar habilitado.
   * - bloqueado: formulario bloqueado, Modificar oculto, Guardar bloqueado.
   */
  function controlarModificacionFormulario(config = {}) {
    const formularioId = config.formulario || 'formPrincipal';
    const botonModificarId = config.botonModificar || 'btnModificar';
    const botonGuardarId = config.botonGuardar || 'btnGuardar';
    const campoPermiso = config.campoPermiso || 'modificar';

    const esNuevo = config.esNuevo === true;
    const modoEdicion = config.modoEdicion === true;
    const permisoVista = puedeModificarRegistro(config.registro, campoPermiso);
    const permiteModificar = esNuevo || permisoVista;

    let estado;

    if (esNuevo) {
      estado = 'nuevo';
    } else if (!permiteModificar) {
      estado = 'bloqueado';
    } else if (modoEdicion) {
      estado = 'edicion';
    } else {
      estado = 'consulta';
    }

    const formularioEditable = estado === 'nuevo' || estado === 'edicion';

    habilitarFormulario(formularioId, formularioEditable, {
      excluir: config.excluir || []
    });

    const formulario = obtenerElemento(formularioId);

    if (formulario) {
      formulario.dataset.estadoModificacion = estado;
      formulario.dataset.permiteModificar = String(permiteModificar);
    }

    const btnModificar = obtenerElemento(botonModificarId);

    if (btnModificar) {
      const mostrarModificar = estado === 'consulta' || (
        estado === 'bloqueado' && config.ocultarModificarBloqueado === false
      );

      btnModificar.style.display = mostrarModificar ? 'inline-flex' : 'none';
      btnModificar.disabled = estado !== 'consulta';
      btnModificar.setAttribute('aria-disabled', String(btnModificar.disabled));

      if (estado === 'bloqueado') {
        btnModificar.title = config.mensajeBloqueado
          || 'Este registro no puede modificarse porque tiene una transacción posterior activa.';
      } else {
        btnModificar.removeAttribute('title');
      }
    }

    const btnGuardar = obtenerElemento(botonGuardarId);

    if (btnGuardar) {
      btnGuardar.disabled = !formularioEditable;
      btnGuardar.setAttribute('aria-disabled', String(btnGuardar.disabled));

      if (estado === 'bloqueado') {
        btnGuardar.title = config.mensajeBloqueado
          || 'Este registro no puede guardarse porque tiene una transacción posterior activa.';
      } else {
        btnGuardar.removeAttribute('title');

      }
    }

    return {
      estado,
      esNuevo,
      modoEdicion,
      permiteModificar,
      formularioEditable
    };
  }

  /**
   * resolverIdentificadorModificacion
   *
   * Normaliza la identificación del registro para mantener compatibilidad:
   *
   * Estándar nuevo:
   * - campoIdRelacionado: id_relacionado
   * - idRelacionado
   * - obtenerIdRelacionado()
   *
   * Compatibilidad anterior:
   * - campoPK
   * - valorPK
   */
  function resolverIdentificadorModificacion(config = {}) {
    const campoIdRelacionado =
      config.campoIdRelacionado ||
      config.campoPK ||
      'id_relacionado';

    let idRelacionado;

    if (typeof config.obtenerIdRelacionado === 'function') {
      idRelacionado = config.obtenerIdRelacionado();
    } else if (config.idRelacionado !== undefined) {
      idRelacionado = config.idRelacionado;
    } else {
      idRelacionado = config.valorPK;
    }

    return {
      campoIdRelacionado,
      idRelacionado
    };
  }

  /**
   * consultarPermisoModificacion
   *
   * Consulta nuevamente la vista antes de modificar o guardar.
   * Por defecto usa los campos estándar:
   *
   * - id_relacionado
   * - modificar
   */
  async function consultarPermisoModificacion(config = {}) {
    if (!config.vista) {
      throw new Error('consultarPermisoModificacion requiere vista.');
    }

    if (!window.sb) {
      throw new Error('No existe window.sb. Verifique base_conexion.js.');
    }

    const {
      campoIdRelacionado,
      idRelacionado
    } = resolverIdentificadorModificacion(config);

    if (
      idRelacionado === undefined ||
      idRelacionado === null ||
      idRelacionado === ''
    ) {
      throw new Error(
        'consultarPermisoModificacion requiere idRelacionado, valorPK u obtenerIdRelacionado().'
      );
    }

    const schema = config.schema || APP_SCHEMA_DEFAULT;
    const campoPermiso = config.campoPermiso || 'modificar';

    const { data: registro, error } = await window.sb
      .schema(schema)
      .from(config.vista)
      .select(`${campoIdRelacionado}, ${campoPermiso}`)
      .eq(campoIdRelacionado, idRelacionado)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return {
      registro: registro || null,
      existe: !!registro,
      campoIdRelacionado,
      idRelacionado,
      permiteModificar: puedeModificarRegistro(registro, campoPermiso)
    };
  }

  /**
   * validarPermisoModificacion
   *
   * Devuelve true únicamente cuando la vista retorna modificar = true.
   * Mantiene compatibilidad con campoPK/valorPK, pero el estándar es
   * campoIdRelacionado/idRelacionado.
   */
  async function validarPermisoModificacion(config = {}) {
    try {
      const resultado = await consultarPermisoModificacion(config);

      if (resultado.permiteModificar) {
        return true;
      }

      if (config.bloquearFormulario !== false) {
        controlarModificacionFormulario({
          ...config,
          registro: resultado.registro,
          esNuevo: false,
          modoEdicion: false
        });
      }

      const mensaje = !resultado.existe
        ? (
          config.mensajeNoEncontrado ||
          'No se encontró el registro en la vista de formulario.'
        )
        : (
          config.mensajeBloqueado ||
          'Este registro no puede modificarse porque tiene una transacción posterior activa.'
        );

      mostrarMensaje(
        mensaje,
        'error',
        config.opcionesMensaje || {}
      );

      return false;
    } catch (error) {
      console.error('Error validando permiso de modificación:', error);

      mostrarMensaje(
        config.mensajeError ||
        'No fue posible validar si el registro puede modificarse.',
        'error',
        config.opcionesMensaje || {}
      );

      return false;
    }
  }

  /**
   * crearControlModificacion
   *
   * Controlador reutilizable para todas las pantallas que cargan registros
   * desde una vista vw_form_* con los campos estándar:
   *
   * - id_relacionado
   * - modificar
   *
   * Ejemplo:
   *
   * const controlEdicion = crearControlModificacion({
   *   vista: VISTA_FORM,
   *   obtenerIdRelacionado: () => Estado.idActual,
   *   formulario: 'formPrincipal',
   *   botonModificar: 'btnModificar',
   *   botonGuardar: 'btnGuardar',
   *   alHabilitar: () => {
   *     document.querySelectorAll('[data-siempre-bloqueado="true"]')
   *       .forEach(el => { el.disabled = true; });
   *   }
   * });
   */
  function crearControlModificacion(config = {}) {
    if (!config.vista) {
      throw new Error('crearControlModificacion requiere vista.');
    }

    const opciones = {
      schema: config.schema || APP_SCHEMA_DEFAULT,
      vista: config.vista,
      campoIdRelacionado: config.campoIdRelacionado || 'id_relacionado',
      campoPermiso: config.campoPermiso || 'modificar',
      formulario: config.formulario || 'formPrincipal',
      botonModificar: config.botonModificar || 'btnModificar',
      botonGuardar: config.botonGuardar || 'btnGuardar',
      excluir: config.excluir || [],
      ocultarModificarBloqueado: config.ocultarModificarBloqueado !== false,
      mensajeBloqueado: config.mensajeBloqueado
        || 'Este registro no puede modificarse porque tiene una transacción posterior activa.',
      mensajeNoEncontrado: config.mensajeNoEncontrado
        || 'No se encontró el registro en la vista de formulario.',
      mensajeError: config.mensajeError
        || 'No fue posible validar si el registro puede modificarse.',
      opcionesMensaje: config.opcionesMensaje || {},
      obtenerIdRelacionado: config.obtenerIdRelacionado,
      autoConfigurarBotonModificar: config.autoConfigurarBotonModificar !== false,
      autoConfigurarBotonGuardar: config.autoConfigurarBotonGuardar === true,
      alHabilitar: config.alHabilitar,
      alBloquear: config.alBloquear,
      alConsulta: config.alConsulta,
      alNuevo: config.alNuevo,
      alCambiarEstado: config.alCambiarEstado,
      alGuardar: config.alGuardar
    };

    const estadoInterno = {
      registro: null,
      idRelacionado: null,
      estado: 'nuevo',
      modoEdicion: true,
      eventoModificarConfigurado: false,
      eventoGuardarConfigurado: false
    };

    function obtenerIdRelacionado() {
      if (typeof opciones.obtenerIdRelacionado === 'function') {
        const valor = opciones.obtenerIdRelacionado();
        if (valor !== undefined && valor !== null && valor !== '') {
          return valor;
        }
      }

      if (
        estadoInterno.registro &&
        estadoInterno.registro[opciones.campoIdRelacionado] !== undefined
      ) {
        return estadoInterno.registro[opciones.campoIdRelacionado];
      }

      return estadoInterno.idRelacionado;
    }

    function ejecutarCallback(nombre, detalle) {
      const callback = opciones[nombre];
      if (typeof callback === 'function') {
        return callback(detalle);
      }
      return undefined;
    }

    function aplicarEstado(configEstado = {}) {
      const esNuevo = configEstado.esNuevo === true;
      const modoEdicion = configEstado.modoEdicion === true;

      estadoInterno.modoEdicion = modoEdicion;

      const resultado = controlarModificacionFormulario({
        registro: estadoInterno.registro,
        esNuevo,
        modoEdicion,
        campoPermiso: opciones.campoPermiso,
        formulario: opciones.formulario,
        botonModificar: opciones.botonModificar,
        botonGuardar: opciones.botonGuardar,
        excluir: opciones.excluir,
        ocultarModificarBloqueado: opciones.ocultarModificarBloqueado,
        mensajeBloqueado: opciones.mensajeBloqueado
      });

      estadoInterno.estado = resultado.estado;

      const detalle = {
        ...resultado,
        registro: estadoInterno.registro,
        idRelacionado: obtenerIdRelacionado(),
        control: api
      };

      if (resultado.estado === 'nuevo') {
        ejecutarCallback('alNuevo', detalle);
      } else if (resultado.estado === 'edicion') {
        ejecutarCallback('alHabilitar', detalle);
      } else if (resultado.estado === 'consulta') {
        ejecutarCallback('alConsulta', detalle);
      } else if (resultado.estado === 'bloqueado') {
        ejecutarCallback('alBloquear', detalle);
      }

      ejecutarCallback('alCambiarEstado', detalle);

      return detalle;
    }

    async function cargar(registro, configCarga = {}) {
      estadoInterno.registro = registro || null;
      estadoInterno.idRelacionado =
        registro?.[opciones.campoIdRelacionado] ??
        configCarga.idRelacionado ??
        obtenerIdRelacionado();

      return aplicarEstado({
        esNuevo: false,
        modoEdicion: false
      });
    }

    function nuevo(configNuevo = {}) {
      estadoInterno.registro = null;
      estadoInterno.idRelacionado = null;

      return aplicarEstado({
        esNuevo: true,
        modoEdicion: configNuevo.modoEdicion !== false
      });
    }

    function limpiar() {
      return nuevo();
    }

    function bloquear(registro = null) {
      estadoInterno.registro = {
        ...(estadoInterno.registro || {}),
        ...(registro || {}),
        [opciones.campoPermiso]: false
      };

      return aplicarEstado({
        esNuevo: false,
        modoEdicion: false
      });
    }

    async function consultar() {
      const idRelacionado = obtenerIdRelacionado();

      const resultado = await consultarPermisoModificacion({
        schema: opciones.schema,
        vista: opciones.vista,
        campoIdRelacionado: opciones.campoIdRelacionado,
        idRelacionado,
        campoPermiso: opciones.campoPermiso
      });

      estadoInterno.idRelacionado = resultado.idRelacionado;
      estadoInterno.registro = {
        ...(estadoInterno.registro || {}),
        ...(resultado.registro || {})
      };

      return resultado;
    }

    async function solicitarEdicion() {
      const idRelacionado = obtenerIdRelacionado();

      if (
        idRelacionado === undefined ||
        idRelacionado === null ||
        idRelacionado === ''
      ) {
        mostrarMensaje(
          opciones.mensajeNoEncontrado,
          'error',
          opciones.opcionesMensaje
        );
        return false;
      }

      try {
        const resultado = await consultar();

        if (!resultado.permiteModificar) {
          bloquear(resultado.registro);

          mostrarMensaje(
            resultado.existe
              ? opciones.mensajeBloqueado
              : opciones.mensajeNoEncontrado,
            'error',
            opciones.opcionesMensaje
          );

          return false;
        }

        estadoInterno.registro = {
          ...(estadoInterno.registro || {}),
          ...(resultado.registro || {}),
          [opciones.campoPermiso]: true
        };

        aplicarEstado({
          esNuevo: false,
          modoEdicion: true
        });

        return true;
      } catch (error) {
        console.error('Error solicitando edición:', error);

        bloquear();

        mostrarMensaje(
          opciones.mensajeError,
          'error',
          opciones.opcionesMensaje
        );

        return false;
      }
    }

    async function validarAntesGuardar() {
      const idRelacionado = obtenerIdRelacionado();

      // Registro nuevo: no existe transacción previa que validar.
      if (
        idRelacionado === undefined ||
        idRelacionado === null ||
        idRelacionado === ''
      ) {
        return true;
      }

      try {
        const resultado = await consultar();

        if (!resultado.permiteModificar) {
          bloquear(resultado.registro);

          mostrarMensaje(
            resultado.existe
              ? opciones.mensajeBloqueado
              : opciones.mensajeNoEncontrado,
            'error',
            opciones.opcionesMensaje
          );

          return false;

        }

        estadoInterno.registro = {
          ...(estadoInterno.registro || {}),
          ...(resultado.registro || {}),
          [opciones.campoPermiso]: true
        };

        return true;
      } catch (error) {
        console.error('Error validando antes de guardar:', error);

        bloquear();

        mostrarMensaje(
          opciones.mensajeError,
          'error',
          opciones.opcionesMensaje
        );

        return false;
      }
    }

    async function ejecutarGuardado(funcionGuardar, ...argumentos) {
      const guardar = funcionGuardar || opciones.alGuardar;

      if (typeof guardar !== 'function') {
        throw new Error(
          'ejecutarGuardado requiere una función de guardado o config.alGuardar.'
        );
      }

      const permitido = await validarAntesGuardar();
      if (!permitido) {
        return false;
      }

      return guardar(...argumentos);
    }

    function configurarBotonModificar() {
      if (estadoInterno.eventoModificarConfigurado) {
        return true;
      }

      const boton = obtenerElemento(opciones.botonModificar);
      if (!boton) {
        return false;
      }

      boton.addEventListener('click', async function (evento) {
        evento.preventDefault();
        await solicitarEdicion();
      });

      estadoInterno.eventoModificarConfigurado = true;
      return true;
    }

    function configurarBotonGuardar() {
      if (estadoInterno.eventoGuardarConfigurado) {
        return true;
      }

      if (typeof opciones.alGuardar !== 'function') {
        return false;
      }

      const boton = obtenerElemento(opciones.botonGuardar);
      if (!boton) {
        return false;
      }

      boton.addEventListener('click', async function (evento) {
        evento.preventDefault();
        await ejecutarGuardado(opciones.alGuardar);
      });

      estadoInterno.eventoGuardarConfigurado = true;
      return true;
    }

    function obtenerEstado() {
      return {
        ...estadoInterno,
        registro: estadoInterno.registro
          ? { ...estadoInterno.registro }
          : null,
        idRelacionado: obtenerIdRelacionado()
      };
    }

    const api = {
      cargar,
      nuevo,
      limpiar,
      bloquear,
      consultar,
      solicitarEdicion,
      validarAntesGuardar,
      ejecutarGuardado,
      aplicarEstado,
      configurarBotonModificar,
      configurarBotonGuardar,
      obtenerEstado,
      obtenerIdRelacionado
    };

    if (opciones.autoConfigurarBotonModificar) {
      configurarBotonModificar();
    }

    if (opciones.autoConfigurarBotonGuardar) {
      configurarBotonGuardar();
    }

    return api;
  }

  // ============================================================
  // 6. SELECT Y CATÁLOGO
  // ============================================================

  function limpiarSelect(idSelect, texto = '— Seleccione —') {
    const s = obtenerElemento(idSelect);
    if (!s) return false;
    s.innerHTML = `<option value="">${texto}</option>`;
    return true;
  }

  function llenarSelect(idSelect, registros = [], config = {}) {
    const s = obtenerElemento(idSelect);
    if (!s) return false;

    const valorCampo  = config.valor || 'id';
    const textoCampo  = config.texto || 'descripcion';
    const placeholder = config.placeholder ?? '— Seleccione —';

    if (config.limpiar !== false) limpiarSelect(idSelect, placeholder);

    (registros || []).forEach(reg => {
      const o = document.createElement('option');
      o.value = reg[valorCampo] ?? '';
      o.textContent = typeof textoCampo === 'function'
        ? textoCampo(reg)
        : (reg[textoCampo] ?? '');
      if (config.dataset) {
        Object.keys(config.dataset).forEach(k => {
          o.dataset[k] = reg[config.dataset[k]] ?? '';
        });
      }
      s.appendChild(o);
    });

    if (config.valorSeleccionado !== undefined) s.value = config.valorSeleccionado ?? '';
    return true;
  }

  async function consultarTabla(tabla, config = {}) {
    if (!window.sb) throw new Error('No existe window.sb. Verifique base_conexion.js.');

    const schema = config.schema || APP_SCHEMA_DEFAULT;
    let q = window.sb.schema(schema).from(tabla).select(config.select || '*');

    (config.filtros || []).forEach(f => {
      const metodo = f.operador || 'eq';
      q = q[metodo](f.campo, f.valor);
    });

    if (config.activo  !== false) q = q.eq('activo',    true);
    if (config.eliminado !== false) q = q.eq('eliminado', false);
    if (config.orden)   q = q.order(config.orden, { ascending: config.ascendente !== false });
    if (config.limite)  q = q.limit(config.limite);

    const { data, error } = await q;
    if (error) throw error;
    return data || [];
  }

  async function cargarSelectTabla(config = {}) {
    const data = await consultarTabla(config.tabla, config);
    llenarSelect(config.selectId, data, {
      valor:            config.valor,
      texto:            config.texto,
      placeholder:      config.placeholder,
      valorSeleccionado: config.valorSeleccionado
    });
    return data;
  }

  /**
   * cargarCatalogo — carga opciones desde mt_cat_opcion.
   *
   * Acepta dos firmas para compatibilidad con pantallas existentes:
   *
   * FIRMA OBJETO (recomendada):
   *   await cargarCatalogo({
   *     selectId:         'via_comunicacion_id',
   *     catalogoCodigo:   'VIA_COMUNICACION',
   *     formularioCodigo: 'CRM10_ATENCION_CLIENTE'   // opcional, default APP_SCHEMA_DEFAULT
   *   });
   *
   * FIRMA POSICIONAL (legacy, sigue funcionando):
   *   await cargarCatalogo('via_comunicacion_id', 'VIA_COMUNICACION');
   *   await cargarCatalogo('mnc_tipo_documento',  'TIPO_DOCUMENTO', 'MT_OPR_CLIENTE');
   */
 async function cargarCatalogo(
  primerArg,
  catalogoCodigoLegacy,
  formularioCodigoLegacy
) {
  let config;

  if (typeof primerArg === 'string') {
    config = {
      selectId: primerArg,
      catalogoCodigo: catalogoCodigoLegacy,
      formularioCodigo: formularioCodigoLegacy
    };
  } else {
    config = primerArg || {};
  }

  const formularioCodigo =
    config.formularioCodigo ||
    config.formulario_codigo ||
    window.FORMULARIO_CODIGO;

  const catalogoCodigo =
    config.catalogoCodigo ||
    config.catalogo_codigo;

  if (!formularioCodigo || !catalogoCodigo) {
    throw new Error(
      'No se pudo determinar formularioCodigo o catalogoCodigo. ' +
      'Defina window.FORMULARIO_CODIGO en la pantalla.'
    );
  }

  const data = await consultarTabla('mt_cat_opcion', {
    schema: config.schema || APP_SCHEMA_DEFAULT,
    select:
      config.select ||
      'opcion_id, opcion_codigo, opcion_nombre, valor, orden_lista',
    filtros: [
      {
        campo: 'formulario_codigo',
        valor: formularioCodigo
      },
      {
        campo: 'catalogo_codigo',
        valor: catalogoCodigo
      }
    ],
    orden: config.orden || 'orden_lista'
  });

  if (config.selectId) {
    llenarSelect(config.selectId, data, {
      valor: config.valor || 'opcion_id',
      texto: config.texto || 'opcion_nombre',
      placeholder: config.placeholder || '— Seleccione —',
      valorSeleccionado: config.valorSeleccionado
    });
  }

  return data;
}

  // ============================================================
  // 7. BÚSQUEDA / AUTOCOMPLETE
  // ============================================================

  function ocultarLista(idLista) {
    const lista = obtenerElemento(idLista);
    if (!lista) return;
    lista.classList.remove('visible');
    lista.style.display = 'none';
  }

  function mostrarLista(idLista) {
    const lista = obtenerElemento(idLista);
    if (!lista) return;
    lista.classList.add('visible');
    lista.style.display = '';
  }

  function renderizarLista(config = {}) {
    const lista = obtenerElemento(config.listaId);
    if (!lista) return false;

    lista.innerHTML = '';
    const resultados = config.resultados || [];

    if (!resultados.length) {
      const item = document.createElement('div');
      item.className   = config.claseVacio || 'autocomplete-item vacio';
      item.textContent = config.textoVacio  || 'Sin resultados';
      lista.appendChild(item);
      mostrarLista(config.listaId);
      return true;
    }

    resultados.forEach(reg => {
      const item = document.createElement('div');
      item.className   = config.claseItem || 'autocomplete-item';
      item.textContent = typeof config.texto === 'function'
        ? config.texto(reg)
        : String(reg[config.texto] ?? '');
      item.addEventListener('click', () => {
        if (typeof config.alSeleccionar === 'function') config.alSeleccionar(reg);
        ocultarLista(config.listaId);
      });
      lista.appendChild(item);
    });

    mostrarLista(config.listaId);
    return true;
  }

  function textoSeguroLike(texto) {
    return String(texto || '').replace(/[%_,]/g, '').trim();
  }

  async function buscarRegistro(config = {}) {
    const termino = textoSeguroLike(config.termino);
    const minimo  = config.minimo ?? 2;
    if (termino.length < minimo) return [];

    if (!window.sb) throw new Error('No existe window.sb. Verifique base_conexion.js.');

    const schema = config.schema || APP_SCHEMA_DEFAULT;
    const campos = config.campos || [];
    let q = window.sb.schema(schema).from(config.tabla).select(config.select || '*');

    if (campos.length) {
      q = q.or(campos.map(c => `${c}.ilike.%${termino}%`).join(','));
    }

    (config.filtros || []).forEach(f => {
      const metodo = f.operador || 'eq';
      q = q[metodo](f.campo, f.valor);
    });

    if (config.activo   !== false) q = q.eq('activo',    true);
    if (config.eliminado !== false) q = q.eq('eliminado', false);
    if (config.orden) q = q.order(config.orden, { ascending: config.ascendente !== false });
    q = q.limit(config.limite || 15);

    const { data, error } = await q;
    if (error) throw error;
    return data || [];
  }

  /**
   * configurarBusquedaEnterBlur — conecta Enter y blur de un input a una función de búsqueda.
   * Evita doble ejecución con flag interno. Resuelve el bug del dispatchEvent frágil.
   *
   * Uso:
   *   configurarBusquedaEnterBlur({
   *     inputId:  'txtBusqueda',
   *     alBuscar: async (termino) => { ... },
   *     delayBlur: 150   // opcional
   *   });
   */
  function configurarBusquedaEnterBlur(config = {}) {
    const input = obtenerElemento(config.inputId);
    if (!input) return false;

    let ejecutando = false;

    async function ejecutar() {
      if (ejecutando) return;
      ejecutando = true;
      try {
        const termino = input.value || '';
        if (typeof config.alBuscar === 'function') await config.alBuscar(termino);
      } finally {
        ejecutando = false;
      }
    }

    input.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        e.preventDefault();
        ejecutar();
      }
    });

    input.addEventListener('blur', () => {
      setTimeout(ejecutar, config.delayBlur || 150);
    });

    return true;
  }


  // ============================================================
  // 7.1. BÚSQUEDA GENÉRICA PARA TABLAS MAESTRAS
  // ============================================================

  /**
   * configurarBusquedaMaestro
   *
   * Estandariza la búsqueda de todos los formularios maestros.
   *
   * Comportamiento:
   * - El botón Buscar abre/cierra el bloque de búsqueda.
   * - Al escribir ** y presionar Enter, consulta todos los registros.
   * - Al escribir una o varias palabras, muestra todas las coincidencias.
   * - Los resultados se presentan en una tabla desplazable.
   * - Al seleccionar un renglón, ejecuta alSeleccionar(registro).
   *
   * Ejemplo:
   *   configurarBusquedaMaestro({
   *     botonBuscarId: 'btnBuscar',
   *     bloqueId: 'bloqueBusqueda',
   *     inputId: 'txtBusqueda',
   *     resultadosId: 'listaBusqueda',
   *     tabla: 'vw_form_mt_opr_cliente',
   *     select: '*',
   *     campoTextoCombinado: 'texto_busqueda',
   *     camposBusqueda: ['nombre_cliente', 'numero_documento'],
   *     orden: 'nombre_cliente',
   *     alSeleccionar: async registro => cargarCliente(registro.cliente_id)
   *   });
   */

  function asegurarEstilosBusquedaMaestro() {
    if (document.getElementById('baseBusquedaMaestroEstilos')) return;

    const estilo = document.createElement('style');
    estilo.id = 'baseBusquedaMaestroEstilos';
    estilo.textContent = `
      .busqueda-maestro-resultados {
        position: static !important;
        inset: auto !important;
        display: none;
        width: 100%;
        max-height: none !important;
        margin-top: 12px;
        overflow: visible !important;
        background: transparent !important;
        border: 0 !important;
        border-radius: 0 !important;
        box-shadow: none !important;
        z-index: auto !important;
      }

      .busqueda-maestro-resultados.visible {
        display: block !important;
      }

      .busqueda-maestro-estado {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        margin: 0 0 8px;
        color: #64748b;
        font-size: 12px;
      }

      .busqueda-maestro-tabla-wrap {
        width: 100%;
        max-height: 420px;
        overflow: auto;
        border: 1px solid #dde6f5;
        border-radius: 9px;
        background: #ffffff;
      }

      .busqueda-maestro-tabla {
        width: 100%;
        min-width: max-content;
        border-collapse: collapse;
        font-size: 12px;
      }

      .busqueda-maestro-tabla th {
        position: sticky;
        top: 0;
        z-index: 2;
        padding: 9px 10px;
        background: #1e3a8a;
        color: #ffffff;
        border: 1px solid #294a9b;
        text-align: left;
        font-weight: 700;
        white-space: nowrap;
      }

      .busqueda-maestro-tabla td {
        padding: 8px 10px;
        border: 1px solid #e5e7eb;
        color: #0f172a;
        white-space: nowrap;
        max-width: 360px;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .busqueda-maestro-tabla tbody tr {
        cursor: pointer;
      }

      .busqueda-maestro-tabla tbody tr:nth-child(even) {
        background: #f8fafc;
      }

      .busqueda-maestro-tabla tbody tr:hover,
      .busqueda-maestro-tabla tbody tr:focus {
        background: #dbeafe;
        outline: 2px solid #2563eb;
        outline-offset: -2px;
      }

      .busqueda-maestro-vacio,
      .busqueda-maestro-cargando,
      .busqueda-maestro-error {
        padding: 14px;
        border: 1px solid #dde6f5;
        border-radius: 8px;
        background: #ffffff;
        color: #64748b;
        font-size: 13px;
      }

      .busqueda-maestro-error {
        color: #991b1b;
        background: #fef2f2;
        border-color: #fecaca;
      }

      @media (max-width: 700px) {
        .busqueda-maestro-tabla-wrap {
          max-height: 360px;
        }
      }
    `;

    document.head.appendChild(estilo);
  }

  function normalizarTerminoBusquedaMaestro(valor) {
    return String(valor ?? '')
      .replace(/[%,()]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function tituloCampoBusquedaMaestro(campo) {
    return String(campo || '')
      .replace(/_/g, ' ')
      .replace(/\b\w/g, letra => letra.toUpperCase());
  }

  function valorVisibleBusquedaMaestro(valor) {
    if (valor === null || valor === undefined) return '';
    if (valor === true) return 'Sí';
    if (valor === false) return 'No';
    if (typeof valor === 'object') {
      try {
        return JSON.stringify(valor);
      } catch (_) {
        return String(valor);
      }
    }
    return String(valor);
  }

  function resolverColumnasBusquedaMaestro(registros = [], columnasConfig, excluir = []) {
    if (Array.isArray(columnasConfig) && columnasConfig.length) {
      return columnasConfig.map(columna => {
        if (typeof columna === 'string') {
          return {
            campo: columna,
            titulo: tituloCampoBusquedaMaestro(columna)
          };
        }

        return {
          campo: columna.campo,
          titulo: columna.titulo || tituloCampoBusquedaMaestro(columna.campo),
          render: columna.render
        };
      });
    }

    const camposExcluidos = new Set(excluir || []);
    const campos = [];
    const vistos = new Set();

    registros.forEach(registro => {
      Object.keys(registro || {}).forEach(campo => {
        if (camposExcluidos.has(campo) || vistos.has(campo)) return;
        vistos.add(campo);
        campos.push(campo);
      });
    });

    return campos.map(campo => ({
      campo,
      titulo: tituloCampoBusquedaMaestro(campo)
    }));
  }

  function aplicarFiltrosBusquedaMaestro(consulta, filtros = []) {
    let q = consulta;

    (filtros || []).forEach(filtro => {
      const operador = filtro.operador || 'eq';

      if (typeof q[operador] !== 'function') {
        throw new Error(`Operador de filtro no soportado: ${operador}`);
      }

      if (operador === 'is') {
        q = q.is(filtro.campo, filtro.valor);
      } else if (operador === 'in') {
        q = q.in(filtro.campo, filtro.valor || []);
      } else {
        q = q[operador](filtro.campo, filtro.valor);
      }
    });

    return q;
  }

  async function buscarRegistrosMaestro(config = {}, terminoOriginal = '') {
    if (!config.tabla) {
      throw new Error('buscarRegistrosMaestro requiere tabla o vista.');
    }

    if (!window.sb) {
      throw new Error('No existe window.sb. Verifique base_conexion.js.');
    }

    const terminoIngresado = String(terminoOriginal ?? '').trim();
    const mostrarTodos = terminoIngresado === '**';
    const termino = normalizarTerminoBusquedaMaestro(terminoIngresado);
    const minimo = config.minimo ?? 1;

    if (!mostrarTodos && termino.length < minimo) return [];

    const terminos = mostrarTodos
      ? []
      : termino.split(' ').map(t => t.trim()).filter(Boolean);

    const schema = config.schema || APP_SCHEMA_DEFAULT;
    const tamanoPagina = Math.max(1, Math.min(Number(config.tamanoPagina || 1000), 1000));
    const maxRegistros = Math.max(tamanoPagina, Number(config.maxRegistros || 10000));
    const registros = [];

    for (let desde = 0; desde < maxRegistros; desde += tamanoPagina) {
      let q = window.sb
        .schema(schema)
        .from(config.tabla)
        .select(config.select || '*');

      if (!mostrarTodos && terminos.length) {
        if (config.campoTextoCombinado) {
          terminos.forEach(palabra => {
            q = q.ilike(config.campoTextoCombinado, `%${palabra}%`);
          });
        } else {
          const campos = config.camposBusqueda || config.campos || [];

          if (!campos.length) {
            throw new Error(
              'Indique campoTextoCombinado o camposBusqueda para buscar coincidencias.'
            );
          }

          terminos.forEach(palabra => {
            const expresion = campos
              .map(campo => `${campo}.ilike.%${palabra}%`)
              .join(',');
            q = q.or(expresion);
          });
        }
      }

      q = aplicarFiltrosBusquedaMaestro(q, config.filtros || []);

      if (config.orden) {
        q = q.order(config.orden, {
          ascending: config.ascendente !== false,
          nullsFirst: config.nulosPrimero === true
        });
      }

      q = q.range(desde, Math.min(desde + tamanoPagina - 1, maxRegistros - 1));

      const { data, error } = await q;
      if (error) throw error;

      const lote = data || [];
      registros.push(...lote);

      if (lote.length < tamanoPagina) break;
    }

    return registros;
  }

  function renderizarResultadosBusquedaMaestro(config = {}) {
    const contenedor = obtenerElemento(config.resultadosId);
    if (!contenedor) return false;

    const registros = config.registros || [];
    const columnas = resolverColumnasBusquedaMaestro(
      registros,
      config.columnas,
      config.excluirColumnas
    );

    contenedor.innerHTML = '';
    contenedor.classList.add('busqueda-maestro-resultados', 'visible');
    contenedor.style.display = 'block';

    const estado = document.createElement('div');
    estado.className = 'busqueda-maestro-estado';

    const resumen = document.createElement('span');
    resumen.textContent = registros.length === 1
      ? '1 registro encontrado'
      : `${registros.length} registros encontrados`;

    const ayuda = document.createElement('span');
    ayuda.textContent = registros.length
      ? 'Seleccione un renglón para cargarlo.'
      : '';

    estado.append(resumen, ayuda);
    contenedor.appendChild(estado);

    if (!registros.length) {
      const vacio = document.createElement('div');
      vacio.className = 'busqueda-maestro-vacio';
      vacio.textContent = config.textoVacio || 'No se encontraron registros.';
      contenedor.appendChild(vacio);
      return true;
    }

    const wrap = document.createElement('div');
    wrap.className = 'busqueda-maestro-tabla-wrap';

    const tabla = document.createElement('table');
    tabla.className = 'busqueda-maestro-tabla';

    const thead = document.createElement('thead');
    const trHead = document.createElement('tr');

    columnas.forEach(columna => {
      const th = document.createElement('th');
      th.scope = 'col';
      th.textContent = columna.titulo;
      trHead.appendChild(th);
    });

    thead.appendChild(trHead);
    tabla.appendChild(thead);

    const tbody = document.createElement('tbody');

    registros.forEach((registro, indice) => {
      const tr = document.createElement('tr');
      tr.tabIndex = 0;
      tr.dataset.indice = String(indice);

      columnas.forEach(columna => {
        const td = document.createElement('td');
        const valor = typeof columna.render === 'function'
          ? columna.render(registro)
          : registro[columna.campo];

        if (valor instanceof Node) {
          td.appendChild(valor);
        } else {
          td.textContent = valorVisibleBusquedaMaestro(valor);
        }

        td.title = td.textContent || '';
        tr.appendChild(td);
      });

      const seleccionar = async () => {
        if (typeof config.alSeleccionar === 'function') {
          await config.alSeleccionar(registro, indice);
        }
      };

      tr.addEventListener('click', seleccionar);
      tr.addEventListener('keydown', async evento => {
        if (evento.key === 'Enter' || evento.key === ' ') {
          evento.preventDefault();
          await seleccionar();
        }
      });

      tbody.appendChild(tr);
    });

    tabla.appendChild(tbody);
    wrap.appendChild(tabla);
    contenedor.appendChild(wrap);

    return true;
  }

  function configurarBusquedaMaestro(config = {}) {
    const boton = obtenerElemento(config.botonBuscarId || 'btnBuscar');
    const bloque = obtenerElemento(config.bloqueId || 'bloqueBusqueda');
    const input = obtenerElemento(config.inputId || 'txtBusqueda');
    const resultados = obtenerElemento(config.resultadosId || 'listaBusqueda');

    if (!bloque || !input || !resultados) {
      console.error(
        'configurarBusquedaMaestro requiere bloque, input y contenedor de resultados.'
      );
      return null;
    }

    asegurarEstilosBusquedaMaestro();
    resultados.classList.add('busqueda-maestro-resultados');
    resultados.setAttribute('role', 'region');
    resultados.setAttribute('aria-live', 'polite');

    let visible = bloque.classList.contains('visible');
    let ejecutando = false;
    let ultimaBusqueda = '';
    let ultimosResultados = [];

    function abrir() {
      visible = true;
      bloque.classList.add('visible');
      bloque.style.display = 'block';
      setTimeout(() => input.focus(), 0);
      return true;
    }

    function cerrar(opciones = {}) {
      visible = false;
      bloque.classList.remove('visible');
      bloque.style.display = 'none';

      if (opciones.limpiar !== false) {
        input.value = '';
        resultados.innerHTML = '';
        resultados.classList.remove('visible');
        resultados.style.display = 'none';
        ultimaBusqueda = '';
        ultimosResultados = [];
      }

      return true;
    }

    function alternar() {
      return visible ? cerrar() : abrir();
    }

    function mostrarCargando() {
      resultados.innerHTML = '';
      resultados.classList.add('visible');
      resultados.style.display = 'block';

      const cargando = document.createElement('div');
      cargando.className = 'busqueda-maestro-cargando';
      cargando.textContent = 'Consultando registros...';
      resultados.appendChild(cargando);
    }

    function mostrarError(error) {
      resultados.innerHTML = '';
      resultados.classList.add('visible');
      resultados.style.display = 'block';

      const mensaje = document.createElement('div');
      mensaje.className = 'busqueda-maestro-error';
      mensaje.textContent = config.mensajeError || 'No se pudo realizar la búsqueda.';
      resultados.appendChild(mensaje);

      console.error('Error en búsqueda maestra:', error);
    }

    async function buscar(terminoForzado) {
      if (ejecutando) return ultimosResultados;

      const termino = terminoForzado !== undefined
        ? String(terminoForzado ?? '')
        : String(input.value ?? '');

      if (termino.trim() !== '**' && normalizarTerminoBusquedaMaestro(termino).length < (config.minimo ?? 1)) {
        resultados.innerHTML = '';
        resultados.classList.add('visible');
        resultados.style.display = 'block';

        const aviso = document.createElement('div');
        aviso.className = 'busqueda-maestro-vacio';
        aviso.textContent = config.textoMinimo || 'Escriba un criterio o ** para mostrar todos los registros.';
        resultados.appendChild(aviso);
        return [];
      }

      ejecutando = true;
      ultimaBusqueda = termino;
      mostrarCargando();

      try {
        const registros = await buscarRegistrosMaestro(config, termino);
        ultimosResultados = registros;

        renderizarResultadosBusquedaMaestro({
          ...config,
          resultadosId: config.resultadosId || 'listaBusqueda',
          registros,
          alSeleccionar: async (registro, indice) => {
            if (typeof config.alSeleccionar === 'function') {
              await config.alSeleccionar(registro, indice);
            }

            if (config.cerrarAlSeleccionar !== false) {
              cerrar();
            }
          }
        });

        if (typeof config.alCompletarBusqueda === 'function') {
          await config.alCompletarBusqueda(registros, termino);
        }

        return registros;
      } catch (error) {
        mostrarError(error);

        if (typeof config.alError === 'function') {
          await config.alError(error);
        }

        return [];
      } finally {
        ejecutando = false;
      }
    }

    input.addEventListener('keydown', async evento => {
      if (evento.key !== 'Enter') return;
      evento.preventDefault();
      await buscar();
    });

    if (boton && config.vincularBoton !== false) {
      boton.addEventListener('click', alternar);
    }

    if (config.cerrarConEscape !== false) {
      input.addEventListener('keydown', evento => {
        if (evento.key === 'Escape') cerrar();
      });
    }

    const api = {
      abrir,
      cerrar,
      alternar,
      buscar,
      estaVisible: () => visible,
      estaEjecutando: () => ejecutando,
      obtenerUltimaBusqueda: () => ultimaBusqueda,
      obtenerResultados: () => [...ultimosResultados]
    };

    return api;
  }

  // ============================================================
  // 8. CRUD SUPABASE GENÉRICO
  // ============================================================

  async function insertarRegistro(tabla, datos, config = {}) {
    if (!window.sb) throw new Error('No existe window.sb.');
    const schema = config.schema || APP_SCHEMA_DEFAULT;
    let q = window.sb.schema(schema).from(tabla).insert(datos);
    if (config.select !== false) q = q.select(config.select || '*');
    if (config.single !== false) q = q.single();
    const { data, error } = await q;
    if (error) throw error;
    return data;
  }

  async function actualizarRegistro(tabla, datos, config = {}) {
    if (!window.sb) throw new Error('No existe window.sb.');
    if (!config.campoId || config.valorId === undefined || config.valorId === null) {
      throw new Error('actualizarRegistro requiere campoId y valorId.');
    }

    const schema = config.schema || APP_SCHEMA_DEFAULT;
    let q = window.sb.schema(schema).from(tabla).update(datos).eq(config.campoId, config.valorId);
    if (config.select !== false) q = q.select(config.select || '*');
    if (config.single !== false) q = q.single();
    const { data, error } = await q;
    if (error) throw error;
    return data;
  }

  async function guardarRegistro(tabla, datos, config = {}) {
    const valorId = datos[config.campoId] || config.valorId;
    if (valorId) {
      return actualizarRegistro(tabla, datos, { ...config, valorId });
    }
    return insertarRegistro(tabla, datos, config);
  }

  async function obtenerRegistro(tabla, config = {}) {
    if (!window.sb) throw new Error('No existe window.sb.');
    if (!config.campoId || config.valorId === undefined || config.valorId === null) {
      throw new Error('obtenerRegistro requiere campoId y valorId.');
    }

    const schema = config.schema || APP_SCHEMA_DEFAULT;
    let q = window.sb.schema(schema).from(tabla).select(config.select || '*').eq(config.campoId, config.valorId);
    if (config.eliminado !== false) q = q.eq('eliminado', false);
    const { data, error } = await q.maybeSingle();
    if (error) throw error;
    return data;
  }

  async function eliminarLogico(tabla, config = {}) {
    return actualizarRegistro(tabla, { eliminado: true, activo: false }, config);
  }

  async function ejecutarRpc(nombreFuncion, parametros = {}, config = {}) {
    if (!window.sb) throw new Error('No existe window.sb.');
    const schema = config.schema || APP_SCHEMA_DEFAULT;
    const { data, error } = await window.sb.schema(schema).rpc(nombreFuncion, parametros);
    if (error) throw error;
    return data;
  }


  // ============================================================
  // 9. CREACIÓN RÁPIDA GENÉRICA
  // ============================================================

  async function crearRegistroRapido(config = {}) {
    if (!config.tabla)  throw new Error('crearRegistroRapido requiere tabla.');
    if (!config.datos)  throw new Error('crearRegistroRapido requiere datos.');

    const reg = await insertarRegistro(config.tabla, config.datos, {
      schema: config.schema || APP_SCHEMA_DEFAULT,
      select: config.select || '*'
    });

    if (config.selectDestino && config.campoId && config.campoTexto) {
      const select = obtenerElemento(config.selectDestino);
      if (select) {
        const o = document.createElement('option');
        o.value       = reg[config.campoId];
        o.textContent = reg[config.campoTexto];
        select.appendChild(o);
        select.value  = reg[config.campoId];
      }
    }

    if (config.modalId) cerrarModal(config.modalId);
    if (config.mensaje !== false) mostrarMensaje(config.mensaje || 'Registro creado correctamente.', 'ok');

    return reg;
  }

  // ============================================================
  // 10. TABLA HTML SIMPLE
  // ============================================================

  function renderizarTabla(config = {}) {
    const contenedor = obtenerElemento(config.contenedorId);
    if (!contenedor) return false;

    const registros = config.registros || [];
    const columnas  = config.columnas  || [];

    if (!registros.length) {
      contenedor.innerHTML = config.textoVacio || '<div class="tabla-vacia">Sin registros.</div>';
      return true;
    }

    const thead = columnas.map(c => `<th>${c.titulo || c.campo}</th>`).join('');
    const filas = registros.map(reg => {
      const tds = columnas.map(c => {
        const valor = typeof c.render === 'function' ? c.render(reg) : (reg[c.campo] ?? '');
        return `<td>${valor}</td>`;
      }).join('');
      return `<tr>${tds}</tr>`;
    }).join('');

    contenedor.innerHTML = `<table class="tabla-base"><thead><tr>${thead}</tr></thead><tbody>${filas}</tbody></table>`;
    return true;
  }

  // ============================================================
  // 11. FORMATO
  // ============================================================

  function formatearFecha(valor) {
    if (!valor) return '';
    const d = new Date(valor);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleDateString('es-DO');
  }

  function formatearFechaHora(valor) {
    if (!valor) return '';
    const d = new Date(valor);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleString('es-DO');
  }

  function formatearMoneda(valor, moneda = 'DOP') {
    const num = Number(valor || 0);
    return new Intl.NumberFormat('es-DO', { style: 'currency', currency: moneda }).format(num);
  }

  function formatearNumero(valor) {
    return Number(valor || 0).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  function redondear2(valor) {
    return Math.round(Number(valor || 0) * 100) / 100;
  }

  function calcularResumenFinanciero(config = {}) {
    const subtotal         = redondear2(config.subtotal);
    const porcSeguro       = Number(config.porcSeguro      || 0);
    const porcImprevisto   = Number(config.porcImprevisto  || 0);
    const porcItbis        = Number(config.porcItbis       || 18);
    const aplicaSeguro     = !!config.aplicaSeguro;
    const aplicaImprevisto = !!config.aplicaImprevisto;
    const aplicaItbis      = !!config.aplicaItbis;

    const seguro     = aplicaSeguro     ? redondear2(subtotal  * porcSeguro     / 100) : 0;
    const imprevisto = aplicaImprevisto ? redondear2(subtotal  * porcImprevisto / 100) : 0;
    const baseItbis  = redondear2(subtotal + seguro + imprevisto);
    const itbis      = aplicaItbis      ? redondear2(baseItbis * porcItbis      / 100) : 0;
    const total      = redondear2(baseItbis + itbis);

    return { subtotal, seguro, imprevisto, baseItbis, itbis, total };
  }

  function normalizarTexto(texto) {
    return String(texto || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .toLowerCase();
  }

  function soloNumero(texto) {
    return String(texto || '').replace(/\D/g, '');
  }

  // ============================================================
  // 12. DIRECCIÓN — provincias / municipios / distritos en cascada
  // ============================================================

  /**
   * cargarSelectDireccion — carga un select de dirección desde las tablas maestras.
   *
   * tipo: 'provincia' | 'municipio' | 'distrito'
   *
   * Uso:
   *   await cargarSelectDireccion('provincia', { selectId: 'mac_provincia' });
   *   await cargarSelectDireccion('municipio', { selectId: 'mac_municipio', provinciaId: 3 });
   *   await cargarSelectDireccion('distrito',  { selectId: 'mac_distrito',  municipioId: 12 });
   */
  async function cargarSelectDireccion(tipo, config = {}) {
    const selectId = config.selectId;
    if (!selectId) throw new Error('cargarSelectDireccion requiere selectId.');

    limpiarSelect(selectId, config.placeholder || '— Seleccione —');

    const TABLAS = {
      provincia: { tabla: 'mt_cat1_direc_provincia',          campoPK: 'provincia_id',  filtroPadre: null              },
      municipio: { tabla: 'mt_cat2_direc_prov_municipio',     campoPK: 'municipio_id',  filtroPadre: 'provincia_id'    },
      distrito:  { tabla: 'mt_cat3_direc_prov_muni_distritomuni', campoPK: 'distrito_mun_id', filtroPadre: 'municipio_id' }
    };

    const def = TABLAS[tipo];
    if (!def) throw new Error(`cargarSelectDireccion: tipo desconocido "${tipo}". Use provincia, municipio o distrito.`);

    const filtroPadreId = tipo === 'municipio' ? config.provinciaId
                        : tipo === 'distrito'  ? config.municipioId
                        : null;

    // Si requiere filtro padre y no se pasó, salir silenciosamente
    if (def.filtroPadre && !filtroPadreId) return [];

    const filtros = def.filtroPadre
      ? [{ campo: def.filtroPadre, valor: filtroPadreId }]
      : [];

    const data = await consultarTabla(def.tabla, {
      schema:   config.schema || APP_SCHEMA_DEFAULT,
      select:   `${def.campoPK}, descripcion`,
      filtros,
      eliminado: false,   // estas tablas no tienen columna eliminado, pero activo sí
      orden:    'descripcion'
    });

    llenarSelect(selectId, data, {
      valor:             def.campoPK,
      texto:             'descripcion',
      valorSeleccionado: config.valorSeleccionado
    });

    return data;
  }

  // ============================================================
  // 13. CRM — cliente y sucursal
  // ============================================================

  /**
   * cargarSucursalesCliente — llena un select con las sucursales activas de un cliente.
   *
   * Uso:
   *   await cargarSucursalesCliente(clienteId, 'cliente_sucursal_id');
   *   await cargarSucursalesCliente(clienteId, 'cliente_sucursal_id', { placeholder: '— Sin sucursal —' });
   */
  async function cargarSucursalesCliente(clienteId, selectId = 'cliente_sucursal_id', opciones = {}) {
    limpiarSelect(selectId, opciones.placeholder || '— Sin sucursal —');
    if (!clienteId) return [];

    const data = await consultarTabla('mt_opr_cliente_sucursal', {
      schema:  opciones.schema || APP_SCHEMA_DEFAULT,
      select:  'cliente_sucursal_id, nombre_sucursal',
      filtros: [{ campo: 'cliente_id', valor: clienteId }],
      orden:   'nombre_sucursal'
    });

    llenarSelect(selectId, data, {
      valor: 'cliente_sucursal_id',
      texto: 'nombre_sucursal'
    });

    return data;
  }

  /**
   * mostrarModalNuevoCliente — abre el modal para crear un cliente prospecto.
   *
   * Convención de IDs en el HTML:
   *   modalNuevoCliente, mnc_nombre, mnc_tipo_documento,
   *   mnc_numero_documento, mnc_telefono, mnc_correo
   *
   * Uso:
   *   mostrarModalNuevoCliente();
   */
  function mostrarModalNuevoCliente() {
    ['mnc_nombre', 'mnc_numero_documento', 'mnc_telefono', 'mnc_correo'].forEach(id => setValor(id, ''));
    abrirModal('modalNuevoCliente');
  }

  function cerrarModalNuevoCliente() {
    cerrarModal('modalNuevoCliente');
  }

  /**
   * guardarNuevoCliente — crea un prospecto nuevo vía RPC fn_guardar_cliente.
   *
   * config:
   *   formularioCodigo  string  — código del formulario para auditoría
   *   alGuardar         async fn(clienteId, nombre) — callback tras guardar
   *
   * Uso:
   *   await guardarNuevoCliente({
   *     formularioCodigo: 'CRM10_ATENCION_CLIENTE',
   *     alGuardar: async (id, nombre) => seleccionarCliente(id, nombre)
   *   });
   */
  async function guardarNuevoCliente(config = {}) {
    const nombre = getTexto('mnc_nombre');
    if (!nombre) { mostrarMensaje('El nombre del cliente es requerido.', 'error'); return; }

    const tipoDocId = getValor('mnc_tipo_documento');
    if (!tipoDocId) { mostrarMensaje('Seleccione el tipo de documento.', 'error'); return; }

    // Buscar tipo relación PROSPECTO
    const { data: prospecto } = await window.sb.schema(APP_SCHEMA_DEFAULT)
      .from('mt_cat_opcion')
      .select('opcion_id')
      .eq('formulario_codigo', 'MT_OPR_CLIENTE')
      .eq('catalogo_codigo', 'TIPO_RELACION')
      .ilike('opcion_nombre', '%prospecto%')
      .eq('activo', true)
      .limit(1).maybeSingle();

    if (!prospecto) { mostrarMensaje('No se encontró el tipo de relación Prospecto.', 'error'); return; }

    // Buscar tipo cliente predeterminado (primer registro por orden)
    const { data: tipoCliente } = await window.sb.schema(APP_SCHEMA_DEFAULT)
      .from('mt_cat_opcion')
      .select('opcion_id')
      .eq('formulario_codigo', 'MT_OPR_CLIENTE')
      .eq('catalogo_codigo', 'TIPO_CLIENTE')
      .order('orden_lista', { ascending: true })
      .limit(1).maybeSingle();

    try {
      const data = await ejecutarRpc('fn_guardar_cliente', {
        p_cabecera: {
          cliente_id:        null,
          nombre_cliente:    nombre,
          tipo_cliente_id:   tipoCliente?.opcion_id || null,
          tipo_relacion_id:  prospecto.opcion_id,
          tipo_documento_id: Number(tipoDocId),
          numero_documento:  getTexto('mnc_numero_documento') || null,
          telefono:          getTexto('mnc_telefono')         || null,
          correo:            getTexto('mnc_correo')           || null,
          estatus:           'REGISTRADO',
          estado:            'ACTIVO',
          activo:            true
        },
        p_detalle:           null,
        p_formulario_codigo: config.formularioCodigo || '',
        p_user_agent:        navigator.userAgent || null
      });

      const fila = Array.isArray(data) ? data[0] : data;
      cerrarModalNuevoCliente();

      if (typeof config.alGuardar === 'function') {
        await config.alGuardar(fila.id_registro, nombre);
      }

      mostrarMensaje(`Cliente creado como Prospecto. No.: ${fila.id_registro}`, 'ok');

    } catch (err) {
      mostrarMensaje(
        err?.code === '23505'
          ? 'Ya existe un cliente con ese tipo y número de documento.'
          : err?.message || 'Error al crear cliente.',
        'error'
      );
    }
  }

  /**
   * mostrarModalNuevaSucursal — abre el modal para crear una sucursal/proyecto.
   *
   * Convención de IDs en el HTML:
   *   modalNuevaSucursal, mns_nombre, mns_telefono,
   *   mns_provincia, mns_municipio
   *
   * config:
   *   clienteId  number  — requerido, cliente al que pertenece la sucursal
   *
   * Uso:
   *   mostrarModalNuevaSucursal({ clienteId: Estado.clienteId });
   */
  async function mostrarModalNuevaSucursal(config = {}) {
    if (!config.clienteId) {
      mostrarMensaje('Seleccione un cliente primero.', 'error');
      return;
    }

    ['mns_nombre', 'mns_telefono'].forEach(id => setValor(id, ''));
    limpiarSelect('mns_provincia');
    limpiarSelect('mns_municipio');

    await cargarSelectDireccion('provincia', { selectId: 'mns_provincia' });

    // Cargar municipios al cambiar provincia
    const selProv = obtenerElemento('mns_provincia');
    if (selProv) {
      selProv.onchange = async function () {
        await cargarSelectDireccion('municipio', {
          selectId:   'mns_municipio',
          provinciaId: this.value ? Number(this.value) : null
        });
      };
    }

    abrirModal('modalNuevaSucursal');
  }

  function cerrarModalNuevaSucursal() {
    cerrarModal('modalNuevaSucursal');
  }

  /**
   * guardarNuevaSucursal — crea una sucursal vía RPC fn_guardar_sucursal.
   *
   * config:
   *   clienteId        number   — requerido
   *   formularioCodigo string   — código para auditoría
   *   selectDestinoId  string   — id del select a actualizar tras guardar (default: 'cliente_sucursal_id')
   *   alGuardar        async fn() — callback opcional tras guardar
   *
   * Uso:
   *   await guardarNuevaSucursal({
   *     clienteId:        Estado.clienteId,
   *     formularioCodigo: 'CRM10_ATENCION_CLIENTE',
   *     selectDestinoId:  'cliente_sucursal_id'
   *   });
   */
  async function guardarNuevaSucursal(config = {}) {
    const nombre = getTexto('mns_nombre');
    if (!nombre) { mostrarMensaje('El nombre de la sucursal es requerido.', 'error'); return; }

    if (!config.clienteId) { mostrarMensaje('No hay cliente seleccionado.', 'error'); return; }

    try {
      const data = await ejecutarRpc('fn_guardar_sucursal', {
        p_cabecera: {
          cliente_id:      config.clienteId,
          nombre_sucursal: nombre,
          provincia_id:    getNumero('mns_provincia'),
          municipio_id:    getNumero('mns_municipio'),
          telefono:        getTexto('mns_telefono') || null,
          es_principal:    false,
          estatus:         'REGISTRADO',
          estado:          'ACTIVO'
        },
        p_formulario_codigo: config.formularioCodigo || '',
        p_user_agent:        navigator.userAgent || null
      });

      cerrarModalNuevaSucursal();

      // Recargar select de sucursales y seleccionar la nueva
      const selectId = config.selectDestinoId || 'cliente_sucursal_id';
      await cargarSucursalesCliente(config.clienteId, selectId);

      const select = obtenerElemento(selectId);
      if (select && select.options.length > 1) {
        select.value = select.options[select.options.length - 1].value;
      }

      if (typeof config.alGuardar === 'function') await config.alGuardar(data);

      mostrarMensaje('Sucursal creada correctamente.', 'ok');

    } catch (err) {
      mostrarMensaje(err?.message || 'No fue posible crear la sucursal.', 'error');
    }
  }

  /**
   * mostrarModalActualizarCliente — abre el modal con datos actuales del cliente para edición.
   *
   * Convención de IDs en el HTML:
   *   modalActualizarCliente,
   *   mac_provincia, mac_municipio, mac_distrito,
   *   mac_direccion_sector, mac_direccion, mac_direccion_referencia,
   *   mac_telefono, mac_telefono_whatsapp, mac_correo,
   *
   * config:
   *   datosCliente  object  — registro actual del cliente (requerido)
   *
   * Uso:
   *   await mostrarModalActualizarCliente({ datosCliente: v_datosClienteActual });
   */
  async function mostrarModalActualizarCliente(config = {}) {
    const reg = config.datosCliente;
    if (!reg) return;

    limpiarSelect('mac_provincia');
    limpiarSelect('mac_municipio');
    limpiarSelect('mac_distrito');

    await cargarSelectDireccion('provincia', { selectId: 'mac_provincia' });
    setValor('mac_provincia', reg.provincia_id || '');

    if (reg.provincia_id) {
      await cargarSelectDireccion('municipio', {
        selectId:   'mac_municipio',
        provinciaId: reg.provincia_id

      });
      setValor('mac_municipio', reg.municipio_id || '');

      if (reg.municipio_id) {
        await cargarSelectDireccion('distrito', {
          selectId:   'mac_distrito',
          municipioId: reg.municipio_id
        });
        setValor('mac_distrito', reg.distrito_mun_id || '');
      }
    }

    // Eventos cascada
    const selProv = obtenerElemento('mac_provincia');
    if (selProv) {
      selProv.onchange = async function () {
        limpiarSelect('mac_municipio');
        limpiarSelect('mac_distrito');
        if (this.value) {
          await cargarSelectDireccion('municipio', {
            selectId:    'mac_municipio',
            provinciaId: Number(this.value)
          });
        }
      };
    }

    const selMun = obtenerElemento('mac_municipio');
    if (selMun) {
      selMun.onchange = async function () {
        limpiarSelect('mac_distrito');
        if (this.value) {
          await cargarSelectDireccion('distrito', {
            selectId:   'mac_distrito',
            municipioId: Number(this.value)
          });
        }
      };
    }

    // Llenar campos del modal
    setValor('mac_direccion_sector',     reg.direccion_sector     || '');
    setValor('mac_direccion',            reg.direccion            || '');
    setValor('mac_direccion_referencia', reg.direccion_referencia || '');
    setValor('mac_telefono',             reg.telefono             || '');
    setValor('mac_telefono_whatsapp',    reg.telefono_whatsapp    || '');
    setValor('mac_correo',               reg.correo               || '');

    abrirModal('modalActualizarCliente');
  }

  function cerrarModalActualizarCliente() {
    cerrarModal('modalActualizarCliente');
  }

  /**
   * guardarActualizarCliente — actualiza dirección y contacto del cliente vía RPC fn_guardar_cliente.
   *
   * config:
   *   datosCliente     object   — registro actual del cliente (requerido, campos que no cambian)
   *   formularioCodigo string   — código para auditoría
   *   alGuardar        async fn() — callback opcional tras guardar
   *
   * Uso:
   *   await guardarActualizarCliente({
   *     datosCliente:     v_datosClienteActual,
   *     formularioCodigo: 'CRM10_ATENCION_CLIENTE',
   *     alGuardar:        async () => cargarDatosCliente(Estado.clienteId)
   *   });
   */
  async function guardarActualizarCliente(config = {}) {
    const reg = config.datosCliente;
    if (!reg) return;

    const confirmar = await confirmarAccion({
      titulo:  'Confirmar modificación',
      mensaje: '¿Está seguro que desea guardar los cambios del cliente?'
    });
    if (!confirmar) return;

    try {
      await ejecutarRpc('fn_guardar_cliente', {
        p_cabecera: {
          cliente_id:           reg.cliente_id,
          nombre_cliente:       reg.nombre_cliente,
          tipo_cliente_id:      reg.tipo_cliente_id,
          tipo_relacion_id:     reg.tipo_relacion_id,
          tipo_documento_id:    reg.tipo_documento_id,
          numero_documento:     reg.numero_documento,
          estatus:              reg.estatus,
          estado:               reg.estado,
          observacion:          reg.observacion,
          activo:               reg.activo,
          provincia_id:         getNumero('mac_provincia'),
          municipio_id:         getNumero('mac_municipio'),
          distrito_mun_id:      getNumero('mac_distrito'),
          direccion_sector:     getTexto('mac_direccion_sector')     || null,
          direccion:            getTexto('mac_direccion')            || null,
          direccion_referencia: getTexto('mac_direccion_referencia') || null,
          telefono:             getTexto('mac_telefono')             || null,
          telefono_whatsapp:    getTexto('mac_telefono_whatsapp')    || null,
          correo:               getTexto('mac_correo')               || null,
        },
        p_detalle:           null,
        p_formulario_codigo: config.formularioCodigo || '',
        p_user_agent:        navigator.userAgent || null
      });

      cerrarModalActualizarCliente();

      if (typeof config.alGuardar === 'function') await config.alGuardar();

      mostrarMensaje('Datos del cliente actualizados.', 'ok');

    } catch (err) {
      mostrarMensaje(err?.message || 'No fue posible actualizar el cliente.', 'error');
    }
  }

  // ============================================================
  // 14. CARGA DE REGISTRO EN PANTALLA
  // ============================================================

  /**
   * cargarRegistro — carga un registro existente, llena el formulario y bloquea la pantalla.
   * Patrón reutilizable en todas las pantallas CRM.
   *
   * config:
   *   tabla        string    — tabla o vista a consultar
   *   campoPK      string    — nombre del campo PK (ej. 'atencion_id')
   *   valorPK      any       — valor del ID a cargar
   *   formulario   string    — id del formulario a llenar (default: 'formPrincipal')
   *   select       string    — columnas a seleccionar (default: '*')
   *   schema       string    — esquema Supabase (default: APP_SCHEMA_DEFAULT)
   *   alCargar     async fn(reg) — callback con el registro cargado; aquí va la lógica
   *                               específica de pantalla (cargar cliente, sucursal, secciones, etc.)
   *   alFinalizar  fn()      — callback opcional tras llenar y bloquear el formulario
   *   mensajeOk    string    — mensaje a mostrar al cargar (default: genérico)
   *   mensajeError string    — mensaje si no se encuentra el registro
   *
   * Uso en 2010-aten_clie.js:
   *   await cargarRegistro({
   *     tabla:    't_opr_crm10_atencion_cliente',
   *     campoPK:  'atencion_id',
   *     valorPK:  atencionId,
   *     alCargar: async reg => {
   *       // lógica específica: cargar cliente, sucursal, sección datos cliente...
   *     },
   *     mensajeOk: 'Atención cargada. Presione Modificar para editar.'
   *   });
   */
  /**
   * cargarRegistro
   *
   * Carga un registro existente, llena el formulario y aplica
   * opcionalmente el control de modificación.
   *
   * Estándar nuevo:
   * - Las vistas vw_form_* deben exponer id_relacionado y modificar.
   * - campoPK usa id_relacionado por defecto.
   * - controlModificacion puede recibir un controlador creado con
   *   crearControlModificacion().
   */
  async function cargarRegistro(config = {}) {
    if (!config.tabla) {
      throw new Error('cargarRegistro requiere tabla.');
    }

    const campoPK =
      config.campoPK ||
      config.campoIdRelacionado ||
      'id_relacionado';

    const valorPK =
      config.valorPK !== undefined
        ? config.valorPK
        : config.idRelacionado;

    if (
      valorPK === undefined ||
      valorPK === null ||
      valorPK === ''
    ) {
      throw new Error(
        'cargarRegistro requiere valorPK o idRelacionado.'
      );
    }

    if (!window.sb) {
      throw new Error(
        'No existe window.sb. Verifique base_conexion.js.'
      );
    }

    const schema = config.schema || APP_SCHEMA_DEFAULT;

    const { data: registro, error } = await window.sb
      .schema(schema)
      .from(config.tabla)
      .select(config.select || '*')
      .eq(campoPK, valorPK)
      .maybeSingle();

    if (error || !registro) {
      if (error) {
        console.error('Error cargando registro:', error);
      }

      mostrarMensaje(
        config.mensajeError ||
        'No se pudo cargar el registro.',
        'error'
      );

      return null;
    }

    llenarFormulario(registro, {
      prefijo: config.prefijo || ''
    });

    if (typeof config.alCargar === 'function') {
      await config.alCargar(registro);
    }

    habilitarFormulario(
      config.formulario || 'formPrincipal',
      false
    );

    if (typeof config.alFinalizar === 'function') {
      await config.alFinalizar(registro);
    }

    let estadoModificacion = null;

    if (config.controlModificacion) {
      const control = config.controlModificacion;

      // Controlador completo creado mediante crearControlModificacion().
      if (
        typeof control === 'object' &&
        typeof control.cargar === 'function'
      ) {
        estadoModificacion = await control.cargar(registro, {
          idRelacionado: registro[campoPK] ?? valorPK
        });
      } else {
        // Compatibilidad: true u objeto simple de configuración.
        const opcionesControl =
          typeof control === 'object'
            ? control
            : {};

        estadoModificacion = controlarModificacionFormulario({
          ...opcionesControl,
          registro,
          esNuevo: false,
          modoEdicion: false,
          formulario:
            opcionesControl.formulario ||
            config.formulario ||
            'formPrincipal'
        });
      }
    }

    const mensajePredeterminado =
      estadoModificacion?.estado === 'bloqueado'
        ? (
          'Registro cargado en modo consulta. ' +
          'No puede modificarse porque tiene una transacción posterior activa.'
        )
        : (
          'Registro cargado. ' +
          'Presione Modificar para editar.'
        );

    mostrarMensaje(
      config.mensajeOk || mensajePredeterminado,
      'info'
    );

    return registro;
  }

  // ============================================================
  // 15. EXPOSICIÓN GLOBAL
  // ============================================================

  const BaseFuncion = {
    // DOM
    obtenerElemento,
    existeElemento,
    on,
    onClick,
    mostrarElemento,
    ocultarElemento,
    alternarClase,
    enfocarCampo,

    // Valor de campo
    getValor,
    setValor,
    getTexto,
    getNumero,
    setTexto,
    setCheck,
    limpiarCampo,

    // Mensaje y confirmación
    mostrarMensaje,
    limpiarMensaje,
    confirmarAccion,

    // Modal
    abrirModal,
    cerrarModal,
    alternarModal,
    configurarModal,

 // Formulario
limpiarFormulario,
habilitarFormulario,
puedeModificarRegistro,
controlarModificacionFormulario,
consultarPermisoModificacion,
validarPermisoModificacion,
crearControlModificacion,
obtenerDatosFormulario,
llenarFormulario,
validarRequerido,
crearPayload,

    // Select y catálogo
    limpiarSelect,
    llenarSelect,
    consultarTabla,
    cargarSelectTabla,
    cargarCatalogo,

    // Búsqueda
    ocultarLista,
    mostrarLista,
    renderizarLista,
    buscarRegistro,
    configurarBusquedaEnterBlur,
    buscarRegistrosMaestro,
    renderizarResultadosBusquedaMaestro,
    configurarBusquedaMaestro,

    // CRUD Supabase
    insertarRegistro,
    actualizarRegistro,
    guardarRegistro,
    obtenerRegistro,
    eliminarLogico,
    ejecutarRpc,

    // Utilitarios
    crearRegistroRapido,
    renderizarTabla,

    // Formato
    formatearFecha,
    formatearFechaHora,
    formatearMoneda,
    formatearNumero,
    calcularResumenFinanciero,
    redondear2,
    normalizarTexto,
    soloNumero,

    // Dirección
    cargarSelectDireccion,

    // Carga de registro en pantalla
    cargarRegistro,

    // CRM — cliente y sucursal
    cargarSucursalesCliente,
    mostrarModalNuevoCliente,
    cerrarModalNuevoCliente,
    guardarNuevoCliente,
    mostrarModalNuevaSucursal,
    cerrarModalNuevaSucursal,
    guardarNuevaSucursal,
    mostrarModalActualizarCliente,
    cerrarModalActualizarCliente,
    guardarActualizarCliente
  };

  window.BaseFuncion = BaseFuncion;

  // Alias globales para uso directo en pantallas sin prefijo BaseFuncion.xxx
  Object.keys(BaseFuncion).forEach(nombre => {
    if (!window[nombre]) window[nombre] = BaseFuncion[nombre];
  });

})();


// ============================================================
// MODAL DE CONFIRMACIÓN BASE (fuera del IIFE — sin cambios)
// ============================================================

function mostrarModalConfirmacionBase(opciones) {
  eliminarModalBase();

  const fondo = document.createElement('div');
  fondo.id        = 'modalBaseFondo';
  fondo.className = 'modal-base-fondo';

  fondo.innerHTML = `
    <div class="modal-base-box">
      <h3>${opciones.titulo  || 'Confirmar'}</h3>
      <p>${opciones.mensaje  || ''}</p>
      <div class="modal-base-actions">
        <button type="button" class="btn-modal-cancelar" id="btnModalCancelar">
          ${opciones.textoCancelar || 'Cancelar'}
        </button>
        <button type="button" class="btn-modal-proceder" id="btnModalProceder">
          ${opciones.textoProceder || 'OK'}
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(fondo);

  document.getElementById('btnModalCancelar').onclick = () => eliminarModalBase();
  document.getElementById('btnModalProceder').onclick = async () => {
    eliminarModalBase();
    if (typeof opciones.alProceder === 'function') await opciones.alProceder();
  };
}

function eliminarModalBase() {
  const modal = document.getElementById('modalBaseFondo');
  if (modal) modal.remove();
}




























































































