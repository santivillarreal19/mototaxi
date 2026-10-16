/**
 * Guarda de rutas: sin sesión, manda al login recordando a dónde se quería ir
 * (state.desde), para regresar ahí después de entrar.
 */
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { Cargando } from '../componentes/Estado';
import { useSesion } from './SesionProvider';

export function RutaProtegida() {
  const { sesion, cargando } = useSesion();
  const location = useLocation();
  if (cargando) return <Cargando />;
  if (!sesion) return <Navigate to="/login" replace state={{ desde: location.pathname + location.search }} />;
  return <Outlet />;
}
