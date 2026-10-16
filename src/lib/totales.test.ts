import { describe, expect, it } from 'vitest';
import { etiquetaCategoria } from './tipos';
import { calcularTotales, TOTALES_VACIOS, totalesPorMoto } from './totales';

const movs = [
  { moto_id: 'a', tipo: 'pago' as const, monto: 35000 },
  { moto_id: 'a', tipo: 'pago' as const, monto: 35000 },
  { moto_id: 'a', tipo: 'gasto' as const, monto: 20000 },
  { moto_id: 'b', tipo: 'gasto' as const, monto: 10000 },
];

describe('calcularTotales', () => {
  it('suma pagos como ingresos, gastos aparte y neto = ingresos − gastos', () => {
    expect(calcularTotales(movs)).toEqual({ ingresos: 70000, gastos: 30000, neto: 40000 });
  });
  it('sin movimientos todo es cero', () => {
    expect(calcularTotales([])).toEqual(TOTALES_VACIOS);
  });
});

describe('totalesPorMoto', () => {
  it('agrupa por moto y permite neto negativo', () => {
    const r = totalesPorMoto(movs);
    expect(r.get('a')).toEqual({ ingresos: 70000, gastos: 20000, neto: 50000 });
    expect(r.get('b')).toEqual({ ingresos: 0, gastos: 10000, neto: -10000 });
    expect(r.get('c')).toBeUndefined();
  });
});

describe('etiquetaCategoria', () => {
  it('traduce la categoría o cae en "Gasto"', () => {
    expect(etiquetaCategoria('soat_impuestos')).toBe('SOAT / impuestos');
    expect(etiquetaCategoria(null)).toBe('Gasto');
  });
});
