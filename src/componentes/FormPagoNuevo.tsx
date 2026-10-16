/**
 * Registrar un pago nuevo, que puede cubrir uno o varios días (pago adelantado).
 *
 * - El monto se precarga con la tarifa diaria. Según el monto, el calendario deja marcar
 *   hasta N días (N = monto ÷ tarifa, máximo 14), entre 14 días atrás y 14 adelante.
 * - Al guardar se crea un pago por día marcado (una tarifa cada uno, el sobrante va al
 *   último día; ver lib/adelantos.ts), todos con el mismo grupo_id y en un solo INSERT.
 * - Luego va a /pago-registrado/:id (id del primer día) con los pagos en el estado de la
 *   navegación, donde está el botón de WhatsApp.
 * - Ids y grupo_id se generan una sola vez: reintentar tras un corte de red no duplica.
 */
import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { aErrorApp } from '../data/errores';
import { crearPagoVariosDias } from '../data/movimientos';
import { supabase } from '../data/supabase';
import { DIAS_MAXIMOS, maxDiasCubiertos, rangoDiasPago, repartirPago, semanasCalendario, validarDiasPago } from '../lib/adelantos';
import { formatearPesos } from '../lib/dinero';
import { formatearDiaCorto, hoyISO } from '../lib/fechas';
import { nuevoId } from '../lib/ids';
import type { Moto } from '../lib/tipos';
import { validarMonto } from '../lib/validaciones';
import { Campo } from './Campo';
import { CampoMonto } from './CampoMonto';
import { Aviso } from './Estado';

const ENCABEZADO_SEMANA = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

export function FormPagoNuevo({ moto }: { moto: Moto }) {
  const navigate = useNavigate();
  const hoy = hoyISO();
  const { desde, hasta } = rangoDiasPago(hoy);
  const [monto, setMonto] = useState<number | null>(moto.tarifa_diaria);
  const [dias, setDias] = useState<string[]>([hoy]);
  const [nota, setNota] = useState('');
  const [errores, setErrores] = useState<Record<string, string | null>>({});
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  // Generados una vez: los reintentos tras un corte de red no duplican el pago.
  const [ids] = useState(() => ({ grupo: nuevoId(), dias: Array.from({ length: DIAS_MAXIMOS }, () => nuevoId()) }));

  const maxDias = maxDiasCubiertos(monto, moto.tarifa_diaria);
  const reparto = monto !== null && dias.length > 0 ? repartirPago(monto, moto.tarifa_diaria, dias) : [];

  function alternarDia(fecha: string) {
    if (dias.includes(fecha)) {
      setDias(dias.filter((d) => d !== fecha));
      setErrores((e) => ({ ...e, dias: null }));
    } else if (dias.length >= maxDias) {
      setErrores((e) => ({ ...e, dias: maxDias === 1 ? 'Este monto cubre 1 día' : `Este monto cubre máximo ${maxDias} días` }));
    } else {
      setDias([...dias, fecha]);
      setErrores((e) => ({ ...e, dias: null }));
    }
  }

  async function guardar(e: FormEvent) {
    e.preventDefault();
    const nuevos = { monto: validarMonto(monto), dias: validarDiasPago(dias, maxDias) };
    setErrores(nuevos);
    if (Object.values(nuevos).some(Boolean)) return;

    setGuardando(true);
    setErrorGeneral(null);
    try {
      const creados = await crearPagoVariosDias(
        { moto_id: moto.id, nota: nota.trim() || null },
        reparto.map((p, i) => ({ id: ids.dias[i], ...p })),
        ids.grupo,
      );
      navigate(`/pago-registrado/${creados[0].id}`, { replace: true, state: { movimientos: creados, moto } });
    } catch (err) {
      const app = aErrorApp(err);
      setErrorGeneral(app.message);
      if (app.tipo === 'sesion') await supabase.auth.signOut();
    } finally {
      setGuardando(false);
    }
  }

  return (
    <form onSubmit={guardar} noValidate>
      {errorGeneral && <Aviso>{errorGeneral}</Aviso>}
      <CampoMonto id="monto" etiqueta="Monto que pagó ($)" valor={monto} onCambio={setMonto} error={errores.monto} />

      <fieldset className="campo calendario" aria-describedby="dias-ayuda">
        <legend>Días que cubre</legend>
        <p id="dias-ayuda" className="calendario__ayuda">
          Marcaste {dias.length} de {maxDias} {maxDias === 1 ? 'día' : 'días'} ({formatearPesos(moto.tarifa_diaria)}/día)
        </p>
        <div className="calendario__grilla" role="group">
          {ENCABEZADO_SEMANA.map((d, i) => (
            <span key={i} className="calendario__dia-semana" aria-hidden="true">
              {d}
            </span>
          ))}
          {semanasCalendario(desde, hasta)
            .flat()
            .map(({ fecha, enRango }) => {
              const [, mes, dia] = fecha.split('-');
              const marcado = dias.includes(fecha);
              const conMes = dia === '01' || fecha === desde;
              return (
                <button
                  key={fecha}
                  type="button"
                  className={`calendario__dia${fecha === hoy ? ' calendario__dia--hoy' : ''}`}
                  aria-pressed={marcado}
                  aria-label={formatearDiaCorto(fecha)}
                  disabled={!enRango || guardando}
                  onClick={() => alternarDia(fecha)}
                >
                  {Number(dia)}
                  {conMes && enRango && <small>{MESES[Number(mes) - 1]}</small>}
                </button>
              );
            })}
        </div>
        {errores.dias && <span className="campo__error">{errores.dias}</span>}
      </fieldset>

      {reparto.length > 1 && (
        <ul className="reparto" aria-label="Así se registra">
          {reparto.map((p) => (
            <li key={p.fecha}>
              <span>{formatearDiaCorto(p.fecha)}</span>
              <span className="monto ingreso">{formatearPesos(p.monto)}</span>
            </li>
          ))}
        </ul>
      )}

      <Campo id="nota" etiqueta="Nota (opcional)">
        <textarea id="nota" rows={2} value={nota} onChange={(e) => setNota(e.target.value)} />
      </Campo>
      <button className="boton" type="submit" disabled={guardando}>
        {guardando ? 'Guardando…' : 'Guardar'}
      </button>
    </form>
  );
}
