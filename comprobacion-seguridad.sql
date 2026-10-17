-- Prueba transaccional. ROLLBACK elimina todas las filas de prueba.
begin;
create temporary table prueba_acceso as select '7bf81ec5-e73f-4815-b804-9aafede545e4'::uuid uid,gen_random_uuid() sid,gen_random_uuid() llave;
grant select on prueba_acceso to authenticated;
insert into auth.sessions(id,user_id,created_at,updated_at,aal) select sid,uid,now(),now(),'aal1' from prueba_acceso;
insert into auth.webauthn_credentials(id,user_id,credential_id,public_key) select llave,uid,decode('010203','hex'),decode('010203','hex') from prueba_acceso;
select set_config('request.jwt.claims',jsonb_build_object('sub',uid,'session_id',sid,'role','authenticated','aal','aal1','user_metadata',jsonb_build_object('admin',true),'amr',jsonb_build_array(jsonb_build_object('method','passkey')))::text,true) from prueba_acceso;
set local role authenticated;
do $$begin
 if dev_v2.fn_acceso_seguro() or dev_v2.tiene_permiso('select') then raise exception 'FALLO: AAL1 accede a datos'; end if;
 if exists(select 1 from dev_v2.mt_opr_proveedor) or exists(select 1 from dev_v2.t_opr_fin10_factura_proveedor) then raise exception 'FALLO: datos sin MFA'; end if;
 begin perform dev_v2.fn_equipo('registrar',repeat('a',64),(select llave from prueba_acceso),'Prueba');raise exception 'FALLO: registro sin MFA'; exception when insufficient_privilege then null; end;
 begin perform dev_v2.fn_equipo('validar',repeat('a',64));raise exception 'FALLO: AMR inventado en JWT'; exception when insufficient_privilege then null; end;
 begin perform 1 from antiacam_private.dispositivos;raise exception 'FALLO: lee hashes privados'; exception when insufficient_privilege then null; end;
end $$;
reset role;
select set_config('request.jwt.claims',jsonb_build_object('sub',uid,'session_id',sid,'role','authenticated','aal','aal2')::text,true) from prueba_acceso;
set local role authenticated;
do $$begin
 if not dev_v2.fn_acceso_seguro() or not dev_v2.tiene_permiso('select') then raise exception 'FALLO: MFA autorizado rechazado';end if;
 perform dev_v2.fn_equipo('registrar',repeat('a',64),(select llave from prueba_acceso),'Prueba temporal');
end $$;
reset role;
insert into auth.mfa_amr_claims(id,session_id,authentication_method,created_at,updated_at) select gen_random_uuid(),sid,'passkey',now(),now() from prueba_acceso;
select set_config('request.jwt.claims',jsonb_build_object('sub',uid,'session_id',sid,'role','authenticated','aal','aal1')::text,true) from prueba_acceso;
set local role authenticated;
do $$begin
 if dev_v2.fn_acceso_seguro() then raise exception 'FALLO: passkey sin validar navegador';end if;
 perform dev_v2.fn_equipo('validar',repeat('a',64));
 if not dev_v2.fn_acceso_seguro() then raise exception 'FALLO: equipo autorizado rechazado';end if;
end $$;
reset role;
update antiacam_private.dispositivos set revocado=true where nombre='Prueba temporal' and usuario_id=(select uid from prueba_acceso);
set local role authenticated;
do $$begin if dev_v2.fn_acceso_seguro() then raise exception 'FALLO: equipo revocado';end if;end $$;
reset role;
rollback;
select 'OK: AAL1, AMR inventado, hashes privados y equipo revocado bloqueados; MFA y equipo válido autorizados. Pruebas revertidas.' as resultado;
