import { describe, expect, it, vi } from 'vitest';
import { aErrorApp, ErrorApp } from './errores';

describe('aErrorApp', () => {
  it('reconoce la falta de red de Safari ("Load failed")', () => {
    const e = aErrorApp(new TypeError('Load failed'), true);
    expect(e.tipo).toBe('sin_conexion');
    expect(e.message).toBe('No hay conexión a internet. Revisa la señal y toca Guardar de nuevo.');
  });
  it('al leer datos sin red no dice que algo "no se guardó"', () => {
    const e = aErrorApp(new TypeError('Load failed'), true, 'leer');
    expect(e.tipo).toBe('sin_conexion');
    expect(e.message).toBe('No hay conexión a internet. No se pudieron cargar los datos.');
  });
  it('reconoce la falta de red de Chrome y el error envuelto por supabase-js', () => {
    expect(aErrorApp({ message: 'TypeError: Failed to fetch', code: '' }, true).tipo).toBe('sin_conexion');
  });
  it('si el navegador dice que está offline, gana eso', () => {
    expect(aErrorApp({ message: 'cualquier cosa', code: 'XX' }, false).tipo).toBe('sin_conexion');
  });
  it('traduce duplicados de Postgres', () => {
    expect(aErrorApp({ code: '23505', message: 'duplicate key value' }, true).tipo).toBe('duplicado');
  });
  it('detecta la sesión vencida', () => {
    expect(aErrorApp({ code: 'PGRST301', message: 'JWT expired' }, true).tipo).toBe('sesion');
    expect(aErrorApp({ message: 'JWT expired' }, true).message).toBe('Tu sesión venció. Vuelve a iniciar sesión.');
  });
  it('traduce credenciales inválidas del login', () => {
    const e = aErrorApp({ code: 'invalid_credentials', message: 'Invalid login credentials' }, true);
    expect(e.tipo).toBe('credenciales');
    expect(e.message).toBe('Correo o contraseña incorrectos.');
  });
  it('traduce "no encontrado" de PostgREST', () => {
    expect(aErrorApp({ code: 'PGRST116', message: 'no rows' }, true).tipo).toBe('no_encontrado');
  });
  it('cualquier otro error queda como genérico y se registra en consola', () => {
    const consola = vi.spyOn(console, 'error').mockImplementation(() => {});
    const e = aErrorApp(new Error('boom'), true);
    expect(e.tipo).toBe('desconocido');
    expect(e.message).toBe('Algo salió mal. Intenta de nuevo.');
    expect(consola).toHaveBeenCalled();
    consola.mockRestore();
  });
  it('deja pasar un ErrorApp tal cual', () => {
    const original = new ErrorApp('duplicado');
    expect(aErrorApp(original, true)).toBe(original);
  });
});
