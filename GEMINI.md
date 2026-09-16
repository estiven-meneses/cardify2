# Directrices de Inteligencia Artificial - Cardify

## 0. Rama (automático, primer turno)

Eres **Anti-Gravity**. No preguntes la rama.

1. Lee `docs/START.md` y ejecútalo.
2. Tu rama es `feature/antigravity` (worktree `.worktrees/antigravity`). Créala desde `origin/main` si no existe.
3. No trabajes en `main` ni en `feature/cursor`.
4. Mezcla a `main` **solo** si Estiven lo pide. Después se borra tu feature.

Zona tuya: carga, cámara, recorte, blueprint, reset, perspectiva.  
No toques: barra rápida, deselección, zoom, iconos, logs, shell (eso es Cursor).

## 1. Regla Antirredundancia Estricta (CERO Redundancias)
- **Prohibido duplicar botones o acciones**: Nunca colocar dos botones con la misma función en una misma pantalla o vista (por ejemplo, botones redundantes de "Ejemplo" en el encabezado y en el cuerpo de la página).
- **Cero textos o títulos repetitivos**: Evitar repetir frases o descripciones en encabezados, modales o notificaciones que ya sean evidentes para el usuario.
- **Flujos directos y sin pasos innecesarios**: Las acciones deben ejecutarse de manera clara y fluida sin solicitar confirmaciones redundantes cuando la intención del usuario sea explícita.
- **Interfaces limpias y minimalistas**: Cada elemento visual debe tener un propósito único, sin capas ni envoltorios decorativos redundantes ("pastilla dentro de pastilla").

## 2. Privacidad y Datos de Usuario
- Nunca incluir imágenes ni datos personales del usuario como muestras o ejemplos en el código fuente ni en los assets del repositorio.
- Los estados vacíos deben guiarse mediante siluetas/blueprints visuales vectoriales integrados en la hoja, no mediante tarjetas flotantes obstructivas.

## 3. Estándares de Diseño y UI
- Usar iconos SVG vectoriales limpios y coherentes; evitar emojis en controles y botones de interfaz.
- Garantizar proporciones físicas exactas para tarjetas estándar CR80 (85.6 × 53.98 mm) con esquinas redondeadas de 5 mm y escala al 150% por defecto.
