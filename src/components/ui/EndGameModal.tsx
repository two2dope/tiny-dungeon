import React from 'react';
import { useGameStore } from '../../store/gameStore';
import { Award, Trophy, Skull, Gem, Sparkles, Sword, RotateCcw } from 'lucide-react';

export const EndGameModal: React.FC = () => {
  const isGameOver = useGameStore((state) => state.isGameOver);
  const finalScore = useGameStore((state) => state.finalScore);
  const bossesDefeated = useGameStore((state) => state.bossesDefeated);
  const resetGame = useGameStore((state) => state.resetGame);

  if (!isGameOver || !finalScore) return null;

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="w-full max-w-md bg-dungeon-card border-2 border-dungeon-gold/60 p-6 rounded-2xl shadow-[0_0_50px_rgba(212,175,55,0.25)] flex flex-col items-center text-center">
        {/* Laurel / Trophy header */}
        <div className="w-16 h-16 rounded-full bg-gradient-to-b from-dungeon-gold to-amber-700 flex items-center justify-center shadow-lg mb-3">
          <Trophy className="w-8 h-8 text-black stroke-[2.2]" />
        </div>

        <h2 className="font-serif text-2xl font-bold uppercase tracking-widest text-dungeon-gold">
          Certificado de Glória
        </h2>
        <p className="text-stone-400 font-mono text-xs mt-1">
          A Expedição aos Labirintos das Sombras Foi Concluída
        </p>

        {/* Big Net Glory Score */}
        <div className="my-6 p-4 w-full rounded-xl bg-dungeon-surface border border-dungeon-border">
          <span className="text-xs font-mono uppercase tracking-wider text-stone-400">
            Glória Final Conquistada
          </span>
          <div className="font-serif text-5xl font-black text-dungeon-flame mt-1 drop-shadow-md">
            {finalScore.netGlory}
          </div>
        </div>

        {/* Score Breakdown Table */}
        <div className="w-full space-y-2 text-xs font-mono border-t border-b border-dungeon-border py-4 mb-6">
          <div className="flex items-center justify-between text-stone-300">
            <span className="flex items-center gap-2">
              <Sword className="w-4 h-4 text-orange-400" /> Monstros Derrotados
            </span>
            <span className="font-bold text-stone-100">+{finalScore.minionsGlory} pts</span>
          </div>

          <div className="flex items-center justify-between text-stone-300">
            <span className="flex items-center gap-2">
              <Award className="w-4 h-4 text-purple-400" /> Chefes Vencidos ({bossesDefeated.length})
            </span>
            <span className="font-bold text-stone-100">+{finalScore.bossesGlory} pts</span>
          </div>

          <div className="flex items-center justify-between text-stone-300">
            <span className="flex items-center gap-2">
              <Gem className="w-4 h-4 text-cyan-400" /> Gemas Preciosas
            </span>
            <span className="font-bold text-stone-100">+{finalScore.gemsGlory} pts</span>
          </div>

          <div className="flex items-center justify-between text-stone-300">
            <span className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" /> Artefatos Mágicos
            </span>
            <span className="font-bold text-stone-100">+{finalScore.itemsGlory} pts</span>
          </div>

          <div className="flex items-center justify-between text-stone-300">
            <span>Níveis dos Heróis</span>
            <span className="font-bold text-stone-100">+{finalScore.heroLevelsGlory} pts</span>
          </div>

          {finalScore.resurrectionPenalties > 0 && (
            <div className="flex items-center justify-between text-red-400 pt-1 border-t border-red-950">
              <span className="flex items-center gap-2">
                <Skull className="w-4 h-4 text-red-500" /> Penalidades de Morte
              </span>
              <span className="font-bold">-{finalScore.resurrectionPenalties} pts</span>
            </div>
          )}
        </div>

        {/* Restart Button */}
        <button
          onClick={resetGame}
          className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-amber-700 via-amber-600 to-amber-700 hover:brightness-110 text-stone-100 font-serif font-bold text-sm uppercase tracking-widest rounded-xl border border-amber-500/50 shadow-lg transition-all active:scale-98"
        >
          <RotateCcw className="w-4 h-4" />
          Nova Aventura
        </button>
      </div>
    </div>
  );
};
