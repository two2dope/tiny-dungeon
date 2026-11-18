# Changelog — Tiny Dungeon

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
