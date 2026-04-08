-- ============================================================
-- IGLESIA STATS — Supabase Migration
-- Ejecutar en el SQL Editor de tu proyecto Supabase
-- ============================================================

-- 1. Campus
create table if not exists campus (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  city text not null,
  country text not null default 'Chile',
  active boolean default true,
  created_at timestamptz default now()
);

-- 2. Perfiles de usuario (extiende auth.users)
create table if not exists profiles (
  id uuid primary key references auth.users on delete cascade,
  email text not null,
  full_name text,
  role text not null default 'viewer' check (role in ('superadmin','admin_campus','voluntario','viewer')),
  campus_id uuid references campus(id),
  created_at timestamptz default now()
);

-- Trigger: crear perfil automáticamente al registrarse
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- 3. Encuentros
create table if not exists encuentros (
  id uuid primary key default gen_random_uuid(),
  campus_id uuid not null references campus(id),
  fecha date not null,
  nombre_encuentro text not null,
  modalidad text not null check (modalidad in ('Presencial','Online','Presencial+Online')),
  predicador text not null,
  nombre_mensaje text,

  -- Presencial
  acepto_jesus_presencial integer default 0,
  total_general integer default 0,
  asistencia_auditorio integer default 0,
  asistencia_kids integer default 0,
  asistencia_tweens integer default 0,
  asistencia_sala_bebe integer default 0,
  asistencia_sala_sensorial integer default 0,

  -- Voluntarios
  vol_servicio integer default 0,
  vol_tecnica integer default 0,
  vol_kids integer default 0,
  vol_tweens integer default 0,
  vol_worship integer default 0,
  vol_cocina integer default 0,
  vol_rrss integer default 0,
  vol_seguridad integer default 0,
  vol_sala_bebes integer default 0,
  vol_conexion integer default 0,
  vol_oracion integer default 0,
  vol_merch integer default 0,
  vol_amor_casa integer default 0,
  vol_sala_sensorial integer default 0,
  vol_punto_siembra integer default 0,

  -- Online
  acepto_jesus_online integer default 0,
  espectadores integer default 0,

  -- Líderes
  lideres_voluntarios text,
  adm_campus text,
  observaciones text,

  created_by uuid references auth.users,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 4. Row Level Security
alter table campus enable row level security;
alter table profiles enable row level security;
alter table encuentros enable row level security;

-- Campus: todos pueden leer
create policy "campus_select_all" on campus for select using (true);
create policy "campus_insert_superadmin" on campus for insert with check (
  exists (select 1 from profiles where id = auth.uid() and role = 'superadmin')
);

-- Profiles: cada usuario ve el suyo; superadmin ve todos
create policy "profiles_select_own" on profiles for select using (
  id = auth.uid() or
  exists (select 1 from profiles where id = auth.uid() and role = 'superadmin')
);
create policy "profiles_update_superadmin" on profiles for update using (
  exists (select 1 from profiles where id = auth.uid() and role = 'superadmin')
);

-- Encuentros: lectura según rol
create policy "encuentros_select" on encuentros for select using (
  exists (
    select 1 from profiles p where p.id = auth.uid() and (
      p.role in ('superadmin','viewer') or
      (p.role in ('admin_campus','voluntario') and p.campus_id = encuentros.campus_id)
    )
  )
);

-- Encuentros: insertar voluntarios y admin de su campus
create policy "encuentros_insert" on encuentros for insert with check (
  exists (
    select 1 from profiles p where p.id = auth.uid() and (
      p.role = 'superadmin' or
      (p.role in ('admin_campus','voluntario') and p.campus_id = campus_id)
    )
  )
);

-- Encuentros: editar solo superadmin y admin_campus de ese campus
create policy "encuentros_update" on encuentros for update using (
  exists (
    select 1 from profiles p where p.id = auth.uid() and (
      p.role = 'superadmin' or
      (p.role = 'admin_campus' and p.campus_id = encuentros.campus_id)
    )
  )
);

-- 5. Datos iniciales de campus
insert into campus (name, city, country) values
  ('Santiago Centro', 'Santiago', 'Chile'),
  ('Puente Alto', 'Puente Alto', 'Chile'),
  ('Punta Arenas', 'Punta Arenas', 'Chile'),
  ('Concepción', 'Concepción', 'Chile'),
  ('Montevideo', 'Montevideo', 'Uruguay'),
  ('Maracaibo', 'Maracaibo', 'Venezuela'),
  ('Miami', 'Miami', 'USA'),
  ('Katy', 'Katy', 'USA')
on conflict do nothing;

-- 6. Vista útil para estadísticas
create or replace view stats_por_campus as
select
  c.id as campus_id,
  c.name as campus,
  count(e.id) as total_eventos,
  coalesce(sum(e.asistencia_auditorio), 0) as total_asistencia,
  coalesce(sum(e.acepto_jesus_presencial + e.acepto_jesus_online), 0) as total_jesus,
  coalesce(avg(e.asistencia_auditorio) filter (where e.asistencia_auditorio > 0), 0) as avg_asistencia
from campus c
left join encuentros e on e.campus_id = c.id
group by c.id, c.name;
