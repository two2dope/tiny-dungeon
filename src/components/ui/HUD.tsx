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

const HeartSprite: React.FC<{ active: boolean }> = ({ active }) => {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <Heart
        className={`w-4 h-4 sm:w-5 sm:h-5 ${
          active
            ? 'text-red-500 fill-red-500 drop-shadow-[0_0_6px_rgba(239,68,68,0.5)]'
            : 'text-stone-700'
        }`}
      />
    );
  }

  return (
    <img
      src={active ? '/assets/ui/icon-heart-full.webp' : '/assets/ui/icon-heart-empty.webp'}
      alt=""
      aria-hidden="true"
      onError={() => setFailed(true)}
      className={`w-5 h-5 sm:w-6 sm:h-6 object-contain transition-transform duration-150 ${
        active
          ? 'drop-shadow-[0_0_6px_rgba(220,38,38,0.65)] scale-105'
          : 'opacity-75'
      }`}
    />
  );
};

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
  const [crestFailed, setCrestFailed] = useState(false);

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
  const isBossRoundNow = currentRound === 3 || currentRound === 6 || currentRound === 8;

  return (
    <header
      className={`w-full flex flex-wrap items-center justify-between gap-2 sm:gap-4 px-3 sm:px-6 ${
        isLedgerOpen ? 'lg:pl-[24.5rem]' : ''
      } py-2 sm:py-3 backdrop-blur-md z-20 pointer-events-auto transition-[padding] duration-200 ${
        isSengoku
          ? 'gui-header-bar'
          : 'bg-dungeon-darkest/90 border-b border-dungeon-border/60'
      }`}
    >
      {/* Left: Title, Map Selector & Round */}
      <div className="flex items-center gap-3 sm:gap-5 flex-wrap">
        <div>
          <h1 className="font-serif text-base sm:text-xl tracking-widest text-amber-200 uppercase font-bold flex items-center gap-1.5 drop-shadow-[0_2px_6px_rgba(0,0,0,0.85)]">
            {isSengoku && !crestFailed ? (
              <img
                src="/assets/ui/crest-sengoku-mon.webp"
                alt=""
                aria-hidden="true"
                onError={() => setCrestFailed(true)}
                className="w-6 h-6 object-contain drop-shadow"
              />
            ) : (
              <Flame className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500" />
            )}
            Tiny Dungeon
          </h1>
          <div className="flex items-center gap-1.5 mt-0.5">
            <MapIcon className="w-3 h-3 text-amber-400/90" />
            <select
              aria-label="Selecionar Mapa"
              value={mapId}
              onChange={(e) => {
                soundEngine.play('click');
                selectMap(Number(e.target.value));
              }}
              className="bg-[#211711] text-[11px] font-mono text-amber-100 border border-amber-800/70 rounded px-1.5 py-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400"
            >
              {CANONICAL_MAPS.map((m) => (
                <option key={m.id} value={m.id}>
                  M{m.id}: {m.name} ({m.sizeLabel})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div
          className={`flex flex-col border-l pl-3 sm:pl-5 tabular-nums ${
            isSengoku ? 'border-amber-900/60' : 'border-slate-700/80'
          }`}
        >
          <div className="flex items-center gap-2">
            <span className={`text-[11px] font-mono uppercase ${isSengoku ? 'text-amber-200/75' : 'text-slate-400'}`}>
              Rodada
            </span>
            <span className="font-serif text-sm sm:text-lg font-bold text-amber-100">
              {currentRound} <span className="text-amber-300/60 text-xs">/ 8</span>
            </span>
            <span
              className={`text-[11px] font-mono px-2 py-0.5 rounded border ${
                isSengoku
                  ? 'bg-amber-950/75 border-amber-700/50 text-amber-300'
                  : 'bg-slate-900/90 border-sky-700/60 text-sky-300'
              }`}
            >
              Ações: {actionsRemaining}/3
            </span>
          </div>
          <div
            className={`hidden sm:flex items-center gap-1.5 text-[11px] font-mono ${
              isBossRoundNow
                ? 'text-red-300 font-bold motion-safe:animate-pulse'
                : isSengoku
                  ? 'text-amber-400/90'
                  : 'text-sky-300/90'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
            <span>
              {isBossRoundNow
                ? `⚡ ${upcomingBoss.name} desperta ao confirmar! (Poder ${upcomingBoss.powerT1}/${upcomingBoss.powerT2})`
                : `${upcomingBoss.name} (R${upcomingBoss.round} • Poder ${upcomingBoss.powerT1}/${upcomingBoss.powerT2})`}
            </span>
          </div>
        </div>
      </div>

      {/* Center: Party Vitality + Free Potion button */}
      <div
        className={`flex items-center gap-2 sm:gap-3 px-3 py-1 rounded-xl tabular-nums shadow-inner border ${
          isSengoku
            ? 'bg-[#1c130e]/90 border-amber-800/60'
            : 'bg-slate-950/90 border-slate-700/80'
        }`}
      >
        <div className="flex items-center gap-1" aria-label={`Vida ${party.currentHealth} de ${party.maxHealth}`}>
          {Array.from({ length: party.maxHealth }).map((_, idx) => (
            <HeartSprite key={idx} active={idx < party.currentHealth} />
          ))}
        </div>

        {canDrinkPotion && (
          <button
            type="button"
            onClick={() => {
              soundEngine.play('potion');
              stageUsePotion();
            }}
            className="touch-target flex items-center gap-1 px-2 py-1 rounded bg-emerald-950/85 hover:bg-emerald-900 border border-emerald-500/60 text-emerald-200 text-[11px] font-mono"
            title="Usar Poção sem gastar dado (+2 Vida)"
          >
            <img
              src="/assets/ui/icon-potion-gourd.webp"
              alt=""
              aria-hidden="true"
              className="w-4 h-4 object-contain"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = 'none';
              }}
            />
            <FlaskConical className="w-3 h-3 hidden" />
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
          className="touch-target gui-btn-gold flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold"
        >
          <Palette className="w-4 h-4" />
          <span className="hidden md:inline">{isSengoku ? 'Sengoku' : 'Vesperfall'}</span>
        </button>

        <button
          type="button"
          onClick={() => setMuted(soundEngine.toggleMute())}
          aria-label={muted ? 'Ativar áudio' : 'Silenciar áudio'}
          title={muted ? 'Ativar áudio' : 'Silenciar áudio'}
          className="touch-target gui-btn-square p-2 rounded-lg"
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
          className={`touch-target gui-btn-gold flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold ${
            isLedgerOpen ? 'ring-2 ring-amber-300' : ''
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
          className="touch-target gui-btn-square p-2 rounded-lg disabled:opacity-30 disabled:pointer-events-none"
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
          className="touch-target gui-btn-square p-2 rounded-lg disabled:opacity-30 disabled:pointer-events-none"
        >
          <RotateCw className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => {
            soundEngine.play('roll');
            confirmRound({ interactive: true });
          }}
          className={`touch-target gui-btn-crimson flex items-center gap-1.5 px-3.5 sm:px-5 py-1.5 sm:py-2 font-serif font-bold text-xs tracking-wider uppercase rounded-lg shadow-lg ${
            actionsRemaining === 0
              ? 'ring-2 ring-amber-300/80 shadow-[0_0_16px_rgba(251,191,36,0.45)]'
              : ''
          }`}
        >
          {isSengoku && (
            <span
              aria-hidden="true"
              className="w-4 h-4 rounded-sm bg-red-900 border border-amber-300/70 text-[10px] leading-none font-serif font-bold text-amber-100 flex items-center justify-center shadow-inner"
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
