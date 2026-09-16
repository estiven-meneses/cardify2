# Arquitectura de CardPDF

App de escritorio/móvil para maquetar carnets CR80 sobre una hoja (A4/Carta), recortar con perspectiva y exportar PDF/PNG/JPG.

## Hoy (vanilla)

```
cardpdf/
  index.html      # UI completa + CSS Tailwind CDN + estilos propios
  script.js       # Estado, canvas, recorte, cámara, export (~4.5k líneas)
  icon.svg
  docs/           # estas reglas
```

No hay bundler ni `package.json`. Corre abriendo `index.html` o cualquier static host.

### Estado

Un `STATE` mutable (clon de `FACTORY_DEFAULTS`) + `INTERACTION` + `cropState` + `HISTORY`.

- `STATE.cards.frente | dorso`: imagen, recorte, escala %, x/y mm, radio, filtros.
- `STATE.selectedCardId`: qué se edita en el lienzo (`frente` | `dorso` | `both` | `null`).
- `STATE.activeCardId`: pestaña del panel de ajustes.
- `STATE.zoom`: zoom de vista. Si `> 1`, `#viewport-scroller` hace scroll/paneo.

Persistencia: `localStorage` (`cardpdf-theme`, `cardpdf-custom-defaults`).

### UI clave

| ID | Rol |
|---|---|
| `#viewport-container` | Mesa de trabajo |
| `#viewport-scroller` / `#viewport-stage` | Scroll cuando hay zoom |
| `#preview-canvas` | Hoja A4 renderizada |
| `#canvas-quick-bar` | Barra flotante del carnet seleccionado |
| `#crop-modal` | Recorte + perspectiva + lupa |
| `#panel-sidebar` / `#panel-controls` | Ajustes (entrada) |
| `#panel-output` / `#panel-export` | Salida (exportar) |
| `#empty-state` | Guía inicial (Bloque 1 puede sustituirla por blueprint) |

Shell tipo app: `docs/SHELL.md`. Celular = Hoja / Ajustes / Salida. Escritorio = Ajustes | Hoja | Salida (derecha).

Librerías CDN: Tailwind, jsPDF, canvas-confetti.

## ¿Puede seguir en HTML plano?

Sí para un prototipo. Ya duele para IAs y para ti:

- Un solo `script.js` gigante = diffs frágiles y conflictos entre agentes.
- Sin TypeScript = contratos invisibles (`selectedCardId` vs `activeCardId`).
- Tailwind CDN + HTML monolítico = UI difícil de reusar.

## Recomendación de migración (cuando Estiven lo pida)

**Vite + TypeScript + React en Vercel.** No hace falta backend.

Por qué este stack y no otro:

- Las IAs editan React/TS mejor que un `script.js` de 4k líneas.
- Vite es estático: `vercel` o incluso Netlify sirven el `dist/`. El bloqueo no es Netlify; es no tener módulos.
- Vercel encaja con Vite sin config rara. Plan gratis alcanza.
- Svelte es más liviano, pero hay menos contexto de entrenamiento y menos componentes listos.

### Módulos objetivo (no implementar hasta que se pida)

```
src/
  main.tsx
  state/store.ts          # STATE + history
  canvas/render.ts        # hoja, snap, selección
  canvas/interaction.ts   # drag, resize, pan, zoom
  crop/                   # modal, homografía, lupa
  cards/                  # carga, cámara, dropzone
  ui/                     # QuickBar, toasts, theme
  export/                 # PDF / PNG / print
```

Criterio de corte: un PR de migración **no** cambia el flujo de recorte ni las medidas CR80. Solo parte archivos y tipa.

### ¿Supabase?

No todavía. CardPDF procesa imágenes en el cliente.

Úsalo el día que pida una de estas: login, plantillas en la nube, historial entre dispositivos, compartir un layout. Hasta entonces es costo y superficie de auth de más.

Si llega: una tabla `profiles` + `templates` (json del STATE sin `rawImage`) y Storage solo si guarda fotos del usuario (con cuidado de privacidad).
