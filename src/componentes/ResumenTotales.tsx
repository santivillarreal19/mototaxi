/** Tarjeta con el neto destacado y, debajo, ingresos (verde) y gastos (rojo). */
import { formatearPesos } from '../lib/dinero';
import type { Totales } from '../lib/totales';

export function ResumenTotales({ titulo, totales }: { titulo: string; totales: Totales }) {
  return (
    <section className="tarjeta">
      <p className="etiqueta">{titulo}</p>
      <p className={`neto ${totales.neto < 0 ? 'gasto' : ''}`}>{formatearPesos(totales.neto)}</p>
      <div className="fila-totales">
        <div>
          <p className="etiqueta">Ingresos</p>
          <p className="monto ingreso">{formatearPesos(totales.ingresos)}</p>
        </div>
        <div>
          <p className="etiqueta">Gastos</p>
          <p className="monto gasto">{formatearPesos(totales.gastos)}</p>
        </div>
      </div>
    </section>
  );
}
