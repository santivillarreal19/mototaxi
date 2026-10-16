/**
 * Ids generados en el cliente (UUID v4), usados para que guardar un movimiento sea
 * idempotente (ver data/idempotencia.ts).
 * Nota: crypto.randomUUID solo existe en contextos seguros (HTTPS o localhost); al probar
 * desde el iPhone por http en la red local no está, así que se arma con getRandomValues.
 */
interface FuenteAleatoria {
  getRandomValues(a: Uint8Array): Uint8Array;
  randomUUID?: () => string;
}

export function nuevoId(c: FuenteAleatoria = globalThis.crypto): string {
  if (typeof c.randomUUID === 'function') return c.randomUUID();
  const b = c.getRandomValues(new Uint8Array(16));
  b[6] = (b[6] & 0x0f) | 0x40; // versión 4
  b[8] = (b[8] & 0x3f) | 0x80; // variante RFC 4122
  const h = Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}
