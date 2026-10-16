/** Envoltorio de campo de formulario: etiqueta + control + mensaje de error asociado por id. */
import type { ReactNode } from 'react';

export function Campo({ id, etiqueta, error, children }: { id: string; etiqueta: string; error?: string | null; children: ReactNode }) {
  return (
    <div className="campo">
      <label htmlFor={id}>{etiqueta}</label>
      {children}
      {error && (
        <span id={`${id}-error`} className="campo__error">
          {error}
        </span>
      )}
    </div>
  );
}
