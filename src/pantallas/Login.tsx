/**
 * Inicio de sesión con correo y contraseña (el registro público está deshabilitado en
 * Supabase; la cuenta del cliente se crea desde el panel). Al entrar, el cambio de
 * sesión dispara la redirección a state.desde o a "/".
 */
import { useState, type FormEvent } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSesion } from '../auth/SesionProvider';
import { Campo } from '../componentes/Campo';
import { Aviso } from '../componentes/Estado';
import { aErrorApp } from '../data/errores';
import { supabase } from '../data/supabase';

export function Login() {
  const { sesion } = useSesion();
  const location = useLocation();
  const destino = (location.state as { desde?: string } | null)?.desde ?? '/';
  const [correo, setCorreo] = useState('');
  const [clave, setClave] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  if (sesion) return <Navigate to={destino} replace />;

  async function entrar(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setEnviando(true);
    const { error: fallo } = await supabase.auth.signInWithPassword({ email: correo.trim(), password: clave });
    setEnviando(false);
    if (fallo) setError(aErrorApp(fallo).message);
  }

  return (
    <main className="pantalla">
      <header className="encabezado">
        <span />
        <h1>Mototaxi</h1>
        <span />
      </header>
      <form onSubmit={entrar} className="tarjeta">
        {error && <Aviso>{error}</Aviso>}
        <Campo id="correo" etiqueta="Correo">
          <input id="correo" type="email" autoComplete="email" value={correo} onChange={(e) => setCorreo(e.target.value)} required />
        </Campo>
        <Campo id="clave" etiqueta="Contraseña">
          <input id="clave" type="password" autoComplete="current-password" value={clave} onChange={(e) => setClave(e.target.value)} required />
        </Campo>
        <button className="boton" type="submit" disabled={enviando}>
          {enviando ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
    </main>
  );
}
