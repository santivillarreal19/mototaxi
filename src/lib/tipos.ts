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
