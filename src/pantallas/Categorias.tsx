/**
 * Categorías de gasto del usuario (/categorias): crear, renombrar y eliminar.
 * Cada usuario tiene las suyas (RLS); arrancan con las 5 de la v1 (ver la migración
 * 20261016120000). Una categoría con gastos no se puede eliminar (la base lo impide y se
 * muestra el aviso 'en_uso'): solo renombrar. Renombrar cambia el nombre en todos sus gastos.
 * Renombrar y eliminar usan los diálogos nativos de iOS (prompt / confirm).
 */
import { useState, type FormEvent } from 'react';
import { Campo } from '../componentes/Campo';
import { Encabezado } from '../componentes/Encabezado';
import { Aviso, Cargando } from '../componentes/Estado';
import { crearCategoria, eliminarCategoria, listarCategorias, renombrarCategoria } from '../data/categorias';
import { aErrorApp } from '../data/errores';
import { useDatos } from '../hooks/useDatos';
import type { CategoriaGasto } from '../lib/tipos';
import { validarTexto } from '../lib/validaciones';

function mensajeDe(err: unknown): string {
  const app = aErrorApp(err);
  if (app.tipo === 'duplicado') return 'Ya tienes una categoría con ese nombre.';
  if (app.tipo === 'en_uso') return 'Esta categoría tiene gastos registrados: no se puede eliminar, solo renombrar.';
  return app.message;
}

export function Categorias() {
  const { datos: categorias, error, cargando, recargar } = useDatos(listarCategorias, []);
  const [nombre, setNombre] = useState('');
  const [errorNombre, setErrorNombre] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);

  async function ejecutar(accion: () => Promise<unknown>) {
    setOcupado(true);
    setAviso(null);
    try {
      await accion();
      recargar();
      return true;
    } catch (err) {
      setAviso(mensajeDe(err));
      return false;
    } finally {
      setOcupado(false);
    }
  }

  async function agregar(e: FormEvent) {
    e.preventDefault();
    const falta = validarTexto(nombre, 'el nombre');
    setErrorNombre(falta);
    if (falta) return;
    if (await ejecutar(() => crearCategoria(nombre))) setNombre('');
  }

  function renombrar(c: CategoriaGasto) {
    const nuevo = window.prompt('Nuevo nombre', c.nombre)?.trim();
    if (nuevo && nuevo !== c.nombre) void ejecutar(() => renombrarCategoria(c.id, nuevo));
  }

  function eliminar(c: CategoriaGasto) {
    if (window.confirm(`¿Eliminar la categoría "${c.nombre}"?`)) void ejecutar(() => eliminarCategoria(c.id));
  }

  return (
    <main className="pantalla">
      <Encabezado titulo="Categorías de gasto" volverA="/" />
      {error && <Aviso onReintentar={recargar}>{error}</Aviso>}
      {aviso && <Aviso>{aviso}</Aviso>}
      {cargando && !categorias ? (
        <Cargando />
      ) : (
        <ul className="lista">
          {categorias?.map((c) => (
            <li key={c.id} className="lista__fila">
              <span>{c.nombre}</span>
              <span className="lista__acciones">
                <button type="button" onClick={() => renombrar(c)} disabled={ocupado}>
                  Renombrar
                </button>
                <button type="button" className="peligro" onClick={() => eliminar(c)} disabled={ocupado}>
                  Eliminar
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}
      <form onSubmit={agregar} noValidate className="tarjeta">
        <Campo id="nombre" etiqueta="Nueva categoría" error={errorNombre}>
          <input id="nombre" value={nombre} maxLength={40} onChange={(e) => setNombre(e.target.value)} aria-invalid={Boolean(errorNombre)} />
        </Campo>
        <button className="boton" type="submit" disabled={ocupado}>
          Agregar
        </button>
      </form>
    </main>
  );
}
