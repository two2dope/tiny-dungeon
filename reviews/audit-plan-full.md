# Full Spectrum Audit: Tiny Dungeon — The Ember Measure (v1.3 Illustrated GUI, 3D Courtyard & Boss Duel / Relics Pass)

**Date**: 2026-11-19
**Mode**: Uncommitted Changes (Repo Mode)
**Source**: working tree vs `HEAD` (`40a126a` / `v1.2.0`) — 22 modified files (`+2618 / -687`), 3 new source modules (`src/engine/relics.ts`, `src/components/ui/BossDuelModal.tsx`, `src/styles/gui-skin.css`), 1 asset pipeline script (`scripts/process-gui-assets.py`), 41 WebPs in `public/assets/ui/`, and untracked raw assets in `assets/`
**Lenses Run**: 9/10 (`Design`, `UX`, `Frontend`, `Structural`, `Repo Maintainer`, `Production Readiness`, `DX`, `Performance`, `Accessibility`)
**Lenses Skipped**: `Backend Engineer` — App 100% client-side SPA/PWA sem servidor, rotas de API, banco de dados ou workers de backend.

---

## Master Verdict: READY FOR COMMIT (Historical Audit: NEEDS REWORK — 8/8 Critical Issues Resolved)

> [!NOTE] Pre-Commit Remediation Status (2026-11-19)
> - **Críticos resolvidos (8/8)**:
>   1. **Higiene Git / assets brutos (`.gitignore`)**: exclusão de `assets/GUI UI_UX/`, zips, bundles e JPEGs gerados; `git status --short` limpo quanto a binários pesados.
>   2. **Assets órfãos + Service Worker (`scripts/process-gui-assets.py`, `public/sw.js`, `src/components/canvas/proceduralTextures.ts`)**: removidos os 5 WebPs órfãos (`36` WebPs / `509.4 KB`), removidos helpers não utilizados em `proceduralTextures.ts`, e cache bump para `v3` no `sw.js` com precache dos `.glb` e WebPs principais + `CacheFirst` para `.glb`/`.webp`.
>   3. **Camada Engine vs Three.js (`src/engine/standeeManifest.ts`, `src/components/canvas/standeeTextures.ts`, `src/components/ui/BossDuelModal.tsx`, `src/engine/combat.ts`)**: manifesto de standees neutro em `src/engine/standeeManifest.ts`; `BossDuelModal` desacoplado de `three`; `getRelevantHeroLevel` e `getCombatPowerBreakdown` centralizados em `src/engine/combat.ts`.
>   4. **Fluxo BossDuelModal & Histórico (`src/store/gameStore.ts`, `src/components/ui/BossDuelModal.tsx`)**: adicionados `cancelPendingBoss()`, botão `Voltar à Rodada (Esc)`, bloqueio de `undo()`/`redo()` durante `pendingBossEncounter`, migração de saves legados (`migrateSavedParty`), captura/retorno de foco, trap de `Tab` e suporte a `Escape`.
>   5. **Vazamento VRAM / UVs GLB & Sombras (`src/components/canvas/glbRegistry.ts`, `src/components/canvas/Environment360.tsx`, `src/components/canvas/RoomTile3D.tsx`, `src/components/canvas/DungeonCanvas.tsx`)**: UVs box-projected sintetizadas uma única vez em `parseGlbToGeometry()` sem clonar geometrias no render; remoção de `castShadow` nas lajes/estandartes planos; frustum de sombra ampliado para `±22`; `RoomTile3D` memoizado com `onSelect(coord)` e `handleSelectTile` via `useCallback`.
>   6. **UX Poder Bélico & Relíquias (`src/components/ui/EmberLedger.tsx`)**: explicação clara do bônus (`+Katana` vs `+vs Chefes`), slots interativos com detalhe expandível por toque/teclado e fallback de erro nas miniaturas.
>   7. **Paridade Tema Vesperfall & CSS (`src/styles/gui-skin.css`, `src/components/ui/EmberLedger.tsx`, `src/components/ui/HUD.tsx`, `src/components/ui/BossDuelModal.tsx`, `src/components/ui/DiceTray.tsx`)**: estilos dedicados para `[data-theme="vesperfall"]`, estados `:active`, largura fluida no `DiceTray` e `prefers-reduced-motion`.
>   8. **Acessibilidade & Teclado (`src/App.tsx`, `src/components/ui/EmberLedger.tsx`, `src/components/ui/CombatLog.tsx`, `src/components/ui/DiceTray.tsx`)**: `App.tsx` não intercepta `Enter`/`Space` em botões/links focados; hierarquia de títulos `<h3>`; `role="log"` + `aria-live="polite"` + `select-text` no `CombatLog`; `aria-pressed` no `DiceTray`.
> - **Verificação pós-edição (`task-1315`)**: `npm run build` (`0` erros TS / `30.07s`), `vitest` (`12/12` arquivos, `41/41` testes), `check_project_surface.py --offline --mobile` (`PASS`, `0 finding(s)`). Inspeção visual ao vivo pós-remediação no navegador: **[Não verificado nesta etapa]**.

> **Justificativa (Pré-Commit):** O núcleo funcional compila sem erros (`npm run build` passou em `tsc && vite build`), **40/40 testes Vitest** passam em `12/12` arquivos e `check_project_surface.py --offline --mobile` aponta `0 finding(s)`. Contudo, as lentes de **Repo Maintainer** e **Accessibility Engineer** apontaram bloqueios objetivos de `NEEDS REWORK` — em especial **~95 MB de arquivos brutos/zips não ignorados no `.gitignore`** que entrariam no histórico Git em caso de `git add .`, além de **ausência de focus trap / cancelamento (`Esc`) no `BossDuelModal`**, tooltips de relíquias inacessíveis via teclado/touch, cache offline PWA desatualizado para `.glb` e vazamento de `THREE.BufferGeometry` clonada. Todos os 8 problemas críticos são correções cirúrgicas de pré-commit que não invalidam a arquitetura da entrega.

---

## Verdict by Lens

| # | Lens | Verdict | Critical | Recommendations |
|---|------|---------|----------|-----------------|
| 1 | Design Engineer | APPROVE WITH CHANGES | 2 | 4 |
| 2 | UX Engineer | APPROVE WITH CHANGES | 2 | 3 |
| 3 | Frontend Engineer | APPROVE WITH CHANGES | 2 | 4 |
| 4 | Backend Engineer | Skipped | 0 | 0 |
| 5 | Structural Engineer | APPROVE WITH CHANGES | 1 | 3 |
| 6 | Repo Maintainer | NEEDS REWORK | 2 | 5 |
| 7 | Production Readiness | APPROVE WITH CHANGES | 2 | 3 |
| 8 | DX Engineer | APPROVE WITH CHANGES | 1 | 4 |
| 9 | Performance Engineer | APPROVE WITH CHANGES | 2 | 4 |
| 10 | Accessibility Engineer | NEEDS REWORK | 3 | 3 |

---

## All Critical Issues (Must Fix)

| # | Issue | Lens(es) | File(s) | Impact | Fix |
|---|-------|----------|---------|--------|-----|
| 1 | ~95 MB de assets brutos/zips (`assets/GUI UI_UX.zip`, `flow-assets-bundle 2.json`, `GUI UI_UX/`, `Gemini_Generated_Image_*.jpeg`) desprotegidos pelo `.gitignore` + nomes com espaço/maiúsculas | Repo Maintainer, Production Readiness | `.gitignore`, `assets/GUI UI_UX.zip`, `assets/flow-assets-bundle 2.json`, `assets/GUI UI_UX/`, `assets/Gemini_Generated_Image_*.jpeg` | `git add .` inflamaria o repositório Git em ~100 MB e violaria regras de nomenclatura File-Fit em paths rastreados | Adicionar `assets/GUI UI_UX/`, `assets/GUI UI_UX.zip`, `assets/flow-assets-bundle*.json` e `assets/Gemini_Generated_Image_*.jpeg` ao `.gitignore`, mantendo os originais locais intactos e versionando apenas os `620.8 KB` processados em `public/assets/ui/` |
| 2 | `BossDuelModal` sem focus trap, foco inicial/de retorno, atalho `Escape` e opção de voltar antes de enfrentar/fugir | Accessibility Engineer, UX Engineer, DX Engineer | `src/components/ui/BossDuelModal.tsx` (`L17-194`), `src/store/gameStore.ts` (`L893-990`), `src/App.tsx` (`L96-112`) | Falha WCAG 2.4.3 / 2.1.2 (Tab navega atrás do modal) e prende o jogador se apertar `Enter`/`Space` sem querer antes de usar ações restantes na rodada | Criar `cancelPendingBoss: () => set({ pendingBossEncounter: null })`, adicionar botão `Voltar (Esc)`, focar a ação primária ao montar, prender `Tab`/`Shift+Tab` no diálogo, tratar `Escape` e restaurar foco ao elemento gatilho |
| 3 | Service Worker (`public/sw.js`) preso em cache `v1` e modelos `.glb` sem cache offline | Production Readiness, Performance Engineer | `public/sw.js` (`L1-66`) | Usuários com PWA instalado recebem HTML/assets antigos; `fetch('/models/*.glb')` possui `request.destination === ''`, ignorando o filtro `['script', 'style', 'image', 'font']` e falhando offline | Subir `CACHE_STATIC`/`CACHE_PAGES` para `v3`, cachear `.glb` e `/assets/ui/*.webp` explicitamente via `request.url.endsWith('.glb')` / `.webp` e pré-cachear os sprites principais da GUI |
| 4 | Geometrias clonadas em `ensureBoxUvGeometry()` nunca sofrem `.dispose()` + 5 WebPs órfãos (`111.3 KB`) e loader morto `getEnvPropTexture` | Performance Engineer, Frontend Engineer, Repo Maintainer | `src/components/canvas/Environment360.tsx` (`L37-68, L92-95`), `src/components/canvas/proceduralTextures.ts` (`L796-843`), `public/assets/ui/prop-*.webp`, `panel-crafting-double.webp`, `icon-heart-damaged.webp`, `scripts/process-gui-assets.py` | Vaza `THREE.BufferGeometry` na GPU a cada remount/StrictMode e entrega `111.3 KB` de imagens não utilizadas em `dist/assets/ui/` | Fazer `.dispose()` das geometrias clonadas no cleanup de `useEffect` (ou gerar UVs uma única vez em `parseGlbToGeometry`) e remover `getEnvPropTexture` + os 5 WebPs órfãos de `process-gui-assets.py` e `public/assets/ui/` |
| 5 | Vazamento visual do tema Sengoku no modo Vesperfall e `animate-pulse` ignorando `prefers-reduced-motion` | Design Engineer, Accessibility Engineer | `src/components/ui/HUD.tsx` (`L147-158, L211-280`), `src/components/ui/BossDuelModal.tsx` (`L103, L169-181`), `src/components/ui/EmberLedger.tsx` (`L197, L246, L424`), `src/index.css` (`L48-52`), `src/styles/gui-skin.css` | Ao alternar para Vesperfall, botões mantêm textura vermelha/dourada Sengoku e bordas marrons/âmbar fixas; além disso `animate-pulse` viola WCAG 2.3.3 | Escopar `.gui-btn-*` sob `[data-theme="sengoku"]` (ou aplicar variantes Slate/Cyan em Vesperfall), usar tokens CSS custom properties, trocar `animate-pulse` por `motion-safe:animate-pulse` e zerar animações no media query `prefers-reduced-motion: reduce` |
| 6 | Tooltips de relíquias inacessíveis por teclado/toque + estado `thumbFailed` preso entre chefes e JPG bruto com fundo escuro no `BossDuelModal` | Accessibility Engineer, UX Engineer, Frontend Engineer, Design Engineer | `src/components/ui/EmberLedger.tsx` (`L360-395`), `src/components/ui/BossDuelModal.tsx` (`L22, L56-67`) | Em celular (sem hover) e navegação por Tab, o jogador não consegue inspecionar o bônus das relíquias; se um chefe falhar imagem, todos os seguintes caem em fallback, e `object-cover` corta a miniatura com fundo de estúdio | Converter slots de relíquias em `<button type="button">` com painel inline de detalhes do item selecionado; resetar `setThumbFailed(false)` em `useEffect(..., [villain?.id])` e usar `object-contain p-1` (ou textura recortada) |
| 7 | Migração quebrada de `localStorage` legado (`craftedRelics`), `undo`/`redo` sem guarda com modal aberto e soma enganosa `combatRelicBonus` no `EmberLedger` | Production Readiness, Frontend Engineer, UX Engineer, Structural Engineer | `src/store/gameStore.ts` (`L160-185, L829-891`), `src/components/ui/EmberLedger.tsx` (`L101-104, L191-202`) | Saves da v1.2.0 com `magicItems > 0` mostram Rack `0/5`; apertar `Z`/`Y` com `BossDuelModal` aberto altera a comitiva por baixo do duelo; `Poder Bélico` exibe soma de `katana + selo-onmyo` mesmo quando `Selo Onmyō` só vale contra chefes | Preencher `craftedRelics` sequencialmente em `loadFromLocalStorage` quando `magicItems > 0 && !craftedRelics`; bloquear `undo`/`redo` se `state.pendingBossEncounter`; separar `+Katana` em `Poder Bélico` e `+Selo` como `vs Chefes` |
| 8 | Cascata de re-render em todos os tiles `RoomTile3D` no hover + duplicação de regras de domínio entre 3 camadas (`getRelevantHeroLevel`, `villainId -> StandeeKind`) | Frontend Engineer, Performance Engineer, Structural Engineer, Repo Maintainer | `src/components/canvas/DungeonCanvas.tsx` (`L262-289, L345-374`), `src/components/canvas/RoomTile3D.tsx` (`L10-28, L60-360`), `src/engine/combat.ts` (`L16-33`), `src/components/ui/BossDuelModal.tsx` (`L9-13`) | Mover o mouse no mapa dispara `setHoveredRoom`, recriando closures e re-renderizando 16–36 `<Html>`/billboards sem `React.memo`; regra de nível de lacaio pode divergir entre `combat.ts`, `RoomTile3D` e `DungeonCanvas` | Extrair `getRelevantHeroLevel(party, minion)` em `src/engine/combat.ts`, compartilhar `resolveVillainStandeeKind` em `standeeTextures.ts` e memoizar `RoomTile3D` com `React.memo` e callback estável `(coord)` |

---

## Cross-Cutting Concerns

| Concern | Flagged By | Root Cause | Unified Fix |
|---------|-----------|------------|-------------|
| Governança de Modal & Segurança de Foco/Estado | Accessibility, UX, DX, Frontend | `BossDuelModal` foi inserido sem ciclo completo de diálogo acessível (focus trap, `Esc`, retorno de foco) nem bloqueio de mutações globais (`undo`/`redo`) | Adicionar `cancelPendingBoss`, botão `Voltar (Esc)`, trava de foco e guarda `if (state.pendingBossEncounter) return` em `undo`/`redo` |
| Vazamento de Tema & Ausência de Tokens CSS Unificados | Design, Accessibility, Repo Maintainer | `gui-skin.css` usa seletores globais diretos para Sengoku e os componentes misturam hexes `#110a07`/âmbar com tema Vesperfall | Centralizar variáveis CSS sob `[data-theme="sengoku"]` vs `[data-theme="vesperfall"]`, mover `.gui-btn-*` para o escopo Sengoku e respeitar `prefers-reduced-motion` |
| Higiene de Assets, Offline Cache & Ciclo de GPU | Repo Maintainer, Performance, Production Readiness | Evolução rápida dos props 2D → 3D deixou WebPs órfãos (`111.3 KB`), clones `.glb` sem `dispose()`, `sw.js` em `v1` sem `.glb` e zips gigantes sem `.gitignore` | Atualizar `.gitignore`, podar os 5 sprites não usados + `getEnvPropTexture`, atualizar `sw.js` para `v3` (incluindo `.glb`) e fazer `dispose()` das geometrias |
| Duplicação de Regras de Combate & UI entre Camadas | Structural, Frontend, Repo Maintainer, UX | `RoomTile3D`, `DungeonCanvas`, `BossDuelModal` e `EmberLedger` reimplementam cálculos de nível/bônus e mapeamento de sprites | Extrair `getRelevantHeroLevel` para `engine/combat.ts`, compartilhar `resolveVillainStandeeKind` e alinhar o texto de bônus entre `EmberLedger` e `BossDuelModal` |

---

## All Recommendations

| # | Recommendation | Lens | File(s) | Fix |
|---|---------------|------|---------|-----|
| 1 | Ajustar touch target (`44px`) e largura fluida da `DiceTray` em viewports mobile `320–360px` | Design, Accessibility | `src/components/ui/DiceTray.tsx` (`L134`) | Trocar `w-[22.5rem]` por `w-full max-w-[26.5rem]` garantindo margem nas laterais em telas de `360px` |
| 2 | Adicionar `role="log"`, `aria-live="polite"` e `user-select: text` ao `CombatLog` | Accessibility, DX | `src/components/ui/CombatLog.tsx` (`L17-55`), `src/index.css` | Definir `role="log" aria-live="polite"` no container rolável de entradas e adicionar `select-text` para permitir copiar logs de erro/seed |
| 3 | Corrigir hierarquia de headings (`<h1>` -> `<h2>` -> `<h3>`) em `EmberLedger` | Accessibility | `src/components/ui/EmberLedger.tsx` (`L273, L425`) | Alterar `<h4>Poções & Itens</h4>` e `<h4>Missões da Expedição</h4>` para `<h3>` sem saltar nível após `<h2>The Ember Measure</h2>` |
| 4 | Expandir frustum de sombras da `<directionalLight>` para `6×6` (`[-22, 22]`) e ajustar ângulo de sapatos do cursor | Design, Performance | `src/components/canvas/DungeonCanvas.tsx` (`L222-231`) | Ampliar `shadow-camera-{left,right,top,bottom}` de `±16` para `±22` e considerar desabilitar `castShadow` nas lajes do chão |
| 5 | Silenciar ruído de `stderr` do `getContext` nos testes JSDOM e adicionar flags `--help`/`--dry-run` em `process-gui-assets.py` | DX, Repo Maintainer | `tests/components/UI.test.tsx` (`L79-95`), `scripts/process-gui-assets.py` (`L1-15, L163-235`) | Usar `vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)` no teste JSDOM e usar `argparse` + erro amigável caso `Pillow` não esteja instalado |
| 6 | Usar `import type` consistente, aliases `@/` e limpar docs/rascunhos soltos em `assets/` antes do release | Repo Maintainer | `src/**/*.ts`, `src/**/*.tsx`, `assets/` | Separar `import type` em módulos editados, atualizar `.gitignore` e mover/ignorar artefatos temporários de geração |
| 7 | Remover chaves `process` inseguras / adicionar aviso visível de quota cheia de `localStorage` e handler `webglcontextlost` | Production Readiness | `src/store/gameStore.ts` (`L148-157`), `src/components/canvas/DungeonCanvas.tsx` (`L376-380`) | Notificar via toast discreto se `localStorage` falhar ao salvar e ouvir `webglcontextlost`/`webglcontextrestored` no canvas `<Canvas onCreated>` |
| 8 | Limitar tamanho histórico de `logs` e `history` em sessões longas e usar `useMemo` em arrays constantes/filtrados | Performance | `src/store/gameStore.ts` (`L83-85, L654`), `src/components/canvas/RoomTile3D.tsx` | Limitar `logs` a últimos `120` registros (append-cap) e evitar recriar arrays dentro de `useFrame` ou render |
| 9 | Esclarecer visualmente qual será a **próxima** relíquia a ser forjada ao clicar em `+ Forjar` | UX | `src/components/ui/EmberLedger.tsx` (`L345-356, L360-395`) | Indicar o nome da próxima relíquia da fila ou marcar o próximo slot no Rack com destaque sutil `"Próx."` |
| 10 | Atualizar `package.json` para `1.3.0` somente no commit oficial de release | Production Readiness, Repo Maintainer | `package.json` (`L4`) | Sincronizar `version` em `package.json`, `CHANGELOG.md` e `STATE.md` antes de criar a tag `v1.3.0` |

---

# Lens Reports

---

## 1. Design Engineer

**Perspective**: Design Engineer
**Date**: 2026-11-19
**Plan**: Uncommitted changes vs `HEAD` (`40a126a`)

### Plan Summary
As alterações introduzem uma pele visual ilustrada no estilo Sengoku & Nanquim (`src/styles/gui-skin.css`, 41 sprites WebP em `public/assets/ui/`), remodelam o pátio 3D com lajotas/névoa/lantermas/estandartes em 3D real, enxugam os rótulos das casas do tabuleiro (`RoomTile3D.tsx`), adicionam o modal `BossDuelModal` e o acervo visual das 5 relíquias na barra lateral.

### Files Reviewed
| File | Visual Role | Risk |
|------|-------------|------|
| `src/styles/gui-skin.css` | Tokens de textura, bordas 9-slice, botões laqueados e cartões de herói | Medium |
| `src/index.css` | Tokens globais dark, `:focus-visible`, `@media (prefers-reduced-motion)` | Low |
| `src/components/ui/EmberLedger.tsx` | Grimório lateral com título em placa, Poder Bélico, heróis, Poções/Itens e Rack de 5 Relíquias | Medium |
| `src/components/ui/BossDuelModal.tsx` | Diálogo modal de confronto contra o Chefe (retrato, limiares T1/T2/Derrota, botões) | High |
| `src/components/ui/DiceTray.tsx` | Bandeja de 6 dados com faces em osso esculpido e pip branco/preto | Low |
| `src/components/ui/HUD.tsx` | Barra superior, brasão mon, corações, alerta de Chefe e Confirmar | Medium |
| `src/components/ui/CombatLog.tsx` | Pergaminho vertical 9-slice com histórico | Low |
| `src/components/ui/EndGameModal.tsx` | Certificado final estilo livro aberto | Medium |
| `src/components/canvas/RoomTile3D.tsx` | Micro-chips objetivos e 4 estados visuais de standee/altar de Chefe | Low |

### Verdict: APPROVE WITH CHANGES

### Critical Issues (Must Fix)
| # | Issue | File(s) | Impact | Fix |
|---|-------|---------|--------|-----|
| 1 | Vazamento de tema Sengoku no modo Vesperfall: `.gui-btn-crimson`, `.gui-btn-gold` e `.gui-btn-square` não checam `isSengoku`, e `BossDuelModal`/`EmberLedger` usam cores `#110a07`/`amber-800` fixas mesmo com `theme === 'vesperfall'` | `src/components/ui/HUD.tsx` (`L211-280`), `src/components/ui/BossDuelModal.tsx` (`L103, L169-181`), `src/components/ui/EmberLedger.tsx` (`L197, L246, L424`), `src/styles/gui-skin.css` | Ao selecionar Vesperfall (obsidiana/ciano frio), botões permanecem com textura de madeira vermelha/dourada Sengoku, quebrando a paridade entre temas | Escopar classes `.gui-*` sob `[data-theme="sengoku"]` em `gui-skin.css` e definir variantes slate/indigo limpas para `[data-theme="vesperfall"]` |
| 2 | `BossDuelModal` exibe standee JPG bruto com `object-cover` dentro de caixa `w-20 h-20` (`L58-65`), cortando asas/pontas das criaturas e expondo o fundo quadrado escuro da arte original em vez de usar recorte ou `object-contain` consistente | `src/components/ui/BossDuelModal.tsx` (`L56-66`) | Recorte duro e desalinhado no card principal de duelo | Aplicar `object-contain p-1` no `<img>` com fundo radial sutil e resetar `thumbFailed` ao trocar de chefe |

### Recommendations
| # | Issue | Why | Fix |
|---|-------|-----|-----|
| 1 | `w-[22.5rem]` (`360px`) em `DiceTray.tsx` (`L134, L189`) aliado ao padding do card encosta nas bordas horizontais em telas mobile `360px` | Reduz respiro lateral e risco de overflow horizontal | Alterar para `w-full max-w-[26.5rem]` tanto no grid de slots quanto na faixa de legendas |
| 2 | Botão `animate-pulse` do alerta de chefe em `HUD.tsx` (`L149`) pisca texto inteiro sem variante `motion-safe:` | Causa fadiga visual e ignora `prefers-reduced-motion` | Trocar para `motion-safe:animate-pulse` e adicionar suporte no `index.css` |
| 3 | Slots não conquistados do Relic Rack (`opacity-30 grayscale`) usam os ícones coloridos esmaecidos em vez de silhueta discreta uniforme | Pode passar impressão de item desabilitado clicável vs bloqueado | Adicionar borda tracejada ou sutil `border-dashed border-amber-900/35` para slots vazios e borda sólida luminosa apenas quando `owned` |
| 4 | O `shadow-camera` direcional está em `[-16, 16]` (`DungeonCanvas.tsx:227-230`), enquanto mapas `6×6` mais portais chegam a `±13.5` | Bordas de sombras das lanternas externas podem ser cortadas em `6×6` | Aumentar frustum de sombra para `±22` |

### Nice-to-Haves
| # | Suggestion | Rationale |
|---|------------|-----------|
| 1 | Adicionar micro-transição suave (`transition-transform duration-150`) ao passar o mouse sobre os slots conquistados do Relic Rack | Aumenta o tato de peça colecionável |
| 2 | Unificar sombras dos badges 3D em `RoomTile3D.tsx` com a paleta Sengoku (`#1a110b`) em vez de `stone-950` | Reforça unidade cromática com a madeira lateral |

### Design System Compliance
O sistema atual não utiliza tokens `oklch` em CSS custom properties: o projeto adota paleta Tailwind + hexes inline + `.gui-*` em `src/styles/gui-skin.css`. A estética **Sengoku & Nanquim** alcançou altíssima fidelidade ao mockup de referência (molduras 9-slice, retratos com brasões de classe, pergaminho vertical com roletes intactos e dados em osso esculpido com pip de cor). O principal desvio estrutural é que `gui-skin.css` aplica aparências específicas de Sengoku sem escopo de atributo `[data-theme="sengoku"]`, vazando elementos visuais para o tema Vesperfall.

### Visual State Coverage
| Component/Element | Hover | Focus | Active | Disabled | Loading | Empty | Error | Dark Mode / Themes |
|-------------------|-------|-------|--------|----------|---------|-------|-------|--------------------|
| HUD Buttons | PASS | PASS (`:focus-visible`) | FAIL (`gui-btn-gold`/`square` sem `:active`) | PASS | N/A | N/A | N/A | CONCERNS (vaza Sengoku no Vesperfall) |
| EmberLedger Hero / Craft | PASS | PASS | PASS (`:active` em `crimson`) | PASS (`opacity-60/65`) | PASS (`lazy` + fallback) | PASS (`0 Poções/Itens`) | PASS (`onError` -> SVG) | CONCERNS (bordas/botões fixos) |
| EmberLedger Relic Rack (5 slots) | CONCERN (`title` só desktop) | FAIL (`<div>` sem foco) | N/A | N/A | PASS | PASS (`opacity-30`) | FAIL (`<img>` sem `onError`) | CONCERN |
| DiceTray (6 dados) | PASS | PASS | PASS (`ring-2`) | PASS (`opacity-55` + ✓) | N/A | N/A | PASS (`onError` -> SVG) | PASS |
| BossDuelModal | PASS | CONCERN (sem foco inicial) | PASS | N/A | N/A | N/A | CONCERN (`thumbFailed` preso) | CONCERNS (só dark Sengoku) |
| RoomTile3D Badges | PASS | N/A (WebGL raycast) | N/A | PASS (`empty`/`cleared` ocultos) | PASS (`standee` fallback procedural) | PASS | PASS | PASS |

### Verdict Details
- **Design Token Fidelity**: CONCERNS (tokens hex espalhados entre TSX e `gui-skin.css` sem CSS variables compartilhadas por tema)
- **Visual State Coverage**: CONCERNS (slots de relíquia sem fallback `onError` nem estado ativo/focado; `thumbFailed` sem reset)
- **Dark Mode Parity**: CONCERNS (app é 100% dark-first, porém a alternância entre os 2 temas Sengoku/Vesperfall não isola sprites dos botões)
- **Animation Quality**: PASS (`useFrame` respeita `isPaused`, `screen-shake` respeita `prefers-reduced-motion`, faltando apenas `motion-safe:` no `animate-pulse`)
- **Visual Consistency**: PASS (identidade Sengoku está coesa, com destaque para a solução 3D do pátio e micro-chips limpos)

---

## 2. UX Engineer

**Perspective**: UX Engineer
**Date**: 2026-11-19
**Plan**: Uncommitted changes vs `HEAD` (`40a126a`)

### Plan Summary
As mudanças atacam diretamente a clareza de regras e legibilidade: reduzem a poluição visual de 25 placas para micro-chips objetivos com inspeção completa no hover, tornam visível o ciclo dos 3 Chefes (`OFF` -> `Ativo` -> `Derrotado`/`Vitorioso`) com duelo explícito (`Enfrentar` vs `Fugir`), e transformam `Itens` num acervo visual de 5 relíquias com bônus táticos reais.

### User Journey Map
1. **Explorar o Tabuleiro e Planejar Risco**
   - *Trigger*: Usuário olha o mapa 3D (`4×4` até `6×6`) e passa o ponteiro nas casas.
   - *Action*: Identifica instantaneamente monstros vencíveis sem dano (`⚔️ Nv.X` verde vs vermelho), dano efetivo de armadilha (já descontando Omamori) e qual Chefe está ativo na rodada (`⚔️ R3 • 6/4`).
   - *Feedback*: OK — Tooltip no topo exibe nome completo, glória, dano e status do chefe sem colidir com `DiceTray` ou toast de evento.
   - *Outcome*: Clear (`OK`).

2. **Enfrentar Chefe nas Rodadas 3, 6 e 8 (`Confirmar`)**
   - *Trigger*: Usuário clica em **Confirmar** (ou aperta `Enter`/`Espaço`) no fim da Rodada 3, 6 ou 8.
   - *Action*: `BossDuelModal` abre mostrando `Poder contra Chefe` (com soma heróis + relíquias), limiares e desfecho previsto.
   - *Feedback*: WARN — Se o usuário apertou `Enter`/`Confirmar` por engano ainda com dados disponíveis na rodada, não existe botão **Voltar / Cancelar** no modal: é obrigado a escolher entre **Enfrentar** ou **Recuar (-1 ♥)** (armadilha de fluxo sem reversão!).
   - *Outcome*: Ambiguous/Trap (`WARN`).

3. **Forjar e Inspecionar as 5 Relíquias**
   - *Trigger*: Usuário clica em `+ Forjar (1 Dado)` no `EmberLedger` ou pisa numa câmara `✦ +1`.
   - *Action*: Recebe a próxima relíquia sequencial da fila; o slot correspondente no Rack de 5 Relíquias acende em dourado e o log/toast mostra o nome e bônus.
   - *Feedback*: WARN — (a) Em mobile ou sem mouse, não há como tocar no ícone da relíquia para ler a descrição (só usa `title`); (b) em `EmberLedger.tsx:190-200`, `Poder Bélico` exibe `5 +2 relíquia` quando o jogador possui `Katana (+1 Poder)` e `Selo Onmyō (+1 vs Chefes)`, embora `calculatePartyPower` seja `5` e `6` só se aplique contra Chefes — o rótulo sugere soma de poder onde parte do bônus é situacional; (c) após fechar o toast, não há indicação visual de qual será a próxima relíquia a forjar.
   - *Outcome*: Ambiguous (`WARN`).

### Verdict: APPROVE WITH CHANGES

### Critical Issues (Must Fix)
| # | Issue | Step in Journey | Impact on User | Fix |
|---|-------|----------------|----------------|-----|
| 1 | `BossDuelModal` não possui ação de cancelar/voltar para a rodada antes do duelo (`Voltar para Rodada`) | Confronto R3/R6/R8 (`BossDuelModal.tsx`, `gameStore.ts:893-990`) | Jogador que clicar em Confirmar ou bater `Espaço`/`Enter` antes de gastar ações ou beber poção fica preso e obrigado a lutar ou perder `-1 ♥` fugindo | Adicionar `cancelPendingBoss` no store e botão discreto `Voltar à Rodada (Esc)` no rodapé do modal quando acionado em modo interativo |
| 2 | Relic Rack usa apenas atributo nativo `title` em `<div>` (`EmberLedger.tsx:369-378`) + soma ambígua `combatRelicBonus` (`+2 relíquia`) junto ao `Poder Bélico` geral (`L103-104, L196-200`) | Uso de Relíquias no Grimório | Jogadores em touch/mobile não conseguem descobrir os efeitos dos itens já forjados, e a soma exibida induz erro de cálculo antes do duelo de Chefe | Transformar cada slot em botão que abre um mini-card/legenda abaixo do rack ao clicar/focar, e exibir `Poder Bélico` somando apenas `Katana Masamune`, listando `(+1 vs Chefes)` separado quando houver `Selo Onmyō` |

### Recommendations
| # | Issue | Impact | Fix |
|---|-------|--------|-----|
| 1 | Sem preview de qual relíquia será criada ao clicar `+ Forjar` | Jogador não consegue planejar se vale gastar 1 dado agora atrás do Omamori ou Selo | Exibir o nome/ícone da próxima relíquia disponível em subtexto compacto ou realçar o slot `"Próx."` |
| 2 | `undo()` / `redo()` não são bloqueados nem ignorados quando `pendingBossEncounter !== null` (`HUD.tsx:242-268`, `gameStore.ts:829-891`) | Em testes ou chamadas imperativas / leitores de tela atrás do modal, alterar a comitiva durante o duelo cria inconsistência de estado | Retornar imediatamente em `undo()` e `redo()` se `state.pendingBossEncounter !== null` |
| 3 | Em `BossDuelModal`, após clicar **Recuar / Fugir (-1 ♥)** e se `currentRound === 8` ou Fase de Perigo disparar logo em seguida, o jogador vê múltiplos efeitos no mesmo clique | Feedback visual rápido pode esconder que houve dano extra da Fase de Perigo | Manter descrição clara no toast e no `CombatLog` (o código já loga ambos separadamente, boa base) |

### Nice-to-Haves
| # | Suggestion | Rationale |
|---|------------|-----------|
| 1 | Adicionar micro-legenda de cores no canto do tabuleiro (`Verde = 0 dano`, `Vermelho = sofre dano`) somente quando o mouse entra em modo de movimento | Acelera aprendizado na 1ª partida sem poluir o tabuleiro |

### Interaction Consistency Check
- **Modais**: `EndGameModal` apresenta resumo completo e ações claras de exportação/reinício; `BossDuelModal` segue o mesmo padrão centralizado e bloqueante, mas diverge por não oferecer fechamento seguro antes da escolha definitiva e não bloquear `undo` de fundo.
- **Feedback imediato**: Movimentos, poções, forjas e confrontos disparam áudio sintético (`soundEngine`) + toast centralizado no topo + entrada no `CombatLog`, mantendo padrão consistente em toda a UI.

### Verdict Details
- **Discoverability**: PASS (micro-chips + hover bar + rack visual de 5 slots tornam o sistema visível de relance)
- **Flow Completeness**: CONCERNS (falta saída segura no `BossDuelModal` antes de confirmar duelo e falta legenda touch nas relíquias)
- **Error Recovery**: CONCERNS (`undo`/`redo` desprotegidos com `pendingBossEncounter` ativo)
- **Feedback & Status**: CONCERNS (`combatRelicBonus` mistura bônus permanente de `Katana` com bônus condicional de `Selo Onmyō`)
- **Consistency**: PASS

---

## 3. Frontend Engineer

**Perspective**: Frontend Engineer
**Date**: 2026-11-19
**Plan**: Uncommitted changes vs `HEAD` (`40a126a`)

### Plan Summary
Arquitetura client-side React 18 + R3F (`@react-three/fiber` v8 / `@react-three/drei` v9) + Three.js (`0.174`) + Zustand v5, adicionando `src/engine/relics.ts`, fluxo interativo de chefe no store (`pendingBossEncounter`, `bossOutcomes`), texturas canvas em cache e componentes `BossDuelModal.tsx` e `EmberLedger.tsx` com rack de relíquias.

### Files Reviewed
| File | Frontend Role | Risk |
|------|--------------|------|
| `src/store/gameStore.ts` | Store Zustand, snapshots undo/redo, persistência e ciclo de rodadas | High |
| `src/components/canvas/Environment360.tsx` | Cena 3D pátio, clonagem de geometrias `.glb`, animações `useFrame` | High |
| `src/components/canvas/RoomTile3D.tsx` | Render de 16–36 casas 3D + `<Billboard>` + `<Html>` | Medium |
| `src/components/canvas/DungeonCanvas.tsx` | Raiz `<Canvas>`, `DungeonScene`, hover state e `<OrbitControls>` | Medium |
| `src/components/ui/BossDuelModal.tsx` | Modal conectado ao `pendingBossEncounter` | Medium |
| `src/components/ui/EmberLedger.tsx` | Sidebar com selectors Zustand e Rack de Relíquias | Medium |
| `src/components/canvas/standeeTextures.ts` | Cache `CanvasTexture` + BFS pixel ops + estados visuais | Low |
| `src/components/canvas/proceduralTextures.ts` | Geradores `CanvasTexture` + carregador assíncrono não utilizado | Medium |

### Verdict: APPROVE WITH CHANGES

### Critical Issues (Must Fix)
| # | Issue | File(s) | Why It Breaks | Code Fix |
|---|-------|---------|---------------|----------|
| 1 | `ensureBoxUvGeometry()` (`Environment360.tsx:37-68`) clona `THREE.BufferGeometry` em `useMemo` (`L93, L95`) sem chamar `.dispose()` ao desmontar ou atualizar a geometria, vazando buffers WebGL na GPU | `src/components/canvas/Environment360.tsx` (`L37-68, L92-95`) | Sob React `StrictMode` (dev) ou troca de mapa/desmontagem, geometrias clonadas ficam órfãs na memória VRAM | Adicionar `useEffect(() => () => { if (toriiGeom && toriiGeom !== rawToriiGeom) toriiGeom.dispose(); }, [toriiGeom, rawToriiGeom]);` (e idem para `lanternGeom`), ou injetar box UVs uma única vez em `parseGlbToGeometry()` dentro de `glbRegistry.ts` |
| 2 | `BossDuelModal.tsx` mantém estado local `thumbFailed` (`L22`) sem reinicializá-lo quando `villain.id` muda entre Rodada 3, 6 e 8; e `gameStore.ts` não bloqueia `undo()`/`redo()` durante `pendingBossEncounter` | `src/components/ui/BossDuelModal.tsx` (`L22`), `src/store/gameStore.ts` (`L829-891`) | Um erro transitório na R3 bloqueia a arte do Chefe da R6 e R8; disparar `undo()`/`redo()` por trás do modal muta a comitiva usada por `resolvePendingBoss()` | Em `BossDuelModal.tsx`: `useEffect(() => { setThumbFailed(false); }, [villain?.id]);`. Em `gameStore.ts`: adicionar `if (state.history.length === 0 || state.pendingBossEncounter) return;` no topo de `undo()` e `if (state.future.length === 0 || state.pendingBossEncounter) return;` em `redo()` |

### Recommendations
| # | Issue | Why | Fix |
|---|-------|-----|-----|
| 1 | `hoveredRoom` em `DungeonCanvas.tsx` (`L309`) força re-render de `DungeonCanvas` -> `DungeonScene` -> todos os 16–36 filhos `RoomTile3D` não memoizados a cada troca de casa sob o ponteiro, passando ainda novas lambdas inline `onSelect={() => ...}` | Aumenta trabalho de reconciliação R3F e atualização de portais `<Html>` durante movimento rápido do mouse | Envolver `RoomTile3D` em `React.memo`, trocar `onSelect: () => void` por `onSelect: (coord: DungeonCoord) => void` + `useCallback` em `DungeonScene`, ou isolar `<DungeonScene>` do estado `hoveredRoom` elevando-o para um subcomponente de tooltip |
| 2 | `EmberLedger.tsx` usa seletores amplos (`party` inteiro) em vez de subseletores quando fechado (`isOpen === false` ainda assina 7 slices antes do `if (!isOpen) return null;`) | Quando a barra lateral está fechada, alterações no jogo ainda disparam o componente wrapper até o `return null` | Separar wrapper leve `{isOpen && <EmberLedgerContent onClose={onClose} />}` para zero assinaturas Zustand quando oculto |
| 3 | `BossDuelModal` não possui fallback `onError` na `<img>` dos slots de relíquia em `EmberLedger.tsx` (`L379-386`) | Se um `.webp` falhar ao carregar offline, mostra ícone quebrado do navegador | Adicionar `RelicThumb` ou `onError` com fallback `<Sparkles />` |
| 4 | Em `BossDuelModal.tsx:9-13`, `resolveVillainThumbKind` reimplementa o mapeamento `v_manticore`/`v_beholder`/`v_dragon` já presente em `RoomTile3D.tsx:10-15` | Risco de divergência se um 4º chefe for adicionado | Exportar função única `resolveVillainStandeeKind(villainId?: string)` de `standeeTextures.ts` |

### Nice-to-Haves
| # | Suggestion | Rationale |
|---|------------|-----------|
| 1 | Tipar o `payload` de `DungeonEvent` em `src/engine/dungeon.ts` com discriminated union em vez de `any` | Elimina `typeof ev.payload === 'number'` ad-hoc em `gameStore.ts` |

### Render Path Analysis
- **Caminhos de renderização ativos:**
  1. Ponteiro move sobre laje (`RoomTile3D.onPointerOver`) -> `setHoveredRoom` em `DungeonCanvas` -> re-renderiza `<Canvas>` JSX filho (`DungeonScene`), `<OrbitControls>` e todos `16–36` `<RoomTile3D>`. Somente `TacticalPath3D` e o pill HTML deveriam atualizar.
  2. Clique em laje / dado -> `gameStore` atualiza `party`, `dungeon`, `consumedDieIds`, `lastEventFeedback` -> re-renderiza `App`, `HUD`, `EmberLedger` (mesmo se fechado no mobile), `DiceTray`, `CombatLog` e `DungeonScene`.
  3. Frame loop (`60fps`) em `Environment360`, `RoomTile3D`, `DungeonCanvas`: apenas `useFrame` (mutação direta Three.js ref, sem `setState`), corretamente pausado quando `isPaused === true`.

### Type Safety Assessment
- Compilação `tsc` estrita passa sem erros e sem `@ts-ignore`/`as any` nos novos módulos (`relics.ts`, `BossDuelModal.tsx`, `EmberLedger.tsx`, `RoomTile3D.tsx`).
- Pontos de atenção: `loadFromLocalStorage()` em `gameStore.ts:165` recebe `JSON.parse(raw)` sem validação estrutural de schema para `craftedRelics` e `bossOutcomes` (apenas fallback parcial `?? {}`, faltando sanitização para `party.craftedRelics`).

### Verdict Details
- **Component Architecture**: PASS (boa separação UI / Canvas / Store / Engine, faltando apenas extrair wrapper de `EmberLedger` e memoizar `RoomTile3D`)
- **State Management**: CONCERNS (`undo`/`redo` desprotegidos durante `pendingBossEncounter` e `thumbFailed` local sem reset por ID)
- **Type Safety**: PASS (limpo nos arquivos novos; `JSON.parse` de save legado merece normalização explícita)
- **Rendering Performance**: CONCERNS (re-render em leque via `hoveredRoom` e geometria clonada sem `.dispose()`)
- **Bundle Impact**: PASS (`index` CSS `41.39 kB`, JS `155.26 kB`, R3F `300.63 kB`, Three `690.41 kB` estáveis; podar 111.3 KB de WebPs órfãos em `public/assets/ui/`)

---

## 4. Backend Engineer

**Skipped** — App 100% client-side Vite/React/R3F SPA & PWA offline-first sem servidor, API routes, banco de dados, filas ou workers de backend.

---

## 5. Structural Engineer

**Perspective**: Systems/Structural Architect
**Date**: 2026-11-19
**Plan**: Uncommitted changes vs `HEAD` (`40a126a`)

### Plan Summary
Novos módulos `src/engine/relics.ts`, `src/components/ui/BossDuelModal.tsx`, `src/styles/gui-skin.css` e `scripts/process-gui-assets.py` integram-se à arquitetura existente em 4 camadas (`engine` pura -> `store` Zustand -> `components/canvas` 3D & `components/ui` 2D).

### Files Reviewed
| File | Structural Role | Layer | Risk |
|------|----------------|-------|------|
| `src/engine/types.ts` | Contratos centrais (`RelicId`, `BossOutcome`, `HeroParty`) | Domain (`engine`) | Low |
| `src/engine/relics.ts` | Catálogo canônico das 5 relíquias e helpers puros | Domain (`engine`) | Low |
| `src/engine/heroes.ts` | Criação de party e progressão/forja de relíquias | Domain (`engine`) | Low |
| `src/engine/combat.ts` | Cálculo de poder base + bônus contra chefe | Domain (`engine`) | Low |
| `src/store/gameStore.ts` | Máquina de estado, orquestração de rodadas e duelos | Application (`store`) | Medium |
| `src/components/canvas/RoomTile3D.tsx` | Projeção visual dos estados do tabuleiro/chefe | Presentation (`canvas`) | Medium |
| `src/components/canvas/DungeonCanvas.tsx` | Orquestrador WebGL e preview textual de sala | Presentation (`canvas`) | Medium |
| `src/components/ui/EmberLedger.tsx` | Sidebar tática + visualização das relíquias | Presentation (`ui`) | Medium |
| `src/components/ui/BossDuelModal.tsx` | Interface de duelo de Chefe | Presentation (`ui`) | Medium |

### Verdict: APPROVE WITH CHANGES

### Critical Issues (Must Fix)
| # | Issue | Files Involved | Structural Impact | Fix |
|---|-------|---------------|-------------------|-----|
| 1 | Acoplamento e divergência da regra de combate contra lacaios (`relevantLevel`) e de cálculo de bônus exibido: a lógica de afinidade de herói contra lacaios está replicada em 3 locais (`combat.ts`, `RoomTile3D.tsx`, `DungeonCanvas.tsx`), e `EmberLedger.tsx` (`L102-104`) diverge de `combat.ts` (`L43-55`) ao somar `selo-onmyo` visualmente ao lado de `calculatePartyPower` | `src/engine/combat.ts` (`L16-55`), `src/components/canvas/RoomTile3D.tsx` (`L181-192`), `src/components/canvas/DungeonCanvas.tsx` (`L372-380`), `src/components/ui/EmberLedger.tsx` (`L101-104`) | Alterar a regra de afinidade ou adicionar um novo bônus de relíquia exige editar 4 arquivos em 3 camadas, com risco de UI mostrar cor verde enquanto o combate dá dano (drift) | Exportar `getRelevantHeroLevel(party, minion)` em `src/engine/combat.ts` e reusá-lo em `resolveMinionEncounter`, `RoomTile3D` e `DungeonCanvas`; expor `getCombatPowerBreakdown(party)` retornando `{ heroLevels, permanentRelicBonus, bossOnlyBonus, partyPower, bossPower }` usado igualmente por `EmberLedger` e `BossDuelModal` |

### Recommendations
| # | Issue | Why | Fix |
|---|-------|-----|-----|
| 1 | `src/engine/relics.ts` acopla URL de apresentação (`/assets/ui/relic-*.webp`) diretamente dentro da camada de domínio pura (`L18, L25, L32, L39, L46`) | Acopla a engine testável de regras ao caminho de servidor HTTP da camada UI | Considerar manter `iconUrl` em um mapa de UI (`RELIC_ICON_URLS` em `src/components/ui/`) ou documentar explicitamente como contrato de asset estático |
| 2 | `BossDuelModal.tsx` (`L6`) importa diretamente `STANDEE_ASSET_URLS` da camada `canvas` (`../canvas/standeeTextures`), invertendo fronteira `ui` <-> `canvas` e puxando dependência lógica do namespace 3D para um modal DOM 2D | `BossDuelModal` não precisa importar módulo Three.js (`standeeTextures.ts` importa `three`) só para ler uma string de URL! | Mover mapa estático de URLs de standees (`STANDEE_ASSET_URLS`) para módulo neutro (`src/engine/` ou `src/assets/assetManifest.ts`) sem importar `three`, reduzindo acoplamento e melhorando code-splitting |
| 3 | `scripts/process-gui-assets.py` e `proceduralTextures.ts` ainda carregam definições de `prop-war-banner`, `prop-stone-lantern`, `prop-torii-gate` que foram substituídos por geometria 3D em `Environment360.tsx` | Código morto engana leitores futuros sobre como o cenário é renderizado | Remover `getEnvPropTexture` e limpar entradas órfãs em `scripts/process-gui-assets.py` |

### Nice-to-Haves
| # | Suggestion | Rationale |
|---|------------|-----------|
| 1 | Extrair constantes de boss rounds `[3, 6, 8]` em `src/engine/combat.ts` (`BOSS_ROUNDS`) em vez de repeti-las em `gameStore.ts`, `HUD.tsx` | Ponto único de verdade para progressão de campanha |

### Dependency Map
```text
src/engine/types.ts  <──  src/engine/relics.ts  ──>  (contém iconUrl /assets/ui/*)
        ▲                        ▲
        │                        ├── src/engine/heroes.ts
        │                        ├── src/engine/combat.ts
        │                        └── src/store/gameStore.ts
        │                                    ▲
        ├────────────────────────────────────┼───────────────────┐
        │                                    │                   │
src/components/canvas/DungeonCanvas    src/components/ui/EmberLedger   src/components/ui/BossDuelModal
        │                                                        ▲          │
        ├── Environment360 ──> proceduralTextures / glbRegistry  │          │
        └── RoomTile3D ──────> standeeTextures (imports three) ◄─┴──────────┘
                                 ▲   (BossDuelModal importa UI -> Canvas -> Three!)
```

### Boundary Crossing Analysis
| Crossing | From -> To | Clean? | Notes |
|----------|-----------|--------|-------|
| Domain <-> Store | `engine/{heroes,combat,relics}` -> `store/gameStore` | Yes | Fluxo unidirecional limpo; apenas `combat.ts` vs `EmberLedger` divergiu na exibição do bônus |
| Store -> Presentation | `gameStore` -> `ui/*` & `canvas/*` | Partial | Faltava `cancelPendingBoss` e guarda em `undo/redo` com modal aberto |
| UI -> Canvas (`BossDuelModal` -> `standeeTextures`) | `components/ui` -> `components/canvas` | No | `BossDuelModal` puxa arquivo que importa `THREE` só para ler `STANDEE_ASSET_URLS` |
| Pipeline -> Runtime (`scripts/process-gui-assets.py` -> `public/assets/ui`) | Build tool -> Static assets | Partial | 5 sprites gerados sem consumidor no runtime |

### Verdict Details
- **Dependency Direction**: CONCERNS (`ui -> canvas -> three` em `BossDuelModal` e `iconUrl` em `engine/relics.ts`)
- **Module Coupling**: CONCERNS (`relevantLevel` e `villainId` mapeados repetidamente em múltiplos componentes)
- **Cohesion**: PASS (`relics.ts` e `BossDuelModal.tsx` são altamente coesos e enxutos)
- **Layer Boundaries**: CONCERNS (cálculo de combate reimplementado dentro de `RoomTile3D` e `DungeonCanvas`)
- **Change Propagation**: PASS (modular e fácil de evoluir após consolidar os helpers compartilhados)

---

## 6. Repo Maintainer

**Perspective**: Repo Maintainer
**Date**: 2026-11-19
**Plan**: Uncommitted changes vs `HEAD` (`40a126a`)

### Plan Summary
Avaliação de higiene do working tree (`22` modificados + arquivos não rastreados em `assets/`, `scripts/`, `src/`, `public/assets/ui/`), convenções File-Fit, código morto, imports e conformidade com padrões estabelecidos do repositório.

### Files Reviewed
| File | Convention Status | Risk |
|------|------------------|------|
| `.gitignore` | Desatualizado (omite zips/bundles/pastas brutas de ~95 MB) | High |
| `assets/` (`GUI UI_UX/`, `GUI UI_UX.zip`, `flow-assets-bundle 2.json`, `Gemini_Generated_Image_*.jpeg`) | Untracked + viola File-Fit (espaços e maiúsculas) | High |
| `scripts/process-gui-assets.py` | Gera 5 WebPs sem consumidor (`prop-*.webp`, `panel-crafting-double.webp`, `icon-heart-damaged.webp`) | Medium |
| `src/components/canvas/proceduralTextures.ts` | Contém função morta `getEnvPropTexture` (`L796-843`) | Medium |
| `src/styles/gui-skin.css` | Novo CSS limpo em kebab-case; mistura classes de tema sem namespace | Low |
| `src/engine/relics.ts`, `src/components/ui/BossDuelModal.tsx` | Naming e colocação exemplares nos diretórios certos | Low |

### Verdict: NEEDS REWORK

### Critical Issues (Must Fix)
| # | Issue | File(s) | Convention Violated | Fix |
|---|-------|---------|-------------------|-----|
| 1 | Working tree contém **~95 MB** de arquivos brutos não listados no `.gitignore`: `assets/GUI UI_UX.zip` (28.4 MB), `assets/flow-assets-bundle 2.json` (34.3 MB), `assets/GUI UI_UX/` (~31 MB), `assets/Gemini_Generated_Image_*.jpeg` (~5.4 MB), vários com espaços e acentos/maiúsculas proibidos pela regra File-Fit para arquivos rastreados | `.gitignore`, `assets/*` | File-Fit Governance (seção 1: slugs sem espaço/maiúsculas; higiene de repositório Git) | Atualizar `.gitignore` com `assets/GUI UI_UX/`, `assets/GUI UI_UX.zip`, `assets/flow-assets-bundle*.json` e `assets/Gemini_Generated_Image_*.jpeg` antes de rodar `git add` |
| 2 | Código morto e assets órfãos em produção: `getEnvPropTexture()` e `EnvPropKind` em `proceduralTextures.ts` (`L5, L15, L796-843`) não têm mais nenhum consumidor em `src/`, e 5 WebPs (`prop-war-banner.webp`, `prop-stone-lantern.webp`, `prop-torii-gate.webp`, `panel-crafting-double.webp`, `icon-heart-damaged.webp` = **111.3 KB**) estão em `public/assets/ui/` sem uso no app | `src/components/canvas/proceduralTextures.ts`, `scripts/process-gui-assets.py`, `public/assets/ui/*.webp`, `tests/components/UI.test.tsx` | No dead code / unused assets left behind | Remover `getEnvPropTexture`, atualizar `tests/components/UI.test.tsx`, podar os 5 sprites órfãos de `process-gui-assets.py` (ou documentar/usar `icon-heart-damaged.webp` para meio coração/ferimento se desejado) e apagar os `.webp` órfãos de `public/assets/ui/` |

### Recommendations
| # | Issue | Why | Fix |
|---|-------|-----|-----|
| 1 | `import` de tipos sem `import type` em vários arquivos editados (`DungeonCanvas.tsx`, `EmberLedger.tsx`, `gameStore.ts`, `RoomTile3D.tsx`) e ausência de uso dos aliases configurados `@/` e `@engine/` | Padrão inconsistente (`vite.config.ts` define `@` e `@engine`, mas todos os arquivos usam `../../`) | Adotar `import type` nos símbolos de tipo dos arquivos tocados |
| 2 | Reaproveitamento: `resolveVillainThumbKind` (`BossDuelModal.tsx`) duplica parte de `resolveRoomStandeeKind` (`RoomTile3D.tsx`) e `relevantLevel` é triplicado | Erosão lenta por duplicação | Consolidar em helpers únicos no engine/manifesto |
| 3 | `package.json` continua em `"version": "1.2.0"` e `CHANGELOG.md` / `STATE.md` ainda não refletem `v1.3` | Normal antes do release, mas importante lembrar antes da tag | Sincronizar versão no commit de fechamento |
| 4 | Aviso do Vite sobre chunks > 500 kB (`vendor-three` em `690.41 kB`) continua presente no build | Warning recorrente no log de CI | Aceito para Three.js via `manualChunks`, ou aumentar `chunkSizeWarningLimit: 750` em `vite.config.ts` |
| 5 | Documentos soltos em `assets/` (`especificacao_de_ui_e_assets_tiny_dungeon.md`, `google-flow-prompts-tiny-dungeon-sengoku.md`, `gui-round2-prompts.md`) misturam documentação em `assets/` em vez de `docs/reference/` | File-Fit Diátaxis coloca documentação técnica em `docs/reference/` | Mover specs/prompts permanentes para `docs/reference/` ou adicionar drafts transitórios ao `.gitignore` |

### Nice-to-Haves
| # | Suggestion | Rationale |
|---|------------|-----------|
| 1 | Adicionar script `"typecheck": "tsc --noEmit"` e `"lint"` em `package.json` | Separa checagem estática rápida do empacotamento completo Vite |

### Convention Compliance Checklist
| Convention | Status | Notes |
|-----------|--------|-------|
| File placement | CONCERNS | Código fonte ok (`src/engine/`, `src/components/{ui,canvas}`, `src/styles/`); rascunhos md soltos em `assets/` |
| Naming conventions | CONCERNS | `src/` perfeito (`PascalCase` componentes, `camelCase` engine); `assets/flow-assets-bundle 2.json` e `GUI UI_UX/` quebram File-Fit |
| Module/barrel exports | N/A | Repo usa imports diretos sem barrels (bom para tree-shaking) |
| Import ordering & hygiene | CONCERNS | Mistura `import` relativo longo `../../` onde `@engine/` existe em `vite.config.ts` |
| Type imports separated | CONCERNS | Tipos importados juntos de valores sem `import type` |
| Path aliases used | CONCERNS | `@/` e `@engine/` definidos no `vite.config.ts` porém subutilizados |
| No dead code left | FAIL | `getEnvPropTexture` + `EnvPropKind` + 5 `.webp` órfãos (`111.3 KB`) |
| Structured logging | PASS | Sem `console.log` de debug nos arquivos alterados (`console.error` apenas em falha de storage) |
| No lint suppressions | PASS | Zero `@ts-ignore` / `eslint-disable` |
| Project guidelines updated | CONCERNS | `CHANGELOG.md` / `STATE.md` ainda em `1.2.0` (pré-commit esperado) |

### Reuse Opportunities
- `resolveVillainStandeeKind` compartilhado entre `BossDuelModal` e `RoomTile3D`.
- `getRelevantHeroLevel` compartilhado entre `combat.ts`, `RoomTile3D` e `DungeonCanvas`.
- `RelicThumb` de `EmberLedger.tsx` pode cobrir o fallback dos slots do Relic Rack.

### Verdict Details
- **File Organization**: CONCERNS (pasta `assets/` desorganizada com zips/backups; `src/` bem organizado)
- **Naming Consistency**: CONCERNS (`flow-assets-bundle 2.json`, `GUI UI_UX/` precisam ficar no `.gitignore`)
- **Import Hygiene**: CONCERNS (faltam `import type`)
- **Code Reuse**: CONCERNS (duplicações pequenas apontadas acima)
- **Lint & Type Compliance**: PASS (`tsc && vite build` limpo, 0 erros)

---

## 7. Production Readiness

**Perspective**: Production Readiness Engineer
**Date**: 2026-11-19
**Plan**: Uncommitted changes vs `HEAD` (`40a126a`)

### Plan Summary
Avaliação de deploy estático / PWA offline-first (`dist/`, `public/sw.js`), compatibilidade com saves anteriores em `localStorage` (`tiny_dungeon_save_v2`), resiliência de WebGL e carregamento de 41 imagens `.webp`.

### Files Reviewed
| File | Production Role | Risk |
|------|----------------|------|
| `public/sw.js` | Estratégia offline PWA e invalidação de cache | High |
| `src/store/gameStore.ts` | Serialização/deserialização `localStorage` entre versões | High |
| `src/components/canvas/DungeonCanvas.tsx` | Verificação WebGL, renderização `<Canvas>` e recuperação de contexto | Medium |
| `src/main.tsx` | Registro do Service Worker e carga de CSS | Low |
| `public/assets/ui/*.webp` | Assets estáticos servidos em produção | Medium |

### Verdict: APPROVE WITH CHANGES

### Critical Issues (Must Fix)
| # | Issue | File(s) | Production Failure Mode | Fix |
|---|-------|---------|------------------------|-----|
| 1 | `public/sw.js` mantém nomes de cache antigos (`tiny-dungeon-static-v1` / `tiny-dungeon-pages-v1`) e o interceptador `fetch` (`L52-64`) só cacheia `request.destination` em `['script', 'style', 'image', 'font']` | `public/sw.js` (`L1-9, L51-65`) | (a) Usuários recorrentes ficam presos com JS/CSS antigos no cache; (b) em modo offline ou rede instável, `fetch('/models/torii-gate.glb')` (que tem `destination === ''`) nunca é cacheado pelo SW e cai para o fallback geométrico | Atualizar chaves para `v3`, incluir `.glb`/`.webp` explicitamente na regra `CacheFirst` (`url.pathname.endsWith('.glb') \|\| url.pathname.endsWith('.webp')`) e pré-cachear as imagens críticas de UI ou cachear no primeiro load |
| 2 | `loadFromLocalStorage()` em `src/store/gameStore.ts` (`L160-185`) aceita saves da versão anterior (`v1.2.0`) sob a mesma `STORAGE_KEY = 'tiny_dungeon_save_v2'` sem migrar `party.craftedRelics` | `src/store/gameStore.ts` (`L102, L160-185`) | Jogador com campanha salva da `v1.2.0` (`magicItems: 2`, `craftedRelics: undefined`) vê `Itens: 2` na interface enquanto todos os 5 slots visuais do Relic Rack aparecem vazios (`0/5`) | Em `loadFromLocalStorage`, se `parsed.party.magicItems > 0 && !Array.isArray(parsed.party.craftedRelics)`, reconstruir sequencialmente `craftedRelics` usando `getNextRelicToCraft` `magicItems` vezes, e garantir `pendingBossEncounter: null` + `bossOutcomes: parsed.bossOutcomes ?? {}` |

### Recommendations
| # | Issue | Why | Fix |
|---|-------|-----|-----|
| 1 | `DungeonCanvas.tsx` checa `isWebGLAvailable()`, mas não trata evento `webglcontextlost` em `<Canvas onCreated>` | Em celulares sob pressão de memória ou drivers Windows após hibernação, o canvas WebGL congela em preto sem aviso ou botão de recuperação | Registrar listener `gl.domElement.addEventListener('webglcontextlost', ...)` com fallback amigável e botão "Recarregar Tabuleiro" |
| 2 | `saveToLocalStorage()` apenas loga `console.error` silencioso se `localStorage.setItem` lançar `QuotaExceededError` | Usuário continua jogando sem saber que a sessão não persistirá após fechar a aba | Exibir feedback discreto ou limpar saves antigos antes de falhar |
| 3 | `gameStore.ts:105` usa `isTestEnvironment()` checando `globalThis.process?.env?.VITEST`; em alguns bundlers isso é benigno, mas é acoplamento desnecessário com variável Node | Segurança e higiene de runtime | Manter compatível com Vitest e opcionalmente usar `import.meta.env?.MODE === 'test'` |

### Nice-to-Haves
| # | Suggestion | Rationale |
|---|------------|-----------|
| 1 | Expor link/botão discreto de "Resetar Progresso Local" no menu/modal caso save corrompido gere estado inesperado | Facilita suporte do usuário final em PWA instalado |

### Failure Mode Analysis
| Scenario | What Fails | User Impact | Recovery | Handled? |
|----------|-----------|-------------|----------|----------|
| PWA offline com app atualizado | `sw.js` `v1` não cacheia `.glb` e pode servir shell desatualizado | Modelos 3D caem em fallback de blocos e CSS pode dessincronizar | Bump para `v3` + match `.glb` em `sw.js` | No |
| Save legado `v1.2.0` no `localStorage` | `party.craftedRelics` é `undefined` | `Itens: N` diverge do Rack visual `0/5` e bônus não aplicam | Hidratar `craftedRelics` em `loadFromLocalStorage` | No |
| WebP ou standee ausente em rede lenta | `<img>` falha em `EmberLedger` (Relic Rack) | Ícone quebrado no slot de relíquia (outros componentes já têm fallback SVG) | Adicionar `onError` nos `<img src={relic.iconUrl}>` | Partial |
| Save JSON corrompido | `JSON.parse` lança exceção | `loadFromLocalStorage` retorna `null` e inicia campanha limpa | Automático | Yes |
| Browser headless / sem WebGL | `isWebGLAvailable()` retorna `false` | Mostra placeholder `[WebGL 3D Dungeon Canvas Active]` sem crash | Automático | Yes |
| Perda de contexto WebGL em runtime | Driver GPU reseta contexto após sleep | Cena fica preta até recarregar página | Listener `webglcontextlost` | No |

### Environment Checklist
| Concern | Dev | Prod | Gap? |
|---------|-----|------|------|
| File paths & storage | Paths relativos `/assets/ui/*`, `localStorage` | Mesmos paths em `dist/assets/ui/*` | Sem gap de path; gap em migração de `craftedRelics` |
| Network & endpoints | Nenhum endpoint externo | 100% local / estático | No |
| Secrets & config | Nenhum segredo | Zero secrets no bundle | No |
| Build & deployment bundling | Vite dev server (ignora `assets/**`) | `dist/` (`vite build` copiará todo `public/`) | Sem gap de build; podar WebPs órfãos antes |
| Offline / PWA Caching | SW desabilitado (`if (import.meta.env.PROD)`) | SW ativo em HTTPS/localhost preview | Gap no `public/sw.js` para `.glb` + cache bump |

### Verdict Details
- **E2E Flow**: PASS (fluxo de jogo completo testado até Round 8 com pontuação final)
- **Error Recovery**: CONCERNS (falta recovery para `webglcontextlost` e fallback `onError` nos ícones do Relic Rack)
- **Data Integrity**: CONCERNS (save legado `v1.2.0` perde vínculo entre `magicItems` e `craftedRelics`)
- **Environment Parity**: CONCERNS (PWA offline `sw.js` perde `.glb`s por `request.destination === ''`)
- **Observability**: PASS (`logs` em jogo e erros tratados sem engolir silenciosamente)

---

## 8. DX Engineer

**Perspective**: Developer Experience Engineer
**Date**: 2026-11-19
**Plan**: Uncommitted changes vs `HEAD` (`40a126a`)

### Plan Summary
Avaliação da experiência do desenvolvedor e power user: ergonomia do pipeline Python (`scripts/process-gui-assets.py`), comportamento de atalhos de teclado (`Z`, `Y`, `Enter`, `Space`, `Esc`), harness `?demo=`/`?map=`/`?seed=` e clareza dos logs/erros em testes e scripts.

### Files Reviewed
| File | DX Role | Risk |
|------|---------|------|
| `scripts/process-gui-assets.py` | CLI local de corte/conversão de sprites | Medium |
| `src/App.tsx` | Atalhos de teclado e flags de URL (`?demo=`, `?map=`, `?seed=`, `?theme=`) | Medium |
| `src/components/ui/BossDuelModal.tsx` | Atalhos e operação sem mouse no modal | Medium |
| `tests/components/UI.test.tsx` | Verificação unitária de componentes e fallbacks de textura | Low |

### Verdict: APPROVE WITH CHANGES

### Critical Issues (Must Fix)
| # | Issue | Impact on Developer / Power User | Fix |
|---|-------|----------------------------------|-----|
| 1 | Atalhos de teclado inconsistentes quando `BossDuelModal` está aberto (`App.tsx:96-112`, `BossDuelModal.tsx`): `Z`/`Y`/`Enter`/`Space` são silenciados com `if (pendingBossEncounter) return;`, porém `Escape` não cancela o modal e não há atalho rápido (`1`/`2` ou foco + `Enter`) documentado no diálogo | Power user que joga pelo teclado usa `Z`/`Y`/`Enter`, abre o modal com `Enter` e fica travado sem `Esc` nem indicação clara no DOM | Adicionar listener de `Escape` dentro de `BossDuelModal` para fechar via `cancelPendingBoss`, manter foco dentro do diálogo e deixar claro os atalhos no label do botão (`Voltar (Esc)`) |

### Recommendations
| # | Issue | Why | Fix |
|---|-------|-----|-----|
| 1 | `scripts/process-gui-assets.py` não tem `argparse` (`--help`, `--dry-run`, `--only`), nem mensagem de instalação caso `PIL` (`Pillow`) esteja ausente; ao rodar sem Pillow falha com traceback cru `ModuleNotFoundError` | Fricção no onboarding de outro dev ou ambiente limpo | Envolver `from PIL import Image` com instrução `pip install pillow` e adicionar `argparse` com `--help` e `--dry-run` |
| 2 | `tests/components/UI.test.tsx` (`L79-96`) chama funções `proceduralTextures.ts` diretamente sem mockar `HTMLCanvasElement.prototype.getContext` -> JSDOM imprime **~13 stacktraces ruidosos de `Error: Not implemented`** no `stderr` a cada `npm test`, ofuscando falhas reais nos logs! | Polui saída de teste e dificulta leitura de CI/terminal | Espionar `vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)` neste teste específico (igual `standeeTextures.test.ts:117` já faz!) com `afterEach(() => vi.restoreAllMocks())` |
| 3 | `?demo=midgame` em `App.tsx:48-59` não cria nenhuma relíquia no estado de demonstração nem testa um chefe no estado `active` (`Round 3/6/8`) | Para validar visualmente Relic Rack aceso e BossDuelModal após mudanças, o dev precisa jogar ou editar estado manualmente | Adicionar opção `?demo=boss` (Round 3 + 2 relíquias forjadas) no harness determinístico de `App.tsx` |
| 4 | `tsconfig`/scripts no `package.json`: ausência de `"typecheck"` isolado faz o dev esperar 25s de bundle Rollup (`npm run build`) só para checar tipos TS | Feedback lento no loop de edição | Adicionar `"typecheck": "tsc --noEmit"` em `package.json` |

### Nice-to-Haves
| # | Suggestion | Rationale |
|---|------------|-----------|
| 1 | Permitir selecionar o texto do `CombatLog` (`select-text`) para copiar seed e mensagens de combate durante QA | Hoje `main` tem `select-none` bloqueando seleção de texto dentro do log |

### Error Message Audit
| Error Scenario | Current Message | What Developer Needs | Suggested Message |
|---------------|----------------|---------------------|-------------------|
| Script Python sem biblioteca Pillow | `ModuleNotFoundError: No module named 'PIL'` | Comando exato de instalação | `Erro: biblioteca Pillow ausente. Instale com: pip install pillow` |
| Imagem fonte ausente em `process-gui-assets.py` | `FileNotFoundError: Asset nao encontrado: ...` | Bom (mostra path completo), pode sugerir rodar com `--check` | Manter path completo e listar quantos faltam antes de abortar |
| Teste JSDOM chamando `.getContext('2d')` em `UI.test.tsx` | 13 stacktraces vermelhos `Error: Not implemented: HTMLCanvasElement.prototype.getContext` apesar do teste passar | Saída limpa de testes sem falso negativo visual | Silenciar com `vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)` em `UI.test.tsx` |
| WebGL indisponível | `[WebGL 3D Dungeon Canvas Active]` em `DungeonCanvas.tsx:338` | Mensagem voltada ao usuário final / QA | `Modo 3D WebGL indisponível neste dispositivo. Ative aceleração de hardware para ver o tabuleiro 3D.` |

### Developer Journey
- **First use**: `npm install`, `npm run build` e `npm test` funcionam direto sem `.env` ou banco; apenas `process-gui-assets.py` assume Python + Pillow pré-instalados e espera o zip/pasta `assets/GUI UI_UX/`.
- **Daily use**: URL harness `?map=5&demo=midgame&seed=4242&theme=sengoku` acelera muito a inspeção visual no preview `vite preview`.

### Verdict Details
- **Error Quality**: CONCERNS (ruído de JSDOM no `stderr` e `ModuleNotFoundError` cru em Python)
- **Defaults & Config**: PASS (zero config necessária, `vite.config.ts` bem configurado)
- **Keyboard/CLI Experience**: CONCERNS (falta `--help` no script Python e `Esc` no `BossDuelModal`)
- **Discoverability**: PASS (botões e harness de URL claros)
- **Workflow Integration**: PASS (PowerShell-safe com testes automatizados rápidos)

---

## 9. Performance Engineer

**Perspective**: Performance Engineer
**Date**: 2026-11-19
**Plan**: Uncommitted changes vs `HEAD` (`40a126a`)

### Plan Summary
Auditoria de orçamento de memória GPU (texturas `512×512` e `1024×1024`, geometrias `.glb` clonadas), hot paths (`useFrame`, hover raycasting em mapas `6×6` com `36` portais `<Html>`), crescimento de estado em sessões longas e tamanho do pacote servido.

### Files Reviewed
| File | Performance Role | Risk |
|------|-----------------|------|
| `src/components/canvas/Environment360.tsx` | Cache de texturas, clones `.glb`, 4 braseiros + 8 lanternas + 8 estandartes em `useFrame` | High |
| `src/components/canvas/proceduralTextures.ts` | 9 caches `Map`, múltiplos canvases `1024×1024` e `512×512` | Medium |
| `src/components/canvas/DungeonCanvas.tsx` | Hover state disparando re-render na árvore R3F, 5 `TorchLight` (`pointLight`) + directional shadows | Medium |
| `src/components/canvas/RoomTile3D.tsx` | 16–36 instâncias com `useFrame`, `Billboard` e `<Html>` | Medium |
| `src/store/gameStore.ts` | Histórico `history`/`future` e array `logs` | Low |

### Verdict: APPROVE WITH CHANGES

### Critical Issues (Must Fix)
| # | Issue | File(s) | Impact | Fix |
|---|-------|---------|--------|-----|
| 1 | Vazamento de `THREE.BufferGeometry` em `Environment360.tsx:37-68, 92-95`: `ensureBoxUvGeometry()` chama `source.clone()` em `torii-gate` e `lantern-pedestal` sem `.dispose()` na desmontagem do componente | `src/components/canvas/Environment360.tsx` (`L37-68, L92-95`) | Retém vertex/index buffers na GPU a cada remount ou troca de modo | Gerar UVs box-projected uma única vez no `parseGlbToGeometry()` ao carregar o `.glb` no cache global de `glbRegistry.ts`, OU chamar `.dispose()` nos clones no cleanup de `useEffect` |
| 2 | `111.3 KB` de assets WebP órfãos servidos em `public/assets/ui/` + `public/sw.js` ignorando cache de modelos `.glb` (forçando re-download de rede a cada recarga) e alternância de tema mantendo os 2 conjuntos de texturas canvas em `Map` sem eviction | `public/sw.js` (`L51-65`), `public/assets/ui/*`, `src/components/canvas/proceduralTextures.ts` (`L6-15`) | Desperdício de espaço em cache/disco, re-fetch desnecessário dos `.glb`s e acúmulo de ~24 MB de bitmaps de `CanvasTexture` se o usuário alternar Sengoku <-> Vesperfall repetidamente | Podar os 5 WebPs sem uso, habilitar cache para `.glb` no `sw.js`, e opcionalmente manter texturas cacheadas apenas para o tema ativo ou limitar a 2 entradas |

### Recommendations
| # | Issue | Why | Fix |
|---|-------|-----|-----|
| 1 | `hoveredRoom` em `DungeonCanvas.tsx` (`L309`) re-renderiza todos os `36` tiles `RoomTile3D` (em mapa `6×6`) + seus nós Drei `<Html>` a cada transição de mouse | Gargalo evitável em CPU durante movimentação rápida do ponteiro em `6×6` | Memoizar `RoomTile3D` (`React.memo`) com prop escalar + callback estável e separar o badge `hoveredRoom` em componente próprio conectado a um ref/sub-store |
| 2 | Cada laje em `RoomTile3D` (`L179`) tem `castShadow` e `receiveShadow` (`36` lajes + `60+` paredes + `8` lanternas + `8` pilares + `8` estandartes + `4` torii) além de 5 `<TorchLight>` (`pointLight`) em `DungeonCanvas` (`L233-237`) | Em GPUs integradas/mobile, múltiplos shadow casters e 5 pointLights por pixel do pátio elevam o custo de fragment shader | Remover `castShadow` das lajes do piso em `RoomTile3D` (`L179` — o piso só precisa `receiveShadow`) e do pano fino dos estandartes em `Environment360` (`L472`) |
| 3 | `gameStore.ts` faz `JSON.parse(JSON.stringify(...))` em `takeSnapshot` (`L350-360`) a cada ação (incluindo `dungeon.rooms` de 36 casas!) e `logs` cresce sem limite ao longo de múltiplas rodadas | Cópia profunda síncrona no main thread + acúmulo linear | Usar `structuredClone` ou cópia rasa dos campos mutáveis, e limitar `logs` a um buffer circular (ex.: últimas 150 entradas) |
| 4 | `RoomTile3D.tsx` declutter reduziu `<Html>` DOM overlays de `36` para ~`15–22` ativos em `6×6`, mantendo custo muito melhor — pode reduzir ainda mais mantendo badges fixos apenas em obstáculos não limpos | Reduz layout/compositing de elementos `<Html>` projetados em CSS3D | Manter abordagem atual de ocultar `empty`/`cleared`, evitando reintroduzir placas extras |

### Nice-to-Haves
| # | Suggestion | Rationale |
|---|------------|-----------|
| 1 | Reduzir `getCourtyardGroundTexture` ou `getTabletopMatTexture` de `1024×1024` para `512×512` em dispositivos com `devicePixelRatio === 1` se notar pressão de VRAM | Economia de 4× na memória da textura de chão sem perda perceptível |

### Resource Budget
| Resource | Current (`HEAD` `v1.2.0`) | After Changes (`working tree`) | Concern? |
|----------|-----------------------------|-------------------------------|----------|
| Bundle CSS (`dist/`) | ~`35.2 kB` (com skin v1 pass) / ~`18 kB` v1.2 | `41.39 kB` (`7.98 kB` gzip) | Low (saudável) |
| Bundle JS (`index`) | ~`124.8 kB` | `155.26 kB` (`42.52 kB` gzip) | Low (`+30 kB` com modal & relics) |
| Vendor Chunks (`three` + `r3f`) | `690.4 kB` + `300.6 kB` | `690.41 kB` + `300.63 kB` | Zero regressão |
| Static UI Assets (`public/assets/ui/`) | `0 KB` (`HEAD` v1.2) | `620.8 KB` (41 WebPs; **111.3 KB órfãos**) | Moderate (podar os 5 órfãos) |
| GPU Procedural `CanvasTexture`s (1 tema) | 4 texturas (~`4.5 MB` uncompressed RGBA) | 9 texturas (`3× 1024²`, `5× 512²`, `1× 256²` ≈ `18.2 MB` por tema) | Moderate (controlável se não clonar geometrias) |
| Network calls por ação de jogo | `0` | `0` (WebPs carregados sob demanda e cacheados) | Low (desde que `sw.js` cacheie `.glb`/`.webp`) |
| Event listeners globais | `keydown`, `visibilitychange` | Sem novos listeners globais adicionados | Low (limpos no `return` de `useEffect`) |

### Hot Path Analysis
- **`useFrame` (`Environment360`, `RoomTile3D`, `DungeonCanvas`)**: Todos checam `if (isPaused) return;` no topo, mutam transforms/opacidade sem alocações nem `setState`. Seguro em 60fps.
- **Hover Raycast (`RoomTile3D` -> `DungeonCanvas`)**: Hot path ao mover o cursor sobre 36 tiles. Precisa de `React.memo` em `RoomTile3D` para evitar re-renderizar todos os 35 irmãos a cada troca de casa sob o mouse.
- **Fragment Shader (`Environment360` chão `circleGeometry radius=40`)**: O chão de lajotas é grande (`radius >= 40`) e tem `receiveShadow` + `bumpMap` sob `1 directionalLight + 5 TorchLights`. Retirar `castShadow` das lajes do piso ajuda GPU integrada.

### Verdict Details
- **Memory Management**: CONCERNS (clones de `BufferGeometry` sem `dispose()` e 111.3 KB de WebPs órfãos)
- **Network/IPC Efficiency**: CONCERNS (`sw.js` sem cache `.glb`)
- **I/O Patterns**: PASS (leitura/escrita `localStorage` enxuta, processamento offscreen via canvas bem isolado)
- **Startup Impact**: PASS (assets UI lazy / sob demanda; `155 kB` app JS inicial leve)
- **Long-Session Stability**: CONCERNS (`logs` sem limite e 2 temas em `Map` dobram VRAM para ~`36 MB` se usuário alternar temas várias vezes)

---

## 10. Accessibility Engineer

**Perspective**: Accessibility Engineer
**Date**: 2026-11-19
**Plan**: Uncommitted changes vs `HEAD` (`40a126a`)

### Plan Summary
Avaliação de conformidade WCAG 2.1 AA para os novos fluxos interativos: `BossDuelModal` (`role="dialog"`), `EmberLedger` (Rack de 5 Relíquias, contraste sobre pergaminho, hierarquia de títulos), `HUD` (animação e leitor de tela), `DiceTray` e `CombatLog`.

### Files Reviewed
| File | A11y Role | Risk |
|------|-----------|------|
| `src/components/ui/BossDuelModal.tsx` | Diálogo modal bloqueante de duelo | Critical |
| `src/components/ui/EmberLedger.tsx` | Painel `<aside>`, headings e slots do Relic Rack | Critical |
| `src/components/ui/HUD.tsx` | Barra de comandos, vidas, alerta animado e atalhos | High |
| `src/components/ui/DiceTray.tsx` | Botões de dados e legendas | Medium |
| `src/components/ui/CombatLog.tsx` | Região de histórico dinâmico | Medium |
| `src/App.tsx` | Landmarks, atalhos globais (`Space`/`Enter`/`Z`/`Y`) e live regions | High |

### Verdict: NEEDS REWORK

### Critical Issues (Must Fix)
| # | Issue | WCAG Criterion | File(s) | Impact | Fix |
|---|-------|---------------|---------|--------|-----|
| 1 | `BossDuelModal` (`L35-193`) tem `role="dialog" aria-modal="true"`, mas **não gerencia foco**: não move o foco para o modal ao abrir, permite `Tab` sair para trás do backdrop na página inteira, não responde a `Escape` e não devolve foco ao gatilho ao fechar | `2.1.2 No Keyboard Trap` / `2.4.3 Focus Order` | `src/components/ui/BossDuelModal.tsx`, `src/App.tsx` | Usuários de teclado e leitores de tela (NVDA/VoiceOver) navegam em botões ocultos sob a tela escura e não conseguem sair pelo `Esc` | Mover foco para o cabeçalho/botão ao montar via `ref`, implementar trap cíclico `Tab`/`Shift+Tab` (ou usar `inert` no `<main>` de fundo), fechar/voltar com `Escape` e restaurar `document.activeElement` anterior ao desmontar |
| 2 | Os 5 slots do **Acervo de Relíquias Forjadas** (`EmberLedger.tsx:365-394`) são `<div>` com `aria-label` e apenas `title` nativo (`hover` do mouse) | `2.1.1 Keyboard` / `4.1.2 Name, Role, Value` | `src/components/ui/EmberLedger.tsx` (`L365-395`) | Usuários de teclado não alcançam as relíquias com `Tab`, e leitores de tela não acessam o `title` de descrição do bônus facilmente (nem usuários touch) | Usar `<button type="button">` em cada slot com `aria-pressed` e mostrar descrição da relíquia selecionada em região texto dedicada logo abaixo do grid |
| 3 | Alerta de rodada de chefe em `HUD.tsx:149` usa `animate-pulse` diretamente sem respeitar `prefers-reduced-motion`, e `gui-skin.css` tem `transition: transform/filter` fora da media query de redução de movimento | `2.3.3 Animation from Interactions` | `src/components/ui/HUD.tsx` (`L149`), `src/index.css` (`L48-52`), `src/styles/gui-skin.css` | Usuários com sensibilidade vestibular / movimento reduzido ativado no sistema ainda veem texto piscando continuamente no cabeçalho | Trocar `animate-pulse` por `motion-safe:animate-pulse` e adicionar regra `@media (prefers-reduced-motion: reduce)` em `gui-skin.css` zerando transições e animações |

### Recommendations
| # | Issue | WCAG Criterion | Fix |
|---|-------|---------------|-----|
| 1 | Hierarquia de cabeçalhos em `EmberLedger.tsx` salta de `<h2>` (`The Ember Measure`, `L160`) para `<h4>` (`Poções & Itens` `L273` e `Missões da Expedição` `L425`) usando `<h3>` apenas nos cards de herói | `1.3.1 Info and Relationships` | Usar `<h3>` nos títulos de seção (`Poções & Itens`, `Missões da Expedição`) mantendo ordem semântica `h1 -> h2 -> h3` |
| 2 | `CombatLog.tsx` (`L38-54`) atualiza logs dinamicamente sem `role="log"` ou `aria-live="polite"`, e `HUD.tsx:283-288` usa caractere kanji `印` (`aria-hidden="true"` bom!), porém `DiceTray` usa `<span className="line-through">` como pista principal no texto inferior + Check icon visual | `4.1.3 Status Messages` / `1.4.1 Use of Color` | Adicionar `role="log" aria-live="polite" aria-relevant="additions"` no container de lista do `CombatLog` e adicionar `aria-pressed={isSelected}` nos botões de dados em `DiceTray.tsx` |
| 3 | Contraste de subtexto pequeno em `EmberLedger.tsx`: `text-amber-200/70` (`10px`) e botões `.gui-parchment-btn` desabilitados (`disabled:opacity-65`) sobre `#b8986b` devem ser validados para >= `4.5:1`; além disso `<main>` usa `select-none` global impedindo copiar textos de regras/log | `1.4.3 Contrast (Minimum)` | Clarear textos secundários (`text-amber-200/90` em fundos escuros) e escurecer texto `#1b1008` nos cartões pergaminho |

### Nice-to-Haves
| # | Suggestion | Rationale |
|---|------------|-----------|
| 1 | Atalhos de teclado dedicados no tabuleiro ou legenda alternativa em texto para casas acessíveis no `HUD`/`EmberLedger` | Em jogos WebGL, oferecer lista/atalhos para mover para uma casa válida amplia jogabilidade sem mouse |

### Keyboard Navigation Walkthrough
| Step | Action | Expected Focus | Expected Announcement | Handled? |
|------|--------|---------------|----------------------|----------|
| 1 | Pressionar `Tab` pelo `HUD` | Ordem lógica: Select Mapa -> Toggle Tema -> Áudio -> Grimório -> Desfazer/Refazer -> Confirmar | Papel `button`/`combobox` + nomes claros em PT-BR | YES |
| 2 | Pressionar `Tab` até `EmberLedger` e inspecionar os 5 slots de Relíquias | Foco entra em cada um dos 5 botões de relíquia | Nome da relíquia, estado (equipada/bloqueada) e bônus | **NO (`<div>` sem `tabIndex`/botão)** |
| 3 | Pressionar `Enter` ou clicar em `Confirmar` na Rodada 3 | Foco move imediatamente para dentro de `BossDuelModal` | "Confronto da Rodada 3 — Mantícora, diálogo" + ações Enfrentar / Fugir / Voltar | **NO (foco fica no botão `Confirmar` atrás do modal)** |
| 4 | Pressionar `Tab` / `Shift+Tab` com `BossDuelModal` aberto | Foco circula estritamente entre botões internos do modal | Não sai para `HUD`/`DiceTray` | **NO (escapa para trás do modal)** |
| 5 | Pressionar `Escape` com `BossDuelModal` aberto | Fecha/cancela duelo sem punir com fuga e devolve foco para `Confirmar` | Anúncio de retorno à rodada | **NO (`Esc` não faz nada)** |

### ARIA Checklist
| Element | Role | Label | States | Keyboard | Notes |
|---------|------|-------|--------|----------|-------|
| `BossDuelModal` container | `dialog` (`aria-modal="true"`) | `aria-labelledby="boss-duel-title"` | Visível condicional | Falta trap `Tab` e `Esc` | Corrigir foco inicial e de saída |
| Relic Rack slots (`5x`) | Nenhum (`<div>`) | `aria-label` dinâmico | Sem `aria-pressed`/expand | Não alcançável por Tab | Converter em `<button type="button">` |
| Dice buttons (`6x`) | `button` | `aria-label` cor + símbolo | `disabled={isConsumed}` (falta `aria-pressed`) | `Tab`/`Enter`/`Space` (atenção: `App` intercepta `Space` global se foco sair de input!) | Adicionar `aria-pressed` e verificar `App` listener `Space` |
| `CombatLog` list | Nenhum (`<div>`) | Título visual | Scrollable | Faltam `role="log"` e `aria-live` | Adicionar `role="log" aria-live="polite"` |
| `hoveredRoom` & Toast | Live container | `aria-live="polite"` | Condicional | N/A | Bem implementado! |
| `EmberLedger` | `<aside>` | `aria-label` presente | Aberto/fechado | `X` com `aria-label` | Ajustar `<h4>` -> `<h3>` |

### Verdict Details
- **Screen Reader Compatibility**: CONCERNS (falta `role="log"`, `aria-pressed` nos dados e acessibilidade nos slots de relíquias)
- **Keyboard Navigation**: **FAIL** (foco vaza por trás do `BossDuelModal`, sem `Esc`, slots de relíquia inacessíveis por `Tab`; além disso `App.tsx:103` captura `Space` globalmente fora de inputs sem checar se o foco está em um `<button>` — se usuário focar um dado ou botão no HUD e apertar `Space`, `App` bloqueia e dispara `confirmRound` em vez de ativar o botão focado!) *(Achado real bônus verificado em `App.tsx:99-107`: `const tag = ...; if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;` — se foco estiver em `<button>`, apertar `Space` chama `e.preventDefault(); confirmRound(...)`!)*
- **Focus Management**: **FAIL** (`BossDuelModal` sem foco inicial, trap nem restauração)
- **Color Contrast**: PASS / minor concerns (boa leitura na maioria; validar botões pergaminho desabilitados)
- **Motion Sensitivity**: CONCERNS (`animate-pulse` fora de `motion-safe:`)
