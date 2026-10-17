# Acceso Antiacam

Proyecto verificado: NCF (`zrnoumlgkmcnjgtslacs`). Revisión: 17 de octubre de 2026.

## Pantallas

- `seguridad.html`: configurar TOTP, verificar el segundo factor, registrar y revocar equipos.
- `cambiar-clave.html`: contraseña actual, nueva y confirmación. Exige sesión AAL2 y pertenencia activa. Maneja el código de reautenticación por correo si Supabase lo solicita.
- El menú de Finanzas enlaza ambas. La entrada por contraseña lleva primero a Seguridad.
- `index.html` ofrece entrada con llave de acceso para navegadores registrados.

## Controles aplicados

- Altas públicas deshabilitadas; confirmación de correo activada; inicio anónimo deshabilitado.
- Contraseña mínima de 12 caracteres, mayúsculas, minúsculas, números y símbolos; cambio seguro y contraseña actual obligatorios.
- Límite de inicio de sesión: 10 solicitudes por IP cada 5 minutos.
- Passkeys restringidas al RP `antiacam.github.io` y origen `https://antiacam.github.io`.
- Datos financieros y Storage protegidos por RLS y `tiene_permiso`. Ahora también requieren una sesión existente en Auth y AAL2 o una sesión de equipo autorizada en servidor.
- Equipo registrado únicamente con AAL2 y una credencial WebAuthn propiedad del usuario. Token aleatorio de 256 bits; solo su hash SHA-256 queda en la base de datos privada. El token del navegador nunca basta: el servidor comprueba además el método `passkey` registrado por Supabase en la sesión.
- Confianza: 30 días; autorización de cada sesión: hasta 8 horas. La revocación, el vencimiento o la eliminación de la llave bloquean el acceso de equipo en la siguiente consulta.
- Funciones elevadas limitadas al esquema privado, con `search_path` vacío, identidad y sesión comprobadas, y sin ejecución pública/anónima. Las funciones expuestas son SECURITY INVOKER. Tablas privadas sin concesiones directas y con RLS.

## Verificación

- `npm run check`: inicialización, cálculos, permisos, búsqueda de proveedores y flujo MFA/registro con dobles de prueba.
- `comprobacion-seguridad.sql`: ejecutado en NCF. Sesión AAL1 sin datos; registro sin MFA bloqueado; AMR inventado en JWT insuficiente; hashes privados inaccesibles; MFA autorizado aceptado; equipo con método real registrado en servidor y token válido aceptado; revocación bloquea acceso. Todas las filas de prueba revertidas con ROLLBACK. Esta simulación SQL prueba las políticas, no sustituye la ceremonia WebAuthn real.
- Pruebas HTTP anteriores: consultas anónimas a perfiles, permisos, facturas, proveedores, vista y RPC rechazadas; JWT con firma falsa rechazado; archivos privados sin listado anónimo.
- La activación real del autenticador, el registro de la llave y cualquier cambio real de contraseña los completa personalmente el usuario. No se han creado credenciales en su nombre.

## Límites y operación

Las páginas HTML de GitHub Pages son públicas. RLS protege los datos aunque alguien descargue el HTML o evite la redirección del navegador.

Passkeys es una función experimental de Supabase; cliente fijado en `2.105.0`. La confianza corresponde al navegador con token local más una llave válida del usuario; algunas llaves pueden sincronizarse entre dispositivos. Borrar datos del navegador exige volver a registrar el equipo tras MFA.

Supabase conserva activada la opción «Limit duration of AAL1 sessions»: una sesión con passkey que permanezca en AAL1 puede terminar tras 15 minutos sin TOTP, aunque la autorización interna de equipo tenga un máximo de 8 horas. No se desactivó esta protección. Si vuelve a solicitar el acceso, usar contraseña y TOTP.

CAPTCHA requiere configurar un proveedor y sus claves. La protección contra contraseñas filtradas requiere Pro y no se contrató. Mantenga protegido el autenticador y su mecanismo de recuperación; no elimine el último factor sin preparar recuperación administrativa.

Para una instalación nueva, aplicar `antiacam-instalacion.sql` y después `seguridad-acceso.sql`. No publicar claves secretas ni service_role.

Referencias: [MFA](https://supabase.com/docs/guides/auth/auth-mfa), [Passkeys](https://supabase.com/docs/guides/auth/passkeys), [Contraseñas](https://supabase.com/docs/guides/auth/passwords).
