import React, { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { Die, DieSymbol } from '../../engine/types';
import { soundEngine } from '../../audio/soundEngine';
import { CheckCircle2 } from 'lucide-react';
import { DieSymbolSvg } from './TacticalIcons';

const FULL_DIE_FACE_SPRITES: Partial<Record<DieSymbol, string>> = {
  sword: '/assets/ui/die-face-sword.webp',
  shield: '/assets/ui/die-face-shield.webp',
  boot: '/assets/ui/die-face-boot.webp',
  magic: '/assets/ui/die-face-magic.webp',
  rogue: '/assets/ui/die-face-rogue.webp',
};

const EMBLEM_DIE_SPRITES: Partial<Record<DieSymbol, string>> = {
  skull: '/assets/ui/icon-oni-skull.webp',
};

const CloakPip: React.FC<{ color: 'white' | 'black' }> = ({ color }) => (
  <span
    aria-hidden="true"
    className={`absolute top-0.5 left-0.5 w-2.5 h-2.5 rounded-full border shadow-sm z-10 ${
      color === 'white'
        ? 'bg-stone-100 border-stone-900/90'
        : 'bg-stone-950 border-amber-400/90'
    }`}
  />
);

const DieFaceArtwork: React.FC<{ symbol: DieSymbol; color: 'white' | 'black' }> = ({
  symbol,
  color,
}) => {
  const [failed, setFailed] = useState(false);
  const fullSpriteUrl = FULL_DIE_FACE_SPRITES[symbol];
  const emblemUrl = EMBLEM_DIE_SPRITES[symbol];
  const baseUrl =
    color === 'white' ? '/assets/ui/die-base-white.webp' : '/assets/ui/die-base-black.webp';
  const obsidianTone =
    color === 'black' ? 'brightness-[0.68] contrast-[1.2] saturate-[0.85]' : '';

  if (fullSpriteUrl && !failed) {
    return (
      <div className="relative w-11 h-11 sm:w-12 sm:h-12 flex items-center justify-center">
        <CloakPip color={color} />
        <img
          src={fullSpriteUrl}
          alt=""
          aria-hidden="true"
          onError={() => setFailed(true)}
          className={`w-11 h-11 sm:w-12 sm:h-12 object-contain rounded-[5px] drop-shadow-[0_2px_4px_rgba(0,0,0,0.75)] ${obsidianTone}`}
        />
      </div>
    );
  }

  return (
    <div
      className="relative w-11 h-11 sm:w-12 sm:h-12 rounded-[5px] flex items-center justify-center bg-contain bg-center bg-no-repeat drop-shadow-[0_2px_4px_rgba(0,0,0,0.75)]"
      style={{ backgroundImage: `url('${baseUrl}')` }}
    >
      <CloakPip color={color} />
      {emblemUrl && !failed ? (
        <img
          src={emblemUrl}
          alt=""
          aria-hidden="true"
          onError={() => setFailed(true)}
          className="w-7 h-7 sm:w-8 sm:h-8 object-contain drop-shadow-[0_1px_2px_rgba(0,0,0,0.85)]"
        />
      ) : (
        <DieSymbolSvg symbol={symbol} className="w-6 h-6 sm:w-7 sm:h-7" />
      )}
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
            ? 'gui-dice-tray-slots px-[4.8%] pt-[2.8%] pb-[6.4%] gap-[1.8%]'
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
              onClick={() => {
                soundEngine.play('click');
                selectDie(isSelected ? null : die.id);
                if (!isDrafted) {
                  stageDraft(die.id);
                }
              }}
              aria-label={`${isWhite ? 'Dado Branco' : 'Dado Negro'}: ${getSymbolLabel(die)}`}
              title={`${isWhite ? 'Dado Branco' : 'Dado Negro'}: ${getSymbolLabel(die)}`}
              className={`group touch-target relative flex items-center justify-center transition-all duration-150 ${slotBaseClass} ${
                isConsumed
                  ? 'opacity-55 cursor-not-allowed'
                  : isSelected
                    ? 'ring-2 ring-amber-300 shadow-[0_0_12px_rgba(251,191,36,0.75)] scale-105'
                    : isDrafted
                      ? 'ring-1 ring-amber-400/75'
                      : 'opacity-95 hover:opacity-100'
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

      {/* Aligned 6-column caption strip below wooden compartments */}
      <div className="w-full max-w-[26.5rem] grid grid-cols-6 px-[4.8%] gap-[1.8%] text-[10px] font-mono text-amber-200/85 text-center capitalize">
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
