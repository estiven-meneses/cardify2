# Ritual al empezar (automático)

Haz esto **en el primer turno**, sin preguntar la rama. No trabajes en `main`.

## Quién eres

| IA | Lee primero | Rama | Worktree | Zona |
|---|---|---|---|---|
| Cursor | `AGENTS.md`, `.cursor/rules/` | `feature/cursor` | `.worktrees/cursor` | Barra, deselección, zoom, iconos, logs, shell |
| Anti-Gravity / Gemini | `GEMINI.md` | `feature/antigravity` | `.worktrees/antigravity` | Carga, cámara, recorte, blueprint, reset, perspectiva |
| Claude Desktop / Claude Code | `CLAUDE.md` | `feature/claude` | `.worktrees/claude` | La del encargo. Si no se dice, la que toque, evitando zonas ajenas. |
| Codex | `CODEX.md`, `AGENTS.md` | `feature/codex` | `.worktrees/codex` | La del encargo. Si no se dice, la que toque, evitando zonas ajenas. |

No entres a la rama de otra IA. `main` siempre debe compilar: integras ahí tu trabajo cuando esté verificado.

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

## Sincroniza con `main` (obligatorio, y no solo al empezar)

`main` se mueve mientras trabajas: otra IA puede haber mezclado ahí hace diez
minutos. Si no traes esos cambios, tu rama se aleja y el conflicto crece.

Trae `main` a **tu** rama en estos tres momentos:

1. Al empezar cada chat, antes de editar nada.
2. Antes de commitear.
3. Antes de integrar a `main`.

```bash
git fetch origin
git merge origin/main      # desde tu worktree, con tu rama activa
```

Reglas de la sincronización:

- La dirección es siempre `main` -> tu rama. **Nunca** al revés sin que
  Estiven pida la mezcla.
- Esto **no** contradice "nunca mezcles otra feature": `origin/main` sí,
  `origin/feature/<otra-ia>` no. Sigue prohibido.
- Si hay conflicto, resuelves **solo tu zona**. Lo de otra IA se queda como
  viene de `main` y encima reaplicas lo mínimo para que tu cambio funcione.
- Si no tienes nada que commitear todavía, `git merge --ff-only origin/main`
  te avisa si te desviaste sin querer.

Comprobar si estás atrasado, sin mezclar nada:

```bash
git log --oneline HEAD..origin/main    # vacío = estás al día
```

## Ciclo de trabajo (obligatorio, de principio a fin)

Todo cambio sigue estos cinco pasos. El orden importa: los pasos 1 y 3 son los
que evitan el conflicto, y el 3 va **antes** de integrar, nunca después.

1. **Traer `main`.** `git fetch origin && git merge origin/main`, desde tu rama.
2. **Trabajar.** Solo tu zona. Commits pequeños y con mensaje que explique el
   porqué, no el qué.
3. **Volver a traer `main`.** Mientras trabajabas pudo moverse. Este segundo
   `merge origin/main` es el que de verdad evita el choque, porque resuelves
   en **tu** rama, donde un error no rompe a nadie más.
4. **Verificar después de mezclar.** Un merge sin conflictos igual puede dejar
   la app rota. Compila (`npm run build`) y prueba lo que tocaste. Si no
   compila, arréglalo en tu rama, no en `main`.
5. **Integrar a `main`.** `git checkout main && git merge --no-ff feature/<id>`
   y `git push origin main`.

### Cómo se resuelven los conflictos

**Entiende antes de elegir.** Un conflicto son dos intenciones, no dos textos.

- Lee el commit del otro lado (`git log --merge`, `git show <sha>`) y averigua
  **qué buscaba** antes de tocar nada.
- **No descartes el lado ajeno** para que compile. Si son incompatibles de
  verdad, conserva el de `main`, deja el tuyo fuera y anótalo en
  `docs/TASKS.md` como `pending` explicando el choque. No bloqueas a nadie y
  no se pierde el contexto.
- Si el conflicto cae **fuera de tu zona**, el lado de `main` manda. Solo
  reaplica encima lo mínimo para que tu cambio siga funcionando.
- Si alguien movió o renombró un archivo que tú editaste, replica tu cambio
  sobre la ruta nueva. No resucites el archivo viejo.
- Deja dicho en el mensaje del merge qué conservaste de cada lado y por qué.

### Lo que este ciclo **no** incluye

- **No corras el bloque de limpieza** de más abajo como parte del ciclo. Borra
  ramas y worktrees de todas las IAs. Solo es seguro cuando **ningún** worktree
  tiene cambios sin commitear; compruébalo antes, no lo supongas.
- Integrar a `main` no borra tu rama. Sigues en ella para lo siguiente.

> Integrar es parte del trabajo, no un permiso que se pide: cada IA lleva su
> cambio hasta `main` en cuanto está verificado. Lo único que no se hace sin
> comprobar antes es **borrar** ramas, porque eso sí destruye trabajo ajeno.

## Lo que sigue prohibido

- Nunca `git merge` / `rebase` de **otra feature**. `origin/main` sí; la rama
  de otra IA no.
- Nunca `push --force` a `main` ni a una rama ajena.
- Nunca commitees trabajo sin commitear de otra IA ni limpies su worktree.
- Nunca dejes `main` sin compilar. Si tu merge la rompe, arréglalo o deshazlo
  (`git revert`) en el momento.

## Cierre de ronda (borrar las ramas)

Con el ciclo de trabajo, cada IA ya llevó lo suyo a `main`. Esto solo borra las
ramas para empezar limpio. Lo hace una IA, y **la guarda de abajo no se quita**:
este bloque ya destruyó trabajo sin commitear de otra IA dos veces.

```bash
set -e
git fetch origin

# Guarda: si algun worktree tiene cambios sin commitear, no se borra nada.
sucio=""
for id in cursor antigravity claude codex; do
  d=".worktrees/${id}"
  [ -d "$d" ] || continue
  [ -n "$(git -C "$d" status --porcelain)" ] && sucio="${sucio} ${id}"
done
if [ -n "$sucio" ]; then
  echo "ABORTADO. Trabajo sin commitear en:${sucio}"
  echo "Esa IA debe commitear e integrar antes de cerrar la ronda."
  exit 1
fi

# Red de seguridad: copia de todo antes de borrar.
git bundle create "/tmp/cardpdf-cierre-$(date +%Y%m%d-%H%M%S).bundle" --all

git checkout main
git pull --ff-only origin main

for id in cursor antigravity claude codex; do
  git rev-parse --verify "origin/feature/${id}" >/dev/null 2>&1 \
    && git merge --no-ff "origin/feature/${id}"
done

npm run build   # main no se queda sin compilar
git push origin main

for id in cursor antigravity claude codex; do
  git push origin --delete "feature/${id}" 2>/dev/null || true
  git worktree remove ".worktrees/${id}" 2>/dev/null || true
  git branch -d "feature/${id}" 2>/dev/null || true
done
```

Dos detalles que no son adorno:

- `git worktree remove` va **sin** `--force`. Con `--force` borra aunque haya
  cambios sin guardar, que es justo como se perdio trabajo antes.
- `git branch -d` (minuscula) se niega a borrar una rama sin integrar. Si
  falla, esa rama tenia trabajo que no llego a `main`: integrala, no la fuerces.

El proximo chat vuelve a crear las ramas desde `origin/main`.
