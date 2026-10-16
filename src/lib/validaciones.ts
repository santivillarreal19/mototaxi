/**
 * Validaciones de formularios. Cada validar* devuelve el mensaje de error para mostrar
 * junto al campo, o null si el valor es válido.
 *
 * Nota: las reglas de placa y teléfono coinciden con los CHECK de la migración
 * supabase/migrations/20261015120000_esquema_inicial.sql; si cambian, cambiar ambas.
 */
import { normalizarTelefono } from './whatsapp';

export const MONTO_MAXIMO = 50_000_000;

export function normalizarPlaca(texto: string): string {
  return texto.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

export function validarPlaca(placa: string): string | null {
  if (placa === '') return 'Escribe la placa';
  if (!/^(?=.*[A-Z])(?=.*\d)[A-Z0-9]{5,7}$/.test(placa)) {
    return 'Placa inválida: usa letras y números, ej. ABC12D';
  }
  return null;
}

export function validarMonto(n: number | null): string | null {
  if (n === null) return 'Escribe el monto';
  if (n <= 0) return 'El monto debe ser mayor a $0';
  if (n > MONTO_MAXIMO) return 'El monto parece demasiado alto, revísalo';
  return null;
}

export function validarFecha(iso: string, hoy: string): string | null {
  if (iso === '') return 'Elige la fecha';
  if (iso > hoy) return 'La fecha no puede ser futura';
  return null;
}

export function validarTelefono(texto: string): string | null {
  return normalizarTelefono(texto) ? null : 'Escribe un celular colombiano de 10 dígitos (ej. 300 123 4567)';
}

export function validarTexto(texto: string, queFalta: string): string | null {
  return texto.trim() === '' ? `Escribe ${queFalta}` : null;
}
