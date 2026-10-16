/**
 * Tabla de rutas. Todo, menos /login, va detrás de RutaProtegida.
 */
import { Navigate, Route, Routes } from 'react-router-dom';
import { RutaProtegida } from './auth/RutaProtegida';
import { FormMoto } from './pantallas/FormMoto';
import { Inicio } from './pantallas/Inicio';
import { Login } from './pantallas/Login';
import { Motos } from './pantallas/Motos';

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<RutaProtegida />}>
        <Route path="/" element={<Inicio />} />
        <Route path="/motos" element={<Motos />} />
        <Route path="/motos/nueva" element={<FormMoto />} />
        <Route path="/motos/:id/editar" element={<FormMoto />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
