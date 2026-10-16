/**
 * Pantallas contenedoras del formulario de movimiento:
 * - NuevoMovimiento (/motos/:id/pago y /motos/:id/gasto): carga la moto.
 * - EditarMovimiento (/movimientos/:id/editar): carga el movimiento y luego su moto.
 */
import { useParams } from 'react-router-dom';
import { Encabezado } from '../componentes/Encabezado';
import { Cargando, ErrorCarga } from '../componentes/Estado';
import { FormMovimiento } from '../componentes/FormMovimiento';
import { obtenerMoto } from '../data/motos';
import { obtenerMovimiento } from '../data/movimientos';
import { useDatos } from '../hooks/useDatos';
import type { TipoMovimiento } from '../lib/tipos';

const TITULOS: Record<TipoMovimiento, { nuevo: string; editar: string }> = {
  pago: { nuevo: 'Registrar pago', editar: 'Editar pago' },
  gasto: { nuevo: 'Registrar gasto', editar: 'Editar gasto' },
};

export function NuevoMovimiento({ tipo }: { tipo: TipoMovimiento }) {
  const { id = '' } = useParams();
  const { datos: moto, error, cargando, recargar } = useDatos(() => obtenerMoto(id), [id]);
  if (cargando && !moto) return <Cargando />;
  if (!moto) return <ErrorCarga titulo={TITULOS[tipo].nuevo} volverA={`/motos/${id}`} mensaje={error ?? 'No se encontró la moto.'} onReintentar={recargar} />;
  return (
    <main className="pantalla">
      <Encabezado titulo={TITULOS[tipo].nuevo} volverA={`/motos/${moto.id}`} />
      <p className="subtitulo">
        {moto.placa} · {moto.encargado_nombre}
      </p>
      <FormMovimiento moto={moto} tipo={tipo} />
    </main>
  );
}

export function EditarMovimiento() {
  const { id = '' } = useParams();
  const { datos, error, cargando, recargar } = useDatos(async () => {
    const movimiento = await obtenerMovimiento(id);
    return { movimiento, moto: await obtenerMoto(movimiento.moto_id) };
  }, [id]);
  if (cargando && !datos) return <Cargando />;
  if (!datos) return <ErrorCarga titulo="Movimiento" volverA="/" mensaje={error ?? 'No se encontró el movimiento.'} onReintentar={recargar} />;
  const { movimiento, moto } = datos;
  return (
    <main className="pantalla">
      <Encabezado titulo={TITULOS[movimiento.tipo].editar} volverA={`/motos/${moto.id}`} />
      <p className="subtitulo">
        {moto.placa} · {moto.encargado_nombre}
      </p>
      <FormMovimiento moto={moto} tipo={movimiento.tipo} existente={movimiento} />
    </main>
  );
}
