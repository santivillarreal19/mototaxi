-- Caja (pedido del cliente del 2026-10-16): dinero que no sale de las motos.
--   saldo    → dinero agregado (ej. lo que ya tenía al empezar a usar la app)
--   prestamo → dinero prestado al encargado de una moto (se guarda su nombre de ese momento)
--   abono    → devolución (parcial o total) de un préstamo
-- El saldo actual se calcula en la app (src/lib/caja.ts); aquí solo se guardan las entradas.
-- Solo AGREGA una tabla: la versión publicada antes de esta migración sigue funcionando.

create table public.caja (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null default auth.uid() references auth.users (id) on delete cascade,
  tipo             text not null check (tipo in ('saldo', 'prestamo', 'abono')),
  fecha            date not null,
  monto            integer not null check (monto > 0),
  moto_id          uuid references public.motos (id) on delete restrict,
  encargado_nombre text,
  prestamo_id      uuid references public.caja (id) on delete restrict,
  nota             text,
  created_at       timestamptz not null default now(),
  constraint caja_campos_segun_tipo check (
    (tipo = 'saldo' and moto_id is null and encargado_nombre is null and prestamo_id is null)
    or (tipo = 'prestamo' and moto_id is not null and length(trim(encargado_nombre)) > 0 and prestamo_id is null)
    or (tipo = 'abono' and prestamo_id is not null and moto_id is null and encargado_nombre is null)
  )
);

create index caja_usuario_idx on public.caja (user_id, created_at);
create index caja_prestamo_idx on public.caja (prestamo_id) where prestamo_id is not null;
create index caja_moto_idx on public.caja (moto_id) where moto_id is not null;

alter table public.caja enable row level security;

-- Además del dueño: la moto del préstamo y el préstamo del abono deben ser del mismo dueño.
create policy caja_del_dueno on public.caja
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (
    user_id = (select auth.uid())
    and (moto_id is null or exists (select 1 from public.motos m where m.id = moto_id and m.user_id = (select auth.uid())))
    and (
      prestamo_id is null
      or exists (select 1 from public.caja p where p.id = prestamo_id and p.tipo = 'prestamo' and p.user_id = (select auth.uid()))
    )
  );

grant select, insert, update, delete on public.caja to authenticated;
