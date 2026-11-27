# Receita de Release — Tiny Dungeon (`v1.2.0`)

> Compatível com a skill `release-app`. Seguir estritamente na ordem: Pré-voo → Evidência → Gate → Publicação → Pós-publicação.

## Pré-voo
- Confirmar branch sincronizada com `origin/main` (`git fetch origin`) e worktree limpo.
- Rodar testes unitários/headless (`node ./node_modules/vitest/vitest.mjs run`).
- Rodar `python "C:\Users\thomaz\.gemini\config\skills\game-over\scripts\check_project_surface.py" . --offline --mobile`.
- Rodar `npm run build` (`tsc && vite build`) e validar zero falhas.

## Evidência
- Validar funcionamento offline do Service Worker (`public/sw.js`) e instalação do `manifest.webmanifest`.
- Capturar evidência visual desktop (`1280x720`) e mobile (`390x844`) usando `?demo=midgame&seed=4242` e `?demo=victory&seed=4242`, confirmando `window.__APP_READY === true` e zero erros de console.

## Gate
- Apresentar resumo de 1 tela (versão `v1.2.0`, o que entra, testes, evidência) e aguardar frase explícita do operador: `Publicar v1.2.0`.

## Publicação
- Criar tag / PR / deploy conforme alvo configurado (GitHub Pages ou Vercel) apenas a partir de worktree limpo.

## Pós-publicação
- Registrar SHA-256 dos artefatos empacotados (quando houver), atualizar `STATE.md` / `CHANGELOG.md` e anotar uma linha no cofre (`Raw/Notas/`).
