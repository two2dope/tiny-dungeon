import React, { useRef, useEffect } from 'react';
import { useGameStore } from '../../store/gameStore';
import { Scroll, Terminal } from 'lucide-react';

export const CombatLog: React.FC = () => {
  const logs = useGameStore((state) => state.logs);
  const theme = useGameStore((state) => state.theme);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView?.({ behavior: 'smooth' });
  }, [logs]);

  const isSengoku = theme === 'sengoku';

  return (
    <div
      className={
        isSengoku
          ? 'gui-scroll-log w-full sm:w-72 h-48 drop-shadow-2xl flex flex-col justify-between'
          : 'w-full sm:w-80 max-h-36 sm:max-h-44 backdrop-blur-md border p-2.5 sm:p-3 rounded-xl shadow-2xl flex flex-col justify-between bg-dungeon-surface/90 border-dungeon-border'
      }
    >
      <div
        className={`flex items-center justify-between pb-1 border-b text-[10px] font-serif uppercase font-bold tracking-wider ${
          isSengoku
            ? 'px-1.5 pt-0.5 border-amber-900/35 text-[#2d1a0d]'
            : 'border-stone-700/60 font-mono text-stone-400'
        }`}
      >
        <span className="flex items-center gap-1.5">
          <Terminal className={`w-3.5 h-3.5 ${isSengoku ? 'text-red-800' : 'text-amber-400'}`} />
          Registro de Exploração
        </span>
        <Scroll className={`w-3 h-3 ${isSengoku ? 'text-amber-900' : 'text-stone-500'}`} />
      </div>

      <div
        role="log"
        aria-live="polite"
        aria-relevant="additions"
        className={`overflow-y-auto overflow-x-hidden no-scrollbar space-y-1 my-1 pr-1 text-[11px] font-mono select-text ${
          isSengoku ? 'px-1.5 py-0.5 text-[#24160d] font-medium' : 'text-stone-300'
        }`}
      >
        {logs.map((log, idx) => (
          <p
            key={idx}
            className={`leading-snug border-l-2 pl-2 py-0.5 ${
              isSengoku ? 'border-red-900/50' : 'border-amber-700/60'
            }`}
          >
            {log}
          </p>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
};
