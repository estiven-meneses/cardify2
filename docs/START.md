# Ritual al empezar (automático)

Haz esto **en el primer turno**, sin preguntar la rama. No trabajes en `main`.

## Quién eres

| IA | Rama | Worktree | Zona (no pises la otra) |
|---|---|---|---|
| Cursor | `feature/cursor` | `.worktrees/cursor` | Barra, deselección, zoom, iconos, logs, shell |
| Anti-Gravity / Gemini | `feature/antigravity` | `.worktrees/antigravity` | Carga, cámara, recorte, blueprint, reset, perspectiva |

`main` es estable. Mezcla **solo** si Estiven dice “mezcla a main” (o equivalente).

## Comandos (tu nombre de rama / worktree)

```bash
git fetch origin

# 1) Si el worktree ya existe:
cd .worktrees/<cursor|antigravity>
git checkout feature/<cursor|antigravity>
git pull --ff-only origin feature/<cursor|antigravity>

# 2) Si la rama ya está en origin, pero no hay worktree:
git worktree add .worktrees/<cursor|antigravity> feature/<cursor|antigravity>

# 3) Si la rama no existe (chat nuevo después de un merge):
git worktree add .worktrees/<cursor|antigravity> -b feature/<cursor|antigravity> origin/main
```

Después: `git branch --show-current` debe ser **tu** rama. Si no, para.

Si el folder del repo está sucio con trabajo de la otra IA: **no lo limpies**. Usa tu worktree.

## Al terminar un arreglo (sin mezclar)

- Commit y push de **tu** rama solo si Estiven lo pide.
- Nunca `git merge` / `rebase` de la rama hermana.
- Nunca push a `main`.

## Cuando Estiven pide mezclar a main

Una sola IA lo hace (la que él nombre):

```bash
git fetch origin
git checkout main
git pull --ff-only origin main
git merge --no-ff origin/feature/cursor
git merge --no-ff origin/feature/antigravity
# resuelve conflictos; no pises el dominio de la otra
git push origin main
git push origin --delete feature/cursor feature/antigravity
git worktree remove --force .worktrees/cursor
git worktree remove --force .worktrees/antigravity
git branch -d feature/cursor feature/antigravity
```

Tras el merge esas dos features **se borran**. El próximo chat las vuelve a crear desde `origin/main`.
