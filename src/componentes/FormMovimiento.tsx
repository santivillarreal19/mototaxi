/**
 * Formulario de gasto (crear o editar) y de edición de un pago (un día).
 * - El pago NUEVO no usa este formulario sino FormPagoNuevo (puede cubrir varios días).
 * - Gasto: la categoría sale de las categorías del usuario (data/categorias.ts); la opción
 *   "+ Nueva categoría…" la crea ahí mismo sin salir del formulario.
 * - Fecha: un gasto no puede ser futuro; un pago admite hasta 14 días adelantados y no puede
 *   caer en un domingo de descanso (ver lib/adelantos.ts).
 * - Editar NO reenvía el mensaje. Eliminar pide confirmación.
 * - En un error de guardado (p. ej. sin señal) los campos se conservan para reintentar, y el
 *   id generado una sola vez evita duplicar el gasto si el primer intento sí llegó.
 */
import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { aErrorApp } from '../data/errores';
import { crearCategoria, listarCategorias } from '../data/categorias';
import { actualizarMovimiento, crearMovimiento, eliminarMovimiento } from '../data/movimientos';
import { supabase } from '../data/supabase';
import { useDatos } from '../hooks/useDatos';
import { DIAS_MAXIMOS, domingoBloqueado } from '../lib/adelantos';
import { hoyISO, sumarDias } from '../lib/fechas';
import { nuevoId } from '../lib/ids';
import type { CategoriaGasto, Moto, Movimiento, TipoMovimiento } from '../lib/tipos';
import { validarFecha, validarMonto } from '../lib/validaciones';
import { Campo } from './Campo';
import { CampoMonto } from './CampoMonto';
import { Aviso } from './Estado';

const NUEVA = '__nueva__';

export function FormMovimiento({ moto, tipo, existente }: { moto: Moto; tipo: TipoMovimiento; existente?: Movimiento }) {
  const navigate = useNavigate();
  const hoy = hoyISO();
  const diasAdelante = tipo === 'pago' ? DIAS_MAXIMOS : 0;
  const [fecha, setFecha] = useState(existente?.fecha ?? hoy);
  const [monto, setMonto] = useState<number | null>(existente?.monto ?? null);
  const [categoria, setCategoria] = useState(existente?.categoria_id ?? '');
  const cargadas = useDatos(() => (tipo === 'gasto' ? listarCategorias() : Promise.resolve([])), [tipo]);
  const [creadas, setCreadas] = useState<CategoriaGasto[]>([]);
  const categorias = [...(cargadas.datos ?? []), ...creadas.filter((c) => !cargadas.datos?.some((x) => x.id === c.id))];
  const [nota, setNota] = useState(existente?.nota ?? '');
  const [errores, setErrores] = useState<Record<string, string | null>>({});
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  // Un solo id por formulario: los reintentos tras un corte de red no duplican el pago.
  const [idNuevo] = useState(() => nuevoId());
  const volver = `/motos/${moto.id}`;

  async function guardar(e: FormEvent) {
    e.preventDefault();
    const nuevos = {
      fecha:
        validarFecha(fecha, hoy, diasAdelante) ??
        (tipo === 'pago' && domingoBloqueado(fecha) ? 'Ese domingo es de descanso: elige otro día' : null),
      monto: validarMonto(monto),
      categoria: tipo === 'gasto' && categoria === '' ? 'Elige una categoría' : null,
    };
    setErrores(nuevos);
    if (Object.values(nuevos).some(Boolean)) return;

    const datos = {
      moto_id: moto.id,
      tipo,
      fecha,
      monto: monto!,
      categoria_id: tipo === 'gasto' ? categoria : null,
      grupo_id: existente?.grupo_id ?? null,
      nota: nota.trim() || null,
    };
    setGuardando(true);
    setErrorGeneral(null);
    try {
      if (existente) {
        await actualizarMovimiento(existente.id, datos);
        navigate(volver, { replace: true });
      } else {
        await crearMovimiento(datos, idNuevo);
        navigate(volver, { replace: true });
      }
    } catch (err) {
      const app = aErrorApp(err);
      setErrorGeneral(app.message);
      if (app.tipo === 'sesion') await supabase.auth.signOut();
    } finally {
      setGuardando(false);
    }
  }

  async function elegirCategoria(valor: string) {
    if (valor !== NUEVA) {
      setCategoria(valor);
      return;
    }
    const nombre = window.prompt('Nombre de la nueva categoría')?.trim();
    if (!nombre) return;
    try {
      const nueva = await crearCategoria(nombre);
      setCreadas((c) => [...c, nueva]);
      setCategoria(nueva.id);
      setErrores((e) => ({ ...e, categoria: null }));
    } catch (err) {
      const app = aErrorApp(err);
      setErrores((e) => ({ ...e, categoria: app.tipo === 'duplicado' ? 'Ya tienes una categoría con ese nombre' : app.message }));
    }
  }

  async function eliminar() {
    if (!existente || !window.confirm('¿Eliminar este movimiento? No se puede deshacer.')) return;
    setGuardando(true);
    try {
      await eliminarMovimiento(existente.id);
      navigate(volver, { replace: true });
    } catch (err) {
      setErrorGeneral(aErrorApp(err).message);
      setGuardando(false);
    }
  }

  return (
    <form onSubmit={guardar} noValidate>
      {errorGeneral && <Aviso>{errorGeneral}</Aviso>}
      {cargadas.error && <Aviso onReintentar={cargadas.recargar}>{cargadas.error}</Aviso>}
      <Campo id="fecha" etiqueta="Fecha" error={errores.fecha}>
        <input id="fecha" type="date" value={fecha} max={sumarDias(hoy, diasAdelante)} onChange={(e) => setFecha(e.target.value)} aria-invalid={Boolean(errores.fecha)} />
      </Campo>
      <CampoMonto id="monto" etiqueta="Monto ($)" valor={monto} onCambio={setMonto} error={errores.monto} />
      {tipo === 'gasto' && (
        <Campo id="categoria" etiqueta="Categoría" error={errores.categoria}>
          <select id="categoria" value={categoria} onChange={(e) => void elegirCategoria(e.target.value)} aria-invalid={Boolean(errores.categoria)}>
            <option value="">{cargadas.cargando && !cargadas.datos ? 'Cargando…' : 'Elige…'}</option>
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
            <option value={NUEVA}>+ Nueva categoría…</option>
          </select>
        </Campo>
      )}
      <Campo id="nota" etiqueta={tipo === 'gasto' ? 'Descripción (opcional)' : 'Nota (opcional)'}>
        <textarea id="nota" rows={2} value={nota} onChange={(e) => setNota(e.target.value)} />
      </Campo>
      <button className="boton" type="submit" disabled={guardando}>
        {guardando ? 'Guardando…' : 'Guardar'}
      </button>
      {existente && (
        <button type="button" className="boton boton--peligro" onClick={eliminar} disabled={guardando}>
          Eliminar
        </button>
      )}
    </form>
  );
}
