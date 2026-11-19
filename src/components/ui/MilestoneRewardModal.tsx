import React, { useEffect, useRef, useState } from 'react';
import { RewardChoice, useGameStore } from '../../store/gameStore';
import { HeroClass, RelicId } from '../../engine/types';
import { getFilledSlotCount, isRelicCompleted, RELIC_CATALOG } from '../../engine/relics';
import { soundEngine } from '../../audio/soundEngine';
import { HeroCrestSvg } from './TacticalIcons';
import { Award, Gem, Sparkles, Plus } from 'lucide-react';

const HERO_LIST: { classType: HeroClass; label: string }[] = [
  { classType: 'warrior', label: 'Guerreiro' },
  { classType: 'mage', label: 'Mago' },
  { classType: 'cleric', label: 'Clérigo' },
  { classType: 'rogue', label: 'Ladino' },
];

export const MilestoneRewardModal: React.FC = () => {
  const pendingRewards = useGameStore((state) => state.pendingRewards);
  const pendingBossEncounter = useGameStore((state) => state.pendingBossEncounter);
  const party = useGameStore((state) => state.party);
  const theme = useGameStore((state) => state.theme);
  const resolvePendingReward = useGameStore((state) => state.resolvePendingReward);

  const [anyTab, setAnyTab] = useState<'hero' | 'relic' | 'gems'>('hero');
  const dialogRef = useRef<HTMLDivElement>(null);
  const firstFocusRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const activeReward = pendingRewards[0];

  useEffect(() => {
    setAnyTab('hero');
  }, [activeReward?.id]);

  useEffect(() => {
    if (!activeReward || pendingBossEncounter || typeof document === 'undefined') return;
    previousFocusRef.current = document.activeElement as HTMLElement | null;
    firstFocusRef.current?.focus();

    return () => {
      previousFocusRef.current?.focus?.();
    };
  }, [activeReward, pendingBossEncounter]);

  if (!activeReward || pendingBossEncounter) return null;

  const isSengoku = theme === 'sengoku';
  const showHeroSection =
    activeReward.kind === 'choose-hero-level' ||
    (activeReward.kind === 'choose-any' && anyTab === 'hero');
  const showRelicSection =
    activeReward.kind === 'choose-relic-step' ||
    (activeReward.kind === 'choose-any' && anyTab === 'relic');
  const showGemSection = activeReward.kind === 'choose-any' && anyTab === 'gems';

  const incompleteRelics = RELIC_CATALOG.filter((r) => !isRelicCompleted(party, r.id));
  const anyHeroCanLevel = HERO_LIST.some(
    (h) => party.heroes[h.classType].level < party.heroes[h.classType].maxLevel
  );

  const applyChoice = (choice: RewardChoice) => {
    soundEngine.play('levelup');
    resolvePendingReward(choice);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Tab' && dialogRef.current) {
      const focusables = dialogRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'
      );
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="milestone-reward-title"
      onKeyDown={handleKeyDown}
      className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50"
    >
      <div
        ref={dialogRef}
        className={`w-full max-w-md rounded-2xl p-5 sm:p-6 shadow-[0_0_50px_rgba(0,0,0,0.85)] border-2 relative ${
          isSengoku
            ? 'bg-gradient-to-b from-[#251711] to-[#140d0a] border-[#b9893d] text-amber-50'
            : 'bg-slate-950/95 border-sky-700/50 text-slate-100'
        }`}
      >
        <div className="flex items-center justify-between gap-2 mb-2">
          <span
            className={`text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded border ${
              isSengoku
                ? 'bg-amber-950/80 border-amber-600/60 text-amber-300'
                : 'bg-sky-950/80 border-sky-600/60 text-sky-300'
            }`}
          >
            {pendingRewards.length > 1
              ? `Recompensa 1 de ${pendingRewards.length}`
              : 'Recompensa de Marco'}
          </span>
          <Award className={`w-5 h-5 ${isSengoku ? 'text-amber-400' : 'text-sky-400'}`} />
        </div>

        <h2
          id="milestone-reward-title"
          className="font-serif text-lg font-bold leading-snug text-amber-100 mb-3"
        >
          {activeReward.title}
        </h2>

        {activeReward.kind === 'choose-any' && (
          <div className="grid grid-cols-3 gap-1.5 mb-3">
            <button
              ref={firstFocusRef}
              type="button"
              onClick={() => setAnyTab('hero')}
              className={`touch-target py-1.5 px-2 rounded-lg border text-[11px] font-mono font-bold flex items-center justify-center gap-1 ${
                anyTab === 'hero'
                  ? 'bg-amber-700/40 border-amber-400 text-amber-100'
                  : 'bg-black/30 border-stone-700 text-stone-300'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              Herói
            </button>
            <button
              type="button"
              onClick={() => setAnyTab('relic')}
              className={`touch-target py-1.5 px-2 rounded-lg border text-[11px] font-mono font-bold flex items-center justify-center gap-1 ${
                anyTab === 'relic'
                  ? 'bg-amber-700/40 border-amber-400 text-amber-100'
                  : 'bg-black/30 border-stone-700 text-stone-300'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              Forja
            </button>
            <button
              type="button"
              onClick={() => setAnyTab('gems')}
              className={`touch-target py-1.5 px-2 rounded-lg border text-[11px] font-mono font-bold flex items-center justify-center gap-1 ${
                anyTab === 'gems'
                  ? 'bg-emerald-700/40 border-emerald-400 text-emerald-100'
                  : 'bg-black/30 border-stone-700 text-stone-300'
              }`}
            >
              <Gem className="w-3.5 h-3.5" />
              +2 Gemas
            </button>
          </div>
        )}

        {showHeroSection && (
          <div className="space-y-2">
            <p className="text-xs font-mono opacity-80">
              Escolha um herói para receber +1 Nível imediatamente:
            </p>
            <div className="grid grid-cols-2 gap-2">
              {HERO_LIST.map((hero, idx) => {
                const state = party.heroes[hero.classType];
                const maxed = state.level >= state.maxLevel;
                return (
                  <button
                    key={hero.classType}
                    ref={idx === 0 && activeReward.kind !== 'choose-any' ? firstFocusRef : undefined}
                    type="button"
                    disabled={maxed}
                    onClick={() => applyChoice({ type: 'hero-level', classType: hero.classType })}
                    className={`touch-target p-2.5 rounded-xl border flex items-center gap-2.5 text-left transition-all disabled:opacity-45 disabled:pointer-events-none ${
                      isSengoku
                        ? 'bg-[#1a110c] border-amber-700/60 hover:border-amber-400'
                        : 'bg-slate-900 border-sky-700/50 hover:border-sky-400'
                    }`}
                  >
                    <HeroCrestSvg classType={hero.classType} className="w-8 h-8" />
                    <div>
                      <div className="font-serif text-sm font-bold">{hero.label}</div>
                      <div className="text-[11px] font-mono text-amber-300">
                        {maxed ? 'Nível Máx.' : `Nv.${state.level} → Nv.${state.level + 1}`}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
            {!anyHeroCanLevel && (
              <button
                type="button"
                onClick={() => applyChoice({ type: 'mastery-fallback' })}
                className="touch-target w-full gui-btn-gold py-2 rounded-xl text-xs font-mono font-bold uppercase"
              >
                Todos no nível máximo — Receber +2 Maestria
              </button>
            )}
          </div>
        )}

        {showRelicSection && (
          <div className="space-y-2">
            <p className="text-xs font-mono opacity-80">
              Escolha uma relíquia para preencher 1 casa da receita gratuitamente:
            </p>
            <div className="max-h-64 overflow-y-auto space-y-1.5 pr-1">
              {incompleteRelics.map((relic, idx) => {
                const filled = getFilledSlotCount(party, relic.id);
                const total = relic.recipe.length;
                return (
                  <button
                    key={relic.id}
                    ref={idx === 0 && activeReward.kind !== 'choose-any' ? firstFocusRef : undefined}
                    type="button"
                    onClick={() => applyChoice({ type: 'relic-step', relicId: relic.id as RelicId })}
                    className={`touch-target w-full p-2 rounded-xl border flex items-center justify-between gap-2 text-left transition-all ${
                      isSengoku
                        ? 'bg-[#1a110c] border-amber-700/60 hover:border-amber-400'
                        : 'bg-slate-900 border-sky-700/50 hover:border-sky-400'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img
                        src={relic.iconUrl}
                        alt={relic.name}
                        className="w-8 h-8 object-contain shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="font-serif text-xs font-bold truncate">{relic.name}</div>
                        <div className="text-[10px] font-mono opacity-80 truncate">
                          {relic.shortBonus}
                        </div>
                      </div>
                    </div>
                    <span className="shrink-0 text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 border border-emerald-500/60 text-emerald-200">
                      {filled + 1}/{total}
                    </span>
                  </button>
                );
              })}
            </div>
            {incompleteRelics.length === 0 && (
              <button
                type="button"
                onClick={() => applyChoice({ type: 'mastery-fallback' })}
                className="touch-target w-full gui-btn-gold py-2 rounded-xl text-xs font-mono font-bold uppercase"
              >
                Todas as 8 relíquias completas — Receber +2 Maestria
              </button>
            )}
          </div>
        )}

        {showGemSection && (
          <div className="space-y-3 text-center py-2">
            <p className="text-xs font-mono opacity-85">
              Adicione +2 Gemas imediatamente à sua trilha de gemas (podendo ativar novos marcos!).
            </p>
            <button
              type="button"
              onClick={() => applyChoice({ type: 'gems', count: 2 })}
              className="touch-target w-full gui-btn-crimson py-2.5 px-4 rounded-xl font-serif font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2"
            >
              <Gem className="w-4 h-4" />
              Coletar +2 Gemas
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
