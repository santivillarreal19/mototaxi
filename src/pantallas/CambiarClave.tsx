/**
 * Cambiar la contraseña del usuario que inició sesión. Los correos de los usuarios no son
 * reales, así que no hay recuperación por correo: este es el único cambio desde la app.
 * Antes de cambiarla se verifica la contraseña actual volviendo a iniciar sesión, para que
 * un celular prestado con la sesión abierta no baste para cambiarla.
 */
import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useSesion } from '../auth/SesionProvider';
import { Campo } from '../componentes/Campo';
import { Encabezado } from '../componentes/Encabezado';
import { Aviso } from '../componentes/Estado';
import { aErrorApp } from '../data/errores';
import { supabase } from '../data/supabase';
import { validarClaveNueva } from '../lib/validaciones';

export function CambiarClave() {
  const { sesion } = useSesion();
  const [actual, setActual] = useState('');
  const [nueva, setNueva] = useState('');
  const [confirmacion, setConfirmacion] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [listo, setListo] = useState(false);

  async function guardar(e: FormEvent) {
    e.preventDefault();
    const invalida = actual === '' ? 'Escribe tu contraseña actual' : validarClaveNueva(nueva, confirmacion, actual);
    setError(invalida);
    if (invalida) return;

    setGuardando(true);
    try {
      const correo = sesion?.user.email ?? '';
      const { error: falloActual } = await supabase.auth.signInWithPassword({ email: correo, password: actual });
      if (falloActual) {
        const app = aErrorApp(falloActual);
        setError(app.tipo === 'credenciales' ? 'La contraseña actual no es correcta' : app.message);
        return;
      }
      const { error: fallo } = await supabase.auth.updateUser({ password: nueva });
      if (fallo) throw fallo;
      setListo(true);
    } catch (err) {
      setError(aErrorApp(err).message);
    } finally {
      setGuardando(false);
    }
  }

  if (listo) {
    return (
      <main className="pantalla">
        <Encabezado titulo="Cambiar contraseña" volverA="/motos" />
        <div className="tarjeta">
          <p>Listo, tu contraseña quedó cambiada. Úsala la próxima vez que inicies sesión.</p>
        </div>
        <Link to="/" className="boton">
          Ir al inicio
        </Link>
      </main>
    );
  }

  return (
    <main className="pantalla">
      <Encabezado titulo="Cambiar contraseña" volverA="/motos" />
      <form onSubmit={guardar} className="tarjeta" noValidate>
        {error && <Aviso>{error}</Aviso>}
        <Campo id="actual" etiqueta="Contraseña actual">
          <input id="actual" type="password" autoComplete="current-password" value={actual} onChange={(e) => setActual(e.target.value)} />
        </Campo>
        <Campo id="nueva" etiqueta="Contraseña nueva">
          <input id="nueva" type="password" autoComplete="new-password" value={nueva} onChange={(e) => setNueva(e.target.value)} />
        </Campo>
        <Campo id="confirmacion" etiqueta="Repite la contraseña nueva">
          <input id="confirmacion" type="password" autoComplete="new-password" value={confirmacion} onChange={(e) => setConfirmacion(e.target.value)} />
        </Campo>
        <button className="boton" type="submit" disabled={guardando}>
          {guardando ? 'Guardando…' : 'Cambiar contraseña'}
        </button>
      </form>
    </main>
  );
}
