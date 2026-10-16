/**
 * Trae TODAS las filas de una consulta, página por página.
 *
 * PostgREST (Supabase) devuelve como máximo 1000 filas por consulta y no avisa cuando corta.
 * Con el período "Todo" una moto pasa de 1000 movimientos en unos 3 años y los totales
 * quedarían cortos. Uso: paginar((desde, hasta) => consulta.range(desde, hasta)).
 * La consulta debe tener un orden estable (incluir `id` como desempate).
 */
export async function paginar<T>(
  traerPagina: (desde: number, hasta: number) => Promise<T[]>,
  tamano = 1000,
): Promise<T[]> {
  const todo: T[] = [];
  for (let desde = 0; ; desde += tamano) {
    const pagina = await traerPagina(desde, desde + tamano - 1);
    todo.push(...pagina);
    if (pagina.length < tamano) return todo;
  }
}
