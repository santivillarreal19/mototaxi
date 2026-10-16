/**
 * Reglas de la Caja: saldo actual y estado de los préstamos a encargados.
 *
 * Saldo actual (acordado con el cliente el 2026-10-16):
 *   saldos agregados − préstamos + abonos + (pagos − gastos REGISTRADOS desde el primer saldo)
 * Se compara contra created_at (cuándo se registró), no contra la fecha del movimiento: el
 * primer saldo es "lo que tenía ese día", así que lo registrado antes ya está incluido, y un
 * pago adelantado cuenta el día en que se recibió la plata aunque cubra días futuros.
 * Sin ningún saldo agregado no hay saldo actual (null): la tarjeta no se muestra.
 *
 * Uso: pantallas Inicio, Caja, DetallePrestamo y FormCaja.
 */
import { formatearPesos } from './dinero';
import type { EntradaCaja, Movimiento } from './tipos';
import { validarMonto } from './validaciones';

export function corteSaldo(caja: EntradaCaja[]): string | null {
  const saldos = caja.filter((e) => e.tipo === 'saldo').map((e) => e.created_at);
  return saldos.length === 0 ? null : saldos.reduce((min, c) => (c < min ? c : min));
}

export function saldoActual(caja: EntradaCaja[], movs: Pick<Movimiento, 'tipo' | 'monto' | 'created_at'>[]): number | null {
  const corte = corteSaldo(caja);
  if (corte === null) return null;
  const deCaja = caja.reduce((s, e) => s + (e.tipo === 'prestamo' ? -e.monto : e.monto), 0);
  const deMotos = movs
    .filter((m) => m.created_at >= corte)
    .reduce((s, m) => s + (m.tipo === 'pago' ? m.monto : -m.monto), 0);
  return deCaja + deMotos;
}

export interface EstadoPrestamo {
  prestamo: EntradaCaja;
  abonos: EntradaCaja[];
  abonado: number;
  pendiente: number;
}

/** Un estado por préstamo, con sus abonos en el orden en que vienen. */
export function estadoPrestamos(caja: EntradaCaja[]): EstadoPrestamo[] {
  return caja
    .filter((e) => e.tipo === 'prestamo')
    .map((prestamo) => {
      const abonos = caja.filter((e) => e.tipo === 'abono' && e.prestamo_id === prestamo.id);
      const abonado = abonos.reduce((s, a) => s + a.monto, 0);
      return { prestamo, abonos, abonado, pendiente: prestamo.monto - abonado };
    });
}

export function validarAbono(monto: number | null, pendiente: number): string | null {
  const error = validarMonto(monto);
  if (error) return error;
  return monto! > pendiente ? `El préstamo solo debe ${formatearPesos(pendiente)}` : null;
}

/** Al editar un préstamo: no puede quedar por debajo de lo ya abonado. */
export function validarMontoPrestamo(monto: number | null, abonado: number): string | null {
  const error = validarMonto(monto);
  if (error) return error;
  return monto! < abonado ? `Ya se abonaron ${formatearPesos(abonado)}: el préstamo no puede ser menor` : null;
}
