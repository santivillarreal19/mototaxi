-- Corrige la política RLS de `caja` (migración 20261016130000): su WITH CHECK consultaba la
-- propia tabla `caja` para validar el préstamo de un abono, y Postgres lo rechaza con
-- "infinite recursion detected in policy for relation caja" en TODO insert/update de caja.
-- Lo detectó tests/rls.integration.test.ts antes de publicar.
-- Arreglo: la verificación pasa a una función security definer, que lee `caja` sin volver
-- a evaluar la política (patrón recomendado por Supabase).

create function public.es_prestamo_propio(pid uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.caja p
    where p.id = pid and p.tipo = 'prestamo' and p.user_id = (select auth.uid())
  );
$$;
-- La política la evalúa el rol authenticated: necesita poder ejecutarla. Solo responde
-- sí/no sobre préstamos del propio usuario, así que exponerla no filtra nada.
revoke execute on function public.es_prestamo_propio(uuid) from public, anon;
grant execute on function public.es_prestamo_propio(uuid) to authenticated;

drop policy caja_del_dueno on public.caja;
create policy caja_del_dueno on public.caja
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (
    user_id = (select auth.uid())
    and (moto_id is null or exists (select 1 from public.motos m where m.id = moto_id and m.user_id = (select auth.uid())))
    and (prestamo_id is null or public.es_prestamo_propio(prestamo_id))
  );
