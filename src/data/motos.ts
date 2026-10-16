/**
 * Consultas de la tabla `motos`. RLS filtra por dueño, así que no se pasa user_id
 * (lo pone la base con default auth.uid()). Las motos no se borran: se archivan.
 * Lanzan el error crudo de Supabase; la UI lo traduce con aErrorApp.
 */
import type { Moto, MotoNueva } from '../lib/tipos';
import { supabase } from './supabase';

const COLUMNAS = 'id, placa, alias, tarifa_diaria, encargado_nombre, encargado_telefono, archivada, created_at';

export async function listarMotos({ incluirArchivadas }: { incluirArchivadas: boolean }): Promise<Moto[]> {
  let consulta = supabase.from('motos').select(COLUMNAS).order('placa');
  if (!incluirArchivadas) consulta = consulta.eq('archivada', false);
  const { data, error } = await consulta;
  if (error) throw error;
  return data as Moto[];
}

export async function obtenerMoto(id: string): Promise<Moto> {
  const { data, error } = await supabase.from('motos').select(COLUMNAS).eq('id', id).single();
  if (error) throw error;
  return data as Moto;
}

export async function crearMoto(moto: MotoNueva): Promise<Moto> {
  const { data, error } = await supabase.from('motos').insert(moto).select(COLUMNAS).single();
  if (error) throw error;
  return data as Moto;
}

export async function actualizarMoto(
  id: string,
  cambios: Partial<MotoNueva> & { archivada?: boolean },
): Promise<Moto> {
  const { data, error } = await supabase.from('motos').update(cambios).eq('id', id).select(COLUMNAS).single();
  if (error) throw error;
  return data as Moto;
}
