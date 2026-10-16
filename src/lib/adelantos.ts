/**
 * Pago que cubre varios días (pago adelantado o atrasado de varios días a la vez).
 *
 * Regla acordada con el cliente (2026-10-16): el monto pagado dividido por la tarifa diaria
 * dice cuántos días puede marcar (máximo 14). Al guardar se crea un pago por día marcado,
 * de una tarifa cada uno, y lo que sobre se suma al último día: el total registrado es
 * siempre lo que de verdad pagó. Un abono menor a la tarifa cubre un solo día.
 * Los días se eligen entre 14 días atrás y 14 días adelante (rangoDiasPago).
 *
 * Uso: FormPagoDias (calendario) y data/movimientos.crearPagoVariosDias.
 */
import { diaSemana, sumarDias } from './fechas';

export const DIAS_MAXIMOS = 14;

export function maxDiasCubiertos(monto: number | null, tarifa: number): number {
  if (monto === null || monto < tarifa) return 1;
  return Math.min(DIAS_MAXIMOS, Math.floor(monto / tarifa));
}

export function rangoDiasPago(hoy: string): { desde: string; hasta: string } {
  return { desde: sumarDias(hoy, -DIAS_MAXIMOS), hasta: sumarDias(hoy, DIAS_MAXIMOS) };
}

export function repartirPago(monto: number, tarifa: number, fechas: string[]): { fecha: string; monto: number }[] {
  const ordenadas = [...fechas].sort();
  if (ordenadas.length === 1) return [{ fecha: ordenadas[0], monto }];
  const sobrante = monto - tarifa * ordenadas.length;
  return ordenadas.map((fecha, i) => ({ fecha, monto: i === ordenadas.length - 1 ? tarifa + sobrante : tarifa }));
}

export function validarDiasPago(fechas: string[], maxDias: number): string | null {
  if (fechas.length === 0) return 'Marca el día que cubre el pago';
  if (fechas.length > maxDias) {
    const cubre = maxDias === 1 ? 'cubre 1 día' : `cubre máximo ${maxDias} días`;
    return `Este monto ${cubre}: desmarca ${fechas.length - maxDias}`;
  }
  return null;
}

export interface DiaCalendario {
  fecha: string;
  enRango: boolean;
}

/** Semanas completas de lunes a domingo que contienen el rango [desde, hasta]. */
export function semanasCalendario(desde: string, hasta: string): DiaCalendario[][] {
  const inicio = sumarDias(desde, -((diaSemana(desde) + 6) % 7));
  const fin = sumarDias(hasta, (7 - diaSemana(hasta)) % 7);
  const semanas: DiaCalendario[][] = [];
  for (let dia = inicio; dia <= fin; dia = sumarDias(dia, 1)) {
    if (diaSemana(dia) === 1) semanas.push([]);
    semanas[semanas.length - 1].push({ fecha: dia, enRango: dia >= desde && dia <= hasta });
  }
  return semanas;
}
