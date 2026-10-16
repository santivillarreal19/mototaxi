/**
 * Confirmación de pago guardado (uno o varios días), con el botón para avisarle al
 * encargado por WhatsApp. El mensaje lleva el total y los días cubiertos.
 * El enlace es un <a> que toca el usuario: iOS bloquea abrir otra app por código.
 * Si WhatsApp no abre, "Copiar mensaje" deja el texto en el portapapeles; si el
 * portapapeles falla, se muestra el texto seleccionable.
 * Usa el pago que viene en el estado de la navegación (no depende de la red justo después
 * de guardar); solo consulta a Supabase si no hay estado, p. ej. al recargar.
 */
import { useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { Encabezado } from '../componentes/Encabezado';
import { Cargando, ErrorCarga } from '../componentes/Estado';
import { obtenerMoto } from '../data/motos';
import { listarGrupo, obtenerMovimiento } from '../data/movimientos';
import { useDatos } from '../hooks/useDatos';
import { pagoDesdeEstado } from '../lib/confirmacion';
import { formatearPesos } from '../lib/dinero';
import { formatearDiaCorto, formatearFecha } from '../lib/fechas';
import { enlaceWhatsApp, mensajePago } from '../lib/whatsapp';

export function PagoRegistrado() {
  const { id = '' } = useParams();
  const location = useLocation();
  const [copiado, setCopiado] = useState<'no' | 'si' | 'fallo'>('no');
  const { datos, error, cargando, recargar } = useDatos(async () => {
    const recienGuardado = pagoDesdeEstado(location.state, id);
    if (recienGuardado) return recienGuardado;
    const movimiento = await obtenerMovimiento(id);
    const [movimientos, moto] = await Promise.all([
      movimiento.grupo_id ? listarGrupo(movimiento.grupo_id) : [movimiento],
      obtenerMoto(movimiento.moto_id),
    ]);
    return { movimientos, moto };
  }, [id]);

  if (cargando && !datos) return <Cargando />;
  if (!datos) return <ErrorCarga titulo="Pago" volverA="/" mensaje={error ?? 'No se encontró el pago.'} onReintentar={recargar} />;
  const { movimientos, moto } = datos;
  const fechas = movimientos.map((m) => m.fecha).sort();
  const total = movimientos.reduce((suma, m) => suma + m.monto, 0);
  const texto = mensajePago({ nombre: moto.encargado_nombre, placa: moto.placa, fechas, monto: total });

  async function copiar() {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado('si');
    } catch {
      setCopiado('fallo');
    }
  }

  return (
    <main className="pantalla">
      <Encabezado titulo="Pago registrado" volverA={`/motos/${moto.id}`} />
      <section className="tarjeta">
        <p className="etiqueta">Guardado</p>
        <p className="neto ingreso">{formatearPesos(total)}</p>
        <p>
          {moto.placa} · {fechas.length === 1 ? formatearFecha(fechas[0]) : `${fechas.length} días: ${fechas.map(formatearDiaCorto).join(', ')}`}
        </p>
      </section>
      <p className="etiqueta">Mensaje para {moto.encargado_nombre}</p>
      <blockquote className="tarjeta mensaje">{texto}</blockquote>
      <a className="boton boton--whatsapp" href={enlaceWhatsApp(moto.encargado_telefono, texto)} target="_blank" rel="noopener noreferrer">
        Enviar a {moto.encargado_nombre} por WhatsApp
      </a>
      <button type="button" className="boton boton--secundario" onClick={copiar}>
        {copiado === 'si' ? 'Mensaje copiado ✓' : 'Copiar mensaje'}
      </button>
      {copiado === 'fallo' && (
        <div className="campo">
          <label htmlFor="texto-manual">No se pudo copiar automáticamente. Mantén presionado para copiar:</label>
          <textarea id="texto-manual" readOnly rows={4} value={texto} onFocus={(e) => e.currentTarget.select()} />
        </div>
      )}
      <Link className="boton boton--secundario" to={`/motos/${moto.id}`}>
        Listo
      </Link>
    </main>
  );
}
