# AGENTS.md — Cardify

**Antes de editar:** lee `docs/START.md` y ejecuta el ritual (crear/entrar a tu rama). No preguntes la rama.

- Cursor → `feature/cursor` (worktree `.worktrees/cursor`).
- Anti-Gravity → `feature/antigravity` (worktree `.worktrees/antigravity`).
- `main` no se edita. Mezcla a `main` **solo** si Estiven lo pide. Después se borran las dos features.

También lee `docs/BRANCHING.md`, `docs/AI.md`, `docs/ARCHITECTURE.md` y `docs/LOGS.md`.

## Logs (al empezar)

- Lee `logs/local/_pending.json` (o los `AAAA-MM-DD.json` con `status: "pending"`).
- Arregla solo `pending` de tu zona. Marca `resolved` + `resolvedNote`.
- No re-revises resolved. No marques un bug de la otra IA.

## Reglas cortas

- Español, respuestas compactas.
- Cero emojis en UI. SVG propio.
- Cero botones o textos duplicados en la misma pantalla.
- Cursor no toca carga/perspectiva/blueprint. Anti-Gravity no toca barra/deselección/zoom/iconos/logs/shell.
- No agregues framework, backend ni dependencias en un parche.
- Deploy: Vercel. Supabase solo si Estiven lo pide.
- Commit/push solo con pedido explícito. Nunca push a `main` salvo la mezcla pedida.
- No subas fotos ni datos personales.
