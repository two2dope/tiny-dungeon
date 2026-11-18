# Changelog — Tiny Dungeon

## [v1.2.0] — 2026-11-18

### Adicionado
- **Etapa 1 (Pacote Visual via Código):**
  - Texturas procedurais `512x512` em `<canvas>` com `bumpMap` (`bumpScale={0.065}`) para lajes `3x3` e alvenaria de paredes em `src/components/canvas/proceduralTextures.ts`.
  - Rota tática BFS `getShortestPath()` em `src/engine/dungeon.ts` + trilha iluminada `TacticalPath3D`, 4 setas cardinais em `PartyPawn3D.tsx` e VFX 3D `ActionBurst3D`.
  - Ícones SVG táticos em 3 camadas e brasões das classes (`src/components/ui/TacticalIcons.tsx`), cantoneiras ornamentais em `DiceTray.tsx`, barras *makimono* em `EmberLedger.tsx` e selo *hanko* (`印`) no botão `Confirmar` em `HUD.tsx`.
- **Etapa 2 (`/flow-assets` — 16 Assets Google Flow):**
  - Retratos 1:1 dos 4 heróis (`hero-warrior.jpg`, `hero-mage.jpg`, `hero-cleric.jpg`, `hero-rogue.jpg` + fallbacks `.svg`) em `EmberLedger.tsx`, além de miniaturas `RelicThumb` para Poções, Itens e Gemas.
  - 8 miniaturas *standee* 2.5D (`<Billboard>`) para peão, lacaios e chefes em `RoomTile3D.tsx` e `PartyPawn3D.tsx`, com remoção automática de fundo de estúdio via BFS (`removeDarkStudioBackdrop` com amostragem de bordas em `standeeTextures.ts`), mais 4 medalhões circulares chanfrados para relíquias/armadilhas.
  - Painel de controle `docs/reference/google-flow-asset-prompts-ptbr.html` com *Style Anchor* Base64, script expandido `assets/gerar-assets.ps1` e manifesto de sincronização em `assets/sync-status.md`.
- **Etapa 3 (Pipeline `.glb` & Ambiente 360° em Paralaxe):**
  - Gerador `scripts/generate-canonical-glbs.mjs` e loader leve `src/components/canvas/glbRegistry.ts` (`parseGlbToGeometry` + `useGlbGeometry`) servindo `torii-gate.glb`, `lantern-pedestal.glb`, `relic-chest.glb` e `tactical-d6.glb` em `public/models/`.
  - `src/components/canvas/Environment360.tsx`: domo panorâmico `1024x512` (`SkyDome360`), plataforma ritual octogonal (`getTabletopMatTexture`), 4 portões Torii cardeais, 8 pilares de lanterna e 12 ruínas em paralaxe para ambos os temas.
  - Corte isométrico nas paredes perimetrais frontais em `Walls3D.tsx`, base de mesa tática em `DungeonCanvas.tsx` e recuo responsivo `lg:pl-[23rem]` quando `EmberLedger` está aberto.
- **Mapas Expandidos Multi-Dimensão (`cols × rows`):**
  - Motor `src/engine/dungeon.ts` e cena 3D parametrizados via `getMapDimensions(map)` para grades arbitrárias, preservando os 4 mapas `4×4` e adicionando:
    - **M5: Castelo de Nijō (`5×5` • 25 salas)**
    - **M6: Labirinto Clássico (`6×5` • 30 salas — formato *Paper Dungeons*)**
    - **M7: Cidadela Imperial (`6×6` • 36 salas)**

### Corrigido
- Corrigida colisão de primitivas 3D e arcos sobre os *standees* 2.5D em `RoomTile3D.tsx` e `PartyPawn3D.tsx`, reposicionadas etiquetas `<Html>` de casas vazias/limpas, fixado toast central no topo em `App.tsx`, e adicionada validação de `removeDarkStudioBackdrop`, `.glb` e mapas expandidos na suíte Vitest (`12` arquivos, `32/32` testes).

## [v1.1.0] — 2026-11-18

### Adicionado
- **Motor tático & economia fiel:** Consumo real de até 3 dados por rodada (`consumedDieIds`), bônus de Maestria por afinidade de cor/símbolo do herói, uso livre de poções (`stageUsePotion`), PRNG determinístico Mulberry32 (`src/engine/rng.ts`) com suporte a `?seed=`, e hidratação segura de save em `localStorage`.
- **4 Mapas Canônicos & 3 Missões Táticas:** *Cripta da Mantícora*, *Pátio de Sengoku*, *Forja de Obsidiana* e *Santuário Abissal* em `src/engine/dungeon.ts`, acompanhados de 3 missões avaliadas em tempo real (`src/engine/scoring.ts`).
- **Seletor de Temas & Visual 3D Iluminado:** Alternância em tempo real entre **Sengoku & Nanquim** e **Vesperfall Obsidian**, com iluminação global reforçada (`ambientLight`, `hemisphereLight`, `directionalLight`), lanternas *chochin* / tochas, modelos 1.45x maiores com pedestais por categoria, interpolação suave do peão e badges `<Html>` táticos visíveis nas 16 salas (`src/components/canvas/RoomTile3D.tsx`).
- **Áudio Procedural & Juice:** Sintetizador WebAudio zero-dependência (`src/audio/soundEngine.ts`) com mute persistente, *screen shake* respeitando `prefers-reduced-motion`, atalhos de teclado (`Z`/`Y`/`Enter`/`Space`), harness determinístico `?demo=&t=&seed=&theme=` e exportação do Certificado de Glória em PNG.
- **PWA Offline-First & Governança:** `public/manifest.webmanifest`, `public/sw.js`, 3 ícones PNG em `public/icons/`, `viewport-fit=cover`, `100dvh`, touch targets `>= 44x44px` (`pointer: coarse`), `ARCHITECTURE.md`, `docs/web-guidance-rules.md` e `release.md`.

### Corrigido
- Corrigidos os 9 erros de `tsc` (`src/lucide-react.d.ts` + limpeza de imports), `rehydrateWalls()` após `undo()`/`localStorage`, `aria-label` nos botões mobile de `HUD.tsx`, warning WebGL na troca de tema em `TorchLight.tsx` e URLs de imagem quebradas em `hero.html`.
- Removidas as 16 duplicatas brutas de imagens e movidos os dossiês externos do AntigravityGate para seus workspaces de origem.

## [v1.0.0] — 2026-10-24

### Adicionado
- Versão inicial jogável em 8 rodadas com Mapa Canônico 1, combate, pontuação de glória, cena 3D isométrica em R3F, HUD, *The Ember Measure*, suíte Vitest (22 testes) e página showcase `hero.html`.
