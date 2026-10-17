-- Aplicar al proyecto NCF. No registra credenciales ni equipos automáticamente.
begin;
create schema if not exists antiacam_private;
revoke all on schema antiacam_private from public, anon;
grant usage on schema antiacam_private to authenticated;
create table if not exists antiacam_private.dispositivos (
 id uuid primary key default gen_random_uuid(), usuario_id uuid not null references auth.users(id) on delete cascade,
 passkey_id uuid not null references auth.webauthn_credentials(id) on delete cascade,
 token_hash text not null unique, nombre text not null check(length(nombre) between 1 and 100),
 creado timestamptz not null default now(), vence timestamptz not null default now()+interval '30 days',
 revocado boolean not null default false, unique(usuario_id,passkey_id)
);
create table if not exists antiacam_private.sesiones_equipo (
 session_id uuid primary key references auth.sessions(id) on delete cascade,
 dispositivo_id uuid not null references antiacam_private.dispositivos(id) on delete cascade,
 usuario_id uuid not null references auth.users(id) on delete cascade,
 vence timestamptz not null default now()+interval '8 hours'
);
alter table antiacam_private.dispositivos enable row level security;
alter table antiacam_private.sesiones_equipo enable row level security;
revoke all on all tables in schema antiacam_private from public,anon,authenticated;

-- Privilegio elevado limitado a comprobar sesión y registros internos propios.
create or replace function antiacam_private.acceso_seguro() returns boolean
language sql stable security definer set search_path='' as $$
 select auth.uid() is not null
 and exists(select 1 from auth.sessions s where s.id::text=auth.jwt()->>'session_id' and s.user_id=auth.uid() and (s.not_after is null or s.not_after>now()))
 and (auth.jwt()->>'aal'='aal2' or exists(
 select 1 from antiacam_private.sesiones_equipo s
 join antiacam_private.dispositivos d on d.id=s.dispositivo_id
 join auth.webauthn_credentials c on c.id=d.passkey_id and c.user_id=d.usuario_id
 where s.session_id::text=auth.jwt()->>'session_id' and s.usuario_id=auth.uid()
 and d.usuario_id=auth.uid() and not d.revocado and d.vence>now() and s.vence>now()
 and exists(select 1 from auth.mfa_amr_claims a where a.session_id=s.session_id and a.authentication_method='passkey')))
$$;
create or replace function antiacam_private.equipo(accion text, token text default null, llave uuid default null, nombre text default null, equipo_id uuid default null)
returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid(); sid uuid; d antiacam_private.dispositivos;
begin
 if uid is null or not exists(select 1 from dev_v2.app_sys_usuario u where u.usuario_id=uid and u.activo and not u.eliminado) then raise exception 'Acceso denegado' using errcode='42501'; end if;
 select s.id into sid from auth.sessions s where s.id::text=auth.jwt()->>'session_id' and s.user_id=uid and (s.not_after is null or s.not_after>now());
 if sid is null then raise exception 'Sesión vencida' using errcode='42501'; end if;
 if accion='estado' then return jsonb_build_object('autorizado',antiacam_private.acceso_seguro()); end if;
 if accion='validar' then
  if not exists(select 1 from auth.mfa_amr_claims a where a.session_id=sid and a.authentication_method='passkey') then raise exception 'Use su llave de acceso' using errcode='42501'; end if;
  select * into d from antiacam_private.dispositivos x where x.usuario_id=uid and x.token_hash=encode(extensions.digest(token,'sha256'),'hex') and not x.revocado and x.vence>now()
   and exists(select 1 from auth.webauthn_credentials c where c.id=x.passkey_id and c.user_id=uid);
  if d.id is null then raise exception 'Equipo no autorizado o vencido' using errcode='42501'; end if;
  insert into antiacam_private.sesiones_equipo(session_id,dispositivo_id,usuario_id) values(sid,d.id,uid)
   on conflict(session_id) do update set dispositivo_id=excluded.dispositivo_id,vence=least(antiacam_private.sesiones_equipo.vence,excluded.vence);
  return jsonb_build_object('autorizado',true);
 end if;
 if auth.jwt()->>'aal' is distinct from 'aal2' then raise exception 'Confirme el segundo factor' using errcode='42501'; end if;
 if accion='registrar' then
  if token is null or token !~ '^[a-f0-9]{64}$' or nombre is null or length(trim(nombre)) not between 1 and 100 then raise exception 'Nombre o token inválido'; end if;
  if not exists(select 1 from auth.webauthn_credentials c where c.id=llave and c.user_id=uid) then raise exception 'Llave ajena o inexistente' using errcode='42501'; end if;
  insert into antiacam_private.dispositivos(usuario_id,passkey_id,token_hash,nombre) values(uid,llave,encode(extensions.digest(token,'sha256'),'hex'),trim(nombre));
  return jsonb_build_object('registrado',true);
 elsif accion='listar' then
  return coalesce((select jsonb_agg(jsonb_build_object('id',x.id,'nombre',x.nombre,'vence',x.vence,'revocado',x.revocado) order by x.creado desc) from antiacam_private.dispositivos x where x.usuario_id=uid),'[]'::jsonb);
 elsif accion='revocar' then
  update antiacam_private.dispositivos set revocado=true where id=equipo_id and usuario_id=uid;
  return jsonb_build_object('revocado',true);
 end if;
 raise exception 'Operación desconocida';
end $$;
revoke all on all functions in schema antiacam_private from public,anon,authenticated;
grant execute on function antiacam_private.acceso_seguro(),antiacam_private.equipo(text,text,uuid,text,uuid) to authenticated;
create or replace function dev_v2.fn_acceso_seguro() returns boolean language sql stable security invoker set search_path='' as $$select antiacam_private.acceso_seguro()$$;
create or replace function dev_v2.fn_equipo(accion text,token text default null,llave uuid default null,nombre text default null,equipo_id uuid default null)
returns jsonb language sql security invoker set search_path='' as $$select antiacam_private.equipo(accion,token,llave,nombre,equipo_id)$$;
revoke all on function dev_v2.fn_acceso_seguro(),dev_v2.fn_equipo(text,text,uuid,text,uuid) from public,anon;
grant execute on function dev_v2.fn_acceso_seguro(),dev_v2.fn_equipo(text,text,uuid,text,uuid) to authenticated;
create or replace function dev_v2.tiene_permiso(operacion text) returns boolean language sql stable security invoker set search_path='' as $$
 select (select antiacam_private.acceso_seguro()) and exists(select 1 from dev_v2.app_sys_usuario_permiso_formulario p join dev_v2.app_sys_usuario u using(usuario_id)
 where p.usuario_id=auth.uid() and p.activo and not p.eliminado and u.activo and not u.eliminado
 and case operacion when 'select' then p.puede_select when 'insert' then p.puede_insert when 'update' then p.puede_update when 'delete' then p.puede_delete else false end)
$$;
notify pgrst,'reload schema';
commit;
