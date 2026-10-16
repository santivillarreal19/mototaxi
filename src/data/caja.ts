/**
 * Consultas de la tabla `caja` (saldos agregados, préstamos y abonos).
 * RLS filtra por dueño y la base pone user_id, igual que en motos. Cada entrada trae la
 * placa de su moto (embed `moto:motos`). La caja de un usuario es pequeña, así que se trae
 * completa y los cálculos se hacen en lib/caja.ts.
 * - Borrar un préstamo con abonos → error 23503 ('en_uso'): primero se borran sus abonos.
 * - Crear es idempotente con id del cliente, como los movimientos (data/idempotencia.ts).
 */
import { corteSaldo, saldoActual } from '../lib/caja';
import type { EntradaCaja, EntradaCajaNueva } from '../lib/tipos';
import { insertarIdempotente } from './idempotencia';
import { listarMovimientosRegistradosDesde } from './movimientos';
import { paginar } from './paginar';
import { supabase } from './supabase';

const COLUMNAS = 'id, tipo, fecha, monto, moto_id, encargado_nombre, prestamo_id, nota, created_at, moto:motos(placa)';

/** Toda la caja, lo más reciente primero. */
export async function listarCaja(): Promise<EntradaCaja[]> {
  return paginar(async (inicio, fin) => {
    const { data, error } = await supabase
      .from('caja')
      .select(COLUMNAS)
      .order('fecha', { ascending: false })
      .order('created_at', { ascending: false })
      .order('id')
      .range(inicio, fin);
    if (error) throw error;
    return data as unknown as EntradaCaja[];
  });
}

export async function obtenerEntradaCaja(id: string): Promise<EntradaCaja> {
  const { data, error } = await supabase.from('caja').select(COLUMNAS).eq('id', id).single();
  if (error) throw error;
  return data as unknown as EntradaCaja;
}

export async function crearEntradaCaja(e: EntradaCajaNueva, id: string): Promise<EntradaCaja> {
  return insertarIdempotente(
    async () => {
      const { data, error } = await supabase.from('caja').insert({ ...e, id }).select(COLUMNAS).single();
      if (error) throw error;
      return data as unknown as EntradaCaja;
    },
    () => obtenerEntradaCaja(id),
  );
}

export async function actualizarEntradaCaja(id: string, cambios: Partial<EntradaCajaNueva>): Promise<EntradaCaja> {
  const { data, error } = await supabase.from('caja').update(cambios).eq('id', id).select(COLUMNAS).single();
  if (error) throw error;
  return data as unknown as EntradaCaja;
}

export async function eliminarEntradaCaja(id: string): Promise<void> {
  const { error } = await supabase.from('caja').delete().eq('id', id);
  if (error) throw error;
}

/** Caja completa + saldo actual (null si no hay saldo agregado). Ver lib/caja.ts. */
export async function cargarCajaConSaldo(): Promise<{ caja: EntradaCaja[]; saldo: number | null; corte: string | null }> {
  const caja = await listarCaja();
  const corte = corteSaldo(caja);
  const movs = corte ? await listarMovimientosRegistradosDesde(corte) : [];
  return { caja, saldo: saldoActual(caja, movs), corte };
}
