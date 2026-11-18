# STATE: Tiny Dungeon — The Ember Measure

**Data de Atualização:** 2026-11-18  
**Status do Projeto:** v1.2.0 Publicado (tag `v1.2.0` enviada a `origin/main`)  
**Repositório Remoto:** [https://github.com/two2dope/tiny-dungeon](https://github.com/two2dope/tiny-dungeon)  
**Branch Ativa:** `main` (sincronizada com `origin/main` + tag `v1.2.0`)

---

## 1. Visão Geral e Propósito

Adaptação digital tática de *Paper Dungeons* em 3D isométrico (*React Three Fiber / Three.js*) com **seletor de temas** (**Sengoku & Nanquim** ⇄ **Vesperfall Obsidian**), economia fiel de 3 dados por rodada, 7 mapas canônicos em múltiplas dimensões (`4×4`, `5×5`, `6×5`, `6×6`), retratos e miniaturas 2.5D do Google Flow, ambiente 360° em paralaxe, pipeline modular `.glb`, áudio procedural WebAudio e PWA offline-first.

---

## 2. Subsistemas Implementados e Verificados

| Subsistema | Módulo Principal | Testes / Validação | Status |
|---|---|---|---|
| **RNG Determinístico & Dados** | `src/engine/rng.ts`, `src/engine/dice.ts`, `src/engine/types.ts` | `tests/engine/dice.test.ts` | Concluído |
| **Comitiva, Poções & Afinidade** | `src/engine/heroes.ts` | `tests/engine/heroes.test.ts` | Concluído |
| **7 Mapas Multi-Dimensão & BFS** | `src/engine/dungeon.ts` (`4×4`, `5×5`, `6×5`, `6×6`) | `tests/engine/dungeon.test.ts` | Concluído |
| **Combate, Missões & Glória** | `src/engine/combat.ts`, `src/engine/scoring.ts` | `tests/engine/combat.test.ts`, `tests/engine/scoring.test.ts` | Concluído |
| **Store, Economia 3 Dados & Save** | `src/store/gameStore.ts` | `tests/store/gameStore.test.ts`, `tests/integration/gameLoop.test.ts` | Concluído |
| **Cena 3D, Ambiente 360° & Texturas** | `src/components/canvas/DungeonCanvas.tsx`, `Environment360.tsx`, `Walls3D.tsx`, `proceduralTextures.ts` | `tests/components/DungeonCanvas.test.tsx`, `npm run build` | Concluído |
| **Standees 2.5D & Pipeline `.glb`** | `standeeTextures.ts`, `glbRegistry.ts`, `public/assets/*`, `public/models/*.glb` | `tests/engine/standeeTextures.test.ts`, `tests/engine/glbRegistry.test.ts` | Concluído |
| **HUD Responsiva, Retratos & Makimono** | `src/components/ui/*`, `src/App.tsx` | `tests/components/UI.test.tsx` | Concluído |
| **Áudio Procedural (WebAudio)** | `src/audio/soundEngine.ts` | `npm run build` | Concluído |
| **PWA Offline-First & Contrato** | `public/manifest.webmanifest`, `public/sw.js`, `ARCHITECTURE.md`, `release.md` | `check_project_surface.py --offline --mobile` | Concluído |

---

## 3. Métricas de Validação e Saúde

- **Vitest Suite (`node ./node_modules/vitest/vitest.mjs run`):** `12` arquivos de teste, `32/32` testes passando (`tests/components/DungeonCanvas.test.tsx` emite aviso `Multiple instances of Three.js being imported` no JSDOM).
- **TypeScript + Vite Build (`npm run build`):** `tsc` com `0` erros; bundle dividido em `index` (`124.04 kB`), `vendor-r3f` (`300.63 kB`) e `vendor-three` (`690.40 kB`).
- **Surface Check (`game-over` `--offline --mobile`):** `[PASS]` com `0 finding(s)`.
- **Evidência Visual / Browser:** Validada visualmente pelo operador em `http://localhost:4173` para as rodadas visuais de v1.2.0 (standees, retratos, ambiente 360° e texturas); renderização pós-expansão dos mapas M5–M7 validada headless via BFS/Vitest (`[Não verificado]` captura ao vivo para M5–M7).

---

## 4. Artefatos de Governança e Expansão

- Contrato arquitetural: [ARCHITECTURE.md](ARCHITECTURE.md)
- Regras web congeladas: [docs/web-guidance-rules.md](docs/web-guidance-rules.md)
- Receita de publicação: [release.md](release.md)
- Central de Prompts Flow: [docs/reference/google-flow-asset-prompts-ptbr.html](docs/reference/google-flow-asset-prompts-ptbr.html)
- Frente visual preservada: `assets/gerar-assets.ps1` e `assets/Gemini_Generated_Image_19k19i19k19i19k1.jpeg`
