/**
 * Configuración de Vite y Vitest.
 *
 * - Build de la SPA React (en la Task 11 se agrega el plugin PWA).
 * - Tests: unitarios junto al código (`src/**\/*.test.ts`) y de integración en `tests/`
 *   (estos últimos se saltan solos si no hay credenciales; ver tests/rls.integration.test.ts).
 */
/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'tests/**/*.test.ts'],
  },
});
