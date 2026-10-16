/**
 * Genera los íconos de la PWA (incluido apple-touch-icon para iOS) a partir de
 * public/logo.svg durante el build. Lo usa vite-plugin-pwa (opción pwaAssets).
 * Fondo amarillo placa en todos los tamaños (sin bordes blancos en iOS).
 */
import { defineConfig, minimal2023Preset } from '@vite-pwa/assets-generator/config';

const fondo = { background: '#ffcc00' };

export default defineConfig({
  headLinkOptions: { preset: '2023' },
  preset: {
    ...minimal2023Preset,
    maskable: { ...minimal2023Preset.maskable, resizeOptions: fondo },
    apple: { ...minimal2023Preset.apple, padding: 0.1, resizeOptions: fondo },
  },
  images: ['public/logo.svg'],
});
