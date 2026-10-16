/**
 * Datos de la pantalla "Pago registrado" que llegan en el estado de la navegación.
 *
 * Al guardar un pago, el formulario pasa { movimiento, moto } al navegar, y la confirmación
 * los usa sin volver a consultar. Así, si la señal se cae justo después de guardar, el botón
 * de WhatsApp sigue apareciendo. Solo se consulta si no hay estado (p. ej. al recargar).
 */
import type { Moto, Movimiento } from './tipos';

export interface PagoConMoto {
  movimiento: Movimiento;
  moto: Moto;
}

export function pagoDesdeEstado(estado: unknown, id: string): PagoConMoto | null {
  const e = estado as Partial<PagoConMoto> | null;
  return e?.movimiento?.id === id && e.moto ? { movimiento: e.movimiento, moto: e.moto } : null;
}
