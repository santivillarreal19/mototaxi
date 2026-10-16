/**
 * Pantalla principal: neto general del período y una tarjeta por moto activa con su neto.
 * El neto general incluye los movimientos de motos archivadas (es plata que sí entró o
 * salió); las tarjetas solo muestran las motos activas.
 */
import { Link } from 'react-router-dom';
import { Encabezado } from '../componentes/Encabezado';
import { Aviso, Cargando } from '../componentes/Estado';
import { ResumenTotales } from '../componentes/ResumenTotales';
import { SelectorPeriodo } from '../componentes/SelectorPeriodo';
import { listarMotos } from '../data/motos';
import { listarMovimientos } from '../data/movimientos';
import { useDatos } from '../hooks/useDatos';
import { usePeriodo } from '../hooks/usePeriodo';
import { formatearPesos } from '../lib/dinero';
import { hoyISO, rangoPeriodo } from '../lib/fechas';
import { calcularTotales, TOTALES_VACIOS, totalesPorMoto } from '../lib/totales';

export function Inicio() {
  const [periodo, cambiarPeriodo] = usePeriodo();
  const { desde, hasta } = rangoPeriodo(periodo, hoyISO());
  const { datos, error, cargando } = useDatos(async () => {
    const [motos, movs] = await Promise.all([listarMotos({ incluirArchivadas: false }), listarMovimientos({ desde, hasta })]);
    return { motos, movs };
  }, [desde, hasta]);

  const porMoto = datos ? totalesPorMoto(datos.movs) : new Map();

  return (
    <main className="pantalla">
      <Encabezado titulo="Mototaxi" accion={<Link to="/motos">Motos</Link>} />
      <SelectorPeriodo valor={periodo} onCambio={cambiarPeriodo} />
      {error && <Aviso>{error}</Aviso>}
      {cargando && !datos && <Cargando />}
      {datos && (
        <>
          <ResumenTotales titulo="Ganancia neta" totales={calcularTotales(datos.movs)} />
          {datos.motos.length === 0 ? (
            <div className="vacio">
              <p>Aún no tienes motos registradas.</p>
              <br />
              <Link to="/motos/nueva" className="boton">
                Agregar mi primera moto
              </Link>
            </div>
          ) : (
            datos.motos.map((m) => {
              const t = porMoto.get(m.id) ?? TOTALES_VACIOS;
              return (
                <Link key={m.id} to={`/motos/${m.id}`} className="tarjeta tarjeta-moto">
                  <div>
                    <span className="placa">{m.placa}</span>
                    {m.alias && <span> · {m.alias}</span>}
                    <p className="etiqueta">{m.encargado_nombre}</p>
                  </div>
                  <span className={`monto ${t.neto < 0 ? 'gasto' : ''}`}>{formatearPesos(t.neto)}</span>
                </Link>
              );
            })
          )}
        </>
      )}
    </main>
  );
}
