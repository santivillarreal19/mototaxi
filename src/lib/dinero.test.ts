import { describe, expect, it } from 'vitest';
import { formatearMiles, formatearPesos, parsearPesos } from './dinero';

describe('formatearMiles', () => {
  it('separa miles con punto', () => {
    expect(formatearMiles(35000)).toBe('35.000');
    expect(formatearMiles(1234567)).toBe('1.234.567');
    expect(formatearMiles(999)).toBe('999');
  });
});

describe('formatearPesos', () => {
  it('usa punto de miles y signo $', () => {
    expect(formatearPesos(35000)).toBe('$35.000');
    expect(formatearPesos(1234567)).toBe('$1.234.567');
  });
  it('formatea cero y montos pequeños', () => {
    expect(formatearPesos(0)).toBe('$0');
    expect(formatearPesos(500)).toBe('$500');
  });
  it('pone el signo menos antes del $', () => {
    expect(formatearPesos(-5000)).toBe('-$5.000');
  });
});

describe('parsearPesos', () => {
  it('lee dígitos simples', () => {
    expect(parsearPesos('35000')).toBe(35000);
  });
  it('ignora puntos de miles, $ y espacios', () => {
    expect(parsearPesos(' $ 35.000 ')).toBe(35000);
    expect(parsearPesos('1.234.567')).toBe(1234567);
  });
  it('descarta los centavos escritos con coma decimal', () => {
    expect(parsearPesos('35.000,50')).toBe(35000);
    expect(parsearPesos('35000,5')).toBe(35000);
  });
  it('trata una coma seguida de tres dígitos como separador de miles', () => {
    expect(parsearPesos('35,000')).toBe(35000);
  });
  it('devuelve null si no hay dígitos', () => {
    expect(parsearPesos('')).toBeNull();
    expect(parsearPesos('abc')).toBeNull();
    expect(parsearPesos('$')).toBeNull();
  });
});
