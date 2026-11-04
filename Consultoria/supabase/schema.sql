-- ============================================================
-- Agenda Dentista — Schema + RLS
-- App interna de gestión de turnos (sin vista pública ni panel admin).
-- Ejecutar en Supabase Dashboard → SQL Editor → New query
-- ============================================================

-- Limpieza segura (re-ejecutable)
drop function if exists public.crear_turno(date, time, text, text, text, text, text, int);
drop function if exists public.crear_turno(date, time, uuid, text, text, int);
drop function if exists public.actualizar_turno(uuid, date, time, uuid, text, text, int);
drop function if exists public.get_ocupados(date);
drop function if exists public.get_mis_turnos(text);

create table if not exists public.business_hours (
  id bigint generated always as identity primary key,
  dia_semana int not null unique check (dia_semana between 0 and 6), -- 0=Dom .. 6=Sab
  abre time not null default '09:00',
  cierra time not null default '18:00',
  activo boolean not null default true
);

create table if not exists public.blocked_dates (
  id uuid primary key default gen_random_uuid(),
  fecha date not null unique,
  motivo text not null default 'Día no laborable',
  created_at timestamptz not null default now()
);

-- Clientes (datos atomizados: nombre y apellido separados)
create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  apellido text not null default '',
  telefono text not null default '',
  dni text not null default '',
  direccion text not null default '',
  obra_social text not null default '',
  notas text not null default '',
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (char_length(trim(nombre)) >= 2)
);

create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  fecha date not null,
  hora_inicio time not null,
  hora_fin time not null,
  cliente_nombre text not null,
  descripcion text not null default '',
  estado text not null default 'pendiente'
    check (estado in ('pendiente','completado','cancelado')),
  client_id uuid references public.clients(id) on delete set null,
  created_at timestamptz not null default now(),
  check (hora_fin > hora_inicio)
);

-- Migración para bases ya existentes
alter table public.appointments
  add column if not exists client_id uuid references public.clients(id) on delete set null;

-- Anti-doble-reserva: mismo día+hora no puede repetirse si está activo
create unique index if not exists appointments_no_dup
  on public.appointments (fecha, hora_inicio)
  where (estado in ('pendiente','completado'));

create index if not exists appointments_fecha_idx on public.appointments (fecha);
create index if not exists appointments_cliente_idx on public.appointments (cliente_nombre);
create index if not exists appointments_client_idx on public.appointments (client_id, fecha desc);

-- DNI único solo cuando se completa
create unique index if not exists clients_dni_unique
  on public.clients (dni) where dni <> '';

create index if not exists clients_nombre_idx
  on public.clients (lower(apellido), lower(nombre));

-- Horario base: Lun-Vie 09-18, Sáb 09-13, Dom cerrado
insert into public.business_hours (dia_semana, abre, cierra, activo) values
  (0, '09:00', '13:00', false),
  (1, '09:00', '18:00', true),
  (2, '09:00', '18:00', true),
  (3, '09:00', '18:00', true),
  (4, '09:00', '18:00', true),
  (5, '09:00', '18:00', true),
  (6, '09:00', '13:00', true)
on conflict (dia_semana) do update set
  abre = excluded.abre, cierra = excluded.cierra, activo = excluded.activo;

-- ============================================================
-- Backfill: crear clientes desde turnos viejos y vincularlos
-- ============================================================
do $$
declare
  r record;
  v_nombre text;
  v_apellido text;
  v_client_id uuid;
begin
  -- Solo migrar una vez: si ya hay clientes, no volver a crear desde turnos
  if exists (select 1 from public.clients) then
    return;
  end if;

  for r in
    select distinct trim(cliente_nombre) as nombre_completo
    from public.appointments
    where client_id is null and trim(cliente_nombre) <> ''
  loop
    v_nombre := split_part(r.nombre_completo, ' ', 1);
    v_apellido := trim(substr(r.nombre_completo, length(v_nombre) + 1));

    select c.id into v_client_id
    from public.clients c
    where lower(c.nombre) = lower(v_nombre)
      and lower(c.apellido) = lower(v_apellido)
    limit 1;

    if v_client_id is null then
      insert into public.clients (nombre, apellido)
      values (v_nombre, v_apellido)
      returning id into v_client_id;
    end if;

    update public.appointments
    set client_id = v_client_id
    where client_id is null
      and trim(cliente_nombre) = r.nombre_completo;
  end loop;
end $$;

-- ============================================================
-- RLS
-- ============================================================
alter table public.business_hours enable row level security;
alter table public.blocked_dates enable row level security;
alter table public.clients enable row level security;
alter table public.appointments enable row level security;

-- Lectura pública (horarios y días bloqueados)
drop policy if exists "hours_public_read" on public.business_hours;
create policy "hours_public_read" on public.business_hours
  for select to anon, authenticated using (true);

drop policy if exists "blocked_public_read" on public.blocked_dates;
create policy "blocked_public_read" on public.blocked_dates
  for select to anon, authenticated using (true);

-- Clientes: acceso directo para la app interna de gestión
drop policy if exists "clients_internal" on public.clients;
create policy "clients_internal" on public.clients
  for all to anon, authenticated using (true) with check (true);

-- Turnos: acceso directo para la app interna de gestión
drop policy if exists "appointments_internal" on public.appointments;
create policy "appointments_internal" on public.appointments
  for all to anon, authenticated using (true) with check (true);

-- ============================================================
-- RPCs (SECURITY DEFINER = corren con permisos del servidor)
-- ============================================================

-- Ocupados de un día (solo fecha+horas, sin datos personales)
create or replace function public.get_ocupados(p_fecha date)
returns table (hora_inicio time, hora_fin time)
language sql security definer set search_path = public as $$
  select a.hora_inicio, a.hora_fin
  from public.appointments a
  where a.fecha = p_fecha and a.estado in ('pendiente','completado');
$$;
grant execute on function public.get_ocupados(date) to anon, authenticated;

-- Crear turno con validaciones + anti-duplicado transaccional.
-- Si p_client_id viene, el nombre se toma del cliente registrado.
-- Si no, se usa p_nombre (paciente sin registrar).
create or replace function public.crear_turno(
  p_fecha date, p_hora time, p_client_id uuid, p_nombre text,
  p_descripcion text, p_duracion_min int default 30
)
returns public.appointments
language plpgsql security definer set search_path = public as $$
declare
  v_fin time;
  v_dow int;
  v_bh business_hours%rowtype;
  v_cliente clients%rowtype;
  v_nombre text;
  v_nuevo appointments%rowtype;
begin
  p_nombre := trim(coalesce(p_nombre, ''));
  p_descripcion := trim(coalesce(p_descripcion, ''));

  if p_client_id is not null then
    select * into v_cliente from public.clients where id = p_client_id;
    if not found then
      raise exception 'El cliente no existe.';
    end if;
    if coalesce(v_cliente.activo, false) = false then
      raise exception 'El cliente está archivado.';
    end if;
    v_nombre := trim(v_cliente.nombre || ' ' || v_cliente.apellido);
  else
    if p_nombre = '' or char_length(p_nombre) < 2 then
      raise exception 'Ingresá el nombre del cliente (mínimo 2 letras).';
    end if;
    v_nombre := p_nombre;
  end if;

  if p_duracion_min < 10 or p_duracion_min > 240 then
    raise exception 'Duración inválida.';
  end if;

  v_fin := (p_fecha + p_hora + make_interval(mins => p_duracion_min))::time;
  v_dow := extract(dow from p_fecha)::int;

  select * into v_bh from public.business_hours where dia_semana = v_dow;
  if not found or coalesce(v_bh.activo, false) = false then
    raise exception 'Ese día está cerrado.';
  end if;
  if v_fin > '24:00'::time then
    raise exception 'Horario fuera del horario laboral.';
  end if;
  if (p_fecha + p_hora) <= (now() at time zone 'America/Argentina/Buenos_Aires') then
    raise exception 'Ese horario ya pasó. Elegí otro.';
  end if;
  if exists (select 1 from public.blocked_dates where fecha = p_fecha) then
    raise exception 'Ese día no hay atención.';
  end if;
  -- Solape con turnos activos (soporta duraciones variables)
  if exists (
    select 1 from public.appointments a
    where a.fecha = p_fecha and a.estado in ('pendiente','completado')
      and tstzrange(
        (p_fecha + a.hora_inicio)::timestamptz,
        (p_fecha + a.hora_fin)::timestamptz, '[)'
      ) && tstzrange(
        (p_fecha + p_hora)::timestamptz,
        (p_fecha + v_fin)::timestamptz, '[)'
      )
  ) then
    raise exception 'Ese horario se acaba de ocupar. Elegí otro.';
  end if;

  insert into public.appointments
    (fecha, hora_inicio, hora_fin, cliente_nombre, descripcion, estado, client_id)
  values
    (p_fecha, p_hora, v_fin, v_nombre, p_descripcion, 'pendiente', p_client_id)
  returning * into v_nuevo;

  return v_nuevo;
exception when unique_violation then
  raise exception 'Ese horario se acaba de ocupar. Elegí otro.';
end;
$$;
grant execute on function public.crear_turno(date, time, uuid, text, text, int) to anon, authenticated;


-- Actualizar turno (misma validación que crear, excluyendo el propio turno).
-- No bloquea horarios pasados: permite corregir turnos históricos.
create or replace function public.actualizar_turno(
  p_id uuid, p_fecha date, p_hora time, p_client_id uuid, p_nombre text,
  p_descripcion text, p_duracion_min int default 30
)
returns public.appointments
language plpgsql security definer set search_path = public as $$
declare
  v_fin time;
  v_dow int;
  v_bh business_hours%rowtype;
  v_cliente clients%rowtype;
  v_nombre text;
  v_turno appointments%rowtype;
begin
  select * into v_turno from public.appointments where id = p_id;
  if not found then
    raise exception 'El turno no existe.';
  end if;

  p_nombre := trim(coalesce(p_nombre, ''));
  p_descripcion := trim(coalesce(p_descripcion, ''));

  if p_client_id is not null then
    select * into v_cliente from public.clients where id = p_client_id;
    if not found then
      raise exception 'El cliente no existe.';
    end if;
    if coalesce(v_cliente.activo, false) = false then
      raise exception 'El cliente está archivado.';
    end if;
    v_nombre := trim(v_cliente.nombre || ' ' || v_cliente.apellido);
  else
    if p_nombre = '' or char_length(p_nombre) < 2 then
      raise exception 'Ingresá el nombre del cliente (mínimo 2 letras).';
    end if;
    v_nombre := p_nombre;
  end if;

  if p_duracion_min < 10 or p_duracion_min > 240 then
    raise exception 'Duración inválida.';
  end if;

  v_fin := (p_fecha + p_hora + make_interval(mins => p_duracion_min))::time;
  v_dow := extract(dow from p_fecha)::int;

  select * into v_bh from public.business_hours where dia_semana = v_dow;
  if not found or coalesce(v_bh.activo, false) = false then
    raise exception 'Ese día está cerrado.';
  end if;
  if v_fin > '24:00'::time then
    raise exception 'Horario fuera del horario laboral.';
  end if;
  if exists (select 1 from public.blocked_dates where fecha = p_fecha) then
    raise exception 'Ese día no hay atención.';
  end if;
  if exists (
    select 1 from public.appointments a
    where a.id <> p_id
      and a.fecha = p_fecha and a.estado in ('pendiente','completado')
      and tstzrange(
        (p_fecha + a.hora_inicio)::timestamptz,
        (p_fecha + a.hora_fin)::timestamptz, '[)'
      ) && tstzrange(
        (p_fecha + p_hora)::timestamptz,
        (p_fecha + v_fin)::timestamptz, '[)'
      )
  ) then
    raise exception 'Ese horario se acaba de ocupar. Elegí otro.';
  end if;

  update public.appointments
  set fecha = p_fecha,
      hora_inicio = p_hora,
      hora_fin = v_fin,
      cliente_nombre = v_nombre,
      descripcion = p_descripcion,
      client_id = p_client_id
  where id = p_id
  returning * into v_turno;

  return v_turno;
exception when unique_violation then
  raise exception 'Ese horario se acaba de ocupar. Elegí otro.';
end;
$$;
grant execute on function public.actualizar_turno(uuid, date, time, uuid, text, text, int) to anon, authenticated;
