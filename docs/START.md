# Ritual al empezar (automático)

Haz esto **en el primer turno**, sin preguntar la rama. No trabajes en `main`.

## Quién eres

| IA | Lee primero | Rama | Worktree | Zona |
|---|---|---|---|---|
| Cursor | `AGENTS.md`, `.cursor/rules/` | `feature/cursor` | `.worktrees/cursor` | Barra, deselección, zoom, iconos, logs, shell |
| Anti-Gravity / Gemini | `GEMINI.md` | `feature/antigravity` | `.worktrees/antigravity` | Carga, cámara, recorte, blueprint, reset, perspectiva |
| Claude Desktop / Claude Code | `CLAUDE.md` | `feature/claude` | `.worktrees/claude` | La que Estiven asigne. Si no dice zona, pregunta solo eso. |
| Codex | `CODEX.md`, `AGENTS.md` | `feature/codex` | `.worktrees/codex` | La que Estiven asigne. Si no dice zona, pregunta solo eso. |

No entres a la rama de otra IA. `main` es estable. Mezcla **solo** si Estiven dice “mezcla a main”.

## Comandos (cambia `<id>`: cursor | antigravity | claude | codex)

```bash
git fetch origin

# 1) Worktree ya existe:
cd .worktrees/<id>
git checkout feature/<id>
git pull --ff-only origin feature/<id>

# 2) Rama en origin, sin worktree:
git worktree add .worktrees/<id> feature/<id>

# 3) Rama no existe (chat nuevo después de un merge):
git worktree add .worktrees/<id> -b feature/<id> origin/main
```

Después: `git branch --show-current` = `feature/<id>`. Si no, para.

Si el repo está sucio con trabajo de otra IA: **no lo limpies**. Usa tu worktree.

## Al terminar un arreglo (sin mezclar)

- Commit y push de **tu** rama solo si Estiven lo pide.
- Nunca `git merge` / `rebase` de otra feature.
- Nunca push a `main`.

## Cuando Estiven pide mezclar a main

Una sola IA lo hace (la que él nombre):

```bash
git fetch origin
git checkout main
git pull --ff-only origin main

for id in cursor antigravity claude codex; do
  git rev-parse --verify "origin/feature/${id}" >/dev/null 2>&1 \
    && git merge --no-ff "origin/feature/${id}"
done

git push origin main

for id in cursor antigravity claude codex; do
  git push origin --delete "feature/${id}" 2>/dev/null || true
  git worktree remove --force ".worktrees/${id}" 2>/dev/null || true
  git branch -d "feature/${id}" 2>/dev/null || true
done
```

Tras el merge esas features **se borran**. El próximo chat las vuelve a crear desde `origin/main`.
