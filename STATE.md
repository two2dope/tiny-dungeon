# STATE: Tiny Dungeon — The Ember Measure

**Data de Atualização:** 2026-10-24  
**Status do Projeto:** v1.0.0 Concluído / Pronto para Expansões (v1.1+)  
**Repositório Remoto:** [https://github.com/two2dope/tiny-dungeon](https://github.com/two2dope/tiny-dungeon)  
**Branch Ativa:** `main`

---

## 1. Visão Geral e Propósito

Adaptação digital independente do aclamado jogo de tabuleiro *roll-and-write* **Paper Dungeons**, com ambientação tática em 3D isométrico (*React Three Fiber / Three.js*) e interface em estética *dark luxury* inspirada em *Vesperfall (ref-c)*.

---

## 2. Subsistemas Implementados e Verificados

| Subsistema | Módulo Principal | Testes Unitários | Status |
| :--- | :--- | :--- | :--- |
| **Scaffolding & Tooling** | `package.json`, `vite.config.ts`, `tailwind.config.js` | `tests/smoke.test.ts` | Concluído |
| **Motor de Dados & Draft** | `src/engine/types.ts`, `src/engine/dice.ts` | `tests/engine/dice.test.ts` | Concluído |
| **Comitiva de 4 Heróis** | `src/engine/heroes.ts` | `tests/engine/heroes.test.ts` | Concluído |
| **Mapa Canônico 1 & BFS** | `src/engine/dungeon.ts` | `tests/engine/dungeon.test.ts` | Concluído |
| **Combate & Glória Final** | `src/engine/combat.ts`, `src/engine/scoring.ts` | `tests/engine/combat.test.ts`, `tests/engine/scoring.test.ts` | Concluído |
| **Store & Undo/Redo** | `src/store/gameStore.ts` | `tests/store/gameStore.test.ts` | Concluído |
| **Cenário Isométrico 3D** | `src/components/canvas/*` | `tests/components/DungeonCanvas.test.tsx` | Concluído |
| **HUD & The Ember Measure** | `src/components/ui/*` | `tests/components/UI.test.tsx` | Concluído |
| **Loop de Jogo Completo** | `src/App.tsx` | `tests/integration/gameLoop.test.ts` | Concluído |
| **Hero Showcase Landing Page** | `hero.html`, `public/assets/*` | N/A (E2E / Static) | Concluído |

---

## 3. Métricas de Validação e Saúde

- **Vitest Suite:** 10 arquivos de teste, 22/22 testes passando (100% de aprovação).
- **Vite Build:** Compilação de produção gerada em `dist/` sem advertências ou erros.
- **Git:** Working tree limpa e sincronizada com `origin/main`.
- **Servidor Dev:** Rodando localmente em `http://localhost:5173/` (jogo) e `http://localhost:5173/hero.html` (showcase).

---

## 4. Decisões Arquiteturais Críticas (ADR)

1. **Desacoplamento do Domínio:**
   - O diretório `src/engine/` não importa bibliotecas de UI, DOM ou WebGL. Toda a lógica de dados, movimentação, colisão de paredes, combate solo e cálculo de glória é executada em funções puras testáveis sem renderizador.
2. **Histórico Intra-Turno com Undo/Redo:**
   - Implementado via pilha de snapshots profundos em Zustand. O jogador pode ensaiar movimentos no mapa 3D, verificar resultados de combate e reverter antes de acionar `confirmRound()`.
3. **Sem Permadeath Prematuro:**
   - Fidelidade às regras de Paper Dungeons: a perda total de corações aplica penalidade de ressurreição (-9 glória na apuração) e restaura vida mínima para completar as 8 rodadas.
4. **Hero Page com Modern Web Guidance:**
   - Implementada em `hero.html` com `fetchpriority="high"` no banner principal e `loading="lazy"` nas mídias secundárias, micro-interações táteis e sombras multi-camada.

---

## 5. Próximos Passos (Roadmap v1.1+)

- [ ] Incorporação das regras da expansão *Sidequest* (rios subterrâneos, baús dourados, sargentos e artefatos).
- [ ] Inclusão dos Mapas Canônicos 2 a 12.
- [ ] Efeitos sonoros procedurais (rolagem de dados, cintilação de tochas e passos na pedra).
- [ ] Exportação de certificado de glória final em imagem PNG / PDF.
