/** Barra superior fija: botón volver opcional, título centrado y una acción opcional a la derecha. */
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

export function Encabezado({ titulo, volverA, accion }: { titulo: string; volverA?: string; accion?: ReactNode }) {
  return (
    <header className="encabezado">
      {volverA ? (
        <Link to={volverA} className="encabezado__volver" aria-label="Volver">
          ‹
        </Link>
      ) : (
        <span />
      )}
      <h1>{titulo}</h1>
      <div className="encabezado__accion">{accion}</div>
    </header>
  );
}
