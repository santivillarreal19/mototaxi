/**
 * Consultas de la tabla `movimientos` (pagos y gastos).
 * listarMovimientos pagina para no perder filas por el tope de 1000 de PostgREST
 * (ver paginar.ts). El orden es fecha desc → created_at desc → id, estable para paginar.
 */
import type { Movimiento, MovimientoNuevo } from '../lib/tipos';
import { insertarIdempotente } from './idempotencia';
import { paginar } from './paginar';
import { supabase } from './supabase';

const COLUMNAS = 'id, moto_id, tipo, fecha, monto, categoria, nota, created_at';

export async function listarMovimientos(f: {
  motoId?: string;
  desde: string | null;
  hasta: string | null;
}): Promise<Movimiento[]> {
  return paginar(async (inicio, fin) => {
    let consulta = supabase
      .from('movimientos')
      .select(COLUMNAS)
      .order('fecha', { ascending: false })
      .order('created_at', { ascending: false })
      .order('id');
    if (f.motoId) consulta = consulta.eq('moto_id', f.motoId);
    if (f.desde) consulta = consulta.gte('fecha', f.desde);
    if (f.hasta) consulta = consulta.lte('fecha', f.hasta);
    const { data, error } = await consulta.range(inicio, fin);
    if (error) throw error;
    return data as Movimiento[];
  });
}

export async function obtenerMovimiento(id: string): Promise<Movimiento> {
  const { data, error } = await supabase.from('movimientos').select(COLUMNAS).eq('id', id).single();
  if (error) throw error;
  return data as Movimiento;
}

/**
 * `id` lo genera el formulario una sola vez (lib/ids.ts): si un reintento choca con un
 * guardado anterior que sí llegó, se devuelve ese en vez de duplicar el pago.
 */
export async function crearMovimiento(m: MovimientoNuevo, id: string): Promise<Movimiento> {
  return insertarIdempotente(
    async () => {
      const { data, error } = await supabase.from('movimientos').insert({ ...m, id }).select(COLUMNAS).single();
      if (error) throw error;
      return data as Movimiento;
    },
    () => obtenerMovimiento(id),
  );
}

export async function actualizarMovimiento(id: string, cambios: Partial<MovimientoNuevo>): Promise<Movimiento> {
  const { data, error } = await supabase.from('movimientos').update(cambios).eq('id', id).select(COLUMNAS).single();
  if (error) throw error;
  return data as Movimiento;
}

export async function eliminarMovimiento(id: string): Promise<void> {
  const { error } = await supabase.from('movimientos').delete().eq('id', id);
  if (error) throw error;
}
