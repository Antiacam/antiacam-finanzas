'use strict';
window.APP_USUARIO = null;
window.APP_PERMISOS = [];
window.APP_ES_ADMIN = false;
window.APP_RUTAS = { '8010-fact_prov.html': '8010', '8011-fact_prov_mod.html': '8011' };
window.volverAlAcceso = () => {
  document.body.classList.remove('app-ready');
  window.APP_USUARIO = null;
  window.APP_PERMISOS = [];
  location.replace('index.html');
};
// Keep this callback synchronous: Supabase calls inside it can deadlock.
window.sb.auth.onAuthStateChange((event) => {
  if (event === 'SIGNED_OUT') window.volverAlAcceso();
});
window.authReady = (async () => {
  try {
    const user = await obtenerUsuarioActualBase();
    if (!user) { window.volverAlAcceso(); return false; }
    const assurance = await window.sb.auth.mfa.getAuthenticatorAssuranceLevel();
    if (assurance.error) throw assurance.error;
    if (assurance.data.nextLevel === 'aal2' && assurance.data.currentLevel !== 'aal2') {
      throw new Error('Se requiere segundo factor para acceder.');
    }
    const {data,error} = await DB.tabla('app_sys_usuario').select('usuario_id,nombre,correo,activo,eliminado').eq('usuario_id',user.id).single();
    if (error) throw error;
    if (!data.activo || data.eliminado) throw new Error('Usuario sin acceso activo a Antiacam.');
    const permisos = await DB.tabla('app_sys_usuario_permiso_formulario').select('*').eq('usuario_id',user.id).eq('activo',true).eq('eliminado',false);
    if (permisos.error) throw permisos.error;
    const forms = await DB.tabla('mt_cfg_modulo_formulario').select('formulario_id,formulario_codigo').eq('activo',true).eq('eliminado',false);
    if (forms.error) throw forms.error;
    const allowed = forms.data.filter(form => permisos.data.some(permission =>
      permission.formulario_id === form.formulario_id && permission.puede_select === true));
    window.APP_FORMULARIOS = allowed.map(form => form.formulario_codigo);
    const route = location.pathname.split('/').pop();
    if (!window.APP_RUTAS[route] || !window.APP_FORMULARIOS.includes(window.APP_RUTAS[route])) {
      throw new Error('No tiene permiso para acceder a esta pantalla.');
    }
    window.APP_USUARIO = data;
    window.APP_PERMISOS = permisos.data;
    document.body.classList.add('app-ready');
    return true;
  } catch (error) {
    if (error.name === 'AuthSessionMissingError' || error.status === 401 || error.status === 403) {
      window.volverAlAcceso(); return false;
    }
    document.body.classList.add('app-ready');
    document.body.replaceChildren();
    const panel = document.createElement('p');
    panel.textContent = 'Antiacam: ' + error.message;
    const back = document.createElement('a'); back.href = 'index.html'; back.textContent = ' Volver al acceso';
    panel.append(back); document.body.append(panel);
    return false;
  }
})();
// Revalidate when a cached page or background tab becomes visible again.
const revalidarSesion = async () => {
  document.body.classList.remove('app-ready');
  try {
    const user = await obtenerUsuarioActualBase();
    if (!user || user.id !== window.APP_USUARIO?.usuario_id) { window.volverAlAcceso(); return; }
    const profile = await DB.tabla('app_sys_usuario').select('activo,eliminado').eq('usuario_id',user.id).single();
    const permissions = await DB.tabla('app_sys_usuario_permiso_formulario').select('formulario_id,puede_select').eq('usuario_id',user.id).eq('activo',true).eq('eliminado',false);
    const forms = await DB.tabla('mt_cfg_modulo_formulario').select('formulario_id,formulario_codigo').eq('activo',true).eq('eliminado',false);
    const assurance = await window.sb.auth.mfa.getAuthenticatorAssuranceLevel();
    const code = window.APP_RUTAS[location.pathname.split('/').pop()];
    if (profile.error || permissions.error || forms.error || assurance.error || !profile.data.activo || profile.data.eliminado ||
        (assurance.data.nextLevel === 'aal2' && assurance.data.currentLevel !== 'aal2') ||
        !forms.data.some(form => form.formulario_codigo === code && permissions.data.some(permission => permission.formulario_id === form.formulario_id && permission.puede_select))) {
      window.volverAlAcceso(); return;
    }
    document.body.classList.add('app-ready');
  } catch { window.volverAlAcceso(); }
};
window.addEventListener('pageshow', event => { if (event.persisted) void revalidarSesion(); });
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && window.APP_USUARIO) void revalidarSesion();
});
