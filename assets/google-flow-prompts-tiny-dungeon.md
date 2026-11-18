# Coleção de Prompts & Diretrizes — Tiny Dungeon: The Ember Measure

> **Especificação Técnica para Importação e Geração em Lote no Google Flow**

- **Projeto**: Tiny Dungeon: The Ember Measure
- **Data de Exportação**: 2026-11-18
- **Status Global**: 0 de 16 assets validados (0% concluído)
- **Imagem Âncora (Style Anchor)**: `public/assets/portraits/hero-warrior.jpg`

## 1. Comando Mestre do Agente (Global Project Prompt)

```text
PROJECT: Tiny Dungeon — The Ember Measure (Tactical Tabletop Roll-and-Write RPG).
ART DIRECTION: Feudal Dark Fantasy blending traditional Japanese Sumi-e ink wash, crisp Ukiyo-e woodblock calligraphic outlines, aged washi parchment warmth, obsidian stone, brushed copper and glowing amber rim light.
STRICT RULES:
1. Zero English words, zero typography, zero watermarks, zero UI numbers inside generated illustrations.
2. Style Anchor ON only for Heroes, Minions, Party Pawn, and Bosses so line weight and amber lighting stay cohesive.
3. Style Anchor OFF strictly for Props, Relics, Chests, Gems, and Traps to prevent facial hallucination bleeding into metal, stone, or glass.
```

## 2. Matriz Detalhada de Assets para Geração em Lote

| ID | Nome do Asset | Categoria | Ratio | Âncora Ativa? | Status | Prompt Calibrado | Caminho Alvo |
| :--- | :--- | :--- | :--- | :---: | :---: | :--- | :--- |
| `hero-warrior` | **Guerreiro Samurai (Manto Branco)** | portraits | `1:1` | SIM | PENDENTE | Dark fantasy feudal Japanese samurai warrior bust portrait, 1:1 square aspect ratio. Sumi-e ink wash and traditional ukiyo-e woodblock calligraphic linework, weathered obsidian and crimson lacquered armor, crescent kabuto crest, warm amber rim lighting, aged washi parchment background with subtle ink splatter, intense gaze, tabletop RPG character token, 100% textless, no letters, no watermark. | `public/assets/portraits/hero-warrior.jpg` |
| `hero-mage` | **Mago Onmyoji (Manto Preto)** | portraits | `1:1` | SIM | PENDENTE | Feudal dark fantasy Onmyoji sorcerer bust portrait, 1:1 square aspect ratio. Sumi-e ink wash and ukiyo-e woodblock calligraphic linework, shadowed wide conical kasa hat glowing amethyst eyes, indigo and obsidian layered silk robes, glowing arcane talisman staff, warm amber rim light on aged washi parchment backdrop with ink splatter, 100% textless, no letters. | `public/assets/portraits/hero-mage.jpg` |
| `hero-cleric` | **Clérigo Sohei (Manto Branco)** | portraits | `1:1` | SIM | PENDENTE | Feudal dark fantasy warrior monk Sohei cleric bust portrait, 1:1 square aspect ratio. Sumi-e ink wash and ukiyo-e woodblock linework, white and azure monastic hood, gilded bronze reliquary shield emblem, serene resolute expression, warm amber rim light, aged washi parchment backdrop with subtle ink splatter, 100% textless, no letters. | `public/assets/portraits/hero-cleric.jpg` |
| `hero-rogue` | **Ladino Shinobi (Manto Preto)** | portraits | `1:1` | SIM | PENDENTE | Feudal dark fantasy shinobi rogue bust portrait, 1:1 square aspect ratio. Sumi-e ink wash and ukiyo-e woodblock calligraphic linework, dark emerald scarf mask, obsidian leather hood, ornate brass skeleton-key dagger near shoulder, sharp emerald eyes, warm amber rim lighting on aged washi parchment with ink splatter, 100% textless, no letters. | `public/assets/portraits/hero-rogue.jpg` |
| `pawn-party` | **Peão Tático & Estandarte Sashimono** | standees-minions | `3:4` | SIM | PENDENTE | 2.5D tabletop RPG cardboard standee miniature of a crimson and gold Sashimono samurai war banner standard held by an armored scout, 3:4 portrait ratio. Sumi-e ink strokes, gilded ember diamond kamon crest, thick die-cut parchment cardboard silhouette edge on clean dark slate background, warm amber rim light, 100% textless, no letters. | `public/assets/standees/pawn-party.jpg` |
| `minion-goblin` | **Goblin Batedor (Lacaio Nv. 1)** | standees-minions | `3:4` | SIM | PENDENTE | 2.5D tabletop RPG cardboard standee miniature of a cunning feudal yokai goblin scout crouching with notched dagger and ragged moss-green armor, 3:4 portrait ratio. Sumi-e black ink linework, glowing yellow eyes, thick die-cut aged parchment token contour on clean dark neutral background, dramatic amber rim light, 100% textless. | `public/assets/standees/minion-goblin.jpg` |
| `minion-skeleton` | **Esqueleto Ronin (Lacaio Nv. 2)** | standees-minions | `3:4` | SIM | PENDENTE | 2.5D tabletop RPG cardboard standee miniature of an undead skeletal samurai ronin sentinel clutching a chipped katana and round iron buckler, 3:4 portrait ratio. Sumi-e ink calligraphy, glowing crimson eye sockets, tattered ash-white bone armor, thick die-cut parchment cardboard edge on clean dark background, amber rim light, 100% textless. | `public/assets/standees/minion-skeleton.jpg` |
| `minion-orc` | **Orc / Oni Brutal (Lacaio Nv. 3)** | standees-minions | `3:4` | SIM | PENDENTE | 2.5D tabletop RPG cardboard standee miniature of a hulking crimson-skinned Oni orc brute wielding heavy odachi greatsword and spiked shoulder plates, 3:4 portrait ratio. Sumi-e ink strokes, ivory tusks and horns, thick die-cut parchment border on dark neutral backdrop, warm amber rim light, 100% textless. | `public/assets/standees/minion-orc.jpg` |
| `minion-troll` | **Troll da Forja (Lacaio Nv. 4)** | standees-minions | `3:4` | SIM | PENDENTE | 2.5D tabletop RPG cardboard standee miniature of a towering obsidian cavern troll lifting an iron studded kanabo war club, 3:4 portrait ratio. Sumi-e black ink brush texture, deep violet-copper hide and amber veins, thick die-cut parchment contour on clean dark neutral studio background, 100% textless. | `public/assets/standees/minion-troll.jpg` |
| `boss-manticore` | **Mantícora Quimera (Chefe R1)** | standees-bosses | `3:4` | SIM | PENDENTE | 2.5D tabletop RPG cardboard standee miniature illustration of a terrifying mythic Japanese Chimera Manticore boss (Oni-lion head, bat wings, scorpion tail), 3:4 portrait aspect ratio. Sumi-e black ink brush strokes, crimson and gold accents, thick die-cut parchment token border on a clean dark neutral background, dramatic amber rim light, 100% textless, no letters. | `public/assets/standees/boss-manticore.jpg` |
| `boss-beholder` | **Observador Yokai (Chefe R2)** | standees-bosses | `3:4` | SIM | PENDENTE | 2.5D tabletop RPG cardboard standee miniature of an eldritch floating many-eyed yokai Beholder horror orb with writhing ocular tendrils and jagged fangs, 3:4 portrait ratio. Sumi-e ink wash, deep imperial amethyst and glowing cyan iris, thick die-cut parchment token border on dark neutral backdrop, dramatic amber rim light, 100% textless. | `public/assets/standees/boss-beholder.jpg` |
| `boss-dragon` | **Dragão Imperador de Brasas (Chefe R3)** | standees-bosses | `3:4` | SIM | PENDENTE | 2.5D tabletop RPG cardboard standee miniature of an ancient armored feudal ember Dragon coiling with molten gold horns and scorched crimson wings, 3:4 portrait ratio. Bold sumi-e ink calligraphy, glowing furnace chest fissures, thick die-cut parchment contour on dark neutral background, 100% textless. | `public/assets/standees/boss-dragon.jpg` |
| `prop-chest-artifact` | **Cofre de Artefato Dourado** | props-relics | `1:1` | NÃO (Desmarcar) | PENDENTE | Isolated ornate feudal Japanese black lacquer and hammered gold treasure chest overflowing with radiant ancient scrolls and relics, 1:1 square icon. Inanimate prop only, NO faces or creatures, bold sumi-e ink outlines, warm amber candlelight reflections, clean dark obsidian backdrop, 100% textless. | `public/assets/props/prop-chest-artifact.jpg` |
| `prop-gems-cluster` | **Aglomerado de Gemas Jade & Esmeralda** | props-relics | `1:1` | NÃO (Desmarcar) | PENDENTE | Isolated cluster of raw faceted glowing emerald and jade dungeon crystals set in dark iron ore base, 1:1 square tabletop token prop. Inanimate object only, NO faces, crisp ink hatching and luminous emerald inner glow on dark matte background, 100% textless. | `public/assets/props/prop-gems-cluster.jpg` |
| `prop-trap-spikes` | **Armadilha Mecânica de Espinhos** | props-relics | `1:1` | NÃO (Desmarcar) | PENDENTE | Isolated deadly feudal dungeon iron floor-plate trap with razor steel spikes springing through bronze gears, crimson danger lacquer rim, 1:1 square prop. Inanimate mechanism only, NO characters or faces, bold sumi-e ink contours on clean dark background, 100% textless. | `public/assets/props/prop-trap-spikes.jpg` |
| `prop-potion-flask` | **Frasco de Elixir Alquímico Carmesim** | props-relics | `1:1` | NÃO (Desmarcar) | PENDENTE | Isolated hand-blown glass alchemy gourd potion flask tied with braided red cord and wax seal, glowing crimson healing elixir inside, 1:1 square tabletop prop. Inanimate vessel only, NO faces, sumi-e calligraphic ink style on dark clean backdrop, 100% textless. | `public/assets/props/prop-potion-flask.jpg` |

## 3. Diretrizes de Ingestão e Governança

1. **Isolamento de Heráldica e Objetos**: Desmarcar obrigatoriamente a foto da âncora ao gerar mapas, armas, emblemas, itens e cenários para evitar alucinação facial no relevo.
2. **Nomenclatura**: Todos os arquivos salvos em minúsculas com separadores kebab-case conforme tabela acima.
3. **Idioma**: Prompts em inglês para tração do difusor, mantendo textos gráficos inseridos rigorosamente em pt-BR.

---
*Exportado pela ferramenta flow-assets • Antigravity AI*
