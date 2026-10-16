/**
 * Campo de monto en pesos: muestra el teclado numérico de iOS (inputMode="numeric") y
 * reformatea con puntos de miles mientras se escribe. Entrega un número entero o null.
 */
import { formatearMiles, parsearPesos } from '../lib/dinero';

export function CampoMonto({ id, etiqueta, valor, onCambio, error }: {
  id: string;
  etiqueta: string;
  valor: number | null;
  onCambio: (n: number | null) => void;
  error?: string | null;
}) {
  return (
    <div className="campo campo--monto">
      <label htmlFor={id}>{etiqueta}</label>
      <input
        id={id}
        inputMode="numeric"
        autoComplete="off"
        placeholder="0"
        value={valor === null ? '' : formatearMiles(valor)}
        onChange={(e) => onCambio(parsearPesos(e.target.value))}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
      />
      {error && (
        <span id={`${id}-error`} className="campo__error">
          {error}
        </span>
      )}
    </div>
  );
}
