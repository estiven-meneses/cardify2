# Reglas para IAs que editan Cardify

Estiven quiere código limpio, compacto y sin adornos. Si una instrucción de este archivo choca con un pedido puntual del usuario, gana el pedido puntual.

## Idioma y tono

- Responde en **español**, corto, al punto. Sin relleno.
- No inventes metáforas ni nombres de features que el usuario no usó.
- Pregunta solo si estás bloqueado. Si se puede inferir, actúa.

## Antes de tocar código

Contéstales en silencio (y al usuario solo si hay duda real):

1. ¿Esto es UI, motor de canvas, recorte/perspectiva o carga de archivos?
2. ¿Otra IA o rama está tocando la misma zona? Si sí, **no la pises**. Lee `docs/BRANCHING.md`.
3. ¿El cambio introduce un segundo botón o texto que ya existe en la misma pantalla? Si sí, no lo hagas.
4. ¿Hace falta un framework, backend o dependencia nueva? Si no es imprescindible, no la agregues.

## Estructura y orden

- Un archivo = una responsabilidad. No sigas hinchando `script.js` ni `index.html` si el cambio es un módulo nuevo.
- Nombres en español para copy de UI; en inglés para IDs, funciones y archivos (`deselectCards`, `viewport-scroller`).
- Funciones pequeñas, con nombre que diga qué hacen. Cero comentarios que repitan el código.
- No dejes código muerto, `console.log` ni TODOs eternos.
- No crees markdown, READMEs extra ni carpetas “por si acaso”.
- No toques archivos que no pediste (incluye `GEMINI.md`, `IMPLEMENTATION_PLAN.md` y assets personales).

## UI (regla de oro)

- **Cero redundancia**: un botón = una acción por pantalla. Nada de “Ejemplo” dos veces, ni pastilla dentro de pastilla.
- **Cero emojis** en HTML, toasts, tooltips, alertas o botones. Solo SVG vectorial propio, nítido, 24×24.
- Táctil: controles de acción ≥ 44px. Escritorio: espacio generoso, jerarquía clara.
- Copy mínimo. Si el icono o el contexto ya lo dicen, no pongas un título extra.
- Al cambiar UI, verifica el flujo de punta a punta (no solo un screenshot). Si no hay browser, dilo.

## Dominios que no se pisan

| Zona | Archivos / funciones típicas | Quién la toca |
|---|---|---|
| Carga, cámara, recorte inmediato, blueprint, reset total | `loadFileIntoCard`, `captureCameraPhoto`, `detectDocumentQuad`, `#empty-state` | Bloque 1 |
| Barra rápida, deselección, zoom/scroll, iconos SVG | `#canvas-quick-bar`, `deselectCards`, `#viewport-scroller` | Bloque 2 |
| Homografía / perspectiva / lupa | `openCropModal`, `warpQuadToRectangle`, `cropState` | No reescribir “de paso” |

Si tu tarea es de un bloque, no “aprovechas” para rehacer el otro.

## Canvas y medidas

- CR80 = `85.6 × 53.98 mm`. Escala por defecto `150`. Radio por defecto `5 mm` (o el factory vigente).
- Frente / Dorso se posicionan en mm reales sobre la hoja. No hardcodees píxeles de hoja.
- Selección visual (`selectedCardId`) ≠ pestaña de ajustes (`activeCardId`). Deseleccionar oculta barra y recuadros.

## Hosting y backend

- Hoy es **100% frontend**. No metas backend, auth ni base de datos sin que Estiven lo pida.
- Deploy previsto: **Vercel** (estático o Vite). No asumas Netlify como requisito.
- **Supabase** solo si pide cuentas, plantillas en la nube o historial. Hasta entonces, `localStorage` está bien.

## Git y dos IAs (léete `docs/BRANCHING.md`)

- Una IA = una rama, siempre creada desde `origin/main`. Nunca desde la rama de la otra IA.
- Bloque 1 → `feature/bloque-1`. Bloque 2 → `feature/bloque-2`. Nadie trabaja en `main`.
- **Prohibido** merge/rebase entre `feature/bloque-1` y `feature/bloque-2`. El cruce es solo vía PR a `main`.
- Si no estás en tu rama, cámbiate. No “arregles” un conflicto de la otra.
- Commit y push **solo si lo pide**.
- No force-push a `main` ni a la rama ajena. No `--no-verify`.
- Mensajes cortos, estilo del repo: el *por qué*, no el listado de archivos.

## Qué no hacer nunca

- Incluir carnets, fotos o datos personales reales en el repo.
- Reintroducir emojis o botones de ejemplo duplicados.
- Cambiar `loadFileIntoCard` / detección de perspectiva “para limpiar”.
- Instalar librerías grandes (React, Tailwind build, etc.) en medio de un arreglo puntual. Eso es una migración, no un parche.
