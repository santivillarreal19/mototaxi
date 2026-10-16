import { describe, expect, it } from 'vitest';
import { maxDiasCubiertos, rangoDiasPago, repartirPago, semanasCalendario, validarDiasPago } from './adelantos';

describe('maxDiasCubiertos', () => {
  it('cuántas tarifas completas cubre el monto', () => {
    expect(maxDiasCubiertos(84_000, 28_000)).toBe(3);
    expect(maxDiasCubiertos(90_000, 28_000)).toBe(3);
  });
  it('un abono menor a la tarifa cubre un solo día', () => {
    expect(maxDiasCubiertos(10_000, 28_000)).toBe(1);
    expect(maxDiasCubiertos(null, 28_000)).toBe(1);
  });
  it('nunca más de 14 días', () => {
    expect(maxDiasCubiertos(1_000_000, 28_000)).toBe(14);
  });
});

describe('rangoDiasPago', () => {
  it('de 14 días atrás a 14 días adelante', () => {
    expect(rangoDiasPago('2026-10-16')).toEqual({ desde: '2026-10-02', hasta: '2026-10-30' });
  });
});

describe('repartirPago', () => {
  it('una tarifa por día, en orden de fecha', () => {
    expect(repartirPago(84_000, 28_000, ['2026-10-24', '2026-10-20', '2026-10-22'])).toEqual([
      { fecha: '2026-10-20', monto: 28_000 },
      { fecha: '2026-10-22', monto: 28_000 },
      { fecha: '2026-10-24', monto: 28_000 },
    ]);
  });
  it('el sobrante se suma al último día', () => {
    expect(repartirPago(90_000, 28_000, ['2026-10-20', '2026-10-22', '2026-10-24']).map((p) => p.monto)).toEqual([
      28_000, 28_000, 34_000,
    ]);
  });
  it('un solo día se lleva todo el monto, aunque sea un abono', () => {
    expect(repartirPago(10_000, 28_000, ['2026-10-20'])).toEqual([{ fecha: '2026-10-20', monto: 10_000 }]);
  });
  it('el total repartido es siempre el monto pagado', () => {
    const partes = repartirPago(100_000, 28_000, ['2026-10-20', '2026-10-21']);
    expect(partes.reduce((s, p) => s + p.monto, 0)).toBe(100_000);
  });
});

describe('validarDiasPago', () => {
  it('pide al menos un día', () => {
    expect(validarDiasPago([], 3)).toBe('Marca el día que cubre el pago');
  });
  it('no deja pasar más días de los que cubre el monto', () => {
    expect(validarDiasPago(['a', 'b', 'c', 'd'], 3)).toBe('Este monto cubre máximo 3 días: desmarca 1');
    expect(validarDiasPago(['a', 'b'], 1)).toBe('Este monto cubre 1 día: desmarca 1');
  });
  it('acepta hasta el máximo', () => {
    expect(validarDiasPago(['a', 'b', 'c'], 3)).toBeNull();
  });
});

describe('semanasCalendario', () => {
  it('arma semanas de lunes a domingo y marca qué días están en el rango', () => {
    // 2026-10-02 es viernes; 2026-10-30 es viernes.
    const semanas = semanasCalendario('2026-10-02', '2026-10-30');
    expect(semanas).toHaveLength(5);
    expect(semanas[0][0]).toEqual({ fecha: '2026-09-28', enRango: false });
    expect(semanas[0][4]).toEqual({ fecha: '2026-10-02', enRango: true });
    expect(semanas[4][6]).toEqual({ fecha: '2026-11-01', enRango: false });
    expect(semanas.every((s) => s.length === 7)).toBe(true);
  });
});
