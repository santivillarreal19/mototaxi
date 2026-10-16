/**
 * Formulario de pago o gasto, para crear o editar.
 * - Pago nuevo: el monto se precarga con la tarifa diaria. Al guardar va a
 *   /pago-registrado/:id, donde está el botón de WhatsApp.
 * - Editar NO reenvía el mensaje. Eliminar pide confirmación.
 * - En un error de guardado (p. ej. sin señal) los campos se conservan para reintentar, y el
 *   id generado una sola vez evita duplicar el pago si el primer intento sí llegó.
 * - El pago guardado viaja en el estado de la navegación (ver lib/confirmacion.ts).
 */
import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { aErrorApp } from '../data/errores';
import { actualizarMovimiento, crearMovimiento, eliminarMovimiento } from '../data/movimientos';
import { supabase } from '../data/supabase';
import { hoyISO } from '../lib/fechas';
import { nuevoId } from '../lib/ids';
import { CATEGORIAS_GASTO, type CategoriaGasto, type Moto, type Movimiento, type TipoMovimiento } from '../lib/tipos';
import { validarFecha, validarMonto } from '../lib/validaciones';
import { Campo } from './Campo';
import { CampoMonto } from './CampoMonto';
import { Aviso } from './Estado';

export function FormMovimiento({ moto, tipo, existente }: { moto: Moto; tipo: TipoMovimiento; existente?: Movimiento }) {
  const navigate = useNavigate();
  const hoy = hoyISO();
  const [fecha, setFecha] = useState(existente?.fecha ?? hoy);
  const [monto, setMonto] = useState<number | null>(existente?.monto ?? (tipo === 'pago' ? moto.tarifa_diaria : null));
  const [categoria, setCategoria] = useState<CategoriaGasto | ''>(existente?.categoria ?? '');
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
      fecha: validarFecha(fecha, hoy),
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
      categoria: tipo === 'gasto' ? (categoria as CategoriaGasto) : null,
      nota: nota.trim() || null,
    };
    setGuardando(true);
    setErrorGeneral(null);
    try {
      if (existente) {
        await actualizarMovimiento(existente.id, datos);
        navigate(volver, { replace: true });
      } else {
        const creado = await crearMovimiento(datos, idNuevo);
        if (tipo === 'pago') navigate(`/pago-registrado/${creado.id}`, { replace: true, state: { movimiento: creado, moto } });
        else navigate(volver, { replace: true });
      }
    } catch (err) {
      const app = aErrorApp(err);
      setErrorGeneral(app.message);
      if (app.tipo === 'sesion') await supabase.auth.signOut();
    } finally {
      setGuardando(false);
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
      <Campo id="fecha" etiqueta="Fecha" error={errores.fecha}>
        <input id="fecha" type="date" value={fecha} max={hoy} onChange={(e) => setFecha(e.target.value)} aria-invalid={Boolean(errores.fecha)} />
      </Campo>
      <CampoMonto id="monto" etiqueta="Monto ($)" valor={monto} onCambio={setMonto} error={errores.monto} />
      {tipo === 'gasto' && (
        <Campo id="categoria" etiqueta="Categoría" error={errores.categoria}>
          <select id="categoria" value={categoria} onChange={(e) => setCategoria(e.target.value as CategoriaGasto | '')} aria-invalid={Boolean(errores.categoria)}>
            <option value="">Elige…</option>
            {CATEGORIAS_GASTO.map((c) => (
              <option key={c.valor} value={c.valor}>
                {c.etiqueta}
              </option>
            ))}
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
