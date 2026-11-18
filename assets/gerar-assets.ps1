# =====================================================================
# Script de Automação em Lote - Tiny Dungeon (Gflow / Sengoku & Nanquim)
# =====================================================================

$env:GFLOW_CHROME_PATH="C:\Program Files\Google\Chrome\Application\chrome.exe"
$outDir = "./out/sengoku-assets"

# Cria a pasta de saída se não existir
if (!(Test-Path $outDir)) {
    New-Item -ItemType Directory -Path $outDir | Out-Null
}

Write-Host "=== Iniciando pipeline de geracao em lote do Tiny Dungeon ===" -ForegroundColor Cyan

# Lista de Prompts Baseados na Spec Sengoku & Nanquim (3 legados + 16 matriz flow-assets)
$assetSpecs = @(
    # --- Cenarios & Elementos Base ---
    @{
        id = "bg-courtyard"
        ratio = "16:9"
        anchored = $false
        prompt = "Tactical isometric view of a feudal Japanese fortified stone courtyard during autumn, dark timber framing, amber glowing paper lanterns, fallen red and orange maple leaves on stone pavement, dark atmospheric ink wash aesthetic, game asset concept art."
    },
    @{
        id = "char-warrior"
        ratio = "1:1"
        anchored = $true
        prompt = "Dark fantasy samurai warrior portrait headshot, rough ink wash and calligraphic brush strokes, traditional feudal armor, intense gaze, parchment background, muted earthy tones with gold highlights."
    },
    @{
        id = "ui-makimono-hud"
        ratio = "16:9"
        anchored = $false
        prompt = "Aged Japanese makimono parchment banner with dark ink borders and iron brackets, fantasy game UI header element, clean composition, high detail."
    },

    # --- Retratos da Comitiva (1:1, Ancora ON) ---
    @{
        id = "hero-warrior"
        ratio = "1:1"
        anchored = $true
        prompt = "Dark fantasy feudal Japanese samurai warrior bust portrait, 1:1 square aspect ratio. Sumi-e ink wash and traditional ukiyo-e woodblock calligraphic linework, weathered obsidian and crimson lacquered armor, crescent kabuto crest, warm amber rim lighting, aged washi parchment background with subtle ink splatter, intense gaze, tabletop RPG character token, 100% textless, no letters, no watermark."
    },
    @{
        id = "hero-mage"
        ratio = "1:1"
        anchored = $true
        prompt = "Feudal dark fantasy Onmyoji sorcerer bust portrait, 1:1 square aspect ratio. Sumi-e ink wash and ukiyo-e woodblock calligraphic linework, shadowed wide conical kasa hat glowing amethyst eyes, indigo and obsidian layered silk robes, glowing arcane talisman staff, warm amber rim light on aged washi parchment backdrop with ink splatter, 100% textless, no letters."
    },
    @{
        id = "hero-cleric"
        ratio = "1:1"
        anchored = $true
        prompt = "Feudal dark fantasy warrior monk Sohei cleric bust portrait, 1:1 square aspect ratio. Sumi-e ink wash and ukiyo-e woodblock linework, white and azure monastic hood, gilded bronze reliquary shield emblem, serene resolute expression, warm amber rim light, aged washi parchment backdrop with subtle ink splatter, 100% textless, no letters."
    },
    @{
        id = "hero-rogue"
        ratio = "1:1"
        anchored = $true
        prompt = "Feudal dark fantasy shinobi rogue bust portrait, 1:1 square aspect ratio. Sumi-e ink wash and ukiyo-e woodblock calligraphic linework, dark emerald scarf mask, obsidian leather hood, ornate brass skeleton-key dagger near shoulder, sharp emerald eyes, warm amber rim lighting on aged washi parchment with ink splatter, 100% textless, no letters."
    },

    # --- Standees 2.5D: Lacaios & Peao (3:4, Ancora ON) ---
    @{
        id = "pawn-party"
        ratio = "3:4"
        anchored = $true
        prompt = "2.5D tabletop RPG cardboard standee miniature of a crimson and gold Sashimono samurai war banner standard held by an armored scout, 3:4 portrait ratio. Sumi-e ink strokes, gilded ember diamond kamon crest, thick die-cut parchment cardboard silhouette edge on clean dark slate background, warm amber rim light, 100% textless, no letters."
    },
    @{
        id = "minion-goblin"
        ratio = "3:4"
        anchored = $true
        prompt = "2.5D tabletop RPG cardboard standee miniature of a cunning feudal yokai goblin scout crouching with notched dagger and ragged moss-green armor, 3:4 portrait ratio. Sumi-e black ink linework, glowing yellow eyes, thick die-cut aged parchment token contour on clean dark neutral background, dramatic amber rim light, 100% textless."
    },
    @{
        id = "minion-skeleton"
        ratio = "3:4"
        anchored = $true
        prompt = "2.5D tabletop RPG cardboard standee miniature of an undead skeletal samurai ronin sentinel clutching a chipped katana and round iron buckler, 3:4 portrait ratio. Sumi-e ink calligraphy, glowing crimson eye sockets, tattered ash-white bone armor, thick die-cut parchment cardboard edge on clean dark background, amber rim light, 100% textless."
    },
    @{
        id = "minion-orc"
        ratio = "3:4"
        anchored = $true
        prompt = "2.5D tabletop RPG cardboard standee miniature of a hulking crimson-skinned Oni orc brute wielding heavy odachi greatsword and spiked shoulder plates, 3:4 portrait ratio. Sumi-e ink strokes, ivory tusks and horns, thick die-cut parchment border on dark neutral backdrop, warm amber rim light, 100% textless."
    },
    @{
        id = "minion-troll"
        ratio = "3:4"
        anchored = $true
        prompt = "2.5D tabletop RPG cardboard standee miniature of a towering obsidian cavern troll lifting an iron studded kanabo war club, 3:4 portrait ratio. Sumi-e black ink brush texture, deep violet-copper hide and amber veins, thick die-cut parchment contour on clean dark neutral studio background, 100% textless."
    },

    # --- Standees 2.5D: Chefes de Masmorra (3:4, Ancora ON) ---
    @{
        id = "boss-manticore"
        ratio = "3:4"
        anchored = $true
        prompt = "2.5D tabletop RPG cardboard standee miniature illustration of a terrifying mythic Japanese Chimera Manticore boss (Oni-lion head, bat wings, scorpion tail), 3:4 portrait aspect ratio. Sumi-e black ink brush strokes, crimson and gold accents, thick die-cut parchment token border on a clean dark neutral background, dramatic amber rim light, 100% textless, no letters."
    },
    @{
        id = "boss-beholder"
        ratio = "3:4"
        anchored = $true
        prompt = "2.5D tabletop RPG cardboard standee miniature of an eldritch floating many-eyed yokai Beholder horror orb with writhing ocular tendrils and jagged fangs, 3:4 portrait ratio. Sumi-e ink wash, deep imperial amethyst and glowing cyan iris, thick die-cut parchment token border on dark neutral backdrop, dramatic amber rim light, 100% textless."
    },
    @{
        id = "boss-dragon"
        ratio = "3:4"
        anchored = $true
        prompt = "2.5D tabletop RPG cardboard standee miniature of an ancient armored feudal ember Dragon coiling with molten gold horns and scorched crimson wings, 3:4 portrait ratio. Bold sumi-e ink calligraphy, glowing furnace chest fissures, thick die-cut parchment contour on dark neutral background, 100% textless."
    },

    # --- Reliquias, Gemas & Armadilhas (1:1, Ancora OFF — Isolamento Inanimado) ---
    @{
        id = "prop-chest-artifact"
        ratio = "1:1"
        anchored = $false
        prompt = "Isolated ornate feudal Japanese black lacquer and hammered gold treasure chest overflowing with radiant ancient scrolls and relics, 1:1 square icon. Inanimate prop only, NO faces or creatures, bold sumi-e ink outlines, warm amber candlelight reflections, clean dark obsidian backdrop, 100% textless."
    },
    @{
        id = "prop-gems-cluster"
        ratio = "1:1"
        anchored = $false
        prompt = "Isolated cluster of raw faceted glowing emerald and jade dungeon crystals set in dark iron ore base, 1:1 square tabletop token prop. Inanimate object only, NO faces, crisp ink hatching and luminous emerald inner glow on dark matte background, 100% textless."
    },
    @{
        id = "prop-trap-spikes"
        ratio = "1:1"
        anchored = $false
        prompt = "Isolated deadly feudal dungeon iron floor-plate trap with razor steel spikes springing through bronze gears, crimson danger lacquer rim, 1:1 square prop. Inanimate mechanism only, NO characters or faces, bold sumi-e ink contours on clean dark background, 100% textless."
    },
    @{
        id = "prop-potion-flask"
        ratio = "1:1"
        anchored = $false
        prompt = "Isolated hand-blown glass alchemy gourd potion flask tied with braided red cord and wax seal, glowing crimson healing elixir inside, 1:1 square tabletop prop. Inanimate vessel only, NO faces, sumi-e calligraphic ink style on dark clean backdrop, 100% textless."
    }
)

foreach ($assetItem in $assetSpecs) {
    $anchorHint = if ($assetItem.anchored) { "[Ancora ON]" } else { "[Ancora OFF - Isolamento Inanimado]" }
    Write-Host "Gerando asset ($($assetItem.ratio)) $anchorHint : $($assetItem.id)..." -ForegroundColor Yellow
    gflow image --id $assetItem.id --prompt "$($assetItem.prompt)" --out $outDir
    Start-Sleep -Seconds 3
}

Write-Host "=== Geração concluída! Verifique a pasta $outDir ===" -ForegroundColor Green
