# Especificação de UI/UX, GUI e Assets — Tiny Dungeon (Sengoku Edition)

**Projeto:** Tiny Dungeon — The Ember Measure  
**Direção de Arte:** Moderno / Fantasia Sombria (Sengoku Cel-Shading)  
**Objetivo:** Mapeamento completo de componentes, propriedades de estado (*props*) e pacotes de *assets* (2D/3D) necessários para a implementação da interface gráfica desktop.

---

## 1. Visão Geral da Direção de Arte

O conceito **Sengoku Dark Fantasy Cel-Shading** mantém a estrutura tática e o tabuleiro isométrico do jogo original, substituindo a interface minimalista escura por materiais táteis do período feudal japonês sombrio:
* **Materiais Base:** Madeira envelhecida, laca fosca (preta e carmim), pergaminho (*washi*), ferro batido e cordas trançadas (*shimenawa*).
* **Acabamento Visual:** Contornos pretos expressivos (*inked outlines*), sombreamento em blocos (*cel-shading*) e iluminação dramática contrastando o fundo noturno frio com tochas quentes.
* **Hierarquia de Leitura:** Separação clara entre o painel de gestão da equipe (esquerda), o palco de ação tática (centro), o controle de dados (base) e o registro histórico (direita).

---

## 2. HUD, Painéis e Containers (UI Framework)

Tabela de mapeamento estrutural dos contêineres da interface, suas texturas correspondentes e as propriedades de estado necessárias no código.

| Elemento / Tela | Componente no Jogo | Asset / Textura (Sengoku Cel-Shading) | Estados / Props Necessários |
| :--- | :--- | :--- | :--- |
| **Top Bar (Cabeçalho)** | Barra de status da expedição | Viga de madeira escura entalhada + corda *shimenawa* vermelha no topo | `round`, `maxRounds`, `actionsLeft`, `bossTimer`, `dungeonName` |
| **Sidebar Esquerda** | Painel de Grupo, Forja e Missões | Moldura em madeira envelhecida, cantoneiras de ferro batido e fundo de pergaminho escuro | `combatPower`, `masteryPoints`, `heroes[]`, `resources`, `quests[]` |
| **Card de Herói (x4)** | Guerreiro/Samurai, Mago/Ninja, Clérigo/Monge, Ladino/Ronin | Placa horizontal de laca fosca com borda colorida por classe e retrato 2D cel-shaded | `heroId`, `level` (1-6), `dieColor` (Branco/Preto), `canLevelUp` |
| **Painel de Forja/Alquimia** | Destilar Poção / Forjar Item | Slots duplos em papel *washi* envelhecido com selos carimbados | `potionsCount`, `itemsCount`, `diceCost`, `canCraft` |
| **Cards de Missão (x3)** | Caçador de Lacaios, Alquimista Real, Desbravador | Tiras de pergaminho amarelado presas por tachas de metal | `questTitle`, `description`, `rewardPoints`, `isCompleted` |
| **Tray de Dados (Base)** | Dados da Rodada | Bandeja de madeira lacada com divisórias internas e detalhes dourados | `rolledDice[]`, `selectedDice[]`, `remainingActions` |
| **Console de Log (Direita)** | Registro de Exploração | Pergaminho vertical aberto com rolos de madeira nas extremidades | `logEntries[]`, `seed`, `currentFloor` |
| **Modal: Grimório** | Botão "Grimório" (Topo Direito) | Livro encadernado em couro/seda japonesa (*Toji*) com páginas ilustradas | `rulesTab`, `bestiaryTab`, `artifactsList`, `isOpen` |
| **Seletor de Masmorra** | Dropdown `M1: Cripta da Manticora` | Placa suspensa de madeira (*Ema*) com seta entalhada | `selectedDungeonId`, `availableDungeons[]` |

---

## 3. Iconografia, Botões e Micro-Elementos (GUI)

Especificação de todos os ícones, botões interativos e indicadores de status para exportação em *spritesheets* ou SVG/PNG.

| Categoria | Itens Específicos Mapeados | Estilo Visual do Asset | Dimensão Sugerida |
| :--- | :--- | :--- | :--- |
| **Faces dos Dados (x6)** | Escada (Movimento), Espada (Ataque), Escudo (Defesa), Magia, Poção, Face Branca/Preta | Cubos em osso/madeira com kanjis estilizados e ícones de armas (Katana, Kunai, Esfera Yin-Yang) | `64x64 px` (2D) ou Textura UV `256x256 px` |
| **Contadores de Vida** | 6 Corações na Top Bar + Penalidades de Armadilha (`-1`, `-2`) | Corações facetados em rubi/laca vermelha com contorno preto espesso (*inked*) | `32x32 px` (Estados: Cheio, Vazio, Dano) |
| **Recursos & Inventário** | Poções, Itens/Artefatos, Gemas, Lacaios, Poder Bélico, Maestria | Cabaça de saquê/poção, pergaminho selado, magatama verde (gema), máscara Oni (lacaio) | `48x48 px` |
| **Retratos de Classes (x4)** | Samurai (Guerreiro), Ninja (Mago), Monge Budista (Clérigo), Ronin (Ladino) | Busto ilustrado em *cel-shading* com iluminação dramática e cor temática de fundo | `128x128 px` |
| **Botões de Ação (CTAs)** | `Confirmar`, `+ Nível`, `+ Destilar`, `+ Forjar`, `Grimório`, `Vesperfall`, Undo/Redo, Áudio | Placas retangulares chanfradas (Vermelho carmim para CTAs principais, Ouro velho para Grimório) | *9-slice sprite* (Escalável) |

---

## 4. Props de Cenário, Tabuleiro e Standees (3D / 2.5D)

Elementos que compõem o *viewport* central da masmorra isométrica.

| Elemento de Jogo | Variações Visíveis na Cena | Especificação de Asset (Sengoku Cel-Shading) |
| :--- | :--- | :--- |
| **Grid / Lajes (6x6)** | Laje oculta, Laje revelada, Laje iluminada (alcance de movimento), Entrada (Escada) | Placas de tatami/pedra vulcânica com bordas chanfradas e *shader* de *outline* preto |
| **Props de Ambiente** | 4 Portões Torii, Pilares/Lanternas *Toro*, Estandartes *Nobori*, Base circular mística | Malhas Low-Poly com textura flat pintada à mão + emissores de partículas de fogo/névoa |
| **Standees de Inimigos** | Goblin Nv.1, Esqueleto Nv.2, Orc Nv.3, Troll Nv.4, Tirano, Manticora, Dragão | Miniaturas tipo *paper-standee* em bases circulares laranja/vermelha (Kappa, Gashadokuro, Oni, Tengu, Ryu) |
| **Tokens de Câmara** | Gemas (`+1`, `+2`), Armadilhas (`-1`, `-2`), Artefatos (`+2*`) | Moedas/Discos em jade (verde), ferro oxidado (armadilha) e ouro (artefato) com *floating badges* acima |

---

## 5. Paleta de Cores e Tipografia Sugerida

### Paleta Cromática (Hex)
* **Fundo Noturno / Abismo:** `#0D111A` a `#182030`
* **Madeira Estrutural (Painéis):** `#2A1E17` (Escura) / `#4A3525` (Média)
* **Pergaminho / Papel Washi:** `#D8C8B0` (Base) / `#B8A386` (Sombra)
* **Acento Primário (Laca Carmim / CTAs):** `#9E2A2B` (Normal) / `#C93B3B` (Hover)
* **Acento Secundário (Ouro Velho / Bordas):** `#C59B27`
* **Cores de Classe:**
  * Samurai (Guerreiro): `#C86432` (Laranja Bronze)
  * Ninja (Mago): `#6E4294` (Roxo Sombrio)
  * Monge (Clérigo): `#2E7D87` (Azul Turquesa)
  * Ronin (Ladino): `#3B7A57` (Verde Musgo)

### Tipografia Recomendada
* **Títulos e Cabeçalhos (`TINY DUNGEON`, Títulos de Seção):** Fonte serifada com aspecto entalhado ou caligráfico (ex.: *Cinzel Decorative*, *Almendra* ou *Reggae One*).
* **Corpo de Texto, Números e Logs:** Fonte sem serifa limpa ou serifada de alta legibilidade em tamanhos reduzidos (ex.: *Inter*, *Source Sans Pro* ou *Spectral*).

---

## 6. Checklist de Produção do Bundle (Pipeline)

- [ ] **Etapa 1: UI Frame & 9-Slices** — Criar as molduras de madeira, pergaminhos e botões base escaláveis.
- [ ] **Etapa 2: Retratos e Standees** — Ilustrar os 4 heróis e os 7 monstros em estilo *cel-shaded* com recorte estilo miniatura de papel.
- [ ] **Etapa 3: Iconografia e Dados** — Desenhar as 6 faces dos dados, corações de vida e ícones de recursos/poções.
- [ ] **Etapa 4: Ambiente 3D/Isométrico** — Substituir texturas das lajes 6x6, aplicar *post-processing* de contorno (*outline*) e posicionar lanternas/portões Torii.
- [ ] **Etapa 5: Integração de Estados (CSS/Canvas)** — Conectar feedbacks de *hover*, seleção de dados e destaque de lajes válidas.