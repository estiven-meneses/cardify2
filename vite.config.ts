import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    // El lienzo y el export manejan imagenes grandes; no inlinees assets.
    assetsInlineLimit: 0
  },
  server: { port: 5173 }
});
