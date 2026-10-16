/**
 * Indicadores de estado reutilizables: carga, aviso de error (role="alert") y pantalla de
 * error de carga con salida. Como PWA instalada en iOS no hay botón atrás ni barra del
 * navegador, toda pantalla de error debe ofrecer "Volver" y "Reintentar".
 */
import type { ReactNode } from 'react';
import { Encabezado } from './Encabezado';

export function Cargando() {
  return (
    <p className="vacio" aria-live="polite">
      Cargando…
    </p>
  );
}

export function Aviso({ children, onReintentar }: { children: ReactNode; onReintentar?: () => void }) {
  return (
    <div className="aviso" role="alert">
      {children}
      {onReintentar && (
        <button type="button" className="boton boton--secundario aviso__reintentar" onClick={onReintentar}>
          Reintentar
        </button>
      )}
    </div>
  );
}

export function ErrorCarga({ titulo, mensaje, volverA, onReintentar }: {
  titulo: string;
  mensaje: string;
  volverA: string;
  onReintentar: () => void;
}) {
  return (
    <main className="pantalla">
      <Encabezado titulo={titulo} volverA={volverA} />
      <Aviso onReintentar={onReintentar}>{mensaje}</Aviso>
    </main>
  );
}
