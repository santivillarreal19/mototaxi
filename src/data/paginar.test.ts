import { describe, expect, it } from 'vitest';
import { paginar } from './paginar';

function fuente(total: number) {
  const datos = Array.from({ length: total }, (_, i) => i);
  const llamadas: [number, number][] = [];
  const traer = async (desde: number, hasta: number) => {
    llamadas.push([desde, hasta]);
    return datos.slice(desde, hasta + 1);
  };
  return { traer, llamadas };
}

describe('paginar', () => {
  it('junta todas las filas cuando hay más de una página', async () => {
    const { traer, llamadas } = fuente(2500);
    const r = await paginar(traer, 1000);
    expect(r).toHaveLength(2500);
    expect(r[2499]).toBe(2499);
    expect(llamadas).toEqual([[0, 999], [1000, 1999], [2000, 2999]]);
  });
  it('hace una sola llamada si todo cabe en una página', async () => {
    const { traer, llamadas } = fuente(10);
    expect(await paginar(traer, 1000)).toHaveLength(10);
    expect(llamadas).toHaveLength(1);
  });
  it('si el total es múltiplo exacto, pide una página más para confirmar el final', async () => {
    const { traer, llamadas } = fuente(2000);
    expect(await paginar(traer, 1000)).toHaveLength(2000);
    expect(llamadas).toHaveLength(3);
  });
  it('propaga el error de cualquier página', async () => {
    await expect(paginar(async () => { throw new Error('caída'); })).rejects.toThrow('caída');
  });
});
