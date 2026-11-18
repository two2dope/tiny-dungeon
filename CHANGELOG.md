# Changelog — Tiny Dungeon

## [Unreleased / v1.1.0+visual] — 2026-11-18

### Adicionado
- **Etapa 1 do Pacote Visual via Código:**
  - Texturas procedurais em `<canvas>` com `bumpMap` para lajes e paredes em `src/components/canvas/proceduralTextures.ts`.
  - Cálculo de rota curta `getShortestPath()` em `src/engine/dungeon.ts` (com teste unitário) + linha tática dourada iluminada no piso 3D (`TacticalPath3D`) + 4 setas cardinais no peão (`PartyPawn3D.tsx`).
  - VFX 3D de impacto, coleta e cura (`ActionBurst3D`) sincronizado com `lastEventFeedback`.
  - Ícones SVG táticos em 3 camadas e brasões das 4 classes (`src/components/ui/TacticalIcons.tsx`), cantoneiras ornamentais em `DiceTray.tsx`, barras de rolo *makimono* em `EmberLedger.tsx` e selo vermelho *hanko* (`印`) no botão `Confirmar` em `HUD.tsx`.

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
