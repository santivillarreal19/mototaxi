/**
 * Tabla de rutas. Todo, menos /login, va detrás de RutaProtegida.
 */
import { Navigate, Route, Routes } from 'react-router-dom';
import { RutaProtegida } from './auth/RutaProtegida';
import { Categorias } from './pantallas/Categorias';
import { DetalleMoto } from './pantallas/DetalleMoto';
import { FormMoto } from './pantallas/FormMoto';
import { Inicio } from './pantallas/Inicio';
import { Login } from './pantallas/Login';
import { Motos } from './pantallas/Motos';
import { EditarMovimiento, NuevoMovimiento } from './pantallas/Movimiento';
import { PagoRegistrado } from './pantallas/PagoRegistrado';

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<RutaProtegida />}>
        <Route path="/" element={<Inicio />} />
        <Route path="/motos" element={<Motos />} />
        <Route path="/motos/nueva" element={<FormMoto />} />
        <Route path="/motos/:id/editar" element={<FormMoto />} />
        <Route path="/motos/:id" element={<DetalleMoto />} />
        <Route path="/motos/:id/pago" element={<NuevoMovimiento tipo="pago" />} />
        <Route path="/motos/:id/gasto" element={<NuevoMovimiento tipo="gasto" />} />
        <Route path="/movimientos/:id/editar" element={<EditarMovimiento />} />
        <Route path="/pago-registrado/:id" element={<PagoRegistrado />} />
        <Route path="/categorias" element={<Categorias />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
