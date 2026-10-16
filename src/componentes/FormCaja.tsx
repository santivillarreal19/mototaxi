/**
 * Formulario de una entrada de Caja: saldo agregado, préstamo o abono (crear o editar).
 * - Préstamo: se elige la moto y se guarda el nombre de su encargado de ese momento.
 *   Al editar no puede quedar por debajo de lo ya abonado.
 * - Abono: no puede pasar de lo que el préstamo aún debe.
 * - La fecha no puede ser futura. Eliminar pide confirmación; un préstamo con abonos no se
 *   puede eliminar (la base lo impide) hasta borrar sus abonos.
 * - El id se genera una sola vez: reintentar tras un corte de red no duplica la entrada.
 */
import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { actualizarEntradaCaja, crearEntradaCaja, eliminarEntradaCaja } from '../data/caja';
import { aErrorApp } from '../data/errores';
import { supabase } from '../data/supabase';
import { validarAbono, validarMontoPrestamo, type EstadoPrestamo } from '../lib/caja';
import { formatearPesos } from '../lib/dinero';
import { hoyISO } from '../lib/fechas';
import { nuevoId } from '../lib/ids';
import type { EntradaCaja, Moto, TipoCaja } from '../lib/tipos';
import { validarFecha, validarMonto } from '../lib/validaciones';
import { Campo } from './Campo';
import { CampoMonto } from './CampoMonto';
import { Aviso } from './Estado';

export function FormCaja({ tipo, existente, motos = [], motoInicial, prestamo }: {
  tipo: TipoCaja;
  existente?: EntradaCaja;
  /** Préstamo: motos activas para elegir (más la del préstamo si ya está archivada). */
  motos?: Moto[];
  motoInicial?: string;
  /** Abono (préstamo al que se abona) o edición de un préstamo (sus abonos). */
  prestamo?: EstadoPrestamo;
}) {
  const navigate = useNavigate();
  const hoy = hoyISO();
  const [fecha, setFecha] = useState(existente?.fecha ?? hoy);
  const [monto, setMonto] = useState<number | null>(existente?.monto ?? null);
  const [motoId, setMotoId] = useState(existente?.moto_id ?? motoInicial ?? '');
  const [nota, setNota] = useState(existente?.nota ?? '');
  const [errores, setErrores] = useState<Record<string, string | null>>({});
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [idNuevo] = useState(() => nuevoId());

  // Lo que el préstamo debe sin contar este abono (al editar un abono, su monto actual se libera).
  const pendienteDisponible = (prestamo?.pendiente ?? 0) + (tipo === 'abono' ? (existente?.monto ?? 0) : 0);
  const prestamoId = tipo === 'abono' ? (existente?.prestamo_id ?? prestamo?.prestamo.id ?? null) : null;

  function validarElMonto(): string | null {
    if (tipo === 'abono') return validarAbono(monto, pendienteDisponible);
    if (tipo === 'prestamo') return validarMontoPrestamo(monto, prestamo?.abonado ?? 0);
    return validarMonto(monto);
  }

  function destino(guardada: EntradaCaja): string {
    if (guardada.tipo === 'prestamo') return `/caja/prestamos/${guardada.id}`;
    if (guardada.tipo === 'abono') return `/caja/prestamos/${guardada.prestamo_id}`;
    return '/caja';
  }

  async function guardar(e: FormEvent) {
    e.preventDefault();
    const nuevos = {
      fecha: validarFecha(fecha, hoy),
      monto: validarElMonto(),
      moto: tipo === 'prestamo' && motoId === '' ? 'Elige la moto' : null,
    };
    setErrores(nuevos);
    if (Object.values(nuevos).some(Boolean)) return;

    const moto = motos.find((m) => m.id === motoId);
    const mismoEncargado = existente?.moto_id === motoId ? existente.encargado_nombre : null;
    const datos = {
      tipo,
      fecha,
      monto: monto!,
      moto_id: tipo === 'prestamo' ? motoId : null,
      encargado_nombre: tipo === 'prestamo' ? (mismoEncargado ?? moto?.encargado_nombre ?? null) : null,
      prestamo_id: prestamoId,
      nota: nota.trim() || null,
    };
    setGuardando(true);
    setErrorGeneral(null);
    try {
      const guardada = existente ? await actualizarEntradaCaja(existente.id, datos) : await crearEntradaCaja(datos, idNuevo);
      navigate(destino(guardada), { replace: true });
    } catch (err) {
      const app = aErrorApp(err);
      setErrorGeneral(app.message);
      if (app.tipo === 'sesion') await supabase.auth.signOut();
    } finally {
      setGuardando(false);
    }
  }

  async function eliminar() {
    if (!existente || !window.confirm('¿Eliminar este registro? No se puede deshacer.')) return;
    setGuardando(true);
    try {
      await eliminarEntradaCaja(existente.id);
      navigate(existente.tipo === 'abono' ? `/caja/prestamos/${existente.prestamo_id}` : '/caja', { replace: true });
    } catch (err) {
      const app = aErrorApp(err);
      setErrorGeneral(app.tipo === 'en_uso' ? 'Este préstamo tiene abonos: elimínalos primero.' : app.message);
      setGuardando(false);
    }
  }

  return (
    <form onSubmit={guardar} noValidate>
      {errorGeneral && <Aviso>{errorGeneral}</Aviso>}
      {tipo === 'abono' && prestamo && (
        <p className="subtitulo">
          {prestamo.prestamo.encargado_nombre} debe {formatearPesos(pendienteDisponible)}
        </p>
      )}
      {tipo === 'prestamo' && (
        <Campo id="moto" etiqueta="Moto (encargado)" error={errores.moto}>
          <select id="moto" value={motoId} onChange={(e) => setMotoId(e.target.value)} aria-invalid={Boolean(errores.moto)}>
            <option value="">Elige…</option>
            {motos.map((m) => (
              <option key={m.id} value={m.id}>
                {m.placa} · {m.encargado_nombre}
              </option>
            ))}
          </select>
        </Campo>
      )}
      <CampoMonto id="monto" etiqueta="Monto ($)" valor={monto} onCambio={setMonto} error={errores.monto} />
      <Campo id="fecha" etiqueta="Fecha" error={errores.fecha}>
        <input id="fecha" type="date" value={fecha} max={hoy} onChange={(e) => setFecha(e.target.value)} aria-invalid={Boolean(errores.fecha)} />
      </Campo>
      <Campo id="nota" etiqueta="Nota (opcional)">
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
