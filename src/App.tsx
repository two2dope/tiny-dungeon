import React from 'react';
import { DungeonCanvas } from './components/canvas/DungeonCanvas';

export default function App() {
  return (
    <main className="w-screen h-screen bg-dungeon-darkest overflow-hidden relative select-none">
      {/* 3D Isometric Dungeon Viewport */}
      <div className="absolute inset-0 z-0">
        <DungeonCanvas />
      </div>

      {/* Placeholder Top Banner (to be replaced in Task 8 by HUD) */}
      <header className="absolute top-4 left-6 z-10 pointer-events-none">
        <h1 className="font-serif text-2xl text-dungeon-gold tracking-widest uppercase drop-shadow-md">
          Tiny Dungeon
        </h1>
        <p className="text-stone-400 font-mono text-xs tracking-wider">
          The Ember Measure
        </p>
      </header>
    </main>
  );
}
