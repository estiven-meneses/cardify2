/**
 * Errores del cliente en produccion, sobre Netlify.
 *
 * Mismo cometido que api/logs.js pero con la firma de Netlify Functions v2.
 * netlify.toml redirige /api/logs aqui, asi el cliente no cambia segun el
 * hosting. La linea se lee en los function logs de Netlify.
 */
import { construirRegistro, emite } from '../../shared/log-entry.js';

export default async function handler(req) {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204 });
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ ok: false, error: 'metodo' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  let cuerpo = {};
  try {
    cuerpo = await req.text();
  } catch {
    cuerpo = {};
  }

  emite(construirRegistro(cuerpo));
  return new Response(null, { status: 204 });
}
