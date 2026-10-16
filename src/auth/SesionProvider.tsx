/**
 * Contexto con la sesión de Supabase. `cargando` es true hasta saber si hay una sesión
 * guardada en el dispositivo (evita mandar al login por un instante al abrir la app).
 * Uso: envolver la app en <SesionProvider> y leer con useSesion().
 */
import type { Session } from '@supabase/supabase-js';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { supabase } from '../data/supabase';

const Contexto = createContext<{ sesion: Session | null; cargando: boolean }>({ sesion: null, cargando: true });

export function SesionProvider({ children }: { children: ReactNode }) {
  const [sesion, setSesion] = useState<Session | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSesion(data.session);
      setCargando(false);
    });
    const { data } = supabase.auth.onAuthStateChange((_evento, nueva) => {
      setSesion(nueva);
      setCargando(false);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  return <Contexto.Provider value={{ sesion, cargando }}>{children}</Contexto.Provider>;
}

export function useSesion() {
  return useContext(Contexto);
}
