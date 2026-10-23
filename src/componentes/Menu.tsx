/**
 * Menú lateral (botón ☰ del encabezado): acceso directo a las secciones desde cualquier
 * pantalla. Usa <dialog> con showModal: el navegador se encarga de cerrar con Escape, de
 * dejar el foco dentro y de bloquear lo de atrás. Tocar el fondo oscuro también lo cierra.
 */
import { useRef } from 'react';
import { NavLink } from 'react-router-dom';
import { supabase } from '../data/supabase';

const SECCIONES = [
  { a: '/', texto: 'Inicio' },
  { a: '/motos', texto: 'Motos' },
  { a: '/caja', texto: 'Caja: saldo y préstamos' },
  { a: '/categorias', texto: 'Categorías de gasto' },
];

export function Menu() {
  const dialogo = useRef<HTMLDialogElement>(null);
  const cerrar = () => dialogo.current?.close();

  return (
    <>
      <button type="button" className="menu__abrir" aria-label="Abrir menú" onClick={() => dialogo.current?.showModal()}>
        ☰
      </button>
      <dialog
        ref={dialogo}
        className="menu"
        aria-label="Menú"
        // El dialog ocupa toda la pantalla; si el toque cae en él y no en el panel, fue en el fondo.
        onClick={(e) => e.target === e.currentTarget && cerrar()}
      >
        <nav className="menu__panel">
          <div className="menu__cabecera">
            <span className="menu__titulo">Alquiler Motos C.V</span>
            <button type="button" className="menu__cerrar" aria-label="Cerrar menú" onClick={cerrar}>
              ✕
            </button>
          </div>
          <ul className="menu__lista">
            {SECCIONES.map((s) => (
              <li key={s.a}>
                <NavLink to={s.a} end={s.a === '/'} onClick={cerrar}>
                  {s.texto}
                </NavLink>
              </li>
            ))}
          </ul>
          <ul className="menu__lista menu__lista--cuenta">
            <li>
              <NavLink to="/cuenta/clave" onClick={cerrar}>
                Cambiar contraseña
              </NavLink>
            </li>
            <li>
              <button type="button" onClick={() => void supabase.auth.signOut()}>
                Cerrar sesión
              </button>
            </li>
          </ul>
        </nav>
      </dialog>
    </>
  );
}
