import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';

import './styles/app.css';
// Orden deliberado: primero los globales del CDN, luego i18n (define `t`,
// que app.js usa en 88 sitios) y por ultimo el codigo heredado.
import './legacy/globals';
import './legacy/i18n.js';
import './legacy/app.js';

const mount = document.getElementById('cardpdf-react-root');
if (mount) {
  createRoot(mount).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
}
