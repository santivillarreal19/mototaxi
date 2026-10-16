import { describe, expect, it } from 'vitest';
import { pagoDesdeEstado } from './confirmacion';
import type { Moto, Movimiento } from './tipos';

const moto: Moto = {
  id: 'm1',
  placa: 'ABC12D',
  alias: null,
  tarifa_diaria: 35000,
  encargado_nombre: 'Juan',
  encargado_telefono: '573001234567',
  archivada: false,
  created_at: '2026-10-16T00:00:00Z',
};
const movimiento: Movimiento = {
  id: 'p1',
  moto_id: 'm1',
  tipo: 'pago',
  fecha: '2026-10-16',
  monto: 35000,
  categoria: null,
  nota: null,
  created_at: '2026-10-16T00:00:00Z',
};

describe('pagoDesdeEstado', () => {
  it('usa el pago recién guardado que viene en la navegación (sin volver a consultar)', () => {
    expect(pagoDesdeEstado({ movimiento, moto }, 'p1')).toEqual({ movimiento, moto });
  });
  it('ignora el estado si es de otro pago', () => {
    expect(pagoDesdeEstado({ movimiento, moto }, 'otro')).toBeNull();
  });
  it('ignora estado vacío o con otra forma (p. ej. al recargar la página)', () => {
    expect(pagoDesdeEstado(null, 'p1')).toBeNull();
    expect(pagoDesdeEstado({ desde: '/x' }, 'p1')).toBeNull();
  });
});
