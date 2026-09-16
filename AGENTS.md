# AGENTS.md — Cardify

Lee `docs/BRANCHING.md`, `docs/AI.md` y `docs/ARCHITECTURE.md` antes de editar.

## Ramas (dos IAs a la vez)

- `main` no se edita. Cada IA nace de `origin/main`.
- IA Bloque 1 → solo `feature/bloque-1`. IA Bloque 2 → solo `feature/bloque-2`.
- Prohibido merge/rebase entre esas dos features. Integración solo por PR a `main`.
- Si tu `git branch` no es la asignada, para y cámbiate. No resuelvas conflictos ajenos.

Reglas cortas:

- Español, respuestas compactas.
- Cero emojis en UI. SVG propio.
- Cero botones o textos duplicados en la misma pantalla.
- No toques carga/perspectiva (Bloque 1) si tu tarea es barra/deselección/zoom/iconos (Bloque 2), y al revés.
- No agregues framework, backend ni dependencias en un parche. Eso es migración explícita.
- Deploy: Vercel. Backend (Supabase) solo si Estiven lo pide.
- Commit/push solo con pedido explícito.
- No subas fotos ni datos personales al repo.
