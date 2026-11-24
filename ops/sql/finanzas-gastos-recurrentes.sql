begin;

create table finanazas_nize.gastos_recurrencias (
  id uuid primary key,
  nombre text not null,
  tipo text not null,
  importe numeric(12,2) not null check (importe >= 0 and importe < 'Infinity'::numeric),
  fecha_inicio date not null check (isfinite(fecha_inicio)),
  frecuencia text not null check (frecuencia in ('semanal', 'quincenal', 'mensual', 'anual')),
  repeticiones integer not null check (repeticiones between 2 and 60),
  notas text,
  factura_url text,
  factura_nombre text,
  creado_por uuid references auth.users(id) on delete set null,
  creado_por_email text,
  creado_por_nombre text,
  siguiente_indice integer not null default 0,
  proxima_fecha date
);

alter table finanazas_nize.gastos_recurrencias enable row level security;
revoke all on finanazas_nize.gastos_recurrencias from public, anon, authenticated, service_role;
create index gastos_recurrencias_proxima_fecha_idx
  on finanazas_nize.gastos_recurrencias (proxima_fecha)
  where proxima_fecha is not null;

create function finanazas_nize.generar_gastos_vencidos(p_hasta date, p_id uuid default null)
returns void
language plpgsql
set search_path = ''
as $$
declare
  serie finanazas_nize.gastos_recurrencias%rowtype;
begin
  for serie in
    select r.* from finanazas_nize.gastos_recurrencias r
    where r.proxima_fecha <= p_hasta and (p_id is null or r.id = p_id)
    order by r.proxima_fecha, r.id
    for update skip locked
  loop
    while serie.proxima_fecha <= p_hasta loop
      insert into finanazas_nize.gastos (
        nombre, tipo, importe, fecha, notas, factura_url, factura_nombre,
        creado_por, creado_por_email, creado_por_nombre
      ) values (
        serie.nombre, serie.tipo, serie.importe, serie.proxima_fecha, serie.notas,
        case when serie.siguiente_indice = 0 then serie.factura_url end,
        case when serie.siguiente_indice = 0 then serie.factura_nombre end,
        serie.creado_por, serie.creado_por_email, serie.creado_por_nombre
      );

      serie.siguiente_indice := serie.siguiente_indice + 1;
      -- Calcula desde la fecha inicial para recuperar el día 31 tras un mes corto.
      serie.proxima_fecha := case
        when serie.siguiente_indice >= serie.repeticiones then null
        when serie.frecuencia = 'semanal' then serie.fecha_inicio + 7 * serie.siguiente_indice
        when serie.frecuencia = 'quincenal' then serie.fecha_inicio + 14 * serie.siguiente_indice
        when serie.frecuencia = 'anual' then (serie.fecha_inicio + make_interval(years => serie.siguiente_indice))::date
        else (serie.fecha_inicio + make_interval(months => serie.siguiente_indice))::date
      end;
    end loop;

    update finanazas_nize.gastos_recurrencias
    set siguiente_indice = serie.siguiente_indice, proxima_fecha = serie.proxima_fecha
    where id = serie.id;
  end loop;
end;
$$;

revoke all on function finanazas_nize.generar_gastos_vencidos(date, uuid)
  from public, anon, authenticated, service_role;

create function public.finanzas_programar_gasto(
  p_id uuid, p_nombre text, p_tipo text, p_importe numeric, p_fecha date,
  p_notas text, p_factura_url text, p_factura_nombre text,
  p_frecuencia text, p_repeticiones integer
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_usuario uuid := auth.uid();
  v_nombre text;
begin
  if v_usuario is null or not public.is_finanzas_admin() then
    raise exception 'No autorizado' using errcode = '42501';
  end if;
  if nullif(btrim(p_nombre), '') is null or nullif(btrim(p_tipo), '') is null then
    raise exception 'Completa el nombre y el tipo de gasto.' using errcode = '22023';
  end if;

  select a.nombre into v_nombre from finanazas_nize.admins a where a.user_id = v_usuario;

  insert into finanazas_nize.gastos_recurrencias (
    id, nombre, tipo, importe, fecha_inicio, frecuencia, repeticiones, notas,
    factura_url, factura_nombre, creado_por, creado_por_email, creado_por_nombre, proxima_fecha
  ) values (
    p_id, btrim(p_nombre), btrim(p_tipo), p_importe, p_fecha, p_frecuencia, p_repeticiones, p_notas,
    p_factura_url, p_factura_nombre, v_usuario, auth.email(), v_nombre, p_fecha
  ) on conflict (id) do nothing;

  if not exists (
    select 1 from finanazas_nize.gastos_recurrencias where id = p_id and creado_por = v_usuario
  ) then
    raise exception 'No autorizado' using errcode = '42501';
  end if;

  perform finanazas_nize.generar_gastos_vencidos((now() at time zone 'Europe/Madrid')::date, p_id);
end;
$$;

revoke all on function public.finanzas_programar_gasto(uuid, text, text, numeric, date, text, text, text, text, integer)
  from public, anon, authenticated, service_role;
grant execute on function public.finanzas_programar_gasto(uuid, text, text, numeric, date, text, text, text, text, integer)
  to authenticated;

select cron.schedule(
  'finanzas-gastos-recurrentes',
  '*/15 * * * *',
  $cron$select finanazas_nize.generar_gastos_vencidos((now() at time zone 'Europe/Madrid')::date)$cron$
);

commit;
