/**
 * Carga datos asíncronos para una pantalla y expone { datos, error, cargando, recargar }.
 * Traduce el error con aErrorApp. Si la sesión venció, cierra sesión: RutaProtegida
 * lleva entonces al login y, al volver a entrar, regresa a la misma pantalla.
 * Ignora respuestas viejas si las dependencias cambian antes de que llegue la anterior.
 * Si falla, reintenta sola al volver la señal (evento 'online'); `recargar` es el reintento manual.
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
        const err = aErrorApp(e, undefined, 'leer');
        if (err.tipo === 'sesion') void supabase.auth.signOut();
        setEstado((anterior) => ({ datos: anterior.datos, error: err.message, cargando: false }));
      });
    return () => {
      vigente = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, version]);

  // Si la carga falló, reintentar sola cuando vuelva la señal.
  useEffect(() => {
    if (!estado.error) return;
    const alVolverLaRed = () => setVersion((v) => v + 1);
    window.addEventListener('online', alVolverLaRed);
    return () => window.removeEventListener('online', alVolverLaRed);
  }, [estado.error]);

  return { ...estado, recargar: () => setVersion((v) => v + 1) };
}
