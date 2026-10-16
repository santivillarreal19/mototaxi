/** Control segmentado estilo iOS para elegir el período de los totales. */
import { PERIODOS, type Periodo } from '../lib/fechas';

export function SelectorPeriodo({ valor, onCambio }: { valor: Periodo; onCambio: (p: Periodo) => void }) {
  return (
    <div className="segmentado" role="group" aria-label="Período">
      {PERIODOS.map((p) => (
        <button key={p.valor} type="button" aria-pressed={p.valor === valor} onClick={() => onCambio(p.valor)}>
          {p.etiqueta}
        </button>
      ))}
    </div>
  );
}
