/**
 * Crear o editar una moto (rutas /motos/nueva y /motos/:id/editar).
 * El formulario interno se monta cuando la moto ya cargó, así el estado inicial sale de
 * ella. En un error de guardado los campos NO se limpian. Archivar conserva el historial.
 */
import { useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Campo } from '../componentes/Campo';
import { CampoMonto } from '../componentes/CampoMonto';
import { Encabezado } from '../componentes/Encabezado';
import { Aviso, Cargando, ErrorCarga } from '../componentes/Estado';
import { aErrorApp } from '../data/errores';
import { actualizarMoto, crearMoto, obtenerMoto } from '../data/motos';
import { supabase } from '../data/supabase';
import { useDatos } from '../hooks/useDatos';
import type { Moto, MotoNueva } from '../lib/tipos';
import { normalizarPlaca, validarMonto, validarPlaca, validarTelefono, validarTexto } from '../lib/validaciones';
import { formatearTelefono, normalizarTelefono } from '../lib/whatsapp';

export function FormMoto() {
  const { id } = useParams();
  const { datos, error, cargando, recargar } = useDatos(async () => (id ? obtenerMoto(id) : null), [id]);
  if (id && cargando) return <Cargando />;
  if (id && !datos) return <ErrorCarga titulo="Editar moto" volverA="/motos" mensaje={error ?? 'No se encontró la moto.'} onReintentar={recargar} />;
  return <FormularioMoto existente={datos ?? undefined} />;
}

function FormularioMoto({ existente }: { existente?: Moto }) {
  const navigate = useNavigate();
  const [placa, setPlaca] = useState(existente?.placa ?? '');
  const [alias, setAlias] = useState(existente?.alias ?? '');
  const [tarifa, setTarifa] = useState<number | null>(existente?.tarifa_diaria ?? null);
  const [nombre, setNombre] = useState(existente?.encargado_nombre ?? '');
  const [telefono, setTelefono] = useState(existente ? formatearTelefono(existente.encargado_telefono) : '');
  const [errores, setErrores] = useState<Record<string, string | null>>({});
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  async function guardar(e: FormEvent) {
    e.preventDefault();
    const placaLimpia = normalizarPlaca(placa);
    const nuevos = {
      placa: validarPlaca(placaLimpia),
      tarifa: validarMonto(tarifa),
      nombre: validarTexto(nombre, 'el nombre del encargado'),
      telefono: validarTelefono(telefono),
    };
    setErrores(nuevos);
    if (Object.values(nuevos).some(Boolean)) return;

    const datos: MotoNueva = {
      placa: placaLimpia,
      alias: alias.trim() || null,
      tarifa_diaria: tarifa!,
      encargado_nombre: nombre.trim(),
      encargado_telefono: normalizarTelefono(telefono)!,
    };
    setGuardando(true);
    setErrorGeneral(null);
    try {
      const moto = existente ? await actualizarMoto(existente.id, datos) : await crearMoto(datos);
      navigate(`/motos/${moto.id}`, { replace: true });
    } catch (err) {
      const app = aErrorApp(err);
      if (app.tipo === 'duplicado') setErrores((p) => ({ ...p, placa: 'Ya tienes una moto con esa placa' }));
      else setErrorGeneral(app.message);
      if (app.tipo === 'sesion') await supabase.auth.signOut();
    } finally {
      setGuardando(false);
    }
  }

  async function alternarArchivo() {
    if (!existente) return;
    const archivar = !existente.archivada;
    if (archivar && !window.confirm('¿Archivar esta moto? Su historial se conserva y deja de aparecer en el inicio.')) return;
    setGuardando(true);
    try {
      await actualizarMoto(existente.id, { archivada: archivar });
      navigate(archivar ? '/motos' : `/motos/${existente.id}`, { replace: true });
    } catch (err) {
      setErrorGeneral(aErrorApp(err).message);
      setGuardando(false);
    }
  }

  return (
    <main className="pantalla">
      <Encabezado titulo={existente ? 'Editar moto' : 'Nueva moto'} volverA={existente ? `/motos/${existente.id}` : '/motos'} />
      <form onSubmit={guardar} noValidate>
        {errorGeneral && <Aviso>{errorGeneral}</Aviso>}
        <Campo id="placa" etiqueta="Placa" error={errores.placa}>
          <input id="placa" value={placa} onChange={(e) => setPlaca(e.target.value)} autoCapitalize="characters" autoComplete="off" aria-invalid={Boolean(errores.placa)} />
        </Campo>
        <Campo id="alias" etiqueta="Alias (opcional)">
          <input id="alias" value={alias} onChange={(e) => setAlias(e.target.value)} placeholder="Ej. La roja" />
        </Campo>
        <CampoMonto id="tarifa" etiqueta="Tarifa diaria ($)" valor={tarifa} onCambio={setTarifa} error={errores.tarifa} />
        <Campo id="nombre" etiqueta="Nombre del encargado" error={errores.nombre}>
          <input id="nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} autoComplete="off" aria-invalid={Boolean(errores.nombre)} />
        </Campo>
        <Campo id="telefono" etiqueta="WhatsApp del encargado" error={errores.telefono}>
          <input id="telefono" type="tel" inputMode="tel" value={telefono} onChange={(e) => setTelefono(e.target.value)} placeholder="300 123 4567" aria-invalid={Boolean(errores.telefono)} />
        </Campo>
        <button className="boton" type="submit" disabled={guardando}>
          {guardando ? 'Guardando…' : 'Guardar'}
        </button>
        {existente && (
          <button type="button" className="boton boton--peligro" onClick={alternarArchivo} disabled={guardando}>
            {existente.archivada ? 'Desarchivar moto' : 'Archivar moto'}
          </button>
        )}
      </form>
    </main>
  );
}
