import { describe, expect, it } from 'vitest';
import {
  normalizarPlaca,
  validarFecha,
  validarMonto,
  validarPlaca,
  validarTelefono,
  validarTexto,
} from './validaciones';

describe('normalizarPlaca', () => {
  it('pasa a mayúsculas y quita espacios y guiones', () => {
    expect(normalizarPlaca(' abc-12d ')).toBe('ABC12D');
    expect(normalizarPlaca('abc 123')).toBe('ABC123');
  });
});

describe('validarPlaca', () => {
  it('acepta placas de moto y de carro', () => {
    expect(validarPlaca('ABC12D')).toBeNull();
    expect(validarPlaca('ABC123')).toBeNull();
  });
  it('pide la placa si está vacía', () => {
    expect(validarPlaca('')).toBe('Escribe la placa');
  });
  it('rechaza largos raros o placas sin letras o sin números', () => {
    const msg = 'Placa inválida: usa letras y números, ej. ABC12D';
    expect(validarPlaca('AB12')).toBe(msg);
    expect(validarPlaca('ABCDEFG')).toBe(msg);
    expect(validarPlaca('1234567')).toBe(msg);
  });
});

describe('validarMonto', () => {
  it('pide el monto si está vacío', () => {
    expect(validarMonto(null)).toBe('Escribe el monto');
  });
  it('rechaza cero', () => {
    expect(validarMonto(0)).toBe('El monto debe ser mayor a $0');
  });
  it('acepta montos normales', () => {
    expect(validarMonto(35000)).toBeNull();
  });
  it('frena montos absurdos (un cero de más)', () => {
    expect(validarMonto(50_000_001)).toBe('El monto parece demasiado alto, revísalo');
  });
});

describe('validarFecha', () => {
  it('pide la fecha si está vacía', () => {
    expect(validarFecha('', '2026-10-15')).toBe('Elige la fecha');
  });
  it('rechaza fechas futuras', () => {
    expect(validarFecha('2026-10-16', '2026-10-15')).toBe('La fecha no puede ser futura');
  });
  it('acepta hoy y días pasados', () => {
    expect(validarFecha('2026-10-15', '2026-10-15')).toBeNull();
    expect(validarFecha('2025-01-01', '2026-10-15')).toBeNull();
  });
});

describe('validarTelefono', () => {
  it('acepta un celular colombiano', () => {
    expect(validarTelefono('300 123 4567')).toBeNull();
  });
  it('explica el formato esperado si no sirve', () => {
    expect(validarTelefono('123')).toBe('Escribe un celular colombiano de 10 dígitos (ej. 300 123 4567)');
  });
});

describe('validarTexto', () => {
  it('pide el dato si está vacío o solo tiene espacios', () => {
    expect(validarTexto('  ', 'el nombre del encargado')).toBe('Escribe el nombre del encargado');
  });
  it('acepta texto con contenido', () => {
    expect(validarTexto('Juan', 'el nombre del encargado')).toBeNull();
  });
});
