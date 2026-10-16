/**
 * Mensaje de confirmación de pago por WhatsApp.
 *
 * - normalizarTelefono: limpia lo que se escriba ("+57 300-123 4567") y devuelve '57' + 10
 *   dígitos, solo para celulares colombianos (empiezan en 3). Los fijos se rechazan porque
 *   WhatsApp no llega ahí.
 * - mensajePago + enlaceWhatsApp: el texto acordado con el cliente y el enlace wa.me.
 * Nota: el enlace se abre desde un <a> que toca el usuario; iOS bloquea abrir otra app
 * por código.
 */
import { formatearPesos } from './dinero';
import { formatearFecha } from './fechas';

export function normalizarTelefono(texto: string): string | null {
  let digitos = texto.replace(/\D/g, '');
  if (digitos.length === 12 && digitos.startsWith('57')) digitos = digitos.slice(2);
  return /^3\d{9}$/.test(digitos) ? `57${digitos}` : null;
}

export function formatearTelefono(tel57: string): string {
  const n = tel57.slice(2);
  return `${n.slice(0, 3)} ${n.slice(3, 6)} ${n.slice(6)}`;
}

export function mensajePago(d: { nombre: string; placa: string; fecha: string; monto: number }): string {
  return (
    `Hola ${d.nombre}, se registró tu pago de alquiler de la moto ${d.placa} ` +
    `del día ${formatearFecha(d.fecha)} por ${formatearPesos(d.monto)}. ¡Gracias!`
  );
}

export function enlaceWhatsApp(tel57: string, texto: string): string {
  return `https://wa.me/${tel57}?text=${encodeURIComponent(texto)}`;
}
