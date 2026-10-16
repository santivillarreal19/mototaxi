-- Esquema inicial de Mototaxi: motos y movimientos (pagos y gastos), protegidos con RLS.
-- Cada fila pertenece a un usuario (user_id) y solo él la ve o la modifica.
-- Las reglas de placa y teléfono coinciden con src/lib/validaciones.ts y src/lib/whatsapp.ts.

create table public.motos (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null default auth.uid() references auth.users (id) on delete cascade,
  placa              text not null check (placa ~ '^[A-Z0-9]{5,7}$'),
  alias              text,
  tarifa_diaria      integer not null check (tarifa_diaria > 0),
  encargado_nombre   text not null check (length(trim(encargado_nombre)) > 0),
  encargado_telefono text not null check (encargado_telefono ~ '^573[0-9]{9}$'),
  archivada          boolean not null default false,
  created_at         timestamptz not null default now(),
  unique (user_id, placa)
);

create table public.movimientos (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  moto_id    uuid not null references public.motos (id) on delete restrict,
  tipo       text not null check (tipo in ('pago', 'gasto')),
  fecha      date not null,
  monto      integer not null check (monto > 0),
  categoria  text check (categoria in ('mantenimiento', 'repuestos', 'combustible', 'soat_impuestos', 'otro')),
  nota       text,
  created_at timestamptz not null default now(),
  constraint categoria_segun_tipo check (
    (tipo = 'gasto' and categoria is not null) or (tipo = 'pago' and categoria is null)
  )
);

create index movimientos_moto_fecha_idx on public.movimientos (moto_id, fecha);

alter table public.motos enable row level security;
alter table public.movimientos enable row level security;

create policy motos_del_dueno on public.motos
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- Además del dueño, el movimiento debe apuntar a una moto del mismo dueño.
create policy movimientos_del_dueno on public.movimientos
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.motos m where m.id = moto_id and m.user_id = (select auth.uid()))
  );

-- Permisos explícitos: no depender de que el proyecto exponga solo las tablas nuevas a la API.
-- anon solo puede SELECT y, sin política para anon, RLS le devuelve [] (lo usa el keep-alive).
grant select, insert, update, delete on public.motos, public.movimientos to authenticated;
grant select on public.motos to anon;
