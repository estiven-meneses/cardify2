# Logs de errores (local y producción)

No hay panel. El “backend” local solo escribe archivos. Las IAs **deben** leerlos al empezar y al terminar un arreglo.

## Dónde están

```
logs/
  local/              # pruebas en http://127.0.0.1
    AAAA-MM-DD.json   # un archivo por día
    _pending.json     # índice de lo que sigue abierto (se regenera solo)
  production/         # mismo formato, cuando exista el endpoint de prod
```

Los JSON del día **no se commitean** (pueden tener datos de prueba). Las IAs los leen en este workspace.

## Cómo se genera un log

1. Arranca el servidor sin UI: `python3 tools/dev-server.py` (puerto 4173).
2. Prueba la app en `http://127.0.0.1:4173`.
3. Cualquier `window.onerror`, promesa rechazada o toast `error`/`warning` hace POST a `/__log__`.
4. Queda en `logs/local/AAAA-MM-DD.json` con hora, mensaje, stack, url y `status: "pending"`.
5. Si el mismo error se repite el mismo día, no se duplica: sube `count` y `lastSeenAt`.

## Ritual obligatorio de cada IA

1. Lee `logs/local/_pending.json`. Si no existe, mira los `AAAA-MM-DD.json` y filtra `status === "pending"`.
2. Si hay pendientes, **arréglalos** (o el que te toque por bloque; no pises al otro).
3. Cuando esté corregido, marca el ítem:
   - `"status": "resolved"`
   - `"resolvedAt":` ISO
   - `"resolvedNote":` una línea de qué cambiaste
   - o `POST /__logs__/resolve` con `{ "id": "e-...", "note": "..." }`
4. **No reabras ni re-investigues** un `resolved`. Otra IA no debe gastar tiempo ahí.
5. Si el arreglo no es de tu bloque, déjalo `pending` y avisa. No lo marques resolved.

## Campos

| Campo | Uso |
|---|---|
| `id` | Identificador único del evento |
| `status` | `pending` o `resolved` |
| `time` / `createdAt` | Hora local del primer fallo |
| `level` | `error` o `warning` |
| `message` / `stack` | Qué falló |
| `source` | `window.onerror`, `unhandledrejection`, `toast` |
| `count` | Veces que se repitió el mismo fallo ese día |
| `resolvedNote` | Por qué ya no hay que tocarlo |

## Producción

Fuera de localhost el cliente envía a **`/api/logs`**, que ya existe
(`api/logs.js`). No escribe en disco: emite una línea JSON con el prefijo
`[cardpdf-client]` que Vercel guarda como runtime log.

En Netlify los recoge `netlify/functions/logs.js` y se leen en los function
logs del panel. En Vercel, con el conector:

- `get_runtime_logs` filtrando por `[cardpdf-client]` — todo lo que reportó el
  navegador: mensaje, stack, URL, user agent.
- `get_runtime_errors` — además, lo que reviente dentro de la propia función.

Así se arregla un fallo de producción: lees el log, reproduces con esa URL y
ese user agent, y corriges. No hace falta base de datos ni panel.

## Servidor

La app se levanta con Vite; `tools/dev-server.py` ya no la sirve (desde la
migración, `index.html` carga módulos que resuelve el bundler). Sigue siendo el
que **registra** los errores, y Vite le pasa `/__log__`, `/__logs__` y
`/api/logs` por proxy. Son dos procesos:

```bash
python3 tools/dev-server.py          # registro de errores, puerto 4173
npm run dev                          # la app, http://localhost:5173
```

Si no levantas el de Python no se rompe nada: la petición falla y el cliente la
ignora. Solo te quedas sin registro local.

Sirve el HTML y escribe logs. No abras esa URL esperando un dashboard: no lo hay.
