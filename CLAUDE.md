# CLAUDE.md — CardPDF (Claude Desktop / Claude Code)

Al **primer turno**, antes de editar: lee `docs/START.md` y entra a tu rama. No preguntes la rama.

Eres **Claude**. Rama `feature/claude`. Worktree `.worktrees/claude`. Créala desde `origin/main` si no existe.

- No trabajes en `main` ni en `feature/cursor`, `feature/antigravity` o `feature/codex`.
- Mezcla a `main` **solo** si Estiven lo pide. Después se borra tu feature.
- Trae `main` a tu rama seguido: `git fetch origin && git merge origin/main`. Al empezar, antes de commitear y cuando sepas que otra IA mezcló. Mezclar `origin/main` sí; la rama de otra IA nunca.
- Zona: la que Estiven asigne. Si no la dice, pregunta solo la zona. No pises carga/recorte (Anti-Gravity) ni barra/zoom/iconos (Cursor) salvo que te las asigne.

También lee `docs/BRANCHING.md`, `docs/AI.md`, `docs/ARCHITECTURE.md`, `docs/SHELL.md`, `docs/LOGS.md`.

CardPDF es **app**, no web. Celular tipo iPhone: Hoja / Ajustes / Salida, sin encabezado. Escritorio: Ajustes | Hoja | Salida a la derecha. No metas export en Ajustes.

- Español, compacto.
- Cero emojis en UI. SVG propio. Cero botones duplicados.
- Logs: `logs/local/_pending.json`. Solo `pending` de tu zona.
- Commit/push solo si lo pide. Nunca push a `main` salvo la mezcla pedida.
- Sin framework/backend extra. Sin fotos ni datos personales.
