/**
 * Mensaje de confirmación de pago por WhatsApp.
 *
 * - normalizarTelefono: limpia lo que se escriba ("+57 300-123 4567") y devuelve '57' + 10
 *   dígitos, solo para celulares colombianos (empiezan en 3). Los fijos se rechazan porque
 *   WhatsApp no llega ahí.
 * - mensajePago + enlaceWhatsApp: el texto acordado con el cliente (uno o varios días) y el enlace wa.me.
 * Nota: el enlace se abre desde un <a> que toca el usuario; iOS bloquea abrir otra app
 * por código.
 */
import { formatearPesos } from './dinero';
import { formatearDiaCorto, formatearFecha } from './fechas';

export function normalizarTelefono(texto: string): string | null {
  let digitos = texto.replace(/\D/g, '');
  if (digitos.length === 12 && digitos.startsWith('57')) digitos = digitos.slice(2);
  return /^3\d{9}$/.test(digitos) ? `57${digitos}` : null;
}

export function formatearTelefono(tel57: string): string {
  const n = tel57.slice(2);
  return `${n.slice(0, 3)} ${n.slice(3, 6)} ${n.slice(6)}`;
}

/** Un día: el texto original acordado. Varios días (pago adelantado): total y lista de días. */
export function mensajePago(d: { nombre: string; placa: string; fechas: string[]; monto: number }): string {
  const fechas = [...d.fechas].sort();
  if (fechas.length === 1) {
    return (
      `Hola ${d.nombre}, se registró tu pago de alquiler de la moto ${d.placa} ` +
      `del día ${formatearFecha(fechas[0])} por ${formatearPesos(d.monto)}. ¡Gracias!`
    );
  }
  const dias = fechas.map(formatearDiaCorto);
  const lista = `${dias.slice(0, -1).join(', ')} y ${dias[dias.length - 1]}`;
  return (
    `Hola ${d.nombre}, se registró tu pago de alquiler de la moto ${d.placa} ` +
    `por ${formatearPesos(d.monto)}, que cubre los días ${lista}. ¡Gracias!`
  );
}

export function enlaceWhatsApp(tel57: string, texto: string): string {
  return `https://wa.me/${tel57}?text=${encodeURIComponent(texto)}`;
}
