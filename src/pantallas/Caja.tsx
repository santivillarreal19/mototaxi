/**
 * Caja (/caja): saldo actual, préstamos pendientes y el historial de saldos, préstamos y
 * abonos. Botones fijos abajo: + Agregar saldo y + Préstamo.
 * El saldo actual solo existe desde el primer saldo agregado (ver lib/caja.ts); antes se
 * muestra una invitación a agregarlo. Tocar un préstamo abre su detalle (abonos); tocar un
 * saldo o un abono abre su edición.
 */
import { Link } from 'react-router-dom';
import { Encabezado } from '../componentes/Encabezado';
import { Aviso, Cargando } from '../componentes/Estado';
import { cargarCajaConSaldo } from '../data/caja';
import { useDatos } from '../hooks/useDatos';
import { estadoPrestamos } from '../lib/caja';
import { formatearPesos } from '../lib/dinero';
import { formatearFecha } from '../lib/fechas';
import type { EntradaCaja } from '../lib/tipos';

function describir(e: EntradaCaja, caja: EntradaCaja[]): { titulo: string; enlace: string; signo: '+' | '−' } {
  if (e.tipo === 'prestamo') {
    return { titulo: `Préstamo a ${e.encargado_nombre} (${e.moto?.placa ?? 'moto'})`, enlace: `/caja/prestamos/${e.id}`, signo: '−' };
  }
  if (e.tipo === 'abono') {
    const prestamo = caja.find((p) => p.id === e.prestamo_id);
    return { titulo: `Abono de ${prestamo?.encargado_nombre ?? 'préstamo'}`, enlace: `/caja/${e.id}/editar`, signo: '+' };
  }
  return { titulo: 'Saldo agregado', enlace: `/caja/${e.id}/editar`, signo: '+' };
}

export function Caja() {
  const { datos, error, cargando, recargar } = useDatos(cargarCajaConSaldo, []);

  if (cargando && !datos) return <Cargando />;
  const pendientes = datos ? estadoPrestamos(datos.caja).filter((p) => p.pendiente > 0) : [];

  return (
    <main className="pantalla">
      <Encabezado titulo="Caja" volverA="/" />
      {error && <Aviso onReintentar={recargar}>{error}</Aviso>}
      {datos && (
        <>
          {datos.saldo !== null && datos.corte ? (
            <section className="tarjeta">
              <p className="etiqueta">Saldo actual</p>
              <p className={`neto ${datos.saldo < 0 ? 'gasto' : ''}`}>{formatearPesos(datos.saldo)}</p>
              <p className="etiqueta">Cuenta lo registrado desde el {formatearFecha(datos.corte.slice(0, 10))}</p>
            </section>
          ) : (
            <p className="vacio">Agrega el dinero que tienes hoy con "+ Agregar saldo" para ver tu saldo actual.</p>
          )}

          {pendientes.length > 0 && (
            <>
              <h2 className="etiqueta seccion">Préstamos pendientes</h2>
              <ul className="lista">
                {pendientes.map((p) => (
                  <li key={p.prestamo.id}>
                    <Link to={`/caja/prestamos/${p.prestamo.id}`}>
                      <span>
                        {p.prestamo.encargado_nombre} · {p.prestamo.moto?.placa}
                        <small>
                          Prestado {formatearPesos(p.prestamo.monto)} el {formatearFecha(p.prestamo.fecha)}
                        </small>
                      </span>
                      <span className="monto gasto">debe {formatearPesos(p.pendiente)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}

          <h2 className="etiqueta seccion">Historial</h2>
          {datos.caja.length === 0 ? (
            <p className="vacio">Sin registros todavía.</p>
          ) : (
            <ul className="lista">
              {datos.caja.map((e) => {
                const d = describir(e, datos.caja);
                return (
                  <li key={e.id}>
                    <Link to={d.enlace}>
                      <span>
                        {d.titulo}
                        <small>
                          {formatearFecha(e.fecha)}
                          {e.nota ? ` · ${e.nota}` : ''}
                        </small>
                      </span>
                      <span className={`monto ${d.signo === '+' ? 'ingreso' : 'gasto'}`}>
                        {d.signo}
                        {formatearPesos(e.monto)}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}
      <nav className="barra-inferior" aria-label="Registrar en caja">
        <Link className="boton" to="/caja/saldo">
          + Agregar saldo
        </Link>
        <Link className="boton boton--secundario" to="/caja/prestamo">
          + Préstamo
        </Link>
      </nav>
    </main>
  );
}
