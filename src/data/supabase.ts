/**
 * Cliente único de Supabase para toda la app.
 * La URL y la clave anon son públicas por diseño (viajan en el bundle): la seguridad
 * la da RLS en la base (ver la migración). La sesión se guarda en el dispositivo y se
 * renueva sola.
 */
import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const clave = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !clave) {
  throw new Error('Faltan VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY (ver .env.example)');
}

export const supabase = createClient(url, clave, {
  auth: { persistSession: true, autoRefreshToken: true },
});
