/**
 * Consultas de la tabla `categorias_gasto`: las categorías de gasto de cada usuario.
 * RLS filtra por dueño y la base pone user_id (default auth.uid()), igual que en motos.
 * - Nombre repetido (sin importar mayúsculas) → error 23505 ('duplicado' en aErrorApp).
 * - Borrar una categoría que ya tiene gastos → error 23503 ('en_uso'): solo se renombra.
 */
import type { CategoriaGasto } from '../lib/tipos';
import { supabase } from './supabase';

const COLUMNAS = 'id, nombre';

export async function listarCategorias(): Promise<CategoriaGasto[]> {
  const { data, error } = await supabase.from('categorias_gasto').select(COLUMNAS).order('nombre');
  if (error) throw error;
  return data as CategoriaGasto[];
}

export async function crearCategoria(nombre: string): Promise<CategoriaGasto> {
  const { data, error } = await supabase.from('categorias_gasto').insert({ nombre: nombre.trim() }).select(COLUMNAS).single();
  if (error) throw error;
  return data as CategoriaGasto;
}

export async function renombrarCategoria(id: string, nombre: string): Promise<CategoriaGasto> {
  const { data, error } = await supabase
    .from('categorias_gasto')
    .update({ nombre: nombre.trim() })
    .eq('id', id)
    .select(COLUMNAS)
    .single();
  if (error) throw error;
  return data as CategoriaGasto;
}

export async function eliminarCategoria(id: string): Promise<void> {
  const { error } = await supabase.from('categorias_gasto').delete().eq('id', id);
  if (error) throw error;
}
