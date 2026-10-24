import React from 'react';
import { useGameStore } from '../../store/gameStore';
import { Die, DieSymbol } from '../../engine/types';
import {
  Footprints,
  Sword,
  Wand2,
  KeyRound,
  Shield,
  Skull,
  CheckCircle2,
} from 'lucide-react';

export const DiceTray: React.FC = () => {
  const dicePool = useGameStore((state) => state.dicePool);
  const selectedDieId = useGameStore((state) => state.selectedDieId);
  const stageDraft = useGameStore((state) => state.stageDraft);
  const selectDie = useGameStore((state) => state.selectDie);

  const getSymbolIcon = (symbol: DieSymbol) => {
    switch (symbol) {
      case 'boot':
        return <Footprints className="w-5 h-5 text-amber-400" />;
      case 'sword':
        return <Sword className="w-5 h-5 text-orange-400" />;
      case 'magic':
        return <Wand2 className="w-5 h-5 text-purple-400" />;
      case 'rogue':
        return <KeyRound className="w-5 h-5 text-emerald-400" />;
      case 'shield':
        return <Shield className="w-5 h-5 text-sky-400" />;
      case 'skull':
        return <Skull className="w-5 h-5 text-rose-500" />;
    }
  };

  const getSymbolLabel = (die: Die) => {
    switch (die.symbol) {
      case 'boot':
        return 'Movimento (2)';
      case 'sword':
        return 'Guerreiro / Combate';
      case 'magic':
        return 'Mago / Feitiço';
      case 'rogue':
        return 'Ladino / Ferramenta';
      case 'shield':
        return 'Clérigo / Defesa';
      case 'skull':
        return 'Perigo / Caveira';
    }
  };

  const draftedCount = dicePool.draftedIds.length;

  return (
    <div className="bg-dungeon-surface/90 backdrop-blur-md border border-dungeon-border p-3 rounded-xl shadow-2xl flex flex-col gap-2">
      <div className="flex items-center justify-between text-xs font-mono px-1">
        <span className="text-stone-400 uppercase tracking-widest">
          Dados da Rodada
        </span>
        <span
          className={`${
            draftedCount === 3
              ? 'text-emerald-400 font-semibold'
              : 'text-dungeon-copper'
          }`}
        >
          {draftedCount} / 3 Selecionados
        </span>
      </div>

      <div className="grid grid-cols-6 gap-2">
        {dicePool.dice.map((die) => {
          const isDrafted = dicePool.draftedIds.includes(die.id);
          const isSelected = selectedDieId === die.id;

          const isWhite = die.color === 'white';
          const bgStyle = isWhite
            ? 'bg-gradient-to-b from-stone-800 to-stone-900 text-stone-200 border-stone-600/60'
            : 'bg-gradient-to-b from-stone-950 to-black text-rose-200/90 border-red-950/80';

          return (
            <button
              key={die.id}
              onClick={() => {
                selectDie(die.id);
                stageDraft(die.id);
              }}
              title={`${isWhite ? 'Dado Branco' : 'Dado Negro'}: ${getSymbolLabel(die)}`}
              className={`relative flex flex-col items-center justify-center p-2.5 rounded-lg border transition-all duration-150 ${bgStyle} ${
                isDrafted
                  ? 'ring-2 ring-dungeon-gold shadow-[0_0_12px_rgba(212,175,55,0.4)] scale-105'
                  : 'hover:border-stone-400 opacity-80 hover:opacity-100'
              } ${isSelected ? 'border-dungeon-ember' : ''}`}
            >
              {isDrafted && (
                <div className="absolute -top-1.5 -right-1.5 bg-dungeon-gold text-black rounded-full p-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5 stroke-[3]" />
                </div>
              )}

              {getSymbolIcon(die.symbol)}

              <span className="text-[10px] font-mono mt-1 capitalize text-stone-300">
                {die.symbol}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
