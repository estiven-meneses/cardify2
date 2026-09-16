# Ramas y dos IAs a la vez

Cardify se trabaja con **varias inteligencias artificiales en paralelo**. Cada una tiene su rama. Nunca comparten rama. Nunca mezclan su código entre ellas. `main` es el único punto de encuentro.

## Mapa actual

Los bloques 1 y 2 **ya están en `main`**. `feature/bloque-1` y `feature/bloque-2` se eliminan después del merge. A partir de ahora:

| Rama | Quién | De dónde sale | Qué toca |
|---|---|---|---|
| `main` | Código estable | — | La rama principal. Nadie trabaja encima sin una feature nueva. |
| `feature/<tarea>` | Una IA por rama | `origin/main` | Solo su tarea. Nunca desde otra feature. |

Bloque 1 (histórico): carga, recorte inmediato, blueprint, reset.  
Bloque 2 (histórico): barra rápida, deselección, zoom/scroll, iconos, logs, shell tipo app.

## Cómo nace una rama (obligatorio)

```bash
git fetch origin
git checkout -b feature/<tarea> origin/main
```

Prohibido:

```bash
git checkout -b feature/bloque-2 feature/bloque-1   # NO
git merge feature/bloque-1                         # NO, si eres la IA del bloque 2
git rebase feature/bloque-2                        # NO, si eres la IA del bloque 1
```

Las dos IAs **no se mergean entre sí**. Cada una abre PR contra `main`. Los conflictos se resuelven **al integrar en `main`**, no copiando la otra rama.

## Qué hace cada IA al empezar

1. Lee `AGENTS.md`, `docs/AI.md` y **este archivo**.
2. Confirma su rama: `git branch --show-current`.
3. Si no está en la suya: `git checkout <su-rama>` o créala desde `origin/main`.
4. Si el working tree tiene cambios de **otra** rama o un merge a medias: **no lo resuelvas**. Vuelve a tu rama. No hagas `reset --hard` del trabajo ajeno.

## Qué no hacer nunca

- Trabajar en `main`.
- Trabajar en la rama de la otra IA.
- Meter un `git merge` / `rebase` de la otra feature “para tener lo último”.
- Resolver conflictos de `script.js` / `index.html` mezclando bloques. Eso pisa al otro agente.
- Force-push a `main` o a la rama ajena.
- Dejar un merge a medias (`UU`, `AUTO_MERGE`) en la rama de otro.

Si ves un conflicto entre bloques, **para** y avisa a Estiven. No improvises un archivo mezclado.

## Cómo llega el trabajo a `main`

1. IA termina su bloque → commit + push de **su** rama.
2. PR: `feature/bloque-X` → `main`.
3. Estiven revisa y mergea.
4. La otra IA, si necesita ese código, hace `git fetch` y **rebase de su rama sobre `origin/main`**, no sobre la feature hermana.

```bash
git fetch origin
git rebase origin/main
```

## Si eres una IA nueva

- Te asignan un bloque o una tarea → una rama nueva desde `origin/main`.
- Nombre: `feature/<tema-corto>` (`feature/bloque-1`, `feature/bloque-2`, `feature/migracion-vite`).
- No reutilices una rama que ya tiene otro agente encima.
- No “ayudes” en archivos del otro bloque aunque veas un bug.

## Docs compartidas

Estas reglas deben vivir en el repo (`docs/`, `AGENTS.md`, `.cursor/rules/`).  
Si solo existen en una feature, la otra IA no las ve. Por eso las docs se mergean a `main` **sin** llevarse el código de un bloque, o van en una rama `chore/docs-agentes` salida de `main`.
