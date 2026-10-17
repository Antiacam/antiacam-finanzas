'use strict';
window.APP_SCHEMA = 'dev_v2';
window.sb = supabase.createClient('https://zrnoumlgkmcnjgtslacs.supabase.co', 'sb_publishable_tDMu-wBLq0mgUjCiD_A_zw_7H8dw5B1', {
  db: { schema: window.APP_SCHEMA },
  auth: { storageKey: 'antiacam-auth', persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
});
window.DB = { tabla: name => window.sb.schema(window.APP_SCHEMA).from(name) };
window.obtenerUsuarioActualBase = async () => {
  const {data,error} = await window.sb.auth.getUser();
  if (error) throw error;
  return data.user;
};
