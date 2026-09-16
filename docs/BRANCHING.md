# Ramas y dos IAs a la vez

Hay **dos IAs en paralelo**: Cursor y Anti-Gravity. Cada una tiene **una rama fija**. Nunca comparten rama. Nunca mezclan código entre ellas. `main` es el único punto de encuentro, y solo cuando Estiven lo pide.

Ritual completo: `docs/START.md`.

## Mapa

| Rama | Quién | De dónde sale |
|---|---|---|
| `main` | Estable. Nadie trabaja aquí. | — |
| `feature/cursor` | Cursor | `origin/main` |
| `feature/antigravity` | Anti-Gravity (Gemini) | `origin/main` |

Worktrees: `.worktrees/cursor` y `.worktrees/antigravity`. Así no se pisan el working tree.

## Al empezar (obligatorio, automático)

1. Lee `docs/START.md`.
2. Identifícate y entra a **tu** rama / worktree. Créala desde `origin/main` si no existe.
3. No preguntes “¿en qué rama trabajo?”. Ya está definida.
4. Si ves suciedad o un merge a medias de la otra IA: no lo toques.

## Prohibido

```bash
git checkout main                    # para editar, no. Solo para mezclar si Estiven lo pide.
git checkout -b feature/cursor feature/antigravity
git merge feature/antigravity        # si eres Cursor
git merge feature/cursor             # si eres Anti-Gravity
git rebase feature/antigravity
```

También prohibido: force-push a `main` o a la rama ajena; resolver conflictos ajenos.

## Cómo llega el trabajo a `main`

1. Cada IA commitea y pushea **su** rama (si Estiven lo pidió).
2. Estiven dice “mezcla a main”.
3. **Una** IA sigue el bloque de merge de `docs/START.md`.
4. Se borran `feature/cursor` y `feature/antigravity`.
5. El siguiente chat las crea de nuevo desde `origin/main`.

Si una IA necesita lo que ya está en `main` (después del merge), no copie la feature hermana: `git fetch` + rebase/ff de **su** rama sobre `origin/main` solo cuando Estiven lo pida o cuando cree la rama nueva.
