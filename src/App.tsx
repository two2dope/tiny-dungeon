import React, { useState } from 'react';
import { DungeonCanvas } from './components/canvas/DungeonCanvas';
import { HUD } from './components/ui/HUD';
import { EmberLedger } from './components/ui/EmberLedger';
import { DiceTray } from './components/ui/DiceTray';
import { CombatLog } from './components/ui/CombatLog';
import { EndGameModal } from './components/ui/EndGameModal';

export default function App() {
  const [isLedgerOpen, setIsLedgerOpen] = useState(false);

  return (
    <main className="w-screen h-screen bg-dungeon-darkest overflow-hidden relative select-none flex flex-col justify-between">
      {/* 3D Isometric Dungeon Viewport */}
      <div className="absolute inset-0 z-0">
        <DungeonCanvas />
      </div>

      {/* Top HUD */}
      <HUD
        isLedgerOpen={isLedgerOpen}
        onToggleLedger={() => setIsLedgerOpen((prev) => !prev)}
      />

      {/* Hero Ledger Drawer */}
      <EmberLedger
        isOpen={isLedgerOpen}
        onClose={() => setIsLedgerOpen(false)}
      />

      {/* Bottom Controls & Event Log Overlay */}
      <footer className="w-full flex items-end justify-between px-6 pb-6 z-20 pointer-events-none">
        {/* Left spacer / quick hint */}
        <div className="pointer-events-auto bg-dungeon-surface/80 backdrop-blur-sm border border-dungeon-border px-3 py-2 rounded-lg text-[11px] font-mono text-stone-400">
          Clique nos blocos iluminados para mover • Rolar / Selecionar 3 dados
        </div>

        {/* Center: Interactive Dice Selection Tray */}
        <div className="pointer-events-auto">
          <DiceTray />
        </div>

        {/* Right: Narrative Combat & Exploration Log */}
        <div className="pointer-events-auto">
          <CombatLog />
        </div>
      </footer>

      {/* End Game Glory Certificate Modal */}
      <EndGameModal />
    </main>
  );
}
