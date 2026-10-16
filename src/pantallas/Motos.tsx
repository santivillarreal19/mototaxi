/**
 * Gestión de motos: lista de activas y archivadas, botón para crear una nueva y cierre
 * de sesión. Tocar una moto abre su edición (placa, tarifa, encargado, archivar).
 */
import { Link } from 'react-router-dom';
import { Encabezado } from '../componentes/Encabezado';
import { Aviso, Cargando } from '../componentes/Estado';
import { listarMotos } from '../data/motos';
import { supabase } from '../data/supabase';
import { useDatos } from '../hooks/useDatos';
import { formatearPesos } from '../lib/dinero';
import type { Moto } from '../lib/tipos';
import { formatearTelefono } from '../lib/whatsapp';

function ItemMoto({ moto }: { moto: Moto }) {
  return (
    <li>
      <Link to={`/motos/${moto.id}/editar`}>
        <span>
          <span className="placa">{moto.placa}</span>
          {moto.alias && ` · ${moto.alias}`}
          <small>
            {moto.encargado_nombre} · {formatearTelefono(moto.encargado_telefono)}
          </small>
        </span>
        <span className="monto">{formatearPesos(moto.tarifa_diaria)}/día</span>
      </Link>
    </li>
  );
}

export function Motos() {
  const { datos: motos, error, cargando } = useDatos(() => listarMotos({ incluirArchivadas: true }), []);
  const activas = motos?.filter((m) => !m.archivada) ?? [];
  const archivadas = motos?.filter((m) => m.archivada) ?? [];

  return (
    <main className="pantalla">
      <Encabezado titulo="Motos" volverA="/" />
      {error && <Aviso>{error}</Aviso>}
      {cargando && !motos ? (
        <Cargando />
      ) : (
        <>
          {activas.length === 0 && <p className="vacio">Aún no hay motos registradas.</p>}
          <ul className="lista">
            {activas.map((m) => (
              <ItemMoto key={m.id} moto={m} />
            ))}
          </ul>
          {archivadas.length > 0 && (
            <>
              <h2 className="etiqueta seccion">Archivadas</h2>
              <ul className="lista">
                {archivadas.map((m) => (
                  <ItemMoto key={m.id} moto={m} />
                ))}
              </ul>
            </>
          )}
        </>
      )}
      <Link to="/motos/nueva" className="boton">
        + Nueva moto
      </Link>
      <button type="button" className="boton boton--secundario" onClick={() => void supabase.auth.signOut()}>
        Cerrar sesión
      </button>
    </main>
  );
}
