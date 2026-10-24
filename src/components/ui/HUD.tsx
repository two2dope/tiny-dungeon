import React from 'react';
import { useGameStore } from '../../store/gameStore';
import {
  Heart,
  RotateCcw,
  RotateCw,
  Check,
  ShieldAlert,
  Flame,
  BookOpen,
} from 'lucide-react';

interface HUDProps {
  onToggleLedger: () => void;
  isLedgerOpen: boolean;
}

export const HUD: React.FC<HUDProps> = ({ onToggleLedger, isLedgerOpen }) => {
  const currentRound = useGameStore((state) => state.currentRound);
  const party = useGameStore((state) => state.party);
  const history = useGameStore((state) => state.history);
  const future = useGameStore((state) => state.future);
  const undo = useGameStore((state) => state.undo);
  const redo = useGameStore((state) => state.redo);
  const confirmRound = useGameStore((state) => state.confirmRound);

  const getUpcomingBoss = () => {
    if (currentRound <= 3) {
      return { name: 'Manticora', round: 3, powerT1: 6, powerT2: 4 };
    }
    if (currentRound <= 6) {
      return { name: 'Tirano Ocular', round: 6, powerT1: 10, powerT2: 7 };
    }
    return { name: 'Dragão Vermelho', round: 8, powerT1: 14, powerT2: 10 };
  };

  const upcomingBoss = getUpcomingBoss();

  return (
    <header className="w-full flex items-center justify-between px-6 py-4 bg-gradient-to-b from-dungeon-darkest/95 via-dungeon-darkest/70 to-transparent backdrop-blur-sm z-20 pointer-events-auto">
      {/* Left: Title & Round Progress */}
      <div className="flex items-center gap-6">
        <div>
          <h1 className="font-serif text-2xl tracking-widest text-dungeon-gold uppercase font-bold flex items-center gap-2 drop-shadow-[0_2px_8px_rgba(212,175,55,0.3)]">
            <Flame className="w-5 h-5 text-dungeon-ember animate-pulse" />
            Tiny Dungeon
          </h1>
          <p className="text-[11px] font-mono text-stone-400 tracking-wider">
            The Ember Measure
          </p>
        </div>

        {/* Round Badge */}
        <div className="flex flex-col border-l border-dungeon-border pl-6">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono uppercase text-stone-400">
              Rodada
            </span>
            <span className="font-serif text-lg font-bold text-stone-100">
              {currentRound} <span className="text-stone-500 text-sm">/ 8</span>
            </span>
          </div>

          {/* Upcoming Boss preview */}
          <div className="flex items-center gap-1.5 text-[11px] font-mono text-dungeon-copper">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>
              {upcomingBoss.name} (R{upcomingBoss.round} • Poder {upcomingBoss.powerT1}/{upcomingBoss.powerT2})
            </span>
          </div>
        </div>
      </div>

      {/* Center: Party Vitality & Resurrections */}
      <div className="flex items-center gap-4 bg-dungeon-surface/80 border border-dungeon-border px-4 py-2 rounded-xl">
        <div className="flex items-center gap-1.5">
          {Array.from({ length: party.maxHealth }).map((_, idx) => (
            <Heart
              key={idx}
              className={`w-5 h-5 ${
                idx < party.currentHealth
                  ? 'text-red-500 fill-red-500 drop-shadow-[0_0_6px_rgba(239,68,68,0.5)]'
                  : 'text-stone-700'
              }`}
            />
          ))}
        </div>

        {party.resurrections > 0 && (
          <div className="flex items-center gap-1 bg-red-950/80 border border-red-800 text-red-300 text-xs px-2 py-0.5 rounded font-mono">
            <span>Ressurreições: {party.resurrections}</span>
            <span className="text-red-400 font-bold">(-{party.resurrections * 9} pts)</span>
          </div>
        )}
      </div>

      {/* Right: Actions & Ledger toggle */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleLedger}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-mono border transition-all ${
            isLedgerOpen
              ? 'bg-dungeon-gold text-black border-dungeon-gold font-semibold'
              : 'bg-dungeon-card border-dungeon-border text-stone-200 hover:border-dungeon-copper'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          The Ember Measure
        </button>

        <div className="h-6 w-[1px] bg-dungeon-border" />

        {/* Undo / Redo */}
        <button
          onClick={undo}
          disabled={history.length === 0}
          title="Desfazer Ação"
          className="p-2 rounded-lg bg-dungeon-card border border-dungeon-border text-stone-300 hover:border-stone-400 disabled:opacity-30 disabled:pointer-events-none"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        <button
          onClick={redo}
          disabled={future.length === 0}
          title="Refazer Ação"
          className="p-2 rounded-lg bg-dungeon-card border border-dungeon-border text-stone-300 hover:border-stone-400 disabled:opacity-30 disabled:pointer-events-none"
        >
          <RotateCw className="w-4 h-4" />
        </button>

        {/* Confirm Round Button */}
        <button
          onClick={confirmRound}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-700 via-amber-600 to-amber-700 text-stone-100 font-serif font-semibold text-xs tracking-wider uppercase rounded-lg border border-amber-500/50 shadow-[0_0_15px_rgba(217,119,6,0.3)] hover:brightness-110 active:scale-95 transition-all"
        >
          <Check className="w-4 h-4 stroke-[2.5]" />
          Confirmar Rodada
        </button>
      </div>
    </header>
  );
};
