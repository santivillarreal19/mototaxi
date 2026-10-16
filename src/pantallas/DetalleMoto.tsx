/**
 * Detalle de una moto: totales del período y lista de movimientos (más recientes primero).
 * Botones fijos abajo para + Pago / + Gasto (ocultos si la moto está archivada).
 * Tocar un movimiento abre su edición. Si el encargado tiene préstamos pendientes (Caja),
 * se muestra cuánto debe, con enlace a la Caja.
 */
import { Link, useParams } from 'react-router-dom';
import { Encabezado } from '../componentes/Encabezado';
import { Aviso, Cargando, ErrorCarga } from '../componentes/Estado';
import { ResumenTotales } from '../componentes/ResumenTotales';
import { SelectorPeriodo } from '../componentes/SelectorPeriodo';
import { obtenerMoto } from '../data/motos';
import { listarCaja } from '../data/caja';
import { listarMovimientos } from '../data/movimientos';
import { useDatos } from '../hooks/useDatos';
import { usePeriodo } from '../hooks/usePeriodo';
import { estadoPrestamos } from '../lib/caja';
import { formatearPesos } from '../lib/dinero';
import { formatearFecha, hoyISO, rangoPeriodo } from '../lib/fechas';
import { etiquetaCategoria } from '../lib/tipos';
import { calcularTotales } from '../lib/totales';

export function DetalleMoto() {
  const { id = '' } = useParams();
  const [periodo, cambiarPeriodo] = usePeriodo();
  const { desde, hasta } = rangoPeriodo(periodo, hoyISO());
  const { datos, error, cargando, recargar } = useDatos(async () => {
    const [moto, movs, caja] = await Promise.all([obtenerMoto(id), listarMovimientos({ motoId: id, desde, hasta }), listarCaja()]);
    const debe = estadoPrestamos(caja)
      .filter((p) => p.prestamo.moto_id === id)
      .reduce((s, p) => s + p.pendiente, 0);
    return { moto, movs, debe };
  }, [id, desde, hasta]);

  if (cargando && !datos) return <Cargando />;
  if (!datos) return <ErrorCarga titulo="Moto" volverA="/" mensaje={error ?? 'No se encontró la moto.'} onReintentar={recargar} />;
  const { moto, movs, debe } = datos;

  return (
    <main className="pantalla">
      <Encabezado titulo={moto.placa} volverA="/" accion={<Link to={`/motos/${moto.id}/editar`}>Editar</Link>} />
      <p className="subtitulo">
        {moto.alias ? `${moto.alias} · ` : ''}
        {moto.encargado_nombre} · {formatearPesos(moto.tarifa_diaria)}/día
      </p>
      {moto.archivada && <Aviso>Esta moto está archivada. Desarchívala desde "Editar" para registrar movimientos.</Aviso>}
      {error && <Aviso onReintentar={recargar}>{error}</Aviso>}
      {debe > 0 && (
        <Link to="/caja" className="enlace-linea">
          Préstamos pendientes: debe {formatearPesos(debe)}
        </Link>
      )}
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
                  {m.tipo === 'pago' ? 'Pago alquiler' : etiquetaCategoria(m)}
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
