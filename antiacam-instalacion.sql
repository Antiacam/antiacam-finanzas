-- Antiacam: ejecutar solamente en zrnoumlgkmcnjgtslacs.
-- Instalación inicial para base nueva. Todo se confirma en una transacción.
begin;
-- Evitar otorgar permisos a usuarios distintos del único usuario inicial.
do $$ begin
  if (select count(*) from auth.users where email is not null) <> 1 then
    raise exception 'Esta instalación requiere exactamente un usuario inicial en Authentication. Si hay varios, seleccionar explícitamente al administrador antes de instalar.';
  end if;
end $$;
create schema if not exists dev_v2;
create table dev_v2.app_sys_usuario (usuario_id uuid primary key references auth.users(id), nombre text not null, correo text, activo boolean not null default true, eliminado boolean not null default false,
creado_por uuid, fecha_creacion timestamptz not null default now(), modificado_por uuid, fecha_modificacion timestamptz);
create table dev_v2.mt_cfg_modulo (modulo_id bigserial primary key,nombre varchar(150) not null,descripcion text,icono varchar(100),orden integer default 0,mostrar boolean default true,activo boolean not null default true, eliminado boolean not null default false,
creado_por uuid, fecha_creacion timestamptz not null default now(), modificado_por uuid, fecha_modificacion timestamptz);
create table dev_v2.mt_cfg_modulo_formulario (formulario_id bigserial primary key,modulo_id bigint not null references dev_v2.mt_cfg_modulo,formulario_codigo varchar(20) not null unique,nombre varchar(150) not null,descripcion text,icono varchar(100),orden integer default 0,mostrar boolean default true,archivo_html varchar(255) not null,esquema_nombre varchar(100) default 'dev_v2',tabla_principal varchar(150),observacion text,activo boolean not null default true, eliminado boolean not null default false,
creado_por uuid, fecha_creacion timestamptz not null default now(), modificado_por uuid, fecha_modificacion timestamptz);
create table dev_v2.app_sys_usuario_permiso_formulario (permiso_formulario_id bigserial primary key,usuario_id uuid not null references dev_v2.app_sys_usuario,formulario_id bigint not null references dev_v2.mt_cfg_modulo_formulario,puede_select boolean not null default false,puede_insert boolean not null default false,puede_update boolean not null default false,puede_delete boolean not null default false,observacion text,activo boolean not null default true, eliminado boolean not null default false,
creado_por uuid, fecha_creacion timestamptz not null default now(), modificado_por uuid, fecha_modificacion timestamptz,unique(usuario_id,formulario_id));
create table dev_v2.mt_opr_proveedor (proveedor_id bigserial primary key,rnc varchar(20) not null unique,proveedor varchar(255) not null,tipo_proveedor varchar(50),estado boolean not null default true,correo varchar(150),p_interno boolean not null default false,activo boolean not null default true, eliminado boolean not null default false,
creado_por uuid, fecha_creacion timestamptz not null default now(), modificado_por uuid, fecha_modificacion timestamptz);
create index idx_mt_opr_proveedor_nombre on dev_v2.mt_opr_proveedor(proveedor);
create table dev_v2.mt_cat_opcion (opcion_id bigserial primary key,formulario_cod varchar(100) not null,orden_formulario integer not null default 0,catalogo_codigo varchar(100) not null,orden_grupo integer not null default 0,opcion_codigo varchar(100) not null,opcion_nombre varchar(150) not null,valor varchar(150),descripcion text,orden_lista integer not null default 0,observacion text,formulario_codigo varchar(100),activo boolean not null default true, eliminado boolean not null default false,
creado_por uuid, fecha_creacion timestamptz not null default now(), modificado_por uuid, fecha_modificacion timestamptz,unique(formulario_cod,catalogo_codigo,opcion_codigo));
create table dev_v2.t_opr_fin10_factura_proveedor (
  factura_prov_id serial not null,
  proveedor_id integer null,
  rnc_proveedor character varying(20) null,
  nombre_proveedor character varying(200) null,
  numero_ncf character varying(20) null,
  tipo_ncf character varying(10) not null default 'MANUAL'::character varying,
  fecha_factura date null,
  fecha_vencimiento date null,
  tipo_compra character varying(50) null,
  forma_pago character varying(30) null,
  gastado_por character varying(120) null,
  tipo_solicitud character varying(30) null,
  orden_compra_id integer null,
  centro_costos character varying(100) null,
  subtotal_servicios_locales numeric(12, 2) not null default 0,
  subtotal_bienes_locales numeric(12, 2) not null default 0,
  subtotal_bruto_factura numeric(12, 2) not null default 0,
  impuesto_selectivo_consumo numeric(12, 2) not null default 0,
  otros_impuestos_tasas numeric(12, 2) not null default 0,
  monto_propina_legal numeric(12, 2) not null default 0,
  itbis_servicios_locales numeric(12, 2) not null default 0,
  itbis_bienes_locales numeric(12, 2) not null default 0,
  itbis_total numeric(12, 2) not null default 0,
  total_factura numeric(12, 2) not null default 0,
  monto_bruto_ncf numeric(12, 2) null,
  total_factura_original numeric(12, 2) null,
  url_consulta text null,
  codigo_seguridad character varying(100) null,
  rnc_comprador character varying(20) null,
  via_carga character varying(20) not null default 'MANUAL'::character varying,
  adjunto_url character varying(500) null,
  estado character varying(30) not null default 'Pendiente'::character varying,
  observacion text null,
  activo boolean not null default true,
  eliminado boolean not null default false,
  creado_por uuid null,
  fecha_creacion timestamp with time zone not null default now(),
  modificado_por uuid null,
  fecha_modificacion timestamp with time zone null,
  tipo_factura character varying(20) null default 'servicio'::character varying,
  nombre_proveedor_snap character varying(200) null,
  rnc_proveedor_snap character varying(20) null,
  vehiculo character varying(100) null,
  proyecto character varying(200) null,
  categoria_relgastos_public character varying(150) null,
  datos_migracion jsonb null,
  constraint t_opr_fin10_factura_proveedor_pkey primary key (factura_prov_id),
  constraint fk_fin10_proveedor foreign KEY (proveedor_id) references dev_v2.mt_opr_proveedor (proveedor_id),
  constraint chk_fin10_rnc_no_vacio check (
    (
      (rnc_proveedor is null)
      or (
        length(
          TRIM(
            both
            from
              rnc_proveedor
          )
        ) > 0
      )
    )
  ),
  constraint chk_fin10_rnc_solo_numeros check (
    (
      (rnc_proveedor is null)
      or ((rnc_proveedor)::text ~ '^[0-9]+$'::text)
    )
  ),
  constraint chk_fin10_tipo_ncf check (
    (
      (tipo_ncf)::text = any (
        array['ECF'::text, 'MANUAL'::text, 'PEND_NCF'::text]
      )
    )
  ),
  constraint chk_fin10_via_carga check (
    (
      (via_carga)::text = any (
        array['QR_ECF'::text, 'MANUAL'::text, 'MIGRACION'::text]
      )
    )
  ),
  constraint chk_fin10_estado check (
    (
      (estado)::text = any (
        array[
          'Pendiente'::text,
          'Registrada'::text,
          'Recibida'::text,
          'Contabilizada'::text,
          'Anulada'::text,
          'Migrado'::text
        ]
      )
    )
  ),
  constraint t_opr_fin10_factura_proveedor_tipo_factura_check check (
    (
      (tipo_factura)::text = any (
        (
          array[
            'material'::character varying,
            'servicio'::character varying
          ]
        )::text[]
      )
    )
  ),
  constraint chk_fin10_montos_no_negativos check (
    (
      (subtotal_servicios_locales >= (0)::numeric)
      and (subtotal_bienes_locales >= (0)::numeric)
      and (subtotal_bruto_factura >= (0)::numeric)
      and (impuesto_selectivo_consumo >= (0)::numeric)
      and (otros_impuestos_tasas >= (0)::numeric)
      and (monto_propina_legal >= (0)::numeric)
      and (itbis_servicios_locales >= (0)::numeric)
      and (itbis_bienes_locales >= (0)::numeric)
      and (itbis_total >= (0)::numeric)
    )
  ),
  constraint chk_fin10_ncf_no_vacio check (
    (
      (numero_ncf is null)
      or (
        length(
          TRIM(
            both
            from
              numero_ncf
          )
        ) > 0
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_fin10_proveedor on dev_v2.t_opr_fin10_factura_proveedor using btree (proveedor_id) TABLESPACE pg_default;

create index IF not exists idx_fin10_orden_compra on dev_v2.t_opr_fin10_factura_proveedor using btree (orden_compra_id) TABLESPACE pg_default;

create index IF not exists idx_fin10_fecha on dev_v2.t_opr_fin10_factura_proveedor using btree (fecha_factura) TABLESPACE pg_default;

create index IF not exists idx_fin10_numero_ncf on dev_v2.t_opr_fin10_factura_proveedor using btree (numero_ncf) TABLESPACE pg_default;

create index IF not exists idx_fin10_rnc_proveedor on dev_v2.t_opr_fin10_factura_proveedor using btree (rnc_proveedor) TABLESPACE pg_default;

create unique INDEX IF not exists idx_fin10_rnc_ncf_unique on dev_v2.t_opr_fin10_factura_proveedor using btree (rnc_proveedor, numero_ncf) TABLESPACE pg_default
where
  (
    (eliminado = false)
    and (activo = true)
  );


-- El detalle de insumos está desactivado en la pantalla suministrada.
-- No se copian tablas de inventario, órdenes de compra ni copias _bak.
insert into dev_v2.mt_cfg_modulo(nombre,descripcion,orden) values('Finanzas','Facturas de proveedores',1);
insert into dev_v2.mt_cfg_modulo_formulario(modulo_id,formulario_codigo,nombre,orden,archivo_html,tabla_principal) select modulo_id,'8010','Registrar factura',1,'8010-fact_prov.html','t_opr_fin10_factura_proveedor' from dev_v2.mt_cfg_modulo;
insert into dev_v2.mt_cfg_modulo_formulario(modulo_id,formulario_codigo,nombre,orden,archivo_html,tabla_principal) select modulo_id,'8011','Consultar y modificar',2,'8011-fact_prov_mod.html','t_opr_fin10_factura_proveedor' from dev_v2.mt_cfg_modulo;
-- Autorizar exclusivamente a los usuarios que ya existen al instalar.
-- Los registros nuevos en Auth NO reciben permisos automáticamente.
insert into dev_v2.app_sys_usuario(usuario_id,nombre,correo) select id,split_part(email,'@',1),email from auth.users where email is not null;
insert into dev_v2.app_sys_usuario_permiso_formulario(usuario_id,formulario_id,puede_select,puede_insert,puede_update)
select u.usuario_id,f.formulario_id,true,f.formulario_codigo='8010',f.formulario_codigo='8011' from dev_v2.app_sys_usuario u cross join dev_v2.mt_cfg_modulo_formulario f;
create function dev_v2.tiene_permiso(operacion text) returns boolean language sql stable security invoker set search_path='' as $$
select exists(select 1 from dev_v2.app_sys_usuario_permiso_formulario p join dev_v2.app_sys_usuario u using(usuario_id)
where p.usuario_id=auth.uid() and p.activo and not p.eliminado and u.activo and not u.eliminado
and case operacion when 'select' then p.puede_select when 'insert' then p.puede_insert when 'update' then p.puede_update when 'delete' then p.puede_delete else false end)
$$;
alter table dev_v2.app_sys_usuario enable row level security;
create policy usuario_propio on dev_v2.app_sys_usuario for select to authenticated using(usuario_id=auth.uid());
alter table dev_v2.app_sys_usuario_permiso_formulario enable row level security;
create policy permisos_propios on dev_v2.app_sys_usuario_permiso_formulario for select to authenticated using(usuario_id=auth.uid());
alter table dev_v2.mt_cfg_modulo enable row level security;
create policy lectura on dev_v2.mt_cfg_modulo for select to authenticated using(dev_v2.tiene_permiso('select'));
alter table dev_v2.mt_cfg_modulo_formulario enable row level security;
create policy lectura on dev_v2.mt_cfg_modulo_formulario for select to authenticated using(dev_v2.tiene_permiso('select'));
alter table dev_v2.mt_cat_opcion enable row level security;
create policy lectura on dev_v2.mt_cat_opcion for select to authenticated using(dev_v2.tiene_permiso('select'));
alter table dev_v2.mt_opr_proveedor enable row level security;
create policy lectura on dev_v2.mt_opr_proveedor for select to authenticated using(dev_v2.tiene_permiso('select'));
create policy alta on dev_v2.mt_opr_proveedor for insert to authenticated with check(dev_v2.tiene_permiso('insert'));
create policy cambio on dev_v2.mt_opr_proveedor for update to authenticated using(dev_v2.tiene_permiso('update')) with check(dev_v2.tiene_permiso('update'));
alter table dev_v2.t_opr_fin10_factura_proveedor enable row level security;
create policy lectura on dev_v2.t_opr_fin10_factura_proveedor for select to authenticated using(dev_v2.tiene_permiso('select'));
create policy alta on dev_v2.t_opr_fin10_factura_proveedor for insert to authenticated with check(dev_v2.tiene_permiso('insert'));
create policy cambio on dev_v2.t_opr_fin10_factura_proveedor for update to authenticated using(dev_v2.tiene_permiso('update')) with check(dev_v2.tiene_permiso('update'));

create function dev_v2.fn_app_set_campos_auditoria() returns trigger language plpgsql security invoker set search_path='' as $$
begin
if TG_OP='INSERT' then NEW.creado_por=auth.uid(); NEW.fecha_creacion=now();
else NEW.creado_por=OLD.creado_por; NEW.fecha_creacion=OLD.fecha_creacion; NEW.modificado_por=auth.uid(); NEW.fecha_modificacion=now(); end if;
return NEW; end $$;
create function dev_v2.calcular_factura() returns trigger language plpgsql security invoker set search_path='' as $$
begin
if NEW.fecha_factura is null or nullif(trim(NEW.nombre_proveedor),'') is null then raise exception 'Fecha y proveedor son obligatorios'; end if;
NEW.subtotal_bruto_factura=NEW.subtotal_servicios_locales+NEW.subtotal_bienes_locales;
NEW.itbis_total=NEW.itbis_servicios_locales+NEW.itbis_bienes_locales;
NEW.total_factura=NEW.subtotal_bruto_factura+NEW.itbis_total+NEW.impuesto_selectivo_consumo+NEW.otros_impuestos_tasas+NEW.monto_propina_legal;
return NEW; end $$;
create trigger calcular before insert or update on dev_v2.t_opr_fin10_factura_proveedor for each row execute function dev_v2.calcular_factura();
create trigger auditoria before insert or update on dev_v2.t_opr_fin10_factura_proveedor for each row execute function dev_v2.fn_app_set_campos_auditoria();
create trigger auditoria before insert or update on dev_v2.mt_opr_proveedor for each row execute function dev_v2.fn_app_set_campos_auditoria();
create view dev_v2.vw_form_t_opr_fin10_factura_proveedor with(security_invoker=true) as select f.*,true as modificar,'[]'::jsonb as lineas from dev_v2.t_opr_fin10_factura_proveedor f where not eliminado;
create view dev_v2.vw_cfg_modulo_formulario_menu_lateral with(security_invoker=true) as
select -m.modulo_id as formulario_menu_id,null::bigint as formulario_menu_padre_id,'MODULO'::text as tipo_menu,null::bigint as formulario_id,null::varchar as formulario_codigo,m.nombre,m.icono,m.descripcion,null::varchar as archivo_html,'dev_v2'::varchar as esquema_nombre,null::varchar as tabla_principal,m.orden,m.mostrar as mostrar_menu from dev_v2.mt_cfg_modulo m where m.activo and not m.eliminado and m.mostrar
union all select f.formulario_id,-f.modulo_id,'FORMULARIO',f.formulario_id,f.formulario_codigo,f.nombre,f.icono,f.descripcion,f.archivo_html,f.esquema_nombre,f.tabla_principal,f.orden,f.mostrar from dev_v2.mt_cfg_modulo_formulario f join dev_v2.mt_cfg_modulo m using(modulo_id) where f.activo and not f.eliminado and f.mostrar and m.activo and not m.eliminado and m.mostrar;
create function dev_v2.fn_guardar_factura_proveedor(p_cabecera jsonb,p_lineas jsonb default '[]') returns jsonb language plpgsql security invoker set search_path='' as $$
declare r dev_v2.t_opr_fin10_factura_proveedor; nuevo_id integer;
begin
if jsonb_array_length(p_lineas)>0 then raise exception 'Detalle de inventario fuera del alcance'; end if;
if nullif(p_cabecera->>'factura_prov_id','') is not null then raise exception 'Utilice la pantalla de modificación'; end if;
select * into r from jsonb_populate_record(null::dev_v2.t_opr_fin10_factura_proveedor,p_cabecera);
insert into dev_v2.t_opr_fin10_factura_proveedor(proveedor_id,rnc_proveedor,nombre_proveedor,numero_ncf,tipo_ncf,fecha_factura,fecha_vencimiento,tipo_compra,forma_pago,gastado_por,tipo_solicitud,orden_compra_id,centro_costos,subtotal_servicios_locales,subtotal_bienes_locales,subtotal_bruto_factura,impuesto_selectivo_consumo,otros_impuestos_tasas,monto_propina_legal,itbis_servicios_locales,itbis_bienes_locales,itbis_total,total_factura,monto_bruto_ncf,total_factura_original,url_consulta,codigo_seguridad,rnc_comprador,via_carga,adjunto_url,estado,observacion,activo,tipo_factura,nombre_proveedor_snap,rnc_proveedor_snap,vehiculo,proyecto,categoria_relgastos_public,datos_migracion) values(r.proveedor_id,r.rnc_proveedor,r.nombre_proveedor,r.numero_ncf,r.tipo_ncf,r.fecha_factura,r.fecha_vencimiento,r.tipo_compra,r.forma_pago,r.gastado_por,r.tipo_solicitud,r.orden_compra_id,r.centro_costos,r.subtotal_servicios_locales,r.subtotal_bienes_locales,r.subtotal_bruto_factura,r.impuesto_selectivo_consumo,r.otros_impuestos_tasas,r.monto_propina_legal,r.itbis_servicios_locales,r.itbis_bienes_locales,r.itbis_total,r.total_factura,r.monto_bruto_ncf,r.total_factura_original,r.url_consulta,r.codigo_seguridad,r.rnc_comprador,r.via_carga,r.adjunto_url,r.estado,r.observacion,r.activo,r.tipo_factura,r.nombre_proveedor_snap,r.rnc_proveedor_snap,r.vehiculo,r.proyecto,r.categoria_relgastos_public,r.datos_migracion) returning factura_prov_id into nuevo_id;
return jsonb_build_object('factura_prov_id',nuevo_id); end $$;
create function dev_v2.fn_actualizar_adjunto_factura_proveedor(p_factura_prov_id integer,p_adjunto_url text) returns void language plpgsql security invoker set search_path='' as $$
begin
if split_part(p_adjunto_url,'/',1)<>auth.uid()::text then raise exception 'Ruta de adjunto no autorizada'; end if;
update dev_v2.t_opr_fin10_factura_proveedor set adjunto_url=p_adjunto_url where factura_prov_id=p_factura_prov_id;
if not found then raise exception 'Factura no encontrada o sin permiso'; end if;
end $$;
grant usage on schema dev_v2 to authenticated;
grant select on all tables in schema dev_v2 to authenticated;
grant insert,update on dev_v2.mt_opr_proveedor,dev_v2.t_opr_fin10_factura_proveedor to authenticated;
grant insert on dev_v2.mt_cat_opcion to authenticated;
create policy alta_catalogo on dev_v2.mt_cat_opcion for insert to authenticated with check(dev_v2.tiene_permiso('insert') and formulario_codigo='FIN10_FACT_PROVEEDOR' and formulario_cod='FIN10_FACT_PROVEEDOR' and catalogo_codigo in ('GASTADO_POR','VEHICULO','PROYECTO'));
grant usage,select on all sequences in schema dev_v2 to authenticated;
revoke all on all functions in schema dev_v2 from public,anon;
grant execute on all functions in schema dev_v2 to authenticated;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('facturas-proveedor','facturas-proveedor',false,10485760,array['image/jpeg','image/png','image/webp','application/pdf']);
create policy antiacam_archivo_lectura on storage.objects for select to authenticated using(bucket_id='facturas-proveedor' and dev_v2.tiene_permiso('select'));
create policy antiacam_archivo_alta on storage.objects for insert to authenticated with check(bucket_id='facturas-proveedor' and (storage.foldername(name))[1]=auth.uid()::text and dev_v2.tiene_permiso('insert'));
create policy antiacam_archivo_cambio on storage.objects for update to authenticated using(bucket_id='facturas-proveedor' and (storage.foldername(name))[1]=auth.uid()::text and dev_v2.tiene_permiso('update')) with check(bucket_id='facturas-proveedor' and (storage.foldername(name))[1]=auth.uid()::text and dev_v2.tiene_permiso('update'));
insert into dev_v2.mt_cat_opcion(formulario_cod,formulario_codigo,catalogo_codigo,opcion_codigo,opcion_nombre,valor,orden_lista) values ('FIN10_FACT_PROVEEDOR','FIN10_FACT_PROVEEDOR','TIPO_COMPRA','COMPRA_MATERIALES','COMPRA MATERIALES','COMPRA MATERIALES',1),
('FIN10_FACT_PROVEEDOR','FIN10_FACT_PROVEEDOR','TIPO_COMPRA','COMPRA_EQUIPO','COMPRA EQUIPO','COMPRA EQUIPO',2),
('FIN10_FACT_PROVEEDOR','FIN10_FACT_PROVEEDOR','TIPO_COMPRA','COMBUSTIBLE','COMBUSTIBLE','COMBUSTIBLE',3),
('FIN10_FACT_PROVEEDOR','FIN10_FACT_PROVEEDOR','TIPO_COMPRA','GAS_TRABAJO','GAS TRABAJO','GAS TRABAJO',4),
('FIN10_FACT_PROVEEDOR','FIN10_FACT_PROVEEDOR','TIPO_COMPRA','SERVICIO','SERVICIO','SERVICIO',5),
('FIN10_FACT_PROVEEDOR','FIN10_FACT_PROVEEDOR','TIPO_COMPRA','COMIDA','COMIDA','COMIDA',6),
('FIN10_FACT_PROVEEDOR','FIN10_FACT_PROVEEDOR','TIPO_COMPRA','PEAJE','PEAJE','PEAJE',7),
('FIN10_FACT_PROVEEDOR','FIN10_FACT_PROVEEDOR','TIPO_COMPRA','VEHICULO_MANTENIMIENTO','VEHICULO MANTENIMIENTO','VEHICULO MANTENIMIENTO',8),
('FIN10_FACT_PROVEEDOR','FIN10_FACT_PROVEEDOR','TIPO_COMPRA','PAGO_PRESTAMO','PAGO PRESTAMO','PAGO PRESTAMO',9),
('FIN10_FACT_PROVEEDOR','FIN10_FACT_PROVEEDOR','TIPO_COMPRA','SERVICIO_TELEFONICO','SERVICIO TELEFONICO','SERVICIO TELEFONICO',10),
('FIN10_FACT_PROVEEDOR','FIN10_FACT_PROVEEDOR','TIPO_COMPRA','SERVICIO_INTERNET','SERVICIO INTERNET','SERVICIO INTERNET',11),
('FIN10_FACT_PROVEEDOR','FIN10_FACT_PROVEEDOR','TIPO_COMPRA','OTRO','OTRO','OTRO',12),
('FIN10_FACT_PROVEEDOR','FIN10_FACT_PROVEEDOR','FORMA_PAGO','TARJETA','TARJETA','TARJETA',1),
('FIN10_FACT_PROVEEDOR','FIN10_FACT_PROVEEDOR','FORMA_PAGO','EFECTIVO','EFECTIVO','EFECTIVO',2),
('FIN10_FACT_PROVEEDOR','FIN10_FACT_PROVEEDOR','FORMA_PAGO','TRANSFERENCIA','TRANSFERENCIA','TRANSFERENCIA',3),
('FIN10_FACT_PROVEEDOR','FIN10_FACT_PROVEEDOR','FORMA_PAGO','CHEQUE','CHEQUE','CHEQUE',4),
('FIN10_FACT_PROVEEDOR','FIN10_FACT_PROVEEDOR','TIPO_SOLICITUD','DESEMBOLSO','DESEMBOLSO','DESEMBOLSO',1),
('FIN10_FACT_PROVEEDOR','FIN10_FACT_PROVEEDOR','TIPO_SOLICITUD','REEMBOLSO','REEMBOLSO','REEMBOLSO',2);
notify pgrst,'reload schema';
commit;
