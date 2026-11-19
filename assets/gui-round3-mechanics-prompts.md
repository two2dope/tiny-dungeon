# Tiny Dungeon — Lote 3ª Rodada (Google Flow: Mecânicas da Ficha & Tabuleiro)

Prompts calibrados pelo protocolo **Flow Assets** para os **8 assets complementares** das novas mecânicas (salas multi-conteúdo, câmaras trancadas, portais laterais e marcos da trilha de poções).

> [!NOTE]
> As **3 relíquias novas** (`relic-kaginawa.webp`, `relic-waraji.webp`, `relic-elixir.webp`) já foram geradas, recortadas e integradas em `public/assets/ui/`. Este lote cobre apenas os tokens 3D e micro-ícones complementares.

> **Regra de geração (Google Flow):** Proporção `1:1`, iluminação uniforme de estúdio, fundo **branco sólido puro (`#FFFFFF`)**, contorno preto em nanquim Sengoku (*hand-inked cel-shading*) e **zero texto / letras / números** na arte.

---

## Diretriz Mestre (Copiar no início do fluxo, se usar prompt único)

`Hand-inked feudal Japanese Sengoku tabletop RPG 2D sprite asset, crisp dark black sumi-e ink outlines, warm aged gold, lacquered crimson, and emerald-jade cel-shaded palette, isolated centered with generous margin on pure solid white background #FFFFFF, zero text, zero letters, zero numbers, no border shadow touching canvas edges.`

---

## Tabela de Assets do Lote 3

| # | Arquivo de Entrada (`assets/GUI UI_UX/`) | Alvo Final (`public/assets/ui/`) | Ratio | Prompt Calibrado (Google Flow) |
| :-: | :--- | :--- | :---: | :--- |
| 1 | `Token_potion_fountain_icon.png` | `token-potion-fountain.webp` | `1:1` | `Circular tabletop board game token medallion with aged embossed gold rim matching feudal Japanese Sengoku style, center sculpted carved emerald-jade alchemical sake basin overflowing with glowing turquoise healing mist, crisp black ink outlines, isolated cleanly on pure solid white background #FFFFFF, 100% textless.` |
| 2 | `Token_sealed_lock_icon.png` | `token-sealed-lock.webp` | `1:1` | `Circular tabletop board game token medallion with heavy forged dark iron rim and crimson lacquer inlay matching Sengoku style, centered ornate Japanese padlocked bronze ofuda vault seal with crossed iron chains, crisp ink linework, isolated cleanly on pure solid white background #FFFFFF, 100% textless.` |
| 3 | `Token_edge_portal_icon.png` | `token-edge-portal.webp` | `1:1` | `Circular tabletop board game token medallion with brass and dark bronze rim matching Sengoku style, centered miniature glowing turquoise-jade spiral dimensional torii vortex gate with swirling energy wisps, hand-inked cel-shaded art, isolated on pure solid white background #FFFFFF, 100% textless.` |
| 4 | `Icon_bonus_levelup.png` | `icon-bonus-levelup.webp` | `1:1` | `Isolated 2D game UI bonus emblem icon matching Sengoku gold and emerald cel-shaded art: upward pointing ornate golden samurai chevron arrow wrapped in glowing amber spirit flames and crisp ink outlines, pure solid white background #FFFFFF, zero text.` |
| 5 | `Icon_bonus_forge.png` | `icon-bonus-forge.webp` | `1:1` | `Isolated 2D game UI bonus emblem icon matching Sengoku parchment-gold and crimson art: miniature Japanese blacksmith iron anvil crossed with a glowing golden forge hammer and tiny spark embers, crisp dark ink outlines, pure solid white background #FFFFFF, zero text.` |
| 6 | `Icon_bonus_alchemist.png` | `icon-bonus-alchemist.webp` | `1:1` | `Isolated 2D game UI grand reward crest matching Sengoku art: radiant golden lacquer crown sigil framing a glowing magatama jade jewel, crimson silk ribbon accents, crisp black ink outlines, pure solid white background #FFFFFF, zero text.` |
| 7 | `Icon_potion_slot_empty.png` | `icon-potion-slot-empty.webp` | `1:1` | `Minimalist 2D UI slot checkbox icon matching dark feudal Japanese parchment GUI: outlined carved wooden apothecary gourd flask silhouette etched with thin dark ink and hollow transparent-white center, isolated centered on pure solid white background #FFFFFF, zero text.` |
| 8 | `Icon_potion_slot_full.png` | `icon-potion-slot-full.webp` | `1:1` | `2D UI checked slot icon matching feudal Japanese Sengoku GUI: bright ruby-emerald glowing alchemical gourd flask sealed with wax stopper and subtle golden checkmark sparkles beside neck, crisp ink outline, isolated centered on pure solid white background #FFFFFF, zero text.` |

---

## Bloco Único para Colar no Google Flow (Geração em Lote)

```text
Asset 1 (Potion Fountain Board Token): Circular tabletop board game token medallion with aged embossed gold rim matching feudal Japanese Sengoku style, center sculpted carved emerald-jade alchemical sake basin overflowing with glowing turquoise healing mist, crisp black ink outlines, 1:1 square, isolated cleanly on pure solid white background #FFFFFF, zero text.

Asset 2 (Sealed Vault Board Token): Circular tabletop board game token medallion with heavy forged dark iron rim and crimson lacquer inlay matching Sengoku style, centered ornate Japanese padlocked bronze ofuda vault seal with crossed iron chains, crisp ink linework, 1:1 square, isolated cleanly on pure solid white background #FFFFFF, zero text.

Asset 3 (Side Portal Board Token): Circular tabletop board game token medallion with brass and dark bronze rim matching Sengoku style, centered miniature glowing turquoise-jade spiral dimensional torii vortex gate with swirling energy wisps, hand-inked cel-shaded art, 1:1 square, isolated on pure solid white background #FFFFFF, zero text.

Asset 4 (Hero Level Up Bonus Icon): Isolated 2D game UI bonus emblem icon matching Sengoku gold and emerald cel-shaded art: upward pointing ornate golden samurai chevron arrow wrapped in glowing amber spirit flames and crisp ink outlines, 1:1 square, pure solid white background #FFFFFF, zero text.

Asset 5 (Free Forge Bonus Icon): Isolated 2D game UI bonus emblem icon matching Sengoku parchment-gold and crimson art: miniature Japanese blacksmith iron anvil crossed with a glowing golden forge hammer and tiny spark embers, crisp dark ink outlines, 1:1 square, pure solid white background #FFFFFF, zero text.

Asset 6 (Alchemist Choice Bonus Icon): Isolated 2D game UI grand reward crest matching Sengoku art: radiant golden lacquer crown sigil framing a glowing magatama jade jewel, crimson silk ribbon accents, crisp black ink outlines, 1:1 square, pure solid white background #FFFFFF, zero text.

Asset 7 (Empty Potion Checkbox Slot): Minimalist 2D UI slot checkbox icon matching dark feudal Japanese parchment GUI: outlined carved wooden apothecary gourd flask silhouette etched with thin dark ink and hollow center, 1:1 square, isolated cleanly on pure solid white background #FFFFFF, zero text.

Asset 8 (Filled Potion Checkbox Slot): 2D UI checked slot icon matching feudal Japanese Sengoku GUI: bright ruby-emerald glowing alchemical gourd flask sealed with wax stopper and subtle golden sparkle accent, crisp ink outline, 1:1 square, isolated cleanly on pure solid white background #FFFFFF, zero text.
```

---

## Como Ingerir Depois de Gerar

1. Baixe cada imagem escolhida no Google Flow e salve em `assets/GUI UI_UX/` com o nome da coluna **Arquivo de Entrada** (`.png` ou `.jpg` — o script lê ambos; apenas ajuste a extensão em `scripts/process-gui-assets.py` se salvar como `.jpg`).
2. Me avise para registrarmos no `scripts/process-gui-assets.py`, rodarmos `python scripts/process-gui-assets.py` e ligarmos os novos `.webp` no tabuleiro 3D e na trilha de poções.
