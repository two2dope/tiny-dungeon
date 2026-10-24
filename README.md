# Tiny Dungeon — The Ember Measure

> Jogo tático de *roll-and-write* em 3D isométrico *low-poly* com estética *dark fantasy*, adaptando com fidelidade as regras oficiais de **Paper Dungeons**.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3-61dafb.svg)](https://react.dev/)
[![Three.js](https://img.shields.io/badge/Three.js-R3F-black.svg)](https://docs.pmnd.rs/react-three-fiber)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8.svg)](https://tailwindcss.com/)
[![Vitest](https://img.shields.io/badge/Vitest-3.0-success.svg)](https://vitest.dev/)

---

## ⚔️ Visão Geral

*Tiny Dungeon* reimagina a experiência analógica dos jogos de tabuleiro *roll-and-write* em uma aplicação web atmosférica com iluminação dinâmica por tochas, sombras suaves e interface inspirada no padrão *luxury dark* de **Vesperfall (ref-c)**.

### Pilares de Design:
- **Fidelidade Mecânica:** Regras canônicas de *Paper Dungeons* ao longo de 8 rodadas completas.
- **Grupo de 4 Classes:** Guerreiro, Mago, Clérigo e Ladino com trilhas individuais de nível (1 a 6).
- **Draft de Dados:** Pool de 6 dados (3 brancos, 3 negros) por rodada; o jogador seleciona até 3 dados para movimentar, subir nível ou criar itens.
- **Fase de Perigo:** 3 ou mais crânios rolados na rodada desferem 1 ferimento automático antes do rascunho de ações.
- **Sem Permadeath Prematuro:** Depleção da vida aplica penalidade de ressurreição (-9 glória na apuração final) e restaura vitalidade para concluir a expedição.
- **Navegação & Colisão de Paredes:** Movimento ortogonal em matriz 4x4 (Mapa 1 canônico) com bloqueio estrito por paredes de pedra maciça.
- **Batalhas contra Chefes Solo:** Confrontos nas rodadas 3 (Mantícora), 6 (Tirano Ocular) e 8 (Dragão Vermelho) com patamares de vitória Tier 1, Tier 2 ou penalidade por derrota.
- **Segurança de Decisão (Undo/Redo):** Histórico de ações dentro da rodada ativa, permitindo ensaiar passos e desfazer antes da confirmação.
- **Autosave Contínuo:** Gravação automática do estado em `localStorage`.

---

## 🏗️ Arquitetura do Sistema

O projeto é dividido em camadas estritamente desacopladas:

```
src/
├── engine/               # Domínio puro (Pure TypeScript - 100% testável)
│   ├── types.ts          # Modelos de dados e contratos
│   ├── dice.ts           # Rolagem, símbolos e validação de draft
│   ├── heroes.ts         # Progressão das 4 classes e penalidade de morte
│   ├── dungeon.ts        # Matriz do Mapa 1, grafos e cálculo de movimento (BFS)
│   ├── combat.ts         # Resolutores de Minions e Chefes solo
│   └── scoring.ts        # Apuração da pontuação de Glória final
│
├── store/                # Coordenação de Estado
│   └── gameStore.ts      # Store reativa Zustand com pilha de Undo/Redo e autosave
│
└── components/
    ├── canvas/           # Camada Gráfica 3D (React Three Fiber + Three.js)
    │   ├── DungeonCanvas.tsx  # Viewport WebGL e câmera isométrica
    │   ├── RoomTile3D.tsx     # Lajes de pedra, marcadores e destaques de rota
    │   ├── Walls3D.tsx        # Paredes perimetrais e interiores
    │   ├── TorchLight.tsx     # Tochas com cintilação procedural orgânica
    │   └── PartyPawn3D.tsx    # Marcador luminoso do grupo
    │
    └── ui/               # Interface DOM (Tailwind CSS + Lucide Icons)
        ├── HUD.tsx            # Barra superior (vitalidade, rodada, chefe iminente)
        ├── EmberLedger.tsx    # "The Ember Measure" (grimório de heróis e alquimia)
        ├── DiceTray.tsx       # Bandeja interativa dos 6 dados rolados
        ├── CombatLog.tsx      # Registro narrativo de exploração e dano
        └── EndGameModal.tsx   # Certificado laureado de glória final
```

---

## 🚀 Como Executar

### Pré-requisitos
- **Node.js** v18+ (recomendado v20 ou v24)
- **npm** v10+

### Instalação
```bash
git clone https://github.com/two2dope/tiny-dungeon.git
cd tiny-dungeon
npm install
```

### Desenvolvimento
Inicie o servidor de desenvolvimento local:
```bash
npm run dev
```
- **Jogo Principal (3D WebGL + HUD):** [http://localhost:5173/](http://localhost:5173/)
- **Hero Showcase Landing Page:** [http://localhost:5173/hero.html](http://localhost:5173/hero.html)

---

## 🎨 Hero Showcase & Identidade Visual

O projeto inclui uma **Hero Landing Page** dedicada ([`hero.html`](hero.html)) criada para demonstrar o universo do jogo no GitHub e na web com diretrizes modernas:
- **Estética Vesperfall (ref-c):** Paleta *luxury dark* com fundos de obsidiana (`#08090c`), tochas vivas em âmbar (`#ff6b35`) e detalhes em ouro imperial (`#d4af37`).
- **Performance Web (Modern Web Guidance):** Carregamento prioritário de Largest Contentful Paint (`fetchpriority="high"`) e deferimento de mídias secundárias (`loading="lazy"`).
- **Refinamento Háptico (Make Interfaces Feel Better):** Micro-interações táteis nos botões (`active:scale-[0.97]`), quebras balanceadas de texto (`text-wrap: balance` e `text-wrap: pretty`) e sombras atmosféricas sobrepostas.

---

### Executar Testes Automatizados
Roda toda a suíte de testes unitários e de integração com Vitest:
```bash
npm test
```

### Build de Produção
Gera o pacote otimizado para deploy:
```bash
npm run build
```

---

## 📜 Especificações & Documentação Técnica
- [Documento de Design / Spec](docs/superpowers/specs/2026-10-23-tiny-dungeon-design.md)
- [Plano de Implementação Detalhado](docs/superpowers/plans/2026-10-23-tiny-dungeon-implementation-plan.md)

---

## 🗺️ Roadmap de Expansão (v1.1+)
- [ ] Conteúdo da expansão *Sidequest* (rios subterrâneos, sargentos, baús dourados e artefatos lendários).
- [ ] Mapas canônicos adicionais (Mapas 2 a 12).
- [ ] Sonoplastia procedural/ambientação de tochas e rolagens de dados.
- [ ] Exportação de certificado de glória em imagem PNG / PDF.
