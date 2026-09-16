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

Misma carpeta y formato en `logs/production/`. El cliente, fuera de localhost, envía a `/api/logs` (aún no hay función en Vercel). No inventes ese endpoint en un parche de UI.

## Servidor

```bash
python3 tools/dev-server.py          # http://127.0.0.1:4173
python3 tools/dev-server.py 4174     # otro puerto
```

Sirve el HTML y escribe logs. No abras esa URL esperando un dashboard: no lo hay.
