/**
 * Errores del cliente en produccion, sobre Vercel.
 *
 * El navegador ya hacia POST aqui (`reportClientError` en src/legacy/app.js).
 * No hay base de datos: se escribe una linea JSON con prefijo
 * [cardpdf-client] en los runtime logs, que una IA lee con el conector de
 * Vercel (get_runtime_logs / get_runtime_errors).
 *
 * El gemelo para Netlify vive en netlify/functions/logs.js.
 */
import { construirRegistro, emite } from '../shared/log-entry.js';

export default function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }
  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, error: 'metodo' });
    return;
  }

  emite(construirRegistro(req.body));

  // 204: al cliente no le sirve la respuesta.
  res.status(204).end();
}
