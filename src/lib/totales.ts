/**
 * Totales de dinero: ingresos (pagos), gastos y neto (ingresos − gastos).
 *
 * Los totales nunca se guardan en la base: se calculan siempre a partir de los movimientos
 * consultados, así no se desincronizan. El llamador debe pasar TODOS los movimientos del
 * período (ver data/paginar.ts: PostgREST corta en 1000 filas).
 */
import type { Movimiento } from './tipos';

export interface Totales {
  ingresos: number;
  gastos: number;
  neto: number;
}

export const TOTALES_VACIOS: Totales = { ingresos: 0, gastos: 0, neto: 0 };

function sumar(t: Totales, m: Pick<Movimiento, 'tipo' | 'monto'>): Totales {
  const ingresos = t.ingresos + (m.tipo === 'pago' ? m.monto : 0);
  const gastos = t.gastos + (m.tipo === 'gasto' ? m.monto : 0);
  return { ingresos, gastos, neto: ingresos - gastos };
}

export function calcularTotales(movs: Pick<Movimiento, 'tipo' | 'monto'>[]): Totales {
  return movs.reduce(sumar, TOTALES_VACIOS);
}

export function totalesPorMoto(movs: Pick<Movimiento, 'moto_id' | 'tipo' | 'monto'>[]): Map<string, Totales> {
  const porMoto = new Map<string, Totales>();
  for (const m of movs) porMoto.set(m.moto_id, sumar(porMoto.get(m.moto_id) ?? TOTALES_VACIOS, m));
  return porMoto;
}
