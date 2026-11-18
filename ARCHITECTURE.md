# Tiny Dungeon — ARCHITECTURE (Contrato Vinculante)

> Este contrato rege a evolução em `mode: "evolve"`. Nenhuma área deve violar as fronteiras de responsabilidade abaixo.

- **Trilha:** `pwa-app` (webjogo 3D tático offline-first)
- **Engine:** `threejs` (`@react-three/fiber` + `@react-three/drei`)
- **Regras Web congeladas:** `docs/web-guidance-rules.md`
- **Wrapper Mobile:** `none` (PWA instalável responsiva desktop + mobile)

---

## 1. Mapa de Ownership Disjunto

| Área | Diretórios / Arquivos Exclusivos | Responsabilidade | Restrição |
|---|---|---|---|
| `logic` | `src/engine/**`, `src/store/gameStore.ts`, `tests/engine/**`, `tests/store/**`, `tests/integration/**` | Regras de dados, PRNG com seed (`mulberry32`), mapas 1–4, missões, combate, economia de 3 ações/rodada, Undo/Redo | **Zero** DOM, `<canvas>` ou Three.js (`storage` isolado por guard); roda headless no Vitest |
| `render` | `src/components/canvas/**`, `src/audio/**` | Cena 3D isométrica (temas *Sengoku & Nanquim* / *Vesperfall*), *Fog of War*, interpolação do peão, partículas, pausa em segundo plano, síntese WebAudio (`soundEngine.ts`) | Consome snapshots de `useGameStore`; nunca duplica regra de combate/glória |
| `ui` | `src/components/ui/**`, `src/index.css`, `index.html` | HUD responsiva (`safe-area`, `100dvh`), seletor de tema e mapa, *EmberLedger* (*makimono*/grimório), bandeja de dados com estado `Usado`, certificado PNG, `:focus-visible`, touch `>= 44px` | Sem `canvas-html` experimental; acessibilidade via DOM overlay |
| `pwa` | `public/manifest.webmanifest`, `public/sw.js`, `public/icons/**` | Manifesto instalável (`id`, `192x192`, `512x512`, `maskable`), cache offline (`NetworkFirst` HTML / `CacheFirst` assets estáticos) | Nunca usar `Cache-Control: no-store` em shell estático |
| `app` | `src/App.tsx`, `src/main.tsx`, `vite.config.ts`, `package.json`, `src/lucide-react.d.ts` | Integração de áreas, atalhos de teclado, registro do Service Worker e harness `?demo=&t=&seed=&theme=` (`window.__APP_READY = true`) | Preserva `hero.html` e `assets/gerar-assets.ps1` + `assets/Gemini_Generated_Image_19k19i19k19i19k1.jpeg` |

---

## 2. Áreas Preservadas (Intocáveis)
- `hero.html`, `README.md`, `docs/superpowers/**`
- `assets/gerar-assets.ps1` e `assets/Gemini_Generated_Image_19k19i19k19i19k1.jpeg` (frente visual *Sengoku & Nanquim*)
- Contratos públicos existentes de `getCanonicalMap1`, `rollDicePool`, `checkHazardPhase`, `draftDie`, `undraftDie`, `resolveMinionEncounter`, `resolveVillainBattle`, `calculateFinalGloryScore`.

---

## 3. Invariantes Obrigatórias
1. **Aleatoriedade determinística:** `src/engine/rng.ts` (`mulberry32`) governa rolagem de dados com seed explícita (`?seed=` ou aleatória na criação do jogo).
2. **Economia de 3 dados por rodada:** Cada ação tática (`stageMove`, `stageLevelUp`, `stageBrewPotion`, `stageCraftItem`) consome 1 dado disponível (até 3 por rodada); beber poção (`stageUsePotion`) é livre.
3. **Harness e estabilidade:** `?demo=<cena>&t=<seg>&seed=<num>&theme=<sengoku|vesperfall>` fixa o estado inicial e expõe `window.__APP_READY = true` sem erros no console.
4. **Mobile & Offline:** `viewport-fit=cover`, `100dvh`, touch `>= 44x44px` em `pointer: coarse`, `manifest.webmanifest` + `sw.js` validados por `check_project_surface.py --offline --mobile`.
