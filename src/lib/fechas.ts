/**
 * Fechas del negocio: "hoy" en Colombia, formato dd/mm/aaaa y rangos de período.
 *
 * - Las fechas viajan como texto ISO 'YYYY-MM-DD' (igual que la columna `date` de Postgres),
 *   así que se comparan como strings y no hay líos de zona horaria al guardarlas.
 * - hoyISO usa America/Bogota: a las 9 pm de Colombia ya es el día siguiente en UTC, y el
 *   pago debe quedar en el día local.
 */

export const ZONA_HORARIA = 'America/Bogota';

export type Periodo = 'mes' | 'mes_anterior' | 'todo';

export const PERIODOS: { valor: Periodo; etiqueta: string }[] = [
  { valor: 'mes', etiqueta: 'Este mes' },
  { valor: 'mes_anterior', etiqueta: 'Mes anterior' },
  { valor: 'todo', etiqueta: 'Todo' },
];

export function esPeriodo(v: unknown): v is Periodo {
  return PERIODOS.some((p) => p.valor === v);
}

const formatoDia = new Intl.DateTimeFormat('es-CO', {
  timeZone: ZONA_HORARIA,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

export function hoyISO(ahora: Date = new Date()): string {
  const partes = formatoDia.formatToParts(ahora);
  const valor = (tipo: Intl.DateTimeFormatPartTypes) => partes.find((p) => p.type === tipo)!.value;
  return `${valor('year')}-${valor('month')}-${valor('day')}`;
}

export function formatearFecha(iso: string): string {
  const [anio, mes, dia] = iso.split('-');
  return `${dia}/${mes}/${anio}`;
}

const dosDigitos = (n: number) => String(n).padStart(2, '0');

/** Último día del mes; `mes` va de 1 a 12. El día 0 del mes siguiente es el último de este. */
function ultimoDia(anio: number, mes: number): number {
  return new Date(Date.UTC(anio, mes, 0)).getUTCDate();
}

export function rangoPeriodo(periodo: Periodo, hoy: string): { desde: string | null; hasta: string | null } {
  if (periodo === 'todo') return { desde: null, hasta: null };
  let [anio, mes] = hoy.split('-').map(Number);
  if (periodo === 'mes_anterior') {
    mes -= 1;
    if (mes === 0) {
      mes = 12;
      anio -= 1;
    }
  }
  const prefijo = `${anio}-${dosDigitos(mes)}`;
  return { desde: `${prefijo}-01`, hasta: `${prefijo}-${dosDigitos(ultimoDia(anio, mes))}` };
}
