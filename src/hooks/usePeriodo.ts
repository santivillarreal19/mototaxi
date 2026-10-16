/**
 * Período seleccionado (este mes / mes anterior / todo), guardado en la URL (?periodo=)
 * para que se conserve al volver atrás. Un valor inválido o ausente cuenta como 'mes'.
 */
import { useSearchParams } from 'react-router-dom';
import { esPeriodo, type Periodo } from '../lib/fechas';

export function usePeriodo(): [Periodo, (p: Periodo) => void] {
  const [params, setParams] = useSearchParams();
  const crudo = params.get('periodo');
  const periodo: Periodo = esPeriodo(crudo) ? crudo : 'mes';
  const cambiar = (p: Periodo) => setParams(p === 'mes' ? {} : { periodo: p }, { replace: true });
  return [periodo, cambiar];
}
