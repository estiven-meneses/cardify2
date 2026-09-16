# Ramas y varias IAs a la vez

Hay **cuatro IAs** que pueden trabajar en paralelo. Cada una tiene **una rama fija**. Nunca comparten rama. Nunca mezclan código entre ellas. `main` es el único punto de encuentro, y solo cuando Estiven lo pide.

Ritual: `docs/START.md`.

## Mapa

| Rama | Quién | Archivo que la IA lee primero |
|---|---|---|
| `main` | Estable. Nadie trabaja aquí. | — |
| `feature/cursor` | Cursor | `AGENTS.md`, `.cursor/rules/` |
| `feature/antigravity` | Anti-Gravity (Gemini) | `GEMINI.md` |
| `feature/claude` | Claude Desktop / Claude Code | `CLAUDE.md` |
| `feature/codex` | Codex | `CODEX.md`, `AGENTS.md` |

Worktrees: `.worktrees/cursor`, `.worktrees/antigravity`, `.worktrees/claude`, `.worktrees/codex`.

## Al empezar (obligatorio, automático)

1. Lee `docs/START.md`.
2. Identifícate y entra a **tu** rama / worktree. Créala desde `origin/main` si no existe.
3. Lee `docs/TASKS.md` (solo `pending`).
4. No preguntes “¿en qué rama trabajo?”. Ya está definida.
5. Si ves suciedad o un merge a medias de otra IA: no lo toques.

## Prohibido

```bash
git checkout main                         # para editar, no. Solo para mezclar si Estiven lo pide.
git checkout -b feature/cursor feature/claude
git merge feature/antigravity             # si no eres quien Estiven nombró para mezclar
git rebase feature/codex
```

También prohibido: force-push a `main` o a la rama ajena; resolver conflictos ajenos.

## Cómo llega el trabajo a `main`

1. Cada IA commitea y pushea **su** rama (si Estiven lo pidió).
2. Estiven dice “mezcla a main”.
3. **Una** IA sigue el bloque de merge de `docs/START.md`.
4. Se borran las features de las IAs.
5. El siguiente chat las crea de nuevo desde `origin/main`.
