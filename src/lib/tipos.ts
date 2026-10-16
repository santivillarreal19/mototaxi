/**
 * Tipos del dominio. Reflejan las columnas de las tablas `motos`, `movimientos` y
 * `categorias_gasto` (ver supabase/migrations/). Si cambia una migración, cambiar aquí
 * también: no se generan tipos automáticamente desde Supabase.
 */

export type TipoMovimiento = 'pago' | 'gasto';

/** Categoría de gasto: cada usuario crea las suyas (desde 2026-10-16; antes eran 5 fijas). */
export interface CategoriaGasto {
  id: string;
  nombre: string;
}

export interface Moto {
  id: string;
  placa: string;
  alias: string | null;
  tarifa_diaria: number;
  encargado_nombre: string;
  encargado_telefono: string;
  archivada: boolean;
  created_at: string;
}

export type MotoNueva = Omit<Moto, 'id' | 'archivada' | 'created_at'>;

export interface Movimiento {
  id: string;
  moto_id: string;
  tipo: TipoMovimiento;
  fecha: string;
  monto: number;
  categoria_id: string | null;
  /** Días de un mismo pago (uno o varios). Null en gastos y en pagos anteriores al 2026-10-16. */
  grupo_id: string | null;
  nota: string | null;
  created_at: string;
  /** Nombre de la categoría, traído junto con el movimiento (embed de PostgREST). */
  categoria: { nombre: string } | null;
}

export type MovimientoNuevo = Omit<Movimiento, 'id' | 'created_at' | 'categoria'>;

export function etiquetaCategoria(m: Pick<Movimiento, 'categoria'>): string {
  return m.categoria?.nombre ?? 'Gasto';
}

/**
 * Caja (tabla `caja`): dinero que no sale de las motos. 'saldo' = dinero agregado,
 * 'prestamo' = prestado al encargado de una moto, 'abono' = devolución de un préstamo.
 */
export type TipoCaja = 'saldo' | 'prestamo' | 'abono';

export interface EntradaCaja {
  id: string;
  tipo: TipoCaja;
  fecha: string;
  monto: number;
  /** Solo en préstamos. */
  moto_id: string | null;
  /** Solo en préstamos: nombre del encargado al momento de prestar. */
  encargado_nombre: string | null;
  /** Solo en abonos: el préstamo que se está devolviendo. */
  prestamo_id: string | null;
  nota: string | null;
  created_at: string;
  /** Placa de la moto del préstamo, traída junto con la entrada (embed de PostgREST). */
  moto: { placa: string } | null;
}

export type EntradaCajaNueva = Omit<EntradaCaja, 'id' | 'created_at' | 'moto'>;
