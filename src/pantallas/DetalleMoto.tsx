/**
 * Detalle de una moto: totales del período y lista de movimientos (más recientes primero).
 * Botones fijos abajo para + Pago / + Gasto (ocultos si la moto está archivada).
 * Tocar un movimiento abre su edición.
 */
import { Link, useParams } from 'react-router-dom';
import { Encabezado } from '../componentes/Encabezado';
import { Aviso, Cargando } from '../componentes/Estado';
import { ResumenTotales } from '../componentes/ResumenTotales';
import { SelectorPeriodo } from '../componentes/SelectorPeriodo';
import { obtenerMoto } from '../data/motos';
import { listarMovimientos } from '../data/movimientos';
import { useDatos } from '../hooks/useDatos';
import { usePeriodo } from '../hooks/usePeriodo';
import { formatearPesos } from '../lib/dinero';
import { formatearFecha, hoyISO, rangoPeriodo } from '../lib/fechas';
import { etiquetaCategoria } from '../lib/tipos';
import { calcularTotales } from '../lib/totales';

export function DetalleMoto() {
  const { id = '' } = useParams();
  const [periodo, cambiarPeriodo] = usePeriodo();
  const { desde, hasta } = rangoPeriodo(periodo, hoyISO());
  const { datos, error, cargando } = useDatos(async () => {
    const [moto, movs] = await Promise.all([obtenerMoto(id), listarMovimientos({ motoId: id, desde, hasta })]);
    return { moto, movs };
  }, [id, desde, hasta]);

  if (cargando && !datos) return <Cargando />;
  if (!datos) return <main className="pantalla"><Encabezado titulo="Moto" volverA="/" /><Aviso>{error ?? 'No se encontró la moto.'}</Aviso></main>;
  const { moto, movs } = datos;

  return (
    <main className="pantalla">
      <Encabezado titulo={moto.placa} volverA="/" accion={<Link to={`/motos/${moto.id}/editar`}>Editar</Link>} />
      <p className="subtitulo">
        {moto.alias ? `${moto.alias} · ` : ''}
        {moto.encargado_nombre} · {formatearPesos(moto.tarifa_diaria)}/día
      </p>
      {moto.archivada && <Aviso>Esta moto está archivada. Desarchívala desde "Editar" para registrar movimientos.</Aviso>}
      {error && <Aviso>{error}</Aviso>}
      <SelectorPeriodo valor={periodo} onCambio={cambiarPeriodo} />
      <ResumenTotales titulo="Neto de la moto" totales={calcularTotales(movs)} />
      {movs.length === 0 ? (
        <p className="vacio">Sin movimientos en este período.</p>
      ) : (
        <ul className="lista">
          {movs.map((m) => (
            <li key={m.id}>
              <Link to={`/movimientos/${m.id}/editar`}>
                <span>
                  {m.tipo === 'pago' ? 'Pago alquiler' : etiquetaCategoria(m.categoria)}
                  <small>
                    {formatearFecha(m.fecha)}
                    {m.nota ? ` · ${m.nota}` : ''}
                  </small>
                </span>
                <span className={`monto ${m.tipo === 'pago' ? 'ingreso' : 'gasto'}`}>
                  {m.tipo === 'pago' ? '+' : '−'}
                  {formatearPesos(m.monto)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      {!moto.archivada && (
        <nav className="barra-inferior" aria-label="Registrar">
          <Link className="boton" to={`/motos/${moto.id}/pago`}>
            + Pago
          </Link>
          <Link className="boton boton--secundario" to={`/motos/${moto.id}/gasto`}>
            + Gasto
          </Link>
        </nav>
      )}
    </main>
  );
}
