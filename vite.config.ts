import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    // El lienzo y el export manejan imagenes grandes; no inlinees assets.
    assetsInlineLimit: 0
  },
  server: {
    port: 5173,
    // El registro local de errores sigue viviendo en tools/dev-server.py, que
    // deduplica y lleva la cuenta en logs/local/. Vite le pasa esas rutas para
    // no duplicar esa logica. Si el servidor de Python no esta levantado, la
    // peticion falla y el cliente ya la ignora (reportClientError la traga).
    proxy: {
      '/__log__': 'http://127.0.0.1:4173',
      '/__logs__': 'http://127.0.0.1:4173',
      '/api/logs': 'http://127.0.0.1:4173'
    }
  }
});
