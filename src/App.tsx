import { useEffect, useState } from 'react';
import { DungeonCanvas } from './components/canvas/DungeonCanvas';
import { HUD } from './components/ui/HUD';
import { EmberLedger } from './components/ui/EmberLedger';
import { DiceTray } from './components/ui/DiceTray';
import { CombatLog } from './components/ui/CombatLog';
import { BossDuelModal } from './components/ui/BossDuelModal';
import { EndGameModal } from './components/ui/EndGameModal';
import { useGameStore } from './store/gameStore';
import { soundEngine } from './audio/soundEngine';

declare global {
  interface Window {
    __APP_READY?: boolean;
  }
}

export default function App() {
  const [isLedgerOpen, setIsLedgerOpen] = useState(true);
  const [shake, setShake] = useState(false);

  const theme = useGameStore((state) => state.theme);
  const lastEventFeedback = useGameStore((state) => state.lastEventFeedback);
  const pendingBossEncounter = useGameStore((state) => state.pendingBossEncounter);
  const undo = useGameStore((state) => state.undo);
  const redo = useGameStore((state) => state.redo);
  const confirmRound = useGameStore((state) => state.confirmRound);

  // Responsive initial ledger state (closed on small mobile viewports)
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setIsLedgerOpen(false);
    }
  }, []);

  // Deterministic ?demo=&seed=&theme=&map= QA harness
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const demo = params.get('demo');
    const demoTheme = params.get('theme');
    const demoMap = Number(params.get('map') || '1');
    const demoSeed = Number(params.get('seed') || '4242');

    if (demoTheme === 'sengoku' || demoTheme === 'vesperfall') {
      useGameStore.getState().setTheme(demoTheme);
    }

    if (demo) {
      const store = useGameStore.getState();
      store.resetGame(demoSeed, Number.isFinite(demoMap) && demoMap >= 1 ? demoMap : 1);
      if (demo === 'midgame') {
        useGameStore.getState().stageLevelUp('warrior');
        useGameStore.getState().stageMove({ x: 1, y: 0 });
        setIsLedgerOpen(true);
      } else if (demo === 'victory') {
        for (let r = 1; r <= 8; r++) {
          useGameStore.getState().confirmRound();
        }
      }
    }

    let raf2 = 0;
    const raf1 = window.requestAnimationFrame(() => {
      raf2 = window.requestAnimationFrame(() => {
        window.__APP_READY = true;
      });
    });

    return () => {
      window.cancelAnimationFrame(raf1);
      window.cancelAnimationFrame(raf2);
    };
  }, []);

  // Audio + Screen Shake juice on feedback
  useEffect(() => {
    if (!lastEventFeedback) return;
    if (lastEventFeedback.tone === 'damage') {
      soundEngine.play('trap');
      const reduced =
        typeof window !== 'undefined' &&
        window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
      if (!reduced) {
        setShake(true);
        const timer = window.setTimeout(() => setShake(false), 320);
        return () => window.clearTimeout(timer);
      }
    } else if (lastEventFeedback.tone === 'glory') {
      soundEngine.play('sword');
    } else if (lastEventFeedback.tone === 'heal') {
      soundEngine.play('potion');
    }
  }, [lastEventFeedback]);

  // Keyboard shortcuts
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (pendingBossEncounter) return;
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (
        tag === 'INPUT' ||
        tag === 'SELECT' ||
        tag === 'TEXTAREA' ||
        tag === 'BUTTON' ||
        tag === 'A'
      ) {
        return;
      }
      if (e.key.toLowerCase() === 'z') undo();
      else if (e.key.toLowerCase() === 'y') redo();
      else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        confirmRound({ interactive: true });
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [undo, redo, confirmRound, pendingBossEncounter]);

  return (
    <main
      data-theme={theme}
      className={`w-full min-h-screen min-h-[100dvh] h-[100dvh] overflow-hidden relative select-none flex flex-col justify-between pt-[env(safe-area-inset-top,0px)] pb-[env(safe-area-inset-bottom,0px)] ${
        theme === 'sengoku' ? 'bg-[#141822]' : 'bg-[#182030]'
      } ${shake ? 'animate-shake' : ''}`}
    >
      <div className="absolute inset-0 z-0">
        <DungeonCanvas isLedgerOpen={isLedgerOpen} />
      </div>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-[1] bg-[radial-gradient(circle_at_center,transparent_58%,rgba(0,0,0,0.28)_100%)]"
      />

      <HUD
        isLedgerOpen={isLedgerOpen}
        onToggleLedger={() => setIsLedgerOpen((prev) => !prev)}
      />

      <EmberLedger
        isOpen={isLedgerOpen}
        onClose={() => setIsLedgerOpen(false)}
      />

      {lastEventFeedback && (
        <div
          aria-live="polite"
          className={`pointer-events-none fixed top-[6.75rem] left-1/2 ${
            isLedgerOpen ? 'lg:left-[calc(50%+11rem)]' : ''
          } -translate-x-1/2 z-30 px-3.5 py-1 rounded-full text-xs font-mono border shadow-lg backdrop-blur-md transition-[left] duration-200 ${
            lastEventFeedback.tone === 'damage'
              ? 'bg-red-950/90 border-red-500/60 text-red-200'
              : lastEventFeedback.tone === 'glory'
                ? 'bg-amber-950/90 border-amber-400/60 text-amber-200'
                : lastEventFeedback.tone === 'heal'
                  ? 'bg-emerald-950/90 border-emerald-400/60 text-emerald-200'
                  : 'bg-stone-900/90 border-stone-600 text-stone-200'
          }`}
        >
          {lastEventFeedback.text}
        </div>
      )}

      <footer
        className={`w-full flex flex-col sm:flex-row items-center sm:items-end justify-between gap-2 px-3 sm:px-6 ${
          isLedgerOpen ? 'lg:pl-[23rem]' : ''
        } pb-3 sm:pb-5 z-20 pointer-events-none transition-[padding] duration-200`}
      >
        <div
          className={`hidden lg:block pointer-events-auto backdrop-blur-sm border px-3 py-2 rounded-lg text-[11px] font-mono ${
            theme === 'sengoku'
              ? 'bg-[#1a120d]/90 border-amber-800/60 text-amber-200/80'
              : 'bg-stone-950/80 border-stone-700/70 text-stone-400'
          }`}
        >
          Clique nas lajes iluminadas para mover • Selecione até 3 dados
        </div>

        <div className="pointer-events-auto w-full sm:w-auto flex justify-center">
          <DiceTray />
        </div>

        <div className="pointer-events-auto w-full sm:w-auto">
          <CombatLog />
        </div>
      </footer>

      <BossDuelModal />
      <EndGameModal />
    </main>
  );
}
