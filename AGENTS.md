# AGENTS.md — CardPDF

**Antes de editar:** lee `docs/START.md` y entra a tu rama. No preguntes la rama.

| Si eres | Rama | Worktree |
|---|---|---|
| Cursor | `feature/cursor` | `.worktrees/cursor` |
| Codex | `feature/codex` | `.worktrees/codex` |
| Anti-Gravity | `feature/antigravity` | `.worktrees/antigravity` |
| Claude Desktop | `feature/claude` | `.worktrees/claude` |

Identifícate por el producto (Cursor vs Codex). Claude lee `CLAUDE.md`. Anti-Gravity lee `GEMINI.md`.

- `main` no se edita. Mezcla **solo** si Estiven lo pide. Después se borran esas features.
- Claude/Codex: zona la que Estiven asigne. Cursor no toca carga/perspectiva. Anti-Gravity no toca barra/zoom/iconos.

También lee `docs/BRANCHING.md`, `docs/AI.md`, `docs/ARCHITECTURE.md`, `docs/SHELL.md` y `docs/LOGS.md`.

CardPDF es **app**, no web. Celular = iPhone (Hoja / Ajustes / Salida). Escritorio = tres columnas (Ajustes | Hoja | Salida a la derecha). Detalle: `docs/SHELL.md`.

## Logs (al empezar)

- Lee `logs/local/_pending.json` (o los `AAAA-MM-DD.json` con `status: "pending"`).
- Arregla solo `pending` de tu zona. Marca `resolved` + `resolvedNote`.
- No re-revises resolved. No marques un bug de otra IA.

## Reglas cortas

- Español, respuestas compactas.
- Cero emojis en UI. SVG propio.
- Cero botones o textos duplicados en la misma pantalla.
- No agregues framework, backend ni dependencias en un parche.
- Deploy: Vercel. Supabase solo si Estiven lo pide.
- Commit/push solo con pedido explícito. Nunca push a `main` salvo la mezcla pedida.
- No subas fotos ni datos personales.
