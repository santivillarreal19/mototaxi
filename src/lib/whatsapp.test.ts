import { describe, expect, it } from 'vitest';
import { enlaceWhatsApp, formatearTelefono, mensajePago, normalizarTelefono } from './whatsapp';

describe('normalizarTelefono', () => {
  it('agrega el 57 a un celular de 10 dígitos', () => {
    expect(normalizarTelefono('3001234567')).toBe('573001234567');
  });
  it('acepta +57, espacios, guiones y paréntesis', () => {
    expect(normalizarTelefono('+57 300-123 4567')).toBe('573001234567');
    expect(normalizarTelefono('(300) 123 45 67')).toBe('573001234567');
    expect(normalizarTelefono('57 3001234567')).toBe('573001234567');
  });
  it('rechaza lo que no es un celular colombiano', () => {
    expect(normalizarTelefono('6012345678')).toBeNull(); // fijo de Bogotá
    expect(normalizarTelefono('300123456')).toBeNull(); // 9 dígitos
    expect(normalizarTelefono('15551234567')).toBeNull(); // EE. UU.
    expect(normalizarTelefono('')).toBeNull();
  });
});

describe('formatearTelefono', () => {
  it('muestra el celular sin el 57 y agrupado', () => {
    expect(formatearTelefono('573001234567')).toBe('300 123 4567');
  });
});

describe('mensajePago', () => {
  it('arma el texto exacto acordado', () => {
    expect(mensajePago({ nombre: 'Juan', placa: 'ABC12D', fecha: '2026-10-15', monto: 35000 })).toBe(
      'Hola Juan, se registró tu pago de alquiler de la moto ABC12D del día 15/10/2026 por $35.000. ¡Gracias!',
    );
  });
});

describe('enlaceWhatsApp', () => {
  it('arma el enlace wa.me con el texto codificado', () => {
    expect(enlaceWhatsApp('573001234567', 'Hola Juan')).toBe('https://wa.me/573001234567?text=Hola%20Juan');
  });
  it('codifica &, #, tildes y emojis sin romper la URL', () => {
    const texto = 'Pagó José & Cía #2 🏍️';
    const url = enlaceWhatsApp('573001234567', texto);
    expect(new URL(url).searchParams.get('text')).toBe(texto);
    expect(url).not.toContain('& ');
  });
});
