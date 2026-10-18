# Campos y alertas de facturas

Los campos obligatorios son NCF / e-NCF, Fecha de factura, RNC / Cédula, Nombre del proveedor, Tipo de bienes y servicios / 606 y Forma de pago. Se identifican con asterisco y los errores señalan el campo.

Se retiraron Tipo de solicitud y Gastado por de los formularios, filtros y Excel general. Los datos históricos permanecen en la base.

| Alerta | Significado y corrección |
| --- | --- |
| Campo obligatorio | Complete el campo indicado. |
| RNC / Cédula | Introduzca 9 dígitos para RNC o 11 para cédula. |
| Tipo de bienes y servicios / 606 | Seleccione un código vigente 01–11. Los textos históricos no equivalen automáticamente a un código DGII. |
| Forma de pago | Seleccione un código vigente 01–07. |
| Tipo de retención en ISR | Seleccione una opción del catálogo; es obligatoria si hay retención de renta. |
| Fecha de factura / Fecha de pago | Introduzca una fecha válida. Fecha de pago es obligatoria cuando existen retenciones. |
| Importes | Revise el importe identificado: debe ser numérico y no negativo. |
| Factura — campo — valor rechazado | El Excel DGII informa todos los problemas detectados, identificando cada factura y campo. La tabla muestra los pendientes en Validación DGII. |
| No se confirmó el guardado | El servidor no devolvió la factura actualizada. Revise sesión y permisos; no se informa éxito. |
| Forma de pago: el servidor no confirmó el valor | La respuesta no coincide con la selección; no se informa éxito. |
| No se guardó el cambio | La edición en tabla falló; se restaura el valor anterior y se muestra la causa. |
| Ya existe una factura con ese RNC y NCF | Revise si la factura ya está registrada. |
| Carga de la pantalla | Falló la consulta de proveedores, permisos o catálogos; revise conexión y acceso. |
| Adjunto de factura | Revise formato permitido, límite de 10 MB y permisos. |

La alerta anterior «Factura 2: Seleccione un código válido del catálogo DGII» indicaba una clasificación inválida en alguno de los catálogos, sin identificar cuál. Los mensajes nuevos identifican campo y valor. No significa por sí sola que el NCF o el proveedor sean incorrectos.

Los cambios en tabla se confirman con la fila devuelta por Supabase y actualizan el mismo campo en el formulario abierto, para evitar que un guardado posterior lo sobrescriba con el valor anterior.
