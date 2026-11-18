# STATE: Tiny Dungeon — The Ember Measure

**Data de Atualização:** 2026-11-18  
**Status do Projeto:** v1.1.0 Publicado (tag `v1.1.0` enviada a `origin/main`)  
**Repositório Remoto:** [https://github.com/two2dope/tiny-dungeon](https://github.com/two2dope/tiny-dungeon)  
**Branch Ativa:** `main` (sincronizada com `origin/main` + tag `v1.1.0`)

---

## 1. Visão Geral e Propósito

Adaptação digital tática de *Paper Dungeons* em 3D isométrico (*React Three Fiber / Three.js*) com **seletor de temas** (**Sengoku & Nanquim** ⇄ **Vesperfall Obsidian**), economia fiel de 3 dados por rodada, 4 mapas canônicos, missões, áudio procedural WebAudio e PWA offline-first.

---

## 2. Subsistemas Implementados e Verificados

| Subsistema | Módulo Principal | Testes / Validação | Status |
|---|---|---|---|
| **RNG Determinístico & Dados** | `src/engine/rng.ts`, `src/engine/dice.ts`, `src/engine/types.ts` | `tests/engine/dice.test.ts` | Concluído |
| **Comitiva, Poções & Afinidade** | `src/engine/heroes.ts` | `tests/engine/heroes.test.ts` | Concluído |
| **4 Mapas Canônicos & BFS** | `src/engine/dungeon.ts` | `tests/engine/dungeon.test.ts` | Concluído |
| **Combate, Missões & Glória** | `src/engine/combat.ts`, `src/engine/scoring.ts` | `tests/engine/combat.test.ts`, `tests/engine/scoring.test.ts` | Concluído |
| **Store, Economia 3 Dados & Save** | `src/store/gameStore.ts` | `tests/store/gameStore.test.ts`, `tests/integration/gameLoop.test.ts` | Concluído |
| **Cena 3D Dual-Theme & Rótulos Táticos** | `src/components/canvas/*` | `tests/components/DungeonCanvas.test.tsx` | Concluído |
| **HUD Responsiva, Makimono & PNG** | `src/components/ui/*`, `src/App.tsx` | `tests/components/UI.test.tsx` | Concluído |
| **Áudio Procedural (WebAudio)** | `src/audio/soundEngine.ts` | `npm run build` | Concluído |
| **PWA Offline-First & Contrato** | `public/manifest.webmanifest`, `public/sw.js`, `ARCHITECTURE.md`, `release.md` | `check_project_surface.py --offline --mobile` | Concluído |

---

## 3. Métricas de Validação e Saúde

- **Vitest Suite (`node ./node_modules/vitest/vitest.mjs run`):** `10` arquivos de teste, `23/23` testes passando (`tests/components/DungeonCanvas.test.tsx` emite aviso `Multiple instances of Three.js being imported` no JSDOM).
- **TypeScript + Vite Build (`npm run build`):** `tsc` com `0` erros; bundle dividido em `index` (`82.88 kB`), `vendor-r3f` (`292.24 kB`) e `vendor-three` (`690.34 kB`).
- **Surface Check (`game-over` `--offline --mobile`):** `[PASS]` com `0 finding(s)`.
- **File-Fit Audit:** `80.7%` (`92/114` itens em conformidade; violações residuais são convenções `PascalCase.tsx`/`camelCase.ts`, bundles `dist/assets/` e imagem preservada da frente *Sengoku & Nanquim*).
- **Evidência Visual / Browser:** Validado no Chrome via `chrome_devtools` MCP (`?demo=midgame&seed=4242&theme=sengoku`) em desktop `1280x720` e mobile `390x844` — cena, HUD, *The Ember Measure*, troca de tema (`Sengoku` ⇄ `Vesperfall`), troca de mapa (`M1` → `M2`), seleção de dados e abertura/fechamento do drawer mobile verificados. Corrigidos posteriormente `aria-label` mobile em `HUD.tsx`, visibilidade em `TorchLight.tsx`, e aplicado reforço de iluminação 3D (`hemisphereLight` + `directionalLight`), remoção da névoa oclusiva, modelos 1.45x maiores com pedestais por categoria e badges táticos `<Html>` nas 16 salas (`RoomTile3D.tsx`) — captura visual pós-reforço de iluminação `[Não verificado]` no browser.

---

## 4. Artefatos de Governança e Expansão

- Contrato arquitetural: [ARCHITECTURE.md](ARCHITECTURE.md)
- Regras web congeladas: [docs/web-guidance-rules.md](docs/web-guidance-rules.md)
- Receita de publicação: [release.md](release.md)
- Frente visual preservada: `assets/gerar-assets.ps1` e `assets/Gemini_Generated_Image_19k19i19k19i19k1.jpeg`
