# Shell: Cardify es una aplicación, no una página web

Cardify se diseña y se comporta como **app nativa**. Nunca como sitio web con encabezado de marca, columnas de blog o export mezclado con la entrada.

## Tres zonas (fijas)

| Zona | Qué es | IDs |
|---|---|---|
| **Hoja** | Lienzo / mesa de trabajo | `#panel-canvas`, `#viewport-container` |
| **Ajustes** | Entrada y configuración | `#panel-sidebar`, `#panel-controls` |
| **Salida** | Exportar, imprimir, copiar | `#panel-output`, `#panel-export` |

No metas Salida dentro de Ajustes. No metas Ajustes dentro de la Hoja. Un botón = una acción por pantalla.

## Celular (iPhone)

- Cero encabezado de marca. Cero chrome de sitio web.
- Estructura: lienzo a pantalla + tab bar inferior `Hoja | Ajustes | Salida`.
- Safe area (`viewport-fit=cover`). Controles de acción ≥ 44px.
- Títulos grandes en Ajustes y Salida. Tema/reinicio viven en Ajustes.
- La hoja no comparte pantalla con paneles: una pestaña visible a la vez.

## Escritorio (app de escritorio)

- Cero layout de página web. No hay header horizontal de sitio.
- Tres columnas fijas: **Ajustes | Hoja | Salida**.
- Salida va a la **derecha** (`#panel-output`), con el chrome de la app (marca, tema, reinicio) arriba de exportar.
- Cada columna scrollea por dentro. El body no scrollea.
- Espacio generoso. Sin pastilla dentro de pastilla.

## Qué no hacer

- No devolver la exportación al panel izquierdo.
- No inventar una cuarta pestaña o un segundo botón de descargar.
- No tratar el lienzo como un `<article>` de web: es el viewport de la app.
