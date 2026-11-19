import React, { useEffect, useRef, useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { getCombatPowerBreakdown } from '../../engine/combat';
import { resolveVillainStandeeKind, STANDEE_ASSET_URLS } from '../../engine/standeeManifest';
import { soundEngine } from '../../audio/soundEngine';
import { RotateCcw, ShieldAlert, Skull, Sword } from 'lucide-react';

export const BossDuelModal: React.FC = () => {
  const villain = useGameStore((state) => state.pendingBossEncounter);
  const party = useGameStore((state) => state.party);
  const theme = useGameStore((state) => state.theme);
  const resolvePendingBoss = useGameStore((state) => state.resolvePendingBoss);
  const cancelPendingBoss = useGameStore((state) => state.cancelPendingBoss);

  const [thumbFailed, setThumbFailed] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const primaryBtnRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    setThumbFailed(false);
  }, [villain?.id]);

  useEffect(() => {
    if (!villain || typeof document === 'undefined') return;
    previousFocusRef.current = document.activeElement as HTMLElement | null;
    primaryBtnRef.current?.focus();

    return () => {
      previousFocusRef.current?.focus?.();
    };
  }, [villain]);

  if (!villain) return null;

  const isSengoku = theme === 'sengoku';
  const breakdown = getCombatPowerBreakdown(party);
  const relicBonus = breakdown.katanaBonus + breakdown.sealBonus;
  const activeTier: 1 | 2 | 'defeat' =
    breakdown.bossPower >= villain.tier1Power
      ? 1
      : breakdown.bossPower >= villain.tier2Power
        ? 2
        : 'defeat';

  const thumbUrl = STANDEE_ASSET_URLS[resolveVillainStandeeKind(villain.id)];

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      soundEngine.play('click');
      cancelPendingBoss();
      return;
    }

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
      aria-labelledby="boss-duel-title"
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
        <div
          className={`flex items-center gap-4 pb-4 border-b ${
            isSengoku ? 'border-amber-800/50' : 'border-slate-800'
          }`}
        >
          <div
            className={`w-20 h-20 rounded-xl border-2 flex items-center justify-center overflow-hidden shrink-0 shadow-lg bg-[radial-gradient(circle,rgba(255,255,255,0.06)_0%,rgba(0,0,0,0.92)_100%)] ${
              isSengoku ? 'border-amber-500/70' : 'border-sky-500/60'
            }`}
          >
            {!thumbFailed ? (
              <img
                src={thumbUrl}
                alt={villain.name}
                onError={() => setThumbFailed(true)}
                className="w-full h-full object-contain p-1"
              />
            ) : (
              <Skull className="w-10 h-10 text-red-400" />
            )}
          </div>

          <div className="min-w-0">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-red-950/90 border border-red-500/60 text-[10px] font-mono uppercase font-bold text-red-200">
              <ShieldAlert className="w-3 h-3" />
              Confronto da Rodada {villain.round}
            </span>
            <h2
              id="boss-duel-title"
              className={`font-serif text-xl sm:text-2xl font-bold tracking-wide mt-1 truncate ${
                isSengoku ? 'text-amber-100' : 'text-slate-100'
              }`}
            >
              {villain.name}
            </h2>
            <p className={`text-xs font-mono mt-0.5 ${isSengoku ? 'text-amber-200/75' : 'text-slate-400'}`}>
              Compare o poder da comitiva e decida o destino do duelo.
            </p>
          </div>
        </div>

        {/* Party Power Summary */}
        <div
          className={`my-4 p-3 rounded-xl border flex items-center justify-between tabular-nums ${
            isSengoku
              ? 'bg-[#110a07]/90 border-amber-700/50'
              : 'bg-slate-900/90 border-slate-700/80'
          }`}
        >
          <div>
            <span
              className={`text-[10px] font-mono uppercase block ${
                isSengoku ? 'text-amber-200/70' : 'text-slate-400'
              }`}
            >
              Poder contra Chefe
            </span>
            <span
              className={`font-serif text-3xl font-black leading-tight ${
                isSengoku ? 'text-amber-200' : 'text-sky-200'
              }`}
            >
              {breakdown.bossPower}
            </span>
            {relicBonus > 0 && (
              <span className="text-[11px] font-mono text-emerald-300 block">
                Heróis {breakdown.heroLevels}
                {breakdown.katanaBonus > 0 ? ` + Katana +${breakdown.katanaBonus}` : ''}
                {breakdown.sealBonus > 0 ? ` + Selo +${breakdown.sealBonus}` : ''}
              </span>
            )}
          </div>
          <div className="text-right">
            <span
              className={`text-[10px] font-mono uppercase block ${
                isSengoku ? 'text-amber-200/70' : 'text-slate-400'
              }`}
            >
              Desfecho Atual
            </span>
            <span
              className={`font-serif text-sm font-bold px-2.5 py-1 rounded border inline-block mt-1 ${
                activeTier === 1
                  ? 'bg-emerald-950/90 border-emerald-400 text-emerald-200'
                  : activeTier === 2
                    ? 'bg-amber-950/90 border-amber-400 text-amber-200'
                    : 'bg-red-950/90 border-red-400 text-red-200'
              }`}
            >
              {activeTier === 1
                ? 'Vitória Heroica'
                : activeTier === 2
                  ? 'Vitória Padrão'
                  : 'Risco de Derrota'}
            </span>
          </div>
        </div>

        {/* Villain Power Tiers */}
        <div className="space-y-2 text-xs font-mono mb-5 tabular-nums">
          <div
            className={`flex items-center justify-between p-2.5 rounded-lg border ${
              activeTier === 1
                ? 'bg-emerald-950/75 border-emerald-400 text-emerald-100 ring-1 ring-emerald-400/50'
                : 'bg-stone-950/60 border-stone-800 text-stone-400'
            }`}
          >
            <span>Vitória Heroica (Poder ≥ {villain.tier1Power})</span>
            <strong className="text-emerald-300">+{villain.tier1Glory} Glória • 0 Dano</strong>
          </div>

          <div
            className={`flex items-center justify-between p-2.5 rounded-lg border ${
              activeTier === 2
                ? 'bg-amber-950/75 border-amber-400 text-amber-100 ring-1 ring-amber-400/50'
                : 'bg-stone-950/60 border-stone-800 text-stone-400'
            }`}
          >
            <span>Vitória Padrão (Poder ≥ {villain.tier2Power})</span>
            <strong className="text-amber-300">+{villain.tier2Glory} Glória • 0 Dano</strong>
          </div>

          <div
            className={`flex items-center justify-between p-2.5 rounded-lg border ${
              activeTier === 'defeat'
                ? 'bg-red-950/80 border-red-400 text-red-100 ring-1 ring-red-400/50'
                : 'bg-stone-950/60 border-stone-800 text-stone-400'
            }`}
          >
            <span>Derrota (Poder &lt; {villain.tier2Power})</span>
            <strong className="text-red-300">-{villain.defeatDamage} Vida • Chefe Vitorioso</strong>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <button
            ref={primaryBtnRef}
            type="button"
            onClick={() => {
              soundEngine.play('sword');
              resolvePendingBoss('fight');
            }}
            className="touch-target gui-btn-crimson flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl font-serif font-bold text-xs uppercase tracking-wider shadow-lg"
          >
            <Sword className="w-4 h-4" />
            Enfrentar Chefe
          </button>

          <button
            type="button"
            onClick={() => {
              soundEngine.play('click');
              resolvePendingBoss('flee');
            }}
            className="touch-target gui-btn-gold flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl font-mono font-bold text-xs uppercase"
          >
            Recuar / Fugir (-1 ♥)
          </button>
        </div>

        <button
          type="button"
          onClick={() => {
            soundEngine.play('click');
            cancelPendingBoss();
          }}
          className={`touch-target mt-2.5 w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border text-xs font-mono transition-colors ${
            isSengoku
              ? 'border-amber-800/50 text-amber-200/85 hover:bg-amber-950/40'
              : 'border-slate-700 text-slate-300 hover:bg-slate-900'
          }`}
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Voltar à Rodada (Esc)
        </button>
      </div>
    </div>
  );
};
