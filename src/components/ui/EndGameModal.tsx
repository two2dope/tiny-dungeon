import React from 'react';
import { useGameStore } from '../../store/gameStore';
import { Award, Trophy, Skull, Gem, Sparkles, Sword, RotateCcw, Download } from 'lucide-react';

export const EndGameModal: React.FC = () => {
  const isGameOver = useGameStore((state) => state.isGameOver);
  const finalScore = useGameStore((state) => state.finalScore);
  const bossesDefeated = useGameStore((state) => state.bossesDefeated);
  const dungeon = useGameStore((state) => state.dungeon);
  const theme = useGameStore((state) => state.theme);
  const resetGame = useGameStore((state) => state.resetGame);

  if (!isGameOver || !finalScore) return null;

  const isSengoku = theme === 'sengoku';

  const exportCertificatePng = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 560;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#0d0e12';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 4;
    ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);

    ctx.fillStyle = '#d4af37';
    ctx.font = 'bold 34px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('TINY DUNGEON — CERTIFICADO DE GLÓRIA', 400, 82);

    ctx.fillStyle = '#a8a29e';
    ctx.font = '18px monospace';
    ctx.fillText(`Masmorra: ${dungeon.mapName ?? 'Mapa 1'}`, 400, 120);

    ctx.fillStyle = '#ff9233';
    ctx.font = 'bold 74px Georgia, serif';
    ctx.fillText(`${finalScore.netGlory} PTS`, 400, 215);

    ctx.textAlign = 'left';
    ctx.fillStyle = '#e7e5e4';
    ctx.font = '20px monospace';
    const rows = [
      `Monstros Derrotados: +${finalScore.minionsGlory}`,
      `Chefes Vencidos (${bossesDefeated.length}): +${finalScore.bossesGlory}`,
      `Gemas Preciosas: +${finalScore.gemsGlory}`,
      `Artefatos Mágicos: +${finalScore.itemsGlory}`,
      `Níveis dos Heróis: +${finalScore.heroLevelsGlory}`,
      `Missões & Maestria: +${(finalScore.missionsGlory ?? 0) + (finalScore.masteryGlory ?? 0)}`,
      `Penalidades de Ressurreição: -${finalScore.resurrectionPenalties}`,
    ];
    rows.forEach((row, i) => {
      ctx.fillText(row, 140, 275 + i * 34);
    });

    const link = document.createElement('a');
    link.download = 'tiny-dungeon-certificado.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="certificate-title"
      className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-50"
    >
      <div
        className={`w-full max-w-lg p-6 sm:p-8 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.75)] flex flex-col items-center text-center relative bg-no-repeat ${
          isSengoku
            ? 'text-[#24160d] border-2 border-amber-800/80'
            : 'bg-dungeon-card border-2 border-dungeon-gold/60 text-stone-200'
        }`}
        style={
          isSengoku
            ? {
                backgroundColor: '#e8d4ad',
                backgroundImage: "url('/assets/ui/modal-open-book.webp')",
                backgroundSize: '100% 100%',
              }
            : undefined
        }
      >
        <div className="w-12 h-12 rounded-full bg-gradient-to-b from-amber-400 to-amber-700 border-2 border-amber-900/60 flex items-center justify-center shadow-lg mb-2">
          <Trophy className="w-6 h-6 text-stone-950 stroke-[2.2]" />
        </div>

        <h2
          id="certificate-title"
          className={`font-serif text-xl sm:text-2xl font-bold uppercase tracking-widest ${
            isSengoku ? 'text-[#2b150b]' : 'text-dungeon-gold'
          }`}
        >
          Certificado de Glória
        </h2>
        <p className={`font-mono text-xs mt-0.5 ${isSengoku ? 'text-[#5b3d28]' : 'text-stone-400'}`}>
          {dungeon.mapName ?? 'Expedição Concluída'}
        </p>

        <div
          className={`my-3 p-3.5 w-full rounded-xl border tabular-nums ${
            isSengoku
              ? 'bg-amber-950/10 border-amber-900/35'
              : 'bg-dungeon-surface border-dungeon-border'
          }`}
        >
          <span
            className={`text-xs font-mono uppercase tracking-wider ${
              isSengoku ? 'text-[#5b3d28]' : 'text-stone-400'
            }`}
          >
            Glória Final Conquistada
          </span>
          <div
            className={`font-serif text-5xl font-black mt-0.5 drop-shadow-sm ${
              isSengoku ? 'text-red-800' : 'text-dungeon-flame'
            }`}
          >
            {finalScore.netGlory}
          </div>
        </div>

        <div
          className={`w-full space-y-1.5 text-xs font-mono border-t border-b py-2.5 mb-4 tabular-nums ${
            isSengoku ? 'border-amber-900/35 text-[#2c1a0e]' : 'border-dungeon-border text-stone-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Sword className="w-4 h-4 text-orange-600" /> Monstros
            </span>
            <span className="font-bold">+{finalScore.minionsGlory} pts</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Award className="w-4 h-4 text-purple-600" /> Chefes ({bossesDefeated.length})
            </span>
            <span className="font-bold">+{finalScore.bossesGlory} pts</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Gem className="w-4 h-4 text-emerald-700" /> Gemas
            </span>
            <span className="font-bold">+{finalScore.gemsGlory} pts</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-700" /> Artefatos
            </span>
            <span className="font-bold">+{finalScore.itemsGlory} pts</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Níveis dos Heróis</span>
            <span className="font-bold">+{finalScore.heroLevelsGlory} pts</span>
          </div>
          <div className={`flex items-center justify-between ${isSengoku ? 'text-emerald-900' : 'text-emerald-300'}`}>
            <span>Missões & Maestria</span>
            <span className="font-bold">
              +{(finalScore.missionsGlory ?? 0) + (finalScore.masteryGlory ?? 0)} pts
            </span>
          </div>
          {finalScore.resurrectionPenalties > 0 && (
            <div className="flex items-center justify-between text-red-700 pt-1 border-t border-red-900/30">
              <span className="flex items-center gap-2">
                <Skull className="w-4 h-4 text-red-600" /> Ressurreições
              </span>
              <span className="font-bold">-{finalScore.resurrectionPenalties} pts</span>
            </div>
          )}
        </div>

        <div className="w-full grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={exportCertificatePng}
            className="touch-target gui-btn-gold flex items-center justify-center gap-1.5 py-2.5 px-3 font-mono font-bold text-xs uppercase rounded-xl"
          >
            <Download className="w-4 h-4" />
            Exportar PNG
          </button>
          <button
            type="button"
            onClick={() => resetGame()}
            className="touch-target gui-btn-crimson flex items-center justify-center gap-1.5 py-2.5 px-3 font-serif font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg"
          >
            <RotateCcw className="w-4 h-4" />
            Nova Aventura
          </button>
        </div>
      </div>
    </div>
  );
};
