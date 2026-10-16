/**
 * Pantallas contenedoras del formulario de Caja (FormCaja):
 * - NuevaEntradaCaja: /caja/saldo, /caja/prestamo (acepta ?moto=<id> para preelegir la
 *   moto, p. ej. desde el detalle de la moto) y /caja/prestamos/:id/abono.
 * - EditarEntradaCaja: /caja/:id/editar (saldo, préstamo o abono).
 * - DetallePrestamo: /caja/prestamos/:id — lo prestado, sus abonos y cuánto falta.
 * Cargan la caja completa (es pequeña) para conocer lo abonado/pendiente de cada préstamo.
 */
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { Encabezado } from '../componentes/Encabezado';
import { Cargando, ErrorCarga } from '../componentes/Estado';
import { FormCaja } from '../componentes/FormCaja';
import { listarCaja } from '../data/caja';
import { listarMotos } from '../data/motos';
import { useDatos } from '../hooks/useDatos';
import { estadoPrestamos } from '../lib/caja';
import { formatearPesos } from '../lib/dinero';
import { formatearFecha } from '../lib/fechas';
import type { TipoCaja } from '../lib/tipos';

const TITULOS: Record<TipoCaja, { nuevo: string; editar: string }> = {
  saldo: { nuevo: 'Agregar saldo', editar: 'Editar saldo' },
  prestamo: { nuevo: 'Préstamo', editar: 'Editar préstamo' },
  abono: { nuevo: 'Abono al préstamo', editar: 'Editar abono' },
};

/** Motos activas, más la del préstamo si ya fue archivada (para no perderla al editar). */
async function motosParaPrestamo(motoActual: string | null) {
  const todas = await listarMotos({ incluirArchivadas: true });
  return todas.filter((m) => !m.archivada || m.id === motoActual);
}

export function NuevaEntradaCaja({ tipo }: { tipo: TipoCaja }) {
  const { id: prestamoId = '' } = useParams();
  const [busqueda] = useSearchParams();
  const { datos, error, cargando, recargar } = useDatos(async () => {
    const [caja, motos] = await Promise.all([listarCaja(), tipo === 'prestamo' ? motosParaPrestamo(null) : []]);
    return { prestamo: estadoPrestamos(caja).find((p) => p.prestamo.id === prestamoId), motos };
  }, [tipo, prestamoId]);

  const volverA = tipo === 'abono' ? `/caja/prestamos/${prestamoId}` : '/caja';
  if (cargando && !datos) return <Cargando />;
  if (!datos || (tipo === 'abono' && !datos.prestamo)) {
    return <ErrorCarga titulo={TITULOS[tipo].nuevo} volverA={volverA} mensaje={error ?? 'No se encontró el préstamo.'} onReintentar={recargar} />;
  }
  return (
    <main className="pantalla">
      <Encabezado titulo={TITULOS[tipo].nuevo} volverA={volverA} />
      <FormCaja tipo={tipo} motos={datos.motos} motoInicial={busqueda.get('moto') ?? undefined} prestamo={datos.prestamo} />
    </main>
  );
}

export function EditarEntradaCaja() {
  const { id = '' } = useParams();
  const { datos, error, cargando, recargar } = useDatos(async () => {
    const caja = await listarCaja();
    const entrada = caja.find((e) => e.id === id);
    const motos = entrada?.tipo === 'prestamo' ? await motosParaPrestamo(entrada.moto_id) : [];
    const delPrestamo = entrada?.tipo === 'abono' ? entrada.prestamo_id : id;
    return { entrada, motos, prestamo: estadoPrestamos(caja).find((p) => p.prestamo.id === delPrestamo) };
  }, [id]);

  if (cargando && !datos) return <Cargando />;
  if (!datos?.entrada) return <ErrorCarga titulo="Caja" volverA="/caja" mensaje={error ?? 'No se encontró el registro.'} onReintentar={recargar} />;
  const { entrada, motos, prestamo } = datos;
  return (
    <main className="pantalla">
      <Encabezado titulo={TITULOS[entrada.tipo].editar} volverA={entrada.tipo === 'abono' ? `/caja/prestamos/${entrada.prestamo_id}` : '/caja'} />
      <FormCaja tipo={entrada.tipo} existente={entrada} motos={motos} prestamo={prestamo} />
    </main>
  );
}

export function DetallePrestamo() {
  const { id = '' } = useParams();
  const { datos, error, cargando, recargar } = useDatos(async () => estadoPrestamos(await listarCaja()).find((p) => p.prestamo.id === id) ?? null, [id]);

  if (cargando && !datos) return <Cargando />;
  if (!datos) return <ErrorCarga titulo="Préstamo" volverA="/caja" mensaje={error ?? 'No se encontró el préstamo.'} onReintentar={recargar} />;
  const { prestamo, abonos, abonado, pendiente } = datos;

  return (
    <main className="pantalla">
      <Encabezado titulo="Préstamo" volverA="/caja" accion={<Link to={`/caja/${prestamo.id}/editar`}>Editar</Link>} />
      <p className="subtitulo">
        {prestamo.encargado_nombre} · {prestamo.moto?.placa}
      </p>
      <section className="tarjeta">
        <p className="etiqueta">{pendiente > 0 ? 'Debe' : 'Estado'}</p>
        <p className={`neto ${pendiente > 0 ? 'gasto' : 'ingreso'}`}>{pendiente > 0 ? formatearPesos(pendiente) : 'Pagado ✓'}</p>
        <div className="fila-totales">
          <div>
            <p className="etiqueta">Prestado</p>
            <p className="monto">{formatearPesos(prestamo.monto)}</p>
          </div>
          <div>
            <p className="etiqueta">Abonado</p>
            <p className="monto ingreso">{formatearPesos(abonado)}</p>
          </div>
        </div>
        <p className="etiqueta separado">
          Prestado el {formatearFecha(prestamo.fecha)}
          {prestamo.nota ? ` · ${prestamo.nota}` : ''}
        </p>
      </section>
      <h2 className="etiqueta seccion">Abonos</h2>
      {abonos.length === 0 ? (
        <p className="vacio">Sin abonos todavía.</p>
      ) : (
        <ul className="lista">
          {abonos.map((a) => (
            <li key={a.id}>
              <Link to={`/caja/${a.id}/editar`}>
                <span>
                  Abono
                  <small>
                    {formatearFecha(a.fecha)}
                    {a.nota ? ` · ${a.nota}` : ''}
                  </small>
                </span>
                <span className="monto ingreso">+{formatearPesos(a.monto)}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      {pendiente > 0 && (
        <Link className="boton" to={`/caja/prestamos/${prestamo.id}/abono`}>
          + Abono
        </Link>
      )}
    </main>
  );
}
