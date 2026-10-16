/**
 * Carga datos asíncronos para una pantalla y expone { datos, error, cargando, recargar }.
 * Traduce el error con aErrorApp. Si la sesión venció, cierra sesión: RutaProtegida
 * lleva entonces al login y, al volver a entrar, regresa a la misma pantalla.
 * Ignora respuestas viejas si las dependencias cambian antes de que llegue la anterior.
 */
import { useEffect, useState } from 'react';
import { aErrorApp } from '../data/errores';
import { supabase } from '../data/supabase';

interface Estado<T> {
  datos: T | null;
  error: string | null;
  cargando: boolean;
}

export function useDatos<T>(cargar: () => Promise<T>, deps: unknown[]) {
  const [estado, setEstado] = useState<Estado<T>>({ datos: null, error: null, cargando: true });
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let vigente = true;
    setEstado((e) => ({ ...e, cargando: true, error: null }));
    cargar()
      .then((datos) => {
        if (vigente) setEstado({ datos, error: null, cargando: false });
      })
      .catch((e: unknown) => {
        if (!vigente) return;
        const err = aErrorApp(e);
        if (err.tipo === 'sesion') void supabase.auth.signOut();
        setEstado((anterior) => ({ datos: anterior.datos, error: err.message, cargando: false }));
      });
    return () => {
      vigente = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, version]);

  return { ...estado, recargar: () => setVersion((v) => v + 1) };
}
