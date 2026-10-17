# Antiacam · Finanzas

Sitio: https://antiacam.github.io/antiacam-finanzas/

En ambas pantallas, «Crear proveedor» permite registrar un RNC de nueve dígitos y su razón social, y seleccionarlo en la factura. Los RNC duplicados se rechazan sin sobrescribir el proveedor existente. La búsqueda consulta Supabase por RNC o nombre y limita las sugerencias a quince registros; no descarga el padrón completo al navegador.

Las páginas protegidas validan el usuario con Supabase Auth, su estado activo, MFA y el permiso de lectura del formulario antes de inicializarse. La sesión se vuelve a comprobar al regresar a la pestaña y las sesiones cerradas ocultan la pantalla y vuelven al acceso. El menú muestra únicamente los formularios autorizados. Ejecutar `npm run check` para verificar sintaxis, funciones y los casos de autorización.

Al tratarse de alojamiento estático, el HTML es público. La confidencialidad de datos y archivos depende de las políticas RLS de Supabase; el control de navegación del navegador no sustituye esas políticas. La conexión actual apunta a `zrnoumlgkmcnjgtslacs`; verificar Auth y RLS en ese proyecto antes de publicar.

Aplicación estática con acceso por Supabase Auth, registro y modificación de facturas de proveedores, importación de datos e-CF mediante QR, adjuntos privados y exportación Excel filtrada.

## Instalación

1. Abrir el SQL Editor del proyecto Supabase `zrnoumlgkmcnjgtslacs`.
2. Ejecutar `antiacam-instalacion.sql` una sola vez, en una base nueva. La instalación es transaccional. No ejecutar en otro proyecto.
3. En Data API → Exposed schemas, agregar `dev_v2`. Se aplican permisos de tabla y políticas RLS desde el script.
4. Debe existir exactamente un usuario inicial en Auth: recibe acceso a estas dos pantallas. Los usuarios creados después requieren alta y permisos explícitos. Si hay varios usuarios iniciales, el script se detiene para seleccionar explícitamente al administrador.
5. Publicar la rama `main`, carpeta raíz, desde Settings → Pages del repositorio.
6. Abrir la web e iniciar sesión con el usuario existente de este proyecto Supabase.

Las listas de tipo de compra, pago y solicitud parten de las opciones de la pantalla de referencia. Gastado por, vehículo y proyecto se agregan desde el botón «Agregar opción» de la pantalla. Proveedor y RNC admiten entrada directa.

## Alcance

Solo Finanzas: `8010-fact_prov.html` y `8011-fact_prov_mod.html`. El detalle de inventario ya estaba desactivado en la referencia y sigue fuera de este módulo; no se instala la tabla de respaldo `_bak`, órdenes de compra, pagos ni otros módulos. No se migran facturas ni personas del sistema anterior. La tabla de proveedores y la estructura de cabecera conservan los campos necesarios para las pantallas. No se replica el enlace público 606, que estaba comentado en la referencia; se conserva Excel general.

El frontend incluye exclusivamente una clave publicable de Supabase. Los datos y adjuntos exigen sesión y permisos en la base. Las claves secretas no se colocan en el frontend. Si el usuario tiene MFA obligatorio, debe ampliarse el acceso con ese flujo antes de usarlo; el login actual lo detecta y no continúa sin segundo factor.

El SQL está preparado para instalación inicial; no es una actualización de una base existente. Se ejecutó en el proyecto NCF (`zrnoumlgkmcnjgtslacs`) el 17 de octubre de 2026. No volver a ejecutarlo sobre ese proyecto: las tablas y el bucket ya existen.

La verificación en Supabase confirmó siete tablas con RLS, dos vistas con `security_invoker`, un usuario autorizado, dos permisos de formulario, dieciocho opciones iniciales y el bucket privado `facturas-proveedor`. El esquema `dev_v2` está habilitado en Data API. Las pruebas con el rol `authenticated` validaron lectura, inserción y actualización del usuario inicial, y bloqueo de usuarios sin alta; todos los datos de prueba se revirtieron. Una petición REST con la clave publicable, sin sesión, recibió HTTP 401. Security Advisor registró cero errores y una advertencia por protección contra contraseñas filtradas desactivada.

Queda pendiente la prueba manual del inicio de sesión desde la app publicada con la contraseña del usuario existente, y la carga y descarga de un adjunto desde esa sesión. No se creó ni cambió ninguna contraseña.
# Identificación de proveedores

«Crear proveedor» admite RNC de 9 dígitos y cédula de 11, sin guiones. Ambos documentos se guardan como texto para conservar ceros iniciales. El campo calculado `tipo_identificacion` se mantiene automáticamente en proveedores y facturas: 1 = RNC; 2 = cédula. No aparece como control en pantalla y se incluye como «Tipo identificación» en el Excel de facturas.

En instalaciones nuevas, aplicar también `proveedores-identificacion.sql` después de los otros scripts de instalación.
