/**
 * Prueba de integración de RLS contra el proyecto Supabase real.
 *
 * Verifica que un usuario (B) no puede ver, modificar ni usar los datos de otro (A),
 * incluidas sus categorías de gasto y su caja (requiere las migraciones 20261016120000 a
 * 20261016140000 aplicadas).
 * Se SALTA sola si faltan credenciales, por eso `npm test` y el CI no la necesitan.
 * Para correrla: crear `.env.test.local` (ignorado por git) con RLS_URL, RLS_ANON_KEY,
 * RLS_A_EMAIL, RLS_A_PASS, RLS_B_EMAIL y RLS_B_PASS (dos usuarios de prueba, NO el del
 * cliente) y ejecutar `npm run test:rls`. Crea una moto temporal de A y la borra al final.
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { existsSync } from 'node:fs';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

if (existsSync('.env.test.local')) process.loadEnvFile('.env.test.local');
const env = process.env;
const configurado = Boolean(
  env.RLS_URL && env.RLS_ANON_KEY && env.RLS_A_EMAIL && env.RLS_A_PASS && env.RLS_B_EMAIL && env.RLS_B_PASS,
);
const PLACA_PRUEBA = 'RLS01A';

function clienteAnonimo(): SupabaseClient {
  return createClient(env.RLS_URL!, env.RLS_ANON_KEY!, { auth: { persistSession: false } });
}

async function clienteDe(email: string, password: string): Promise<SupabaseClient> {
  const c = clienteAnonimo();
  const { error } = await c.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return c;
}

describe.skipIf(!configurado)('RLS: aislamiento entre usuarios', () => {
  let a: SupabaseClient;
  let b: SupabaseClient;
  let idUsuarioA: string;
  let motoA: string;

  beforeAll(async () => {
    a = await clienteDe(env.RLS_A_EMAIL!, env.RLS_A_PASS!);
    b = await clienteDe(env.RLS_B_EMAIL!, env.RLS_B_PASS!);
    idUsuarioA = (await a.auth.getUser()).data.user!.id;
    await a.from('motos').delete().eq('placa', PLACA_PRUEBA); // restos de una corrida anterior
    const { data, error } = await a
      .from('motos')
      .insert({ placa: PLACA_PRUEBA, tarifa_diaria: 1000, encargado_nombre: 'Prueba', encargado_telefono: '573001112233' })
      .select('id')
      .single();
    if (error) throw error;
    motoA = data.id;
  });

  afterAll(async () => {
    if (!motoA) return;
    await a.from('movimientos').delete().eq('moto_id', motoA);
    await a.from('motos').delete().eq('id', motoA);
  });

  it('B no ve la moto de A', async () => {
    const { data, error } = await b.from('motos').select('id').eq('id', motoA);
    expect(error).toBeNull();
    expect(data).toEqual([]);
  });

  it('B no puede modificar la moto de A', async () => {
    const { data } = await b.from('motos').update({ alias: 'hackeada' }).eq('id', motoA).select('id');
    expect(data).toEqual([]);
    const { data: real } = await a.from('motos').select('alias').eq('id', motoA).single();
    expect(real?.alias).toBeNull();
  });

  it('B no puede registrar movimientos en la moto de A', async () => {
    const { error } = await b
      .from('movimientos')
      .insert({ moto_id: motoA, tipo: 'pago', fecha: '2026-10-15', monto: 1000 });
    expect(error).not.toBeNull();
  });

  it('B no puede crear filas a nombre de A', async () => {
    const { error } = await b.from('motos').insert({
      user_id: idUsuarioA,
      placa: 'RLS02B',
      tarifa_diaria: 1000,
      encargado_nombre: 'X',
      encargado_telefono: '573001112233',
    });
    expect(error).not.toBeNull();
  });

  it('B no ve las categorías de gasto de A', async () => {
    const { data: deA } = await a.from('categorias_gasto').select('id').limit(1).single();
    expect(deA).not.toBeNull(); // la migración le sembró las 5 iniciales
    const { data } = await b.from('categorias_gasto').select('id').eq('id', deA!.id);
    expect(data).toEqual([]);
  });

  it('B no puede registrar un gasto con una categoría de A', async () => {
    const { data: categoriaA } = await a.from('categorias_gasto').select('id').limit(1).single();
    await b.from('motos').delete().eq('placa', 'RLS03B');
    const { data: motoB, error } = await b
      .from('motos')
      .insert({ placa: 'RLS03B', tarifa_diaria: 1000, encargado_nombre: 'Prueba', encargado_telefono: '573001112233' })
      .select('id')
      .single();
    if (error) throw error;
    try {
      const { error: errGasto } = await b
        .from('movimientos')
        .insert({ moto_id: motoB.id, tipo: 'gasto', fecha: '2026-10-15', monto: 1000, categoria_id: categoriaA!.id });
      expect(errGasto).not.toBeNull();
    } finally {
      await b.from('movimientos').delete().eq('moto_id', motoB.id);
      await b.from('motos').delete().eq('id', motoB.id);
    }
  });

  it('B no ve la caja de A ni puede prestar sobre la moto de A', async () => {
    const { data: saldoA, error } = await a
      .from('caja')
      .insert({ tipo: 'saldo', fecha: '2026-10-16', monto: 1000, nota: 'prueba RLS' })
      .select('id')
      .single();
    if (error) throw error;
    try {
      const { data } = await b.from('caja').select('id').eq('id', saldoA.id);
      expect(data).toEqual([]);
      const { error: errPrestamo } = await b
        .from('caja')
        .insert({ tipo: 'prestamo', fecha: '2026-10-16', monto: 1000, moto_id: motoA, encargado_nombre: 'X' });
      expect(errPrestamo).not.toBeNull();
    } finally {
      await a.from('caja').delete().eq('id', saldoA.id);
    }
  });

  it('A abona a su propio préstamo, pero B no puede abonar a un préstamo de A', async () => {
    const { data: prestamoA, error } = await a
      .from('caja')
      .insert({ tipo: 'prestamo', fecha: '2026-10-16', monto: 1000, moto_id: motoA, encargado_nombre: 'Prueba' })
      .select('id')
      .single();
    if (error) throw error;
    try {
      const { error: errA } = await a.from('caja').insert({ tipo: 'abono', fecha: '2026-10-16', monto: 500, prestamo_id: prestamoA.id });
      expect(errA).toBeNull();
      const { error: errB } = await b.from('caja').insert({ tipo: 'abono', fecha: '2026-10-16', monto: 500, prestamo_id: prestamoA.id });
      expect(errB).not.toBeNull();
    } finally {
      await a.from('caja').delete().eq('prestamo_id', prestamoA.id);
      await a.from('caja').delete().eq('id', prestamoA.id);
    }
  });

  it('sin sesión no se ve nada', async () => {
    const { data } = await clienteAnonimo().from('motos').select('id');
    expect(data ?? []).toEqual([]);
  });
});
