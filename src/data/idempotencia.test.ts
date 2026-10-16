import { describe, expect, it } from 'vitest';
import { insertarIdempotente } from './idempotencia';

describe('insertarIdempotente', () => {
  it('devuelve lo insertado cuando el insert funciona', async () => {
    const r = await insertarIdempotente(async () => 'nuevo', async () => 'existente');
    expect(r).toBe('nuevo');
  });
  it('si el id ya existe (reintento de un guardado que sí llegó), devuelve el registro existente', async () => {
    const r = await insertarIdempotente(
      async () => {
        throw { code: '23505', message: 'duplicate key value violates unique constraint "movimientos_pkey"' };
      },
      async () => 'existente',
    );
    expect(r).toBe('existente');
  });
  it('propaga cualquier otro error', async () => {
    await expect(
      insertarIdempotente(
        async () => {
          throw new TypeError('Load failed');
        },
        async () => 'existente',
      ),
    ).rejects.toThrow('Load failed');
  });
});
