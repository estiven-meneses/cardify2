/**
 * Recoge los errores del cliente en produccion.
 *
 * El navegador ya hace POST aqui (ver `reportClientError` en src/legacy/app.js),
 * pero hasta ahora la funcion no existia y todo se perdia en un 404.
 *
 * No hay base de datos de por medio: se escribe una linea JSON en la salida de
 * la funcion, que Vercel guarda como runtime log. Asi una IA los lee con el
 * conector de Vercel (get_runtime_logs / get_runtime_errors) sin montar nada
 * mas. El prefijo [cardpdf-client] es el filtro para separarlos del ruido.
 */

const LIMITES = { message: 2000, stack: 8000, url: 500, userAgent: 400 };

function recorta(valor, max) {
  if (valor === undefined || valor === null) return '';
  return String(valor).slice(0, max);
}

export default function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }
  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, error: 'metodo' });
    return;
  }

  let payload = req.body;
  if (typeof payload === 'string') {
    try {
      payload = JSON.parse(payload);
    } catch {
      payload = {};
    }
  }
  if (!payload || typeof payload !== 'object') payload = {};

  const nivel = payload.level === 'warn' || payload.level === 'info' ? payload.level : 'error';

  const registro = {
    at: new Date().toISOString(),
    level: nivel,
    message: recorta(payload.message, LIMITES.message) || 'Error desconocido',
    source: recorta(payload.source, 120) || 'client',
    url: recorta(payload.url, LIMITES.url),
    userAgent: recorta(payload.userAgent, LIMITES.userAgent),
    stack: recorta(payload.stack, LIMITES.stack)
  };

  // Una sola linea: los logs de Vercel se leen y filtran mucho mejor asi.
  // console.error para que caiga tambien en get_runtime_errors.
  const linea = `[cardpdf-client] ${JSON.stringify(registro)}`;
  if (nivel === 'error') console.error(linea);
  else console.warn(linea);

  // 204: al cliente no le sirve la respuesta y asi no gasta ancho de banda.
  res.status(204).end();
}
