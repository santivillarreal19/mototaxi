/**
 * Consultas de la tabla `movimientos` (pagos y gastos).
 * listarMovimientos pagina para no perder filas por el tope de 1000 de PostgREST
 * (ver paginar.ts). El orden es fecha desc → created_at desc → id, estable para paginar.
 * Cada movimiento trae el nombre de su categoría (embed `categoria:categorias_gasto`).
 * Un pago de varios días se guarda como varias filas con el mismo grupo_id, en un solo
 * INSERT: o entran todas o ninguna (ver crearPagoVariosDias).
 */
import type { Movimiento, MovimientoNuevo } from '../lib/tipos';
import { insertarIdempotente } from './idempotencia';
import { paginar } from './paginar';
import { supabase } from './supabase';

const COLUMNAS = 'id, moto_id, tipo, fecha, monto, categoria_id, grupo_id, nota, created_at, categoria:categorias_gasto(nombre)';

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
    return data as unknown as Movimiento[];
  });
}

export async function obtenerMovimiento(id: string): Promise<Movimiento> {
  const { data, error } = await supabase.from('movimientos').select(COLUMNAS).eq('id', id).single();
  if (error) throw error;
  return data as unknown as Movimiento;
}

/** Todos los días de un pago de varios días, en orden de fecha. */
export async function listarGrupo(grupoId: string): Promise<Movimiento[]> {
  const { data, error } = await supabase.from('movimientos').select(COLUMNAS).eq('grupo_id', grupoId).order('fecha');
  if (error) throw error;
  return data as unknown as Movimiento[];
}

/**
 * `id` lo genera el formulario una sola vez (lib/ids.ts): si un reintento choca con un
 * guardado anterior que sí llegó, se devuelve ese en vez de duplicar el movimiento.
 */
export async function crearMovimiento(m: MovimientoNuevo, id: string): Promise<Movimiento> {
  return insertarIdempotente(
    async () => {
      const { data, error } = await supabase.from('movimientos').insert({ ...m, id }).select(COLUMNAS).single();
      if (error) throw error;
      return data as unknown as Movimiento;
    },
    () => obtenerMovimiento(id),
  );
}

/**
 * Pago que cubre varios días: una fila por día, todas con el mismo grupo_id, en un solo
 * INSERT (atómico). Los ids y el grupo_id los genera el formulario una vez, así un
 * reintento tras un corte de red devuelve el grupo ya guardado en vez de duplicarlo.
 */
export async function crearPagoVariosDias(
  base: { moto_id: string; nota: string | null },
  dias: { id: string; fecha: string; monto: number }[],
  grupoId: string,
): Promise<Movimiento[]> {
  const filas = dias.map((d) => ({ ...base, ...d, tipo: 'pago' as const, categoria_id: null, grupo_id: grupoId }));
  return insertarIdempotente(
    async () => {
      const { data, error } = await supabase.from('movimientos').insert(filas).select(COLUMNAS).order('fecha');
      if (error) throw error;
      return data as unknown as Movimiento[];
    },
    () => listarGrupo(grupoId),
  );
}

export async function actualizarMovimiento(id: string, cambios: Partial<MovimientoNuevo>): Promise<Movimiento> {
  const { data, error } = await supabase.from('movimientos').update(cambios).eq('id', id).select(COLUMNAS).single();
  if (error) throw error;
  return data as unknown as Movimiento;
}

export async function eliminarMovimiento(id: string): Promise<void> {
  const { error } = await supabase.from('movimientos').delete().eq('id', id);
  if (error) throw error;
}

/** Pagos y gastos registrados desde un momento (created_at), para el saldo actual de la Caja. */
export async function listarMovimientosRegistradosDesde(
  desde: string,
): Promise<Pick<Movimiento, 'tipo' | 'monto' | 'created_at'>[]> {
  return paginar(async (inicio, fin) => {
    const { data, error } = await supabase
      .from('movimientos')
      .select('id, tipo, monto, created_at')
      .gte('created_at', desde)
      .order('created_at')
      .order('id')
      .range(inicio, fin);
    if (error) throw error;
    return data as Pick<Movimiento, 'tipo' | 'monto' | 'created_at'>[];
  });
}
