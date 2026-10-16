/**
 * Punto de entrada de la PWA: monta el router, el proveedor de sesión y los estilos globales.
 */
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { App } from './App';
import { SesionProvider } from './auth/SesionProvider';
import './estilos.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <SesionProvider>
        <App />
      </SesionProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
