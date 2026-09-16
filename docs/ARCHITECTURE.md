# Arquitectura de CardPDF

App de escritorio/móvil para maquetar carnets CR80 sobre una hoja (A4/Carta), recortar con perspectiva y exportar PDF/PNG/JPG.

## Hoy (Vite + TypeScript)

```
cardpdf/
  index.html              # UI completa (solo markup; el CSS salio de aqui)
  api/logs.js             # errores del cliente en produccion (Vercel)
  netlify/functions/logs.js  # lo mismo, en Netlify
  shared/log-entry.js     # logica comun de los dos, para que no se desvien
  netlify.toml            # build de Netlify
  vercel.json             # build de Vercel
  public/                 # manifest, sw.js, iconos (se copian tal cual a dist/)
  src/
    main.tsx              # entrada: estilos -> globales -> i18n -> legacy -> React
    App.tsx               # superficie React (login + galeria); null sin backend
    styles/app.css        # Tailwind por PostCSS + los estilos propios
    legacy/
      globals.ts          # expone jsPDF y confetti, que antes ponian los CDN
      i18n.js             # textos EN/ES
      app.js              # estado, lienzo, recorte, camara, export (~5.8k lineas)
    lib/supabase.ts       # cliente; null si faltan las variables
    features/auth/        # enlace magico por correo
    features/gallery/     # fotos privadas (bucket + URLs firmadas)
  supabase/migrations/    # bucket privado y policies de RLS
```

`npm run dev` levanta Vite; `npm run build` compila a `dist/`, que es lo que
sirve Vercel. Ya no se abre `index.html` a pelo: hay bundler y `package.json`.

### Lo que sigue pendiente de migrar

`src/legacy/app.js` e `i18n.js` todavia son JavaScript sin tipar y se comunican
por el ambito global: cada uno expone al final las funciones que el otro usa
(`t`, `initLang`, `updateUIFromState`, `scheduleRender`...). Ese puente se quita
cuando ambos esten partidos en modulos y tipados.

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

Dependencias npm: Tailwind (PostCSS), jsPDF 4.x, canvas-confetti, React, supabase-js.

## Lo que falta por partir

La migracion se hizo por etapas para no tocar el recorte. Criterio de corte que
sigue vigente: **un cambio de migracion no altera el flujo de recorte ni las
medidas CR80**; solo parte archivos y tipa.

Modulos objetivo, sacando trozos de `src/legacy/app.js` de uno en uno:

```
src/
  state/store.ts          # STATE + history
  canvas/render.ts        # hoja, snap, seleccion
  canvas/interaction.ts   # drag, resize, pan, zoom
  crop/                   # modal, homografia, lupa
  cards/                  # carga, camara, dropzone
  ui/                     # QuickBar, toasts, theme
  export/                 # PDF / PNG / print
```

Al mover algo fuera del legacy, quita tambien su linea del puente global.

### Supabase

El código ya está puesto, el proyecto todavía no. Es **opcional por diseño**:
`src/lib/supabase.ts` exporta `null` si faltan `VITE_SUPABASE_URL` y
`VITE_SUPABASE_ANON_KEY`, y entonces `App.tsx` no pinta nada. Sin variables,
CardPDF corre 100% en el cliente igual que siempre.

Cuando el proyecto exista:

1. Aplicar `supabase/migrations/0001_fotos_privadas.sql`: crea el bucket
   privado `cardpdf-photos` y las policies de RLS.
2. Poner las dos variables en Vercel.
3. Deshabilitar los signups en Supabase (Authentication → Sign Ups). Si no,
   cualquiera con un correo puede crearse cuenta y la galería deja de ser
   privada.

Las policies se apoyan en que cada objeto viva en `${auth.uid()}/…`. El prefijo
de carpeta no es cosmético: es lo que evalúan. El bucket es privado, así que la
galería pide URLs firmadas de una hora en vez de enlaces permanentes.
