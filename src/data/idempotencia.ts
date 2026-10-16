/**
 * Inserción idempotente: evita pagos duplicados cuando la red se cae justo al guardar.
 *
 * Con señal inestable, Safari puede reportar "Load failed" aunque Postgres ya guardó la fila.
 * Por eso el formulario genera el id del movimiento UNA vez (lib/ids.ts) y lo reusa en cada
 * reintento: si el id ya existe, Postgres responde 23505 (llave duplicada) y aquí se trata
 * como éxito devolviendo el registro existente.
 * Nota: solo sirve en tablas cuyo único UNIQUE es la llave primaria (caso de `movimientos`).
 */
export async function insertarIdempotente<T>(insertar: () => Promise<T>, obtenerExistente: () => Promise<T>): Promise<T> {
  try {
    return await insertar();
  } catch (e) {
    if (typeof e === 'object' && e !== null && (e as { code?: unknown }).code === '23505') return obtenerExistente();
    throw e;
  }
}
