-- Clasificación automática, incluida para los registros existentes.
-- RNC/cédula se guardan como texto para conservar ceros iniciales.
begin;
alter table dev_v2.mt_opr_proveedor add column if not exists tipo_identificacion smallint
generated always as (case when rnc ~ '^[0-9]{9}$' then 1 when rnc ~ '^[0-9]{11}$' then 2 else null end) stored;
alter table dev_v2.t_opr_fin10_factura_proveedor add column if not exists tipo_identificacion smallint
generated always as (case when rnc_proveedor ~ '^[0-9]{9}$' then 1 when rnc_proveedor ~ '^[0-9]{11}$' then 2 else null end) stored;
comment on column dev_v2.mt_opr_proveedor.tipo_identificacion is '1 = RNC (9 dígitos); 2 = cédula (11 dígitos). Calculado automáticamente.';
comment on column dev_v2.t_opr_fin10_factura_proveedor.tipo_identificacion is '1 = RNC (9 dígitos); 2 = cédula (11 dígitos), según documento de la factura.';
notify pgrst,'reload schema';
commit;
