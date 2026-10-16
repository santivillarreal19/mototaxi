import { describe, expect, it } from 'vitest';
import { esPeriodo, formatearDiaCorto, formatearFecha, hoyISO, rangoPeriodo, sumarDias } from './fechas';

describe('hoyISO', () => {
  it('usa la hora de Colombia, no UTC', () => {
    // 2026-10-16 02:00 UTC = 2026-10-15 21:00 en Bogotá (UTC-5)
    expect(hoyISO(new Date('2026-10-16T02:00:00Z'))).toBe('2026-10-15');
  });
  it('cambia de día a la medianoche de Colombia', () => {
    expect(hoyISO(new Date('2026-10-16T05:00:00Z'))).toBe('2026-10-16');
  });
});

describe('formatearFecha', () => {
  it('muestra dd/mm/aaaa', () => {
    expect(formatearFecha('2026-03-07')).toBe('07/03/2026');
  });
});

describe('rangoPeriodo', () => {
  it('mes: del 1 al último día del mes de hoy', () => {
    expect(rangoPeriodo('mes', '2026-10-15')).toEqual({ desde: '2026-10-01', hasta: '2026-10-31' });
  });
  it('mes: respeta febrero de año bisiesto', () => {
    expect(rangoPeriodo('mes', '2028-02-10')).toEqual({ desde: '2028-02-01', hasta: '2028-02-29' });
  });
  it('mes anterior: cruza el cambio de año', () => {
    expect(rangoPeriodo('mes_anterior', '2026-01-20')).toEqual({ desde: '2025-12-01', hasta: '2025-12-31' });
  });
  it('todo: sin límites', () => {
    expect(rangoPeriodo('todo', '2026-10-15')).toEqual({ desde: null, hasta: null });
  });
});

describe('esPeriodo', () => {
  it('reconoce solo los períodos válidos', () => {
    expect(esPeriodo('mes')).toBe(true);
    expect(esPeriodo('todo')).toBe(true);
    expect(esPeriodo('semana')).toBe(false);
    expect(esPeriodo(null)).toBe(false);
  });
});

describe('sumarDias', () => {
  it('suma y resta días cruzando meses y años', () => {
    expect(sumarDias('2026-10-16', 14)).toBe('2026-10-30');
    expect(sumarDias('2026-10-25', 14)).toBe('2026-11-08');
    expect(sumarDias('2026-01-05', -14)).toBe('2025-12-22');
  });
});

describe('formatearDiaCorto', () => {
  it('muestra día de la semana y dd/mm', () => {
    expect(formatearDiaCorto('2026-10-19')).toBe('lun 19/10');
    expect(formatearDiaCorto('2026-10-21')).toBe('mié 21/10');
    expect(formatearDiaCorto('2026-10-25')).toBe('dom 25/10');
  });
});
