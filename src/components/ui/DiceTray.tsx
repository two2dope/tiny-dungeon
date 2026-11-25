import React, { useEffect, useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { Die, DieColor, DieSymbol } from '../../engine/types';
import { soundEngine } from '../../audio/soundEngine';
import { CheckCircle2 } from 'lucide-react';
import { DieSymbolSvg } from './TacticalIcons';

function getDieSpriteUrl(color: DieColor, symbol: DieSymbol): string {
  return `/assets/ui/die-${color}-${symbol}.webp`;
}

const DieFaceArtwork: React.FC<{ symbol: DieSymbol; color: DieColor }> = ({
  symbol,
  color,
}) => {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [color, symbol]);

  if (!failed) {
    return (
      <div className="relative w-10 h-10 sm:w-[2.95rem] sm:h-[2.95rem] flex items-center justify-center">
        <img
          src={getDieSpriteUrl(color, symbol)}
          alt=""
          aria-hidden="true"
          onError={() => setFailed(true)}
          className="w-10 h-10 sm:w-[2.95rem] sm:h-[2.95rem] object-contain drop-shadow-[0_3px_5px_rgba(0,0,0,0.85)]"
        />
      </div>
    );
  }

  return (
    <div
      className={`relative w-11 h-11 rounded-lg border flex items-center justify-center shadow-md ${
        color === 'white'
          ? 'bg-stone-200 border-stone-400'
          : 'bg-stone-950 border-amber-500/70'
      }`}
    >
      <DieSymbolSvg symbol={symbol} className="w-7 h-7" />
    </div>
  );
};

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
      className={`relative backdrop-blur-md p-2 sm:p-2.5 rounded-xl flex flex-col gap-1 ${
        isSengoku
          ? 'gui-dice-tray'
          : 'bg-dungeon-surface/90 border border-dungeon-border shadow-2xl'
      }`}
    >
      <div className="flex items-center justify-between text-[11px] font-mono px-1 gap-3 tabular-nums">
        <span className="text-amber-100 uppercase tracking-wider font-semibold">
          Dados da Rodada
        </span>
        <span className={remaining === 0 ? 'text-emerald-400 font-semibold' : 'text-amber-300 font-semibold'}>
          {remaining} {remaining === 1 ? 'ação restante' : 'ações restantes'}
        </span>
      </div>

      <div
        className={`w-full max-w-[26.5rem] grid grid-cols-6 rounded-lg ${
          isSengoku
            ? 'gui-dice-tray-slots aspect-[680/172] pl-[6.7%] pr-[4.8%] pt-[4.0%] pb-[2.2%] gap-0 items-center justify-items-center'
            : 'p-1.5 gap-1.5 sm:gap-2'
        }`}
      >
        {dicePool.dice.map((die) => {
          const isConsumed = consumedDieIds.includes(die.id);
          const isDrafted = dicePool.draftedIds.includes(die.id);
          const isSelected = selectedDieId === die.id;
          const isWhite = die.color === 'white';

          const slotBaseClass = isSengoku
            ? 'bg-transparent border border-transparent p-0.5 rounded-md'
            : isWhite
              ? 'bg-stone-200/90 text-stone-950 border border-stone-400 p-1 rounded-lg'
              : 'bg-stone-950/90 text-amber-100 border border-stone-700 p-1 rounded-lg';

          return (
            <button
              key={die.id}
              type="button"
              disabled={isConsumed}
              aria-pressed={isSelected}
              onMouseEnter={() => {
                if (!isConsumed) soundEngine.play('hover');
              }}
              onClick={() => {
                soundEngine.play('dice');
                selectDie(isSelected ? null : die.id);
                if (!isDrafted) {
                  stageDraft(die.id);
                }
              }}
              aria-label={`${isWhite ? 'Dado Branco' : 'Dado Negro'}: ${getSymbolLabel(die)}`}
              title={`${isWhite ? 'Dado Branco' : 'Dado Negro'}: ${getSymbolLabel(die)}`}
              className={`group touch-target relative flex items-center justify-center transition-all duration-150 ${slotBaseClass} ${
                isConsumed
                  ? 'opacity-50 grayscale-[35%] cursor-not-allowed'
                  : isSelected
                    ? 'ring-2 ring-amber-300 shadow-[0_0_12px_rgba(251,191,36,0.75)] -translate-y-0.5 scale-[1.06]'
                    : isDrafted
                      ? 'ring-1 ring-amber-400/75 hover:-translate-y-0.5 hover:scale-[1.04]'
                      : 'opacity-95 hover:opacity-100 hover:-translate-y-0.5 hover:scale-[1.04]'
              }`}
            >
              {isConsumed && (
                <div className="absolute -top-1 -right-1 bg-emerald-500 text-black rounded-full p-0.5 z-20 shadow">
                  <CheckCircle2 className="w-3 h-3 stroke-[3]" />
                </div>
              )}

              <DieFaceArtwork symbol={die.symbol} color={die.color} />
            </button>
          );
        })}
      </div>

      {/* Aligned 6-column caption strip matching exact tray compartment centers */}
      <div
        className={`w-full max-w-[26.5rem] grid grid-cols-6 ${
          isSengoku ? 'pl-[6.7%] pr-[4.8%] gap-0' : 'px-1.5 gap-1.5 sm:gap-2'
        } text-[10px] font-mono text-amber-200/85 text-center capitalize`}
      >
        {dicePool.dice.map((die) => (
          <span
            key={`lbl-${die.id}`}
            className={consumedDieIds.includes(die.id) ? 'opacity-55 line-through' : 'font-semibold'}
          >
            {ptSymbol[die.symbol]}
          </span>
        ))}
      </div>
    </div>
  );
};
