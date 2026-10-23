/**
 * Validaciones de formularios. Cada validar* devuelve el mensaje de error para mostrar
 * junto al campo, o null si el valor es válido.
 *
 * Nota: las reglas de placa y teléfono coinciden con los CHECK de la migración
 * supabase/migrations/20261015120000_esquema_inicial.sql; si cambian, cambiar ambas.
 */
import { sumarDias } from './fechas';
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

/** `diasAdelante`: 0 para gastos (nada futuro); los pagos admiten hasta 14 días adelantados. */
export function validarFecha(iso: string, hoy: string, diasAdelante = 0): string | null {
  if (iso === '') return 'Elige la fecha';
  if (iso > sumarDias(hoy, diasAdelante)) {
    return diasAdelante === 0 ? 'La fecha no puede ser futura' : `Máximo ${diasAdelante} días por adelantado`;
  }
  return null;
}

export function validarTelefono(texto: string): string | null {
  return normalizarTelefono(texto) ? null : 'Escribe un celular colombiano de 10 dígitos (ej. 300 123 4567)';
}

export function validarTexto(texto: string, queFalta: string): string | null {
  return texto.trim() === '' ? `Escribe ${queFalta}` : null;
}

/** Mínimo de Supabase Auth (minimum_password_length en supabase/config.toml). */
export const CLAVE_MINIMA = 6;

export function validarClaveNueva(clave: string, confirmacion: string, actual: string): string | null {
  if (clave.length < CLAVE_MINIMA) return `La contraseña debe tener al menos ${CLAVE_MINIMA} caracteres`;
  if (clave === actual) return 'La contraseña nueva debe ser distinta a la actual';
  if (clave !== confirmacion) return 'Las contraseñas no coinciden';
  return null;
}
