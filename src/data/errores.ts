/**
 * Traduce cualquier error (red, Postgres, PostgREST, Auth) a un ErrorApp con un mensaje
 * entendible para el cliente y un `tipo` con el que la UI decide qué hacer
 * (p. ej. 'sesion' → cerrar sesión y volver al login; 'duplicado' → marcar el campo).
 *
 * Nota: Safari reporta la falta de red como "Load failed" y Chrome como "Failed to fetch".
 * supabase-js a veces devuelve objetos planos {code, message}, no instancias de Error.
 */

export type TipoError = 'sin_conexion' | 'duplicado' | 'sesion' | 'credenciales' | 'no_encontrado' | 'desconocido';

const MENSAJES: Record<TipoError, string> = {
  // Al guardar sin red no se puede saber si el servidor alcanzó a recibirlo; reintentar es
  // seguro porque los movimientos se crean con id del cliente (ver data/idempotencia.ts).
  sin_conexion: 'No hay conexión a internet. Revisa la señal y toca Guardar de nuevo.',
  duplicado: 'Ya existe un registro igual.',
  sesion: 'Tu sesión venció. Vuelve a iniciar sesión.',
  credenciales: 'Correo o contraseña incorrectos.',
  no_encontrado: 'No se encontró el registro.',
  desconocido: 'Algo salió mal. Intenta de nuevo.',
};

export class ErrorApp extends Error {
  readonly tipo: TipoError;

  constructor(tipo: TipoError, mensaje: string = MENSAJES[tipo]) {
    super(mensaje);
    this.name = 'ErrorApp';
    this.tipo = tipo;
  }
}

function navegadorEnLinea(): boolean {
  return typeof navigator === 'undefined' ? true : navigator.onLine;
}

const SIN_CONEXION_AL_LEER = 'No hay conexión a internet. No se pudieron cargar los datos.';

/** `operacion` cambia el texto de "sin conexión": al leer no tiene sentido decir "Guardar". */
export function aErrorApp(
  e: unknown,
  enLinea: boolean = navegadorEnLinea(),
  operacion: 'leer' | 'guardar' = 'guardar',
): ErrorApp {
  if (e instanceof ErrorApp) return e;
  const obj = (typeof e === 'object' && e !== null ? e : {}) as { code?: unknown; message?: unknown };
  const codigo = String(obj.code ?? '');
  const texto = String(obj.message ?? '');

  let tipo: TipoError = 'desconocido';
  if (!enLinea || /failed to fetch|load failed|network/i.test(texto)) tipo = 'sin_conexion';
  else if (codigo === '23505') tipo = 'duplicado';
  else if (codigo === 'PGRST301' || /jwt/i.test(texto)) tipo = 'sesion';
  else if (codigo === 'invalid_credentials' || /invalid login credentials/i.test(texto)) tipo = 'credenciales';
  else if (codigo === 'PGRST116') tipo = 'no_encontrado';

  if (tipo === 'desconocido') console.error(e);
  if (tipo === 'sin_conexion' && operacion === 'leer') return new ErrorApp(tipo, SIN_CONEXION_AL_LEER);
  return new ErrorApp(tipo);
}
