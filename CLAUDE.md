# CLAUDE.md — CardPDF (Claude Desktop / Claude Code)

Al **primer turno**, antes de editar: lee `docs/START.md` y entra a tu rama. No preguntes la rama.

Eres **Claude**. Rama `feature/claude`. Worktree `.worktrees/claude`. Créala desde `origin/main` si no existe.

- No trabajes en `main` ni en `feature/cursor`, `feature/antigravity` o `feature/codex`.
- Al terminar un cambio: trae `main` otra vez, resuelve conflictos entendiendo qué buscaba el otro lado, verifica que compila y **entonces** integra tu rama a `main`. Tu rama no se borra.
- Trae `main` a tu rama seguido: `git fetch origin && git merge origin/main`. Al empezar, antes de commitear y cuando sepas que otra IA mezcló. Mezclar `origin/main` sí; la rama de otra IA nunca.
- Zona: la del encargo. Si no se dice, la que toque, sin rehacer de paso carga/recorte (Anti-Gravity) ni barra/zoom/iconos (Cursor).

También lee `docs/BRANCHING.md`, `docs/AI.md`, `docs/ARCHITECTURE.md`, `docs/SHELL.md`, `docs/LOGS.md`.

CardPDF es **app**, no web. Celular tipo iPhone: Hoja / Ajustes / Salida, sin encabezado. Escritorio: Ajustes | Hoja | Salida a la derecha. No metas export en Ajustes.

- Español, compacto.
- Cero emojis en UI. SVG propio. Cero botones duplicados.
- Logs: `logs/local/_pending.json`. Solo `pending` de tu zona.
- Commitea y pushea tu rama al terminar. A `main` se llega con merge, nunca editándola.
- Stack: Vite + TypeScript, React para lo nuevo, Supabase opcional. Sin fotos ni datos personales en el repo.
