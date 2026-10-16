/**
 * Tipos del dominio. Reflejan las columnas de las tablas `motos` y `movimientos`
 * (ver supabase/migrations/20261015120000_esquema_inicial.sql). Si cambia la migración,
 * cambiar aquí también: no se generan tipos automáticamente desde Supabase en la v1.
 */

export type TipoMovimiento = 'pago' | 'gasto';

export type CategoriaGasto = 'mantenimiento' | 'repuestos' | 'combustible' | 'soat_impuestos' | 'otro';

export const CATEGORIAS_GASTO: { valor: CategoriaGasto; etiqueta: string }[] = [
  { valor: 'mantenimiento', etiqueta: 'Mantenimiento' },
  { valor: 'repuestos', etiqueta: 'Repuestos' },
  { valor: 'combustible', etiqueta: 'Combustible' },
  { valor: 'soat_impuestos', etiqueta: 'SOAT / impuestos' },
  { valor: 'otro', etiqueta: 'Otro' },
];

export function etiquetaCategoria(c: CategoriaGasto | null): string {
  return CATEGORIAS_GASTO.find((x) => x.valor === c)?.etiqueta ?? 'Gasto';
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
  categoria: CategoriaGasto | null;
  nota: string | null;
  created_at: string;
}

export type MovimientoNuevo = Omit<Movimiento, 'id' | 'created_at'>;
