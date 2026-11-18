import React from 'react';
import { useGameStore } from '../../store/gameStore';
import { Die, DieSymbol } from '../../engine/types';
import { soundEngine } from '../../audio/soundEngine';
import { CheckCircle2 } from 'lucide-react';
import { DieSymbolSvg } from './TacticalIcons';

export const DiceTray: React.FC = () => {
  const dicePool = useGameStore((state) => state.dicePool);
  const selectedDieId = useGameStore((state) => state.selectedDieId);
  const consumedDieIds = useGameStore((state) => state.consumedDieIds);
  const theme = useGameStore((state) => state.theme);
  const stageDraft = useGameStore((state) => state.stageDraft);
  const selectDie = useGameStore((state) => state.selectDie);

  const getSymbolLabel = (die: Die) => {
    switch (die.symbol) {
      case 'boot':
        return 'Bota (2 passos)';
      case 'sword':
        return 'Espada (Guerreiro)';
      case 'magic':
        return 'Magia (Mago)';
      case 'rogue':
        return 'Chave (Ladino)';
      case 'shield':
        return 'Escudo (Clérigo)';
      case 'skull':
        return 'Crânio (Perigo)';
    }
  };

  const ptSymbol: Record<DieSymbol, string> = {
    boot: 'bota',
    sword: 'espada',
    magic: 'magia',
    rogue: 'ladino',
    shield: 'escudo',
    skull: 'crânio',
  };

  const isSengoku = theme === 'sengoku';
  const remaining = Math.max(0, 3 - consumedDieIds.length);

  return (
    <div
      className={`relative backdrop-blur-md border p-2.5 sm:p-3 rounded-xl shadow-2xl flex flex-col gap-2 ${
        isSengoku
          ? 'bg-[#251b14]/95 border-amber-700/70'
          : 'bg-dungeon-surface/90 border-dungeon-border'
      }`}
    >
      <span aria-hidden="true" className="pointer-events-none absolute top-1 left-1 w-2.5 h-2.5 border-t-2 border-l-2 border-amber-400/70 rounded-tl" />
      <span aria-hidden="true" className="pointer-events-none absolute top-1 right-1 w-2.5 h-2.5 border-t-2 border-r-2 border-amber-400/70 rounded-tr" />
      <span aria-hidden="true" className="pointer-events-none absolute bottom-1 left-1 w-2.5 h-2.5 border-b-2 border-l-2 border-amber-400/70 rounded-bl" />
      <span aria-hidden="true" className="pointer-events-none absolute bottom-1 right-1 w-2.5 h-2.5 border-b-2 border-r-2 border-amber-400/70 rounded-br" />
      <div className="flex items-center justify-between text-[11px] font-mono px-1 gap-3 tabular-nums">
        <span className="text-stone-300 uppercase tracking-wider">Dados da Rodada</span>
        <span className={remaining === 0 ? 'text-emerald-400 font-semibold' : 'text-amber-400'}>
          {remaining} {remaining === 1 ? 'ação restante' : 'ações restantes'}
        </span>
      </div>

      <div className="grid grid-cols-6 gap-1.5 sm:gap-2">
        {dicePool.dice.map((die) => {
          const isConsumed = consumedDieIds.includes(die.id);
          const isDrafted = dicePool.draftedIds.includes(die.id);
          const isSelected = selectedDieId === die.id;

          const isWhite = die.color === 'white';
          const bgStyle = isWhite
            ? 'bg-gradient-to-b from-stone-200 to-stone-300 text-stone-900 border-stone-400'
            : 'bg-gradient-to-b from-stone-900 to-black text-stone-100 border-stone-700';

          return (
            <button
              key={die.id}
              type="button"
              disabled={isConsumed}
              onClick={() => {
                soundEngine.play('click');
                selectDie(isSelected ? null : die.id);
                if (!isDrafted) {
                  stageDraft(die.id);
                }
              }}
              title={`${isWhite ? 'Dado Branco' : 'Dado Negro'}: ${getSymbolLabel(die)}`}
              className={`group touch-target relative flex flex-col items-center justify-center p-2 sm:p-2.5 rounded-lg border transition-all duration-150 ${bgStyle} ${
                isConsumed
                  ? 'opacity-35 grayscale cursor-not-allowed'
                  : isSelected
                    ? 'ring-2 ring-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.5)] scale-105'
                    : isDrafted
                      ? 'ring-1 ring-amber-500/60'
                      : 'opacity-90 hover:opacity-100'
              }`}
            >
              {isConsumed && (
                <div className="absolute -top-1.5 -right-1.5 bg-emerald-500 text-black rounded-full p-0.5">
                  <CheckCircle2 className="w-3 h-3 stroke-[3]" />
                </div>
              )}

              <DieSymbolSvg symbol={die.symbol} className="w-6 h-6" />

              <span className="text-[10px] font-mono mt-1 capitalize">
                {ptSymbol[die.symbol]}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
