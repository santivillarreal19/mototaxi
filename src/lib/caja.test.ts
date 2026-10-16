import { describe, expect, it } from 'vitest';
import { corteSaldo, estadoPrestamos, saldoActual, validarAbono, validarMontoPrestamo } from './caja';
import type { EntradaCaja } from './tipos';

function entrada(p: Partial<EntradaCaja> & Pick<EntradaCaja, 'id' | 'tipo' | 'monto'>): EntradaCaja {
  return {
    fecha: '2026-10-16',
    moto_id: null,
    encargado_nombre: null,
    prestamo_id: null,
    nota: null,
    created_at: '2026-10-16T15:00:00Z',
    moto: null,
    ...p,
  };
}

const saldo = entrada({ id: 's1', tipo: 'saldo', monto: 628_000, created_at: '2026-10-16T15:00:00Z' });
const prestamo = entrada({ id: 'p1', tipo: 'prestamo', monto: 200_000, moto_id: 'm1', encargado_nombre: 'Juan' });
const abono1 = entrada({ id: 'a1', tipo: 'abono', monto: 50_000, prestamo_id: 'p1' });
const abono2 = entrada({ id: 'a2', tipo: 'abono', monto: 30_000, prestamo_id: 'p1' });

describe('corteSaldo', () => {
  it('es el momento en que se registró el primer saldo', () => {
    const otro = entrada({ id: 's0', tipo: 'saldo', monto: 1, created_at: '2026-10-15T10:00:00Z' });
    expect(corteSaldo([saldo, otro, prestamo])).toBe('2026-10-15T10:00:00Z');
  });
  it('sin saldo agregado no hay corte (no se muestra saldo actual)', () => {
    expect(corteSaldo([prestamo])).toBeNull();
  });
});

describe('saldoActual', () => {
  const movs = [
    { tipo: 'pago' as const, monto: 28_000, created_at: '2026-10-16T16:00:00Z' },
    { tipo: 'gasto' as const, monto: 10_000, created_at: '2026-10-16T17:00:00Z' },
    // registrado antes del saldo: ya está incluido en los 628.000
    { tipo: 'pago' as const, monto: 99_000, created_at: '2026-10-16T09:00:00Z' },
  ];
  it('saldos − préstamos + abonos + (pagos − gastos registrados desde el corte)', () => {
    expect(saldoActual([saldo, prestamo, abono1], movs)).toBe(628_000 - 200_000 + 50_000 + 28_000 - 10_000);
  });
  it('null si no hay saldo agregado', () => {
    expect(saldoActual([prestamo], movs)).toBeNull();
  });
});

describe('estadoPrestamos', () => {
  it('suma los abonos de cada préstamo y calcula lo pendiente', () => {
    const [e] = estadoPrestamos([abono1, saldo, prestamo, abono2]);
    expect(e.prestamo.id).toBe('p1');
    expect(e.abonos.map((a) => a.id)).toEqual(['a1', 'a2']);
    expect(e.abonado).toBe(80_000);
    expect(e.pendiente).toBe(120_000);
  });
  it('un préstamo sin abonos queda pendiente completo', () => {
    expect(estadoPrestamos([prestamo])[0].pendiente).toBe(200_000);
  });
});

describe('validarAbono', () => {
  it('no deja abonar más de lo pendiente', () => {
    expect(validarAbono(130_000, 120_000)).toBe('El préstamo solo debe $120.000');
    expect(validarAbono(120_000, 120_000)).toBeNull();
  });
  it('valida el monto como cualquier otro', () => {
    expect(validarAbono(null, 120_000)).toBe('Escribe el monto');
  });
});

describe('validarMontoPrestamo', () => {
  it('al editar, no puede quedar por debajo de lo ya abonado', () => {
    expect(validarMontoPrestamo(70_000, 80_000)).toBe('Ya se abonaron $80.000: el préstamo no puede ser menor');
    expect(validarMontoPrestamo(80_000, 80_000)).toBeNull();
  });
});
