/**
 * Formato y lectura de montos en pesos colombianos (enteros, sin decimales).
 *
 * - formatearPesos(35000) → "$35.000"; formatearMiles(35000) → "35.000" (para inputs).
 * - parsearPesos acepta lo que el usuario escriba o pegue ("$ 35.000", "35.000,50")
 *   y devuelve el entero, o null si no hay dígitos.
 * Nota: el formato se arma a mano (no con Intl) para que sea idéntico en Safari, en Node
 * y en los tests; Intl es-CO inserta un espacio duro después del $.
 */

export function formatearMiles(n: number): string {
  return Math.abs(Math.trunc(n))
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

export function formatearPesos(n: number): string {
  return `${n < 0 ? '-' : ''}$${formatearMiles(n)}`;
}

export function parsearPesos(texto: string): number | null {
  // Una coma seguida de 1–2 dígitos al final son centavos: se descartan.
  const sinCentavos = texto.trim().replace(/,\d{1,2}$/, '');
  const digitos = sinCentavos.replace(/\D/g, '');
  return digitos === '' ? null : Number(digitos);
}
