/**
 * Configuración de Vite y Vitest.
 *
 * - Build de la SPA React como PWA (vite-plugin-pwa): manifest, íconos generados desde
 *   public/logo.svg (pwa-assets.config.ts) y service worker que precachea el cascarón
 *   de la app. Las llamadas a Supabase NO se cachean: guardar exige conexión (spec §6).
 * - Tests: unitarios junto al código (`src/**\/*.test.ts`) y de integración en `tests/`
 *   (estos últimos se saltan solos si no hay credenciales; ver tests/rls.integration.test.ts).
 */
/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      pwaAssets: { config: true, overrideManifestIcons: true },
      manifest: {
        name: 'Mototaxi — cuentas de alquiler',
        short_name: 'Mototaxi',
        description: 'Pagos, gastos y ganancias de tus motos',
        lang: 'es-CO',
        start_url: '/',
        display: 'standalone',
        background_color: '#eceef0',
        theme_color: '#ffcc00',
      },
      workbox: {
        navigateFallback: '/index.html',
        globPatterns: ['**/*.{js,css,html,svg,png,ico,webmanifest}'],
      },
    }),
  ],
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'tests/**/*.test.ts'],
  },
});
