/**
 * unpack-bundle.cjs
 * Descompacta o arquivo flow-assets-bundle.json exportado do Google Flow
 * diretamente na estrutura oficial de pastas do projeto (assets/<categoria>/<id>.ext).
 * 
 * Extensão .cjs garante compatibilidade universal mesmo em projetos com "type": "module".
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

// Diretório base: onde o script/bat está localizado
let baseDir = __dirname;
let explicitFile = null;

// Analisar argumentos
for (let i = 2; i < process.argv.length; i++) {
  const arg = process.argv[i];
  if (!arg) continue;
  const resolved = path.resolve(arg);
  if (fs.existsSync(resolved)) {
    if (fs.statSync(resolved).isDirectory()) {
      baseDir = resolved;
    } else if (resolved.toLowerCase().endsWith('.json')) {
      explicitFile = resolved;
      baseDir = path.dirname(resolved);
    }
  }
}

function findBundle() {
  if (explicitFile && fs.existsSync(explicitFile)) {
    return explicitFile;
  }

  // 1. Procurar na pasta base (onde está o script e o .bat)
  try {
    const local = fs.readdirSync(baseDir).filter(f => f.toLowerCase().endsWith('.json') && (f.toLowerCase().includes('bundle') || f.toLowerCase().includes('flow-assets')));
    if (local.length > 0) {
      local.sort((a, b) => fs.statSync(path.join(baseDir, b)).mtimeMs - fs.statSync(path.join(baseDir, a)).mtimeMs);
      return path.join(baseDir, local[0]);
    }
  } catch (e) {}

  // 2. Procurar na pasta de execução atual (process.cwd()) se for diferente
  if (process.cwd() !== baseDir) {
    try {
      const cwdFiles = fs.readdirSync(process.cwd()).filter(f => f.toLowerCase().endsWith('.json') && (f.toLowerCase().includes('bundle') || f.toLowerCase().includes('flow-assets')));
      if (cwdFiles.length > 0) {
        cwdFiles.sort((a, b) => fs.statSync(path.join(process.cwd(), b)).mtimeMs - fs.statSync(path.join(process.cwd(), a)).mtimeMs);
        baseDir = process.cwd();
        return path.join(process.cwd(), cwdFiles[0]);
      }
    } catch (e) {}
  }

  // 3. Fallback: Procurar na pasta Downloads do usuário
  const dl = path.join(os.homedir(), 'Downloads');
  if (fs.existsSync(dl)) {
    try {
      const dlFiles = fs.readdirSync(dl).filter(f => f.toLowerCase().endsWith('.json') && (f.toLowerCase().includes('bundle') || f.toLowerCase().includes('flow-assets')));
      if (dlFiles.length > 0) {
        dlFiles.sort((a, b) => fs.statSync(path.join(dl, b)).mtimeMs - fs.statSync(path.join(dl, a)).mtimeMs);
        return path.join(dl, dlFiles[0]);
      }
    } catch (e) {}
  }

  return null;
}

const targetBundle = findBundle();

if (!targetBundle) {
  console.error('\x1b[31m[ERRO]\x1b[0m Nenhum arquivo "flow-assets-bundle.json" encontrado na pasta:');
  console.error(`       \x1b[33m${baseDir}\x1b[0m`);
  console.log('\nCertifique-se de que o arquivo .json do bundle esteja na mesma pasta do script/bat.');
  process.exit(1);
}

console.log(`\x1b[36m[FLOW-ASSETS]\x1b[0m Pacote localizado: \x1b[33m${path.basename(targetBundle)}\x1b[0m`);
console.log(`\x1b[36m[DESTINO]\x1b[0m Extraindo na pasta: \x1b[32m${baseDir}\x1b[0m\n`);

try {
  const raw = fs.readFileSync(targetBundle, 'utf8');
  const bundle = JSON.parse(raw);

  console.log(`Projeto: \x1b[32m${bundle.projectTitle || 'Google Flow Asset Studio'}\x1b[0m`);
  console.log(`Data de exportação: ${bundle.exportDate || 'N/A'}`);
  
  const assetsList = bundle.assets || [];
  console.log(`Total de assets no pacote: \x1b[1m${assetsList.length}\x1b[0m\n`);

  if (!Array.isArray(assetsList) || assetsList.length === 0) {
    console.error('\x1b[31m[ERRO]\x1b[0m O arquivo JSON não contém uma lista válida de assets.');
    process.exit(1);
  }

  let extractedCount = 0;
  let skippedCount = 0;

  assetsList.forEach(asset => {
    const rawData = asset.base64 || asset.base64Data || asset.data;
    if (!asset.targetPath || !rawData) {
      skippedCount++;
      return;
    }

    // Normaliza targetPath
    let relPath = asset.targetPath.replace(/\\/g, '/').replace(/^\/+/, '');

    // Se a pasta base já for chamada 'assets' e o caminho começar com 'assets/', evita duplicar:
    if (path.basename(baseDir).toLowerCase() === 'assets' && relPath.toLowerCase().startsWith('assets/')) {
      relPath = relPath.substring(7);
    }

    // Grava relativo à pasta base onde o script/bat está
    const targetFile = path.resolve(baseDir, relPath);
    const targetDir = path.dirname(targetFile);

    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const cleanBase64 = rawData.replace(/^data:[^;]+;base64,/, '');
    const buffer = Buffer.from(cleanBase64, 'base64');

    fs.writeFileSync(targetFile, buffer);
    extractedCount++;
    console.log(`  ✓ Gravado: \x1b[32m${relPath}\x1b[0m (${(buffer.length / 1024).toFixed(1)} KB)`);
  });

  const syncReportContent = bundle.syncStatusMarkdown || bundle.syncReport || bundle.report;
  if (syncReportContent) {
    const reportPath = path.resolve(baseDir, 'sync-status.md');
    fs.writeFileSync(reportPath, syncReportContent, 'utf8');
    console.log(`\n  ✓ Relatório de sincronização salvo em: \x1b[32msync-status.md\x1b[0m`);
  }

  console.log(`\n\x1b[32m══════════════════════════════════════════════════════════════\x1b[0m`);
  console.log(`\x1b[32m✔ SUCESSO:\x1b[0m ${extractedCount} arquivos extraídos nas pastas do projeto.`);
  if (skippedCount > 0) {
    console.log(`\x1b[33m⚠ AVISO:\x1b[0m ${skippedCount} assets não continham dados de imagem.`);
  }
  console.log(`\x1b[32m══════════════════════════════════════════════════════════════\x1b[0m\n`);

} catch (err) {
  console.error('\x1b[31m[ERRO AO DESCOMPACTAR]\x1b[0m', err.message);
  process.exit(1);
}
