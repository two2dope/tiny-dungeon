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

# Lista de Prompts Baseados na Spec Sengoku & Nanquim
$assets = @(
    @{
        id = "bg-courtyard"
        prompt = "Tactical isometric view of a feudal Japanese fortified stone courtyard during autumn, dark timber framing, amber glowing paper lanterns, fallen red and orange maple leaves on stone pavement, dark atmospheric ink wash aesthetic, game asset concept art."
    },
    @{
        id = "char-warrior"
        prompt = "Dark fantasy samurai warrior portrait headshot, rough ink wash and calligraphic brush strokes, traditional feudal armor, intense gaze, parchment background, muted earthy tones with gold highlights."
    },
    @{
        id = "ui-makimono-hud"
        prompt = "Aged Japanese makimono parchment banner with dark ink borders and iron brackets, fantasy game UI header element, clean composition, high detail."
    }
)

foreach ($asset in $assets) {
    Write-Host "Gerando asset: $($asset.id)..." -ForegroundColor Yellow
    gflow image --id $asset.id --prompt "$($asset.prompt)" --out $outDir
    Start-Sleep -Seconds 3
}

Write-Host "=== Geração concluída! Verifique a pasta $outDir ===" -ForegroundColor Green