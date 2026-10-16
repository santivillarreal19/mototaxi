/**
 * Punto de entrada de la PWA. Por ahora solo monta un texto para verificar el build;
 * en la Task 8 pasa a montar el router, la sesión y los estilos.
 */
import React from 'react';
import ReactDOM from 'react-dom/client';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <p>Mototaxi</p>
  </React.StrictMode>,
);
