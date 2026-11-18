import React, { useRef, useEffect } from 'react';
import { useGameStore } from '../../store/gameStore';
import { Scroll, Terminal } from 'lucide-react';

export const CombatLog: React.FC = () => {
  const logs = useGameStore((state) => state.logs);
  const theme = useGameStore((state) => state.theme);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const isSengoku = theme === 'sengoku';

  return (
    <div
      className={`w-full sm:w-80 max-h-36 sm:max-h-44 backdrop-blur-md border p-2.5 sm:p-3 rounded-xl shadow-2xl flex flex-col justify-between ${
        isSengoku
          ? 'bg-[#201712]/90 border-amber-900/50'
          : 'bg-dungeon-surface/90 border-dungeon-border'
      }`}
    >
      <div className="flex items-center justify-between pb-1 border-b border-stone-700/60 text-[10px] font-mono uppercase text-stone-400">
        <span className="flex items-center gap-1.5">
          <Terminal className="w-3.5 h-3.5 text-amber-400" />
          Registro de Exploração
        </span>
        <Scroll className="w-3 h-3 text-stone-500" />
      </div>

      <div className="overflow-y-auto space-y-1 my-1.5 pr-1 text-[11px] font-mono text-stone-300">
        {logs.map((log, idx) => (
          <p key={idx} className="leading-snug border-l-2 border-amber-700/60 pl-2 py-0.5">
            {log}
          </p>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
};
