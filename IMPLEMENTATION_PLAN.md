# Plan de Implementación: Cardify Pro (Rediseño, Blueprint Visual, Recorte Inmediato y Deselección)

Plan de trabajo estructurado en **dos bloques independientes** para atender con máxima precisión y sin redundancias todas las solicitudes del usuario.

---

## User Review Required

> [!IMPORTANT]
> - **Eliminación de datos personales**: Se removerán definitivamente los carnets de prueba de `recursos/carnet confa *.png` y los botones redundantes de "Ejemplo".
> - **Nuevo estado inicial**: En lugar de la tarjeta modal flotante que tapaba la hoja (`media_1789529637759.png`), la hoja A4 mostrará directamente una guía visual elegante estilo blueprint/wireframe (boceto punteado del frente y dorso) para que el usuario entienda cómo se colocarán sus carnets sin obstruir la vista.
> - **Flujo de recorte**: Al subir o fotografiar un carnet, se abrirá **de inmediato** el estudio de perspectiva/recorte, y al confirmar se aplicará automáticamente **escala = 150%** y **radio de esquinas = 5 mm**.

---

## Bloque 1: Experiencia de Carga, Flujo de Recorte Obligatorio & Blueprint en la Hoja

### 1. Regla Antirredundancia (`GEMINI.md`)
- Crear `GEMINI.md` en la raíz del proyecto estableciendo directrices permanentes:
  - Cero duplicación de botones con la misma función en una misma pantalla.
  - Cero textos repetitivos o redundantes en encabezados, modales o tooltips.
  - Mantener la interfaz limpia, minimalista y directa.

### 2. Eliminación de Carnets Personales y Botones de Ejemplo
- Eliminar los archivos personales `recursos/carnet confa 1.png` y `recursos/carnet confa 2.png`.
- Eliminar el botón "Ejemplo" del encabezado (`#btn-load-demo`).
- Eliminar la tarjeta modal flotante `#empty-state` (`media_1789529637759.png`).

### 3. Blueprint Ilustrativo Dibujado en la Hoja Vacía
- Cuando no haya imágenes cargadas (`!STATE.cards.frente.rawImage && !STATE.cards.dorso.rawImage`), el motor de renderizado del canvas (`renderCanvas`) o un overlay vectorial SVG proyectará directamente sobre el papel A4:
  - Silueta estética y sutil del **Frente** en la posición superior ($Y=21$), con esquinas redondeadas de $5\text{ mm}$, icono de foto/carnet y líneas guía tenues.
  - Silueta estética y sutil del **Dorso** en la posición inferior ($Y=-8$), con franja magnética / chip estilizado.
  - Mensaje sutil y profesional integrado en la composición: *"Sube o toma foto de tu carnet para colocarlo aquí"*.

### 4. Flujo de Recorte Inmediato al Cargar / Fotografiar
- Modificar `loadFileIntoCard` y `captureCameraPhoto`:
  - En cuanto la imagen se carga en memoria, abre **directamente** el modal de recorte y perspectiva (`openCropModal(cardId)`).
  - La detección de 4 esquinas por contraste extremal se ejecuta automáticamente.
  - Al presionar `[ Aplicar Recorte & Aplanar ]`:
    - Aplica la homografía perpendicular CR80.
    - Fija automáticamente: `scale = 150`, `borderRadiusMm = 5`, `xMm = 0`, `yMm = 21` (frente) o `-8` (dorso), `rotation = 0`.
    - Coloca el carnet recortado en la hoja.

### 5. Arreglo del Botón de Refrescar / Reiniciar en el Encabezado
- Reparar `#btn-reset-all`:
  - Limpiar por completo las imágenes cargadas en el estado (`rawImage = null`, `croppedCanvas = null`, `cachedCanvas = null`).
  - Restablecer dropzones al estado vacío original.
  - Restaurar valores por defecto (150%, 5 mm, centrado).
  - Redibujar la hoja con el blueprint inicial y emitir confirmación clara: *"Aplicación reiniciada a nuevo"*.

---

## Bloque 2: Rediseño de la Barra Rápida, Deselección, Scroll en Zoom & Iconos SVG

### 1. Rediseño Espacioso de la Barra Rápida Flotante (`media_1789529780406.png`)
- Rediseñar `#canvas-quick-bar`:
  - Eliminar el apilamiento y los estilos "pastilla dentro de pastilla".
  - Estructura limpia con 4 zonas bien definidas:
    1. **Identificador de Cara**: Chip nítido (`Frente` / `Dorso` / `Ambos`).
    2. **Escala**: Botón `−`, porcentaje numérico grande (ej. `150%`), botón `+`.
    3. **Herramientas**: Botones independientes con espaciado generoso para Rotar ($90^\circ$), Recortar y Centrado ($X$, $Y$).
    4. **Botón de Deseleccionar (`✕`)**: Permite cerrar la barra y quitar la selección inmediatamente.
  - Tamaño táctil cómodo tanto en escritorio como en smartphones.

### 2. Deselección Confiable de Carnets
- Permitir deseleccionar:
  - Al hacer clic o tap en cualquier zona vacía del papel o del contenedor `#viewport-container`.
  - Al presionar la tecla `Escape` en el teclado.
  - Al presionar el nuevo botón de deseleccionar en la barra rápida.
- Al deseleccionar, se oculta la barra flotante y las líneas delimitadoras, mostrando la hoja limpia.

### 3. Scroll y Panning en el Canvas en Escritorio
- Modificar `#viewport-container` y el layout del lienzo:
  - Habilitar desplazamiento con scroll horizontal y vertical cuando `STATE.zoom > 1.0` (`overflow: auto` con scrollbars sutiles).
  - Permitir paneo mediante arrastre sobre el fondo del lienzo cuando se está en niveles altos de zoom.
  - Asegurar que ningún borde de la hoja quede inaccesible o cortado al hacer zoom a 150%, 200% o 250%.

### 4. Eliminación Total de Emojis por Iconos SVG Propios
- Reemplazar todos los emojis de la interfaz, alertas y toasts por iconos SVG vectoriales:
  - ✂️ $\rightarrow$ SVG de tijeras de corte.
  - 🎯 $\rightarrow$ SVG de diana / centrado de coordenadas.
  - 🌙 / ☀️ $\rightarrow$ SVG de luna y sol vectoriales.
  - 📐 $\rightarrow$ SVG de escuadra geométrica.
  - 🔄 / ↺ $\rightarrow$ SVG de flecha de giro suave.
  - 🔲 $\rightarrow$ SVG de encuadre rectangular.
  - 📸 $\rightarrow$ SVG de cámara fotográfica.
  - 👥 $\rightarrow$ SVG de dos tarjetas combinadas.
  - 🔍 $\rightarrow$ SVG de lupa de precisión.
  - ✨ / ⭐ $\rightarrow$ SVG de estrella / ajuste favorito.
  - ✕ $\rightarrow$ SVG de cierre limpio.

---

## Proposed Changes

### Bloque 1
- `[NEW]` [GEMINI.md](file:///Users/estivenmeneses/vsCode/personal/cardify2/GEMINI.md)
- `[DELETE]` `recursos/carnet confa 1.png` y `recursos/carnet confa 2.png`
- `[MODIFY]` [index.html](file:///Users/estivenmeneses/vsCode/personal/cardify2/index.html)
- `[MODIFY]` [script.js](file:///Users/estivenmeneses/vsCode/personal/cardify2/script.js)

### Bloque 2
- `[MODIFY]` [index.html](file:///Users/estivenmeneses/vsCode/personal/cardify2/index.html)
- `[MODIFY]` [script.js](file:///Users/estivenmeneses/vsCode/personal/cardify2/script.js)

---

## Verification Plan

### Automated Tests
- Validación de sintaxis JavaScript: `node --check script.js`.
- Verificación de ausencia de emojis residuales en el código: script regex de búsqueda.

### Manual Verification
1. **Verificación de Bloque 1**:
   - Abrir la app limpia: comprobar que la hoja A4 muestra el boceto blueprint estético y que ya no existe la tarjeta modal de "Ejemplo".
   - Probar el botón de refrescar (arriba a la derecha): verificar que reinicia la app limpiamente.
   - Subir una imagen o tomar foto: verificar que se abre de inmediato en el modal de recorte.
   - Aplicar recorte: verificar que se coloca en la hoja con escala al 150% y radio de 5 mm.
2. **Verificación de Bloque 2**:
   - Tocar un carnet: verificar que la barra rápida se ve espaciosa, sin desorden ni emojis.
   - Hacer clic fuera o presionar `Escape`: verificar que se deselecciona limpiamente.
   - En escritorio, subir el zoom al 200%: verificar que aparecen barras de scroll para desplazarse libremente por toda la hoja.
