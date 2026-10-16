-- Pedidos del cliente del 2026-10-16:
-- 1) Categorías de gasto propias de cada usuario (antes eran 5 fijas en un CHECK).
--    Cada usuario arranca con las 5 de siempre; los gastos existentes se pasan a la
--    categoría equivalente sin perder nada. Una categoría con gastos no se puede borrar
--    (FK on delete restrict): solo renombrar.
-- 2) Pago que cubre varios días: se guarda un movimiento por día, unidos por grupo_id
--    (para mostrar la confirmación y el WhatsApp de todo el pago junto).

-- ── Categorías ────────────────────────────────────────────────────────────────
create table public.categorias_gasto (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  nombre     text not null check (length(trim(nombre)) between 1 and 40),
  created_at timestamptz not null default now()
);

create unique index categorias_gasto_nombre_unico on public.categorias_gasto (user_id, lower(trim(nombre)));

alter table public.categorias_gasto enable row level security;

create policy categorias_del_dueno on public.categorias_gasto
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

grant select, insert, update, delete on public.categorias_gasto to authenticated;

-- Categorías iniciales de un usuario (las mismas 5 de la v1).
create function public.sembrar_categorias_gasto(uid uuid) returns void
language sql security definer set search_path = '' as $$
  insert into public.categorias_gasto (user_id, nombre)
  select uid, n from unnest(array['Mantenimiento', 'Repuestos', 'Combustible', 'SOAT / impuestos', 'Otro']) as n
  on conflict do nothing;
$$;
-- Solo la usan esta migración y el trigger: que no quede expuesta como RPC en la API.
revoke execute on function public.sembrar_categorias_gasto(uuid) from public, anon, authenticated;

select public.sembrar_categorias_gasto(id) from auth.users;

-- Usuarios creados después (desde el panel de Supabase) reciben las 5 categorías.
create function public.al_crear_usuario_sembrar_categorias() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  perform public.sembrar_categorias_gasto(new.id);
  return new;
end;
$$;
revoke execute on function public.al_crear_usuario_sembrar_categorias() from public, anon, authenticated;

create trigger sembrar_categorias_gasto
  after insert on auth.users
  for each row execute function public.al_crear_usuario_sembrar_categorias();

-- ── Movimientos: categoría por id y grupo de pago ─────────────────────────────
alter table public.movimientos
  add column categoria_id uuid references public.categorias_gasto (id) on delete restrict,
  add column grupo_id uuid;

update public.movimientos m
set categoria_id = c.id
from public.categorias_gasto c
where m.tipo = 'gasto'
  and c.user_id = m.user_id
  and c.nombre = case m.categoria
    when 'mantenimiento' then 'Mantenimiento'
    when 'repuestos' then 'Repuestos'
    when 'combustible' then 'Combustible'
    when 'soat_impuestos' then 'SOAT / impuestos'
    else 'Otro'
  end;

alter table public.movimientos drop constraint categoria_segun_tipo;
alter table public.movimientos drop column categoria;
alter table public.movimientos add constraint categoria_segun_tipo check (
  (tipo = 'gasto' and categoria_id is not null) or (tipo = 'pago' and categoria_id is null)
);

create index movimientos_grupo_idx on public.movimientos (grupo_id) where grupo_id is not null;
create index movimientos_categoria_idx on public.movimientos (categoria_id) where categoria_id is not null;

-- La categoría de un gasto también debe ser del mismo dueño.
drop policy movimientos_del_dueno on public.movimientos;
create policy movimientos_del_dueno on public.movimientos
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.motos m where m.id = moto_id and m.user_id = (select auth.uid()))
    and (
      categoria_id is null
      or exists (select 1 from public.categorias_gasto c where c.id = categoria_id and c.user_id = (select auth.uid()))
    )
  );
