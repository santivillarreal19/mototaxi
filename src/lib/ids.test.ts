import { describe, expect, it } from 'vitest';
import { nuevoId } from './ids';

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

describe('nuevoId', () => {
  it('genera UUID v4 distintos', () => {
    const a = nuevoId();
    expect(a).toMatch(UUID_V4);
    expect(nuevoId()).not.toBe(a);
  });
  it('funciona sin crypto.randomUUID (Safari en http por la red local)', () => {
    const soloAleatorio = { getRandomValues: (a: Uint8Array) => globalThis.crypto.getRandomValues(a) };
    expect(nuevoId(soloAleatorio)).toMatch(UUID_V4);
  });
});
