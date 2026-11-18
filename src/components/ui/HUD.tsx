import React, { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { CANONICAL_MAPS } from '../../engine/dungeon';
import { soundEngine } from '../../audio/soundEngine';
import {
  Heart,
  RotateCcw,
  RotateCw,
  Check,
  ShieldAlert,
  Flame,
  BookOpen,
  Palette,
  Volume2,
  VolumeX,
  FlaskConical,
  Map as MapIcon,
} from 'lucide-react';

interface HUDProps {
  onToggleLedger: () => void;
  isLedgerOpen: boolean;
}

export const HUD: React.FC<HUDProps> = ({ onToggleLedger, isLedgerOpen }) => {
  const currentRound = useGameStore((state) => state.currentRound);
  const party = useGameStore((state) => state.party);
  const mapId = useGameStore((state) => state.mapId);
  const theme = useGameStore((state) => state.theme);
  const consumedDieIds = useGameStore((state) => state.consumedDieIds);
  const history = useGameStore((state) => state.history);
  const future = useGameStore((state) => state.future);
  const setTheme = useGameStore((state) => state.setTheme);
  const selectMap = useGameStore((state) => state.selectMap);
  const stageUsePotion = useGameStore((state) => state.stageUsePotion);
  const undo = useGameStore((state) => state.undo);
  const redo = useGameStore((state) => state.redo);
  const confirmRound = useGameStore((state) => state.confirmRound);

  const [muted, setMuted] = useState(() => soundEngine.isMuted());

  const actionsRemaining = Math.max(0, 3 - consumedDieIds.length);
  const canDrinkPotion = party.potions > 0 && party.currentHealth < party.maxHealth;

  const getUpcomingBoss = () => {
    if (currentRound <= 3) {
      return { name: 'Chefe R3', round: 3, powerT1: 6, powerT2: 4 };
    }
    if (currentRound <= 6) {
      return { name: 'Chefe R6', round: 6, powerT1: 10, powerT2: 7 };
    }
    return { name: 'Chefe Final', round: 8, powerT1: 14, powerT2: 10 };
  };

  const upcomingBoss = getUpcomingBoss();
  const isSengoku = theme === 'sengoku';

  return (
    <header
      className={`w-full flex flex-wrap items-center justify-between gap-2 sm:gap-4 px-3 sm:px-6 ${
        isLedgerOpen ? 'lg:pl-[23rem]' : ''
      } py-2.5 sm:py-3.5 backdrop-blur-md z-20 pointer-events-auto border-b transition-[padding] duration-200 ${
        isSengoku
          ? 'bg-[#17110d]/90 border-amber-900/40'
          : 'bg-dungeon-darkest/90 border-dungeon-border/60'
      }`}
    >
      {/* Left: Title, Map Selector & Round */}
      <div className="flex items-center gap-3 sm:gap-5 flex-wrap">
        <div>
          <h1 className="font-serif text-base sm:text-xl tracking-widest text-dungeon-gold uppercase font-bold flex items-center gap-1.5 drop-shadow-[0_2px_8px_rgba(212,175,55,0.3)]">
            <Flame className="w-4 h-4 sm:w-5 sm:h-5 text-dungeon-ember" />
            Tiny Dungeon
          </h1>
          <div className="flex items-center gap-1.5 mt-0.5">
            <MapIcon className="w-3 h-3 text-amber-400/80" />
            <select
              aria-label="Selecionar Mapa"
              value={mapId}
              onChange={(e) => {
                soundEngine.play('click');
                selectMap(Number(e.target.value));
              }}
              className="bg-stone-900/90 text-[11px] font-mono text-stone-200 border border-stone-700 rounded px-1.5 py-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400"
            >
              {CANONICAL_MAPS.map((m) => (
                <option key={m.id} value={m.id}>
                  M{m.id}: {m.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-col border-l border-stone-700/70 pl-3 sm:pl-5 tabular-nums">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono uppercase text-stone-400">Rodada</span>
            <span className="font-serif text-sm sm:text-lg font-bold text-stone-100">
              {currentRound} <span className="text-stone-500 text-xs">/ 8</span>
            </span>
            <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-amber-950/60 border border-amber-700/40 text-amber-300">
              Ações: {actionsRemaining}/3
            </span>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-mono text-dungeon-copper">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>
              {upcomingBoss.name} (R{upcomingBoss.round} • Poder {upcomingBoss.powerT1}/{upcomingBoss.powerT2})
            </span>
          </div>
        </div>
      </div>

      {/* Center: Party Vitality + Free Potion button */}
      <div className="flex items-center gap-2 sm:gap-3 bg-stone-900/85 border border-stone-700/70 px-3 py-1.5 rounded-xl tabular-nums">
        <div className="flex items-center gap-1" aria-label={`Vida ${party.currentHealth} de ${party.maxHealth}`}>
          {Array.from({ length: party.maxHealth }).map((_, idx) => (
            <Heart
              key={idx}
              className={`w-4 h-4 sm:w-5 sm:h-5 ${
                idx < party.currentHealth
                  ? 'text-red-500 fill-red-500 drop-shadow-[0_0_6px_rgba(239,68,68,0.5)]'
                  : 'text-stone-700'
              }`}
            />
          ))}
        </div>

        {canDrinkPotion && (
          <button
            type="button"
            onClick={() => {
              soundEngine.play('potion');
              stageUsePotion();
            }}
            className="touch-target flex items-center gap-1 px-2 py-1 rounded bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/50 text-emerald-300 text-[11px] font-mono"
            title="Usar Poção sem gastar dado (+2 Vida)"
          >
            <FlaskConical className="w-3.5 h-3.5" />
            <span>+2 ({party.potions})</span>
          </button>
        )}

        {party.resurrections > 0 && (
          <span className="bg-red-950/80 border border-red-800 text-red-300 text-[11px] px-1.5 py-0.5 rounded font-mono">
            -{party.resurrections * 9} pts
          </span>
        )}
      </div>

      {/* Right: Theme Toggle, Audio, Ledger, Undo/Redo, Confirm */}
      <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
        <button
          type="button"
          onClick={() => {
            soundEngine.play('click');
            setTheme(isSengoku ? 'vesperfall' : 'sengoku');
          }}
          title="Alternar tema visual (Sengoku & Nanquim / Vesperfall)"
          aria-label="Alternar tema visual"
          className="touch-target flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-mono border bg-stone-900/90 border-stone-700 text-amber-300 hover:border-amber-500/60"
        >
          <Palette className="w-4 h-4" />
          <span className="hidden md:inline">{isSengoku ? 'Sengoku' : 'Vesperfall'}</span>
        </button>

        <button
          type="button"
          onClick={() => setMuted(soundEngine.toggleMute())}
          aria-label={muted ? 'Ativar áudio' : 'Silenciar áudio'}
          title={muted ? 'Ativar áudio' : 'Silenciar áudio'}
          className="touch-target p-2 rounded-lg bg-stone-900/90 border border-stone-700 text-stone-300 hover:border-stone-500"
        >
          {muted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
        </button>

        <button
          type="button"
          onClick={() => {
            soundEngine.play('click');
            onToggleLedger();
          }}
          aria-label="Abrir ou fechar Grimório"
          className={`touch-target flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-mono border transition-all ${
            isLedgerOpen
              ? 'bg-dungeon-gold text-black border-dungeon-gold font-semibold'
              : 'bg-stone-900/90 border-stone-700 text-stone-200 hover:border-dungeon-copper'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span className="hidden sm:inline">Grimório</span>
        </button>

        <button
          type="button"
          onClick={() => {
            soundEngine.play('click');
            undo();
          }}
          disabled={history.length === 0}
          aria-label="Desfazer Ação"
          title="Desfazer (Z)"
          className="touch-target p-2 rounded-lg bg-stone-900/90 border border-stone-700 text-stone-300 hover:border-stone-500 disabled:opacity-30 disabled:pointer-events-none"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => {
            soundEngine.play('click');
            redo();
          }}
          disabled={future.length === 0}
          aria-label="Refazer Ação"
          title="Refazer (Y)"
          className="touch-target p-2 rounded-lg bg-stone-900/90 border border-stone-700 text-stone-300 hover:border-stone-500 disabled:opacity-30 disabled:pointer-events-none"
        >
          <RotateCw className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => {
            soundEngine.play('roll');
            confirmRound();
          }}
          className="touch-target flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-amber-700 via-amber-600 to-amber-700 text-stone-100 font-serif font-semibold text-xs tracking-wider uppercase rounded-lg border border-amber-400/50 shadow-[0_0_15px_rgba(217,119,6,0.3)] hover:brightness-110 active:scale-95 transition-all"
        >
          {isSengoku && (
            <span
              aria-hidden="true"
              className="w-4 h-4 rounded-sm bg-red-700 border border-red-300/70 text-[10px] leading-none font-serif font-bold text-amber-100 flex items-center justify-center shadow-inner"
            >
              印
            </span>
          )}
          <Check className="w-4 h-4 stroke-[2.5]" />
          <span>Confirmar</span>
        </button>
      </div>
    </header>
  );
};
