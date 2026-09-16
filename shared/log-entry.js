/**
 * Logica comun de los dos endpoints de errores del cliente.
 *
 * Hay dos porque hay dos hostings: Vercel (api/logs.js) y Netlify
 * (netlify/functions/logs.js), y cada uno tiene su firma. Lo que no se duplica
 * es esto, para que no se desincronicen los limites ni el formato de la linea.
 */

const LIMITES = { message: 2000, stack: 8000, url: 500, userAgent: 400, source: 120 };

function recorta(valor, max) {
  if (valor === undefined || valor === null) return '';
  return String(valor).slice(0, max);
}

/** Acepta objeto, cadena JSON o basura; nunca lanza. */
export function normalizaPayload(entrada) {
  let payload = entrada;
  if (typeof payload === 'string') {
    try {
      payload = JSON.parse(payload);
    } catch {
      payload = {};
    }
  }
  return payload && typeof payload === 'object' ? payload : {};
}

export function construirRegistro(entrada) {
  const payload = normalizaPayload(entrada);
  const level = payload.level === 'warn' || payload.level === 'info' ? payload.level : 'error';

  return {
    at: new Date().toISOString(),
    level,
    message: recorta(payload.message, LIMITES.message) || 'Error desconocido',
    source: recorta(payload.source, LIMITES.source) || 'client',
    url: recorta(payload.url, LIMITES.url),
    userAgent: recorta(payload.userAgent, LIMITES.userAgent),
    stack: recorta(payload.stack, LIMITES.stack)
  };
}

/**
 * Una sola linea, con prefijo fijo: asi se filtra en los logs del hosting.
 * console.error para que caiga tambien en los informes de errores.
 */
export function emite(registro) {
  const linea = `[cardpdf-client] ${JSON.stringify(registro)}`;
  if (registro.level === 'error') console.error(linea);
  else console.warn(linea);
  return linea;
}
