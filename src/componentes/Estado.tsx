/** Indicadores de estado reutilizables: carga y aviso de error (role="alert" para lectores de pantalla). */
import type { ReactNode } from 'react';

export function Cargando() {
  return (
    <p className="vacio" aria-live="polite">
      Cargando…
    </p>
  );
}

export function Aviso({ children }: { children: ReactNode }) {
  return (
    <div className="aviso" role="alert">
      {children}
    </div>
  );
}
