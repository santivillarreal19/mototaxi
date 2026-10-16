/**
 * Datos de la pantalla "Pago registrado" que llegan en el estado de la navegación.
 *
 * Al guardar un pago, el formulario pasa { movimientos, moto } al navegar (un movimiento por
 * día cubierto; ver lib/adelantos.ts) y la confirmación los usa sin volver a consultar. Así,
 * si la señal se cae justo después de guardar, el botón de WhatsApp sigue apareciendo.
 * La ruta lleva el id del primer día. Solo se consulta si no hay estado (p. ej. al recargar).
 */
import type { Moto, Movimiento } from './tipos';

export interface PagoConMoto {
  movimientos: Movimiento[];
  moto: Moto;
}

export function pagoDesdeEstado(estado: unknown, id: string): PagoConMoto | null {
  const e = estado as Partial<PagoConMoto> | null;
  const movimientos = Array.isArray(e?.movimientos) ? e.movimientos : [];
  return movimientos[0]?.id === id && e?.moto ? { movimientos, moto: e.moto } : null;
}
