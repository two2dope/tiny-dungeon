import React from 'react';
import { useGameStore } from '../../store/gameStore';
import { Award, Trophy, Skull, Gem, Sparkles, Sword, RotateCcw, Download } from 'lucide-react';

export const EndGameModal: React.FC = () => {
  const isGameOver = useGameStore((state) => state.isGameOver);
  const finalScore = useGameStore((state) => state.finalScore);
  const bossesDefeated = useGameStore((state) => state.bossesDefeated);
  const dungeon = useGameStore((state) => state.dungeon);
  const resetGame = useGameStore((state) => state.resetGame);

  if (!isGameOver || !finalScore) return null;

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
      <div className="w-full max-w-md bg-dungeon-card border-2 border-dungeon-gold/60 p-6 rounded-2xl shadow-[0_0_50px_rgba(212,175,55,0.25)] flex flex-col items-center text-center">
        <div className="w-14 h-14 rounded-full bg-gradient-to-b from-dungeon-gold to-amber-700 flex items-center justify-center shadow-lg mb-3">
          <Trophy className="w-7 h-7 text-black stroke-[2.2]" />
        </div>

        <h2 id="certificate-title" className="font-serif text-xl sm:text-2xl font-bold uppercase tracking-widest text-dungeon-gold">
          Certificado de Glória
        </h2>
        <p className="text-stone-400 font-mono text-xs mt-1">
          {dungeon.mapName ?? 'Expedição Concluída'}
        </p>

        <div className="my-4 p-4 w-full rounded-xl bg-dungeon-surface border border-dungeon-border tabular-nums">
          <span className="text-xs font-mono uppercase tracking-wider text-stone-400">
            Glória Final Conquistada
          </span>
          <div className="font-serif text-5xl font-black text-dungeon-flame mt-1 drop-shadow-md">
            {finalScore.netGlory}
          </div>
        </div>

        <div className="w-full space-y-1.5 text-xs font-mono border-t border-b border-dungeon-border py-3 mb-5 tabular-nums">
          <div className="flex items-center justify-between text-stone-300">
            <span className="flex items-center gap-2"><Sword className="w-4 h-4 text-orange-400" /> Monstros</span>
            <span className="font-bold text-stone-100">+{finalScore.minionsGlory} pts</span>
          </div>
          <div className="flex items-center justify-between text-stone-300">
            <span className="flex items-center gap-2"><Award className="w-4 h-4 text-purple-400" /> Chefes ({bossesDefeated.length})</span>
            <span className="font-bold text-stone-100">+{finalScore.bossesGlory} pts</span>
          </div>
          <div className="flex items-center justify-between text-stone-300">
            <span className="flex items-center gap-2"><Gem className="w-4 h-4 text-cyan-400" /> Gemas</span>
            <span className="font-bold text-stone-100">+{finalScore.gemsGlory} pts</span>
          </div>
          <div className="flex items-center justify-between text-stone-300">
            <span className="flex items-center gap-2"><Sparkles className="w-4 h-4 text-amber-400" /> Artefatos</span>
            <span className="font-bold text-stone-100">+{finalScore.itemsGlory} pts</span>
          </div>
          <div className="flex items-center justify-between text-stone-300">
            <span>Níveis dos Heróis</span>
            <span className="font-bold text-stone-100">+{finalScore.heroLevelsGlory} pts</span>
          </div>
          <div className="flex items-center justify-between text-emerald-300">
            <span>Missões & Maestria</span>
            <span className="font-bold">+{(finalScore.missionsGlory ?? 0) + (finalScore.masteryGlory ?? 0)} pts</span>
          </div>
          {finalScore.resurrectionPenalties > 0 && (
            <div className="flex items-center justify-between text-red-400 pt-1 border-t border-red-950">
              <span className="flex items-center gap-2"><Skull className="w-4 h-4 text-red-500" /> Ressurreições</span>
              <span className="font-bold">-{finalScore.resurrectionPenalties} pts</span>
            </div>
          )}
        </div>

        <div className="w-full grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={exportCertificatePng}
            className="touch-target flex items-center justify-center gap-1.5 py-2.5 px-3 bg-stone-800 hover:bg-stone-700 text-amber-300 font-mono text-xs uppercase rounded-xl border border-amber-600/40"
          >
            <Download className="w-4 h-4" />
            Exportar PNG
          </button>
          <button
            type="button"
            onClick={() => resetGame()}
            className="touch-target flex items-center justify-center gap-1.5 py-2.5 px-3 bg-gradient-to-r from-amber-700 via-amber-600 to-amber-700 hover:brightness-110 text-stone-100 font-serif font-bold text-xs uppercase tracking-wider rounded-xl border border-amber-500/50 shadow-lg"
          >
            <RotateCcw className="w-4 h-4" />
            Nova Aventura
          </button>
        </div>
      </div>
    </div>
  );
};
