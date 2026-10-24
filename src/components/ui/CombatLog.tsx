import React, { useRef, useEffect } from 'react';
import { useGameStore } from '../../store/gameStore';
import { Scroll, Terminal } from 'lucide-react';

export const CombatLog: React.FC = () => {
  const logs = useGameStore((state) => state.logs);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <div className="w-80 max-h-48 bg-dungeon-surface/90 backdrop-blur-md border border-dungeon-border p-3 rounded-xl shadow-2xl flex flex-col justify-between">
      <div className="flex items-center gap-1.5 pb-1.5 border-b border-dungeon-border text-[11px] font-mono uppercase text-stone-400">
        <Terminal className="w-3.5 h-3.5 text-dungeon-copper" />
        <span>Registro de Exploração</span>
      </div>

      <div className="overflow-y-auto space-y-1 my-2 pr-1 text-xs font-mono text-stone-300">
        {logs.map((log, idx) => (
          <p key={idx} className="leading-relaxed border-l-2 border-stone-700 pl-2 py-0.5">
            {log}
          </p>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="pt-1 text-[10px] font-mono text-stone-500 flex items-center justify-between">
        <span>Histórico Ativo</span>
        <Scroll className="w-3 h-3 text-stone-600" />
      </div>
    </div>
  );
};
