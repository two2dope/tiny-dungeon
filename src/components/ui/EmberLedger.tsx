import React from 'react';
import { useGameStore } from '../../store/gameStore';
import { HeroClass } from '../../engine/types';
import {
  Sword,
  Wand2,
  Shield,
  KeyRound,
  FlaskConical,
  Sparkles,
  Gem,
  Plus,
  X,
} from 'lucide-react';
import { calculatePartyPower } from '../../engine/combat';

interface EmberLedgerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EmberLedger: React.FC<EmberLedgerProps> = ({ isOpen, onClose }) => {
  const party = useGameStore((state) => state.party);
  const stageLevelUp = useGameStore((state) => state.stageLevelUp);
  const stageBrewPotion = useGameStore((state) => state.stageBrewPotion);
  const stageCraftItem = useGameStore((state) => state.stageCraftItem);
  const minionsDefeatedCount = useGameStore((state) => state.minionsDefeatedCount);
  const minionsGlory = useGameStore((state) => state.minionsGlory);

  if (!isOpen) return null;

  const totalPower = calculatePartyPower(party);

  const heroList: {
    classType: HeroClass;
    name: string;
    role: string;
    icon: React.ReactNode;
    color: string;
  }[] = [
    {
      classType: 'warrior',
      name: 'Guerreiro',
      role: 'Vanguarda & Combate Brutal',
      icon: <Sword className="w-5 h-5 text-orange-400" />,
      color: 'border-orange-500/30 bg-orange-950/10',
    },
    {
      classType: 'mage',
      name: 'Mago',
      role: 'Arcanista & Manipulação Elemental',
      icon: <Wand2 className="w-5 h-5 text-purple-400" />,
      color: 'border-purple-500/30 bg-purple-950/10',
    },
    {
      classType: 'cleric',
      name: 'Clérigo',
      role: 'Proteção Divina & Purificação',
      icon: <Shield className="w-5 h-5 text-sky-400" />,
      color: 'border-sky-500/30 bg-sky-950/10',
    },
    {
      classType: 'rogue',
      name: 'Ladino',
      role: 'Furtividade, Desarme & Chaves',
      icon: <KeyRound className="w-5 h-5 text-emerald-400" />,
      color: 'border-emerald-500/30 bg-emerald-950/10',
    },
  ];

  return (
    <div className="fixed inset-y-0 left-0 w-96 bg-dungeon-bg/95 backdrop-blur-xl border-r border-dungeon-border p-6 shadow-2xl z-30 flex flex-col justify-between overflow-y-auto">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-dungeon-border">
          <div>
            <h2 className="font-serif text-xl text-dungeon-gold tracking-wider uppercase font-bold">
              The Ember Measure
            </h2>
            <p className="text-stone-400 text-xs font-mono">
              Grimório do Grupo & Poder Bélico
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-100 hover:bg-stone-800/60"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Total Party Power Bar */}
        <div className="my-5 p-3 rounded-lg bg-dungeon-surface border border-dungeon-border flex items-center justify-between">
          <span className="text-xs font-mono uppercase text-stone-300">
            Poder Bélico Total
          </span>
          <span className="font-serif text-2xl font-bold text-dungeon-flame">
            {totalPower}
          </span>
        </div>

        {/* Heroes Progression Tracks */}
        <div className="space-y-3">
          {heroList.map((hero) => {
            const heroState = party.heroes[hero.classType];
            const isMax = heroState.level >= heroState.maxLevel;

            return (
              <div
                key={hero.classType}
                className={`p-3.5 rounded-xl border ${hero.color} flex flex-col gap-2`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    {hero.icon}
                    <div>
                      <h3 className="font-serif text-sm font-semibold text-stone-200">
                        {hero.name}
                      </h3>
                      <p className="text-[10px] text-stone-400 font-mono">
                        Nível {heroState.level} / {heroState.maxLevel}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => stageLevelUp(hero.classType)}
                    disabled={isMax}
                    className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-mono bg-stone-800 hover:bg-stone-700 text-stone-200 rounded border border-stone-600 disabled:opacity-30 disabled:pointer-events-none transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Subir Nível
                  </button>
                </div>

                {/* Level Pips */}
                <div className="flex items-center gap-1.5 mt-1">
                  {Array.from({ length: heroState.maxLevel }).map((_, idx) => (
                    <div
                      key={idx}
                      className={`h-2 flex-1 rounded-sm transition-all ${
                        idx < heroState.level
                          ? 'bg-dungeon-copper shadow-[0_0_6px_rgba(200,125,85,0.6)]'
                          : 'bg-stone-800'
                      }`}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Alchemical Arts & Reliquary */}
        <div className="mt-6 pt-5 border-t border-dungeon-border space-y-3">
          <h4 className="text-xs font-mono uppercase tracking-widest text-stone-400">
            Alquimia & Tesouros
          </h4>

          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
            {/* Potions */}
            <div className="p-3 rounded-lg bg-dungeon-surface border border-dungeon-border flex flex-col justify-between">
              <div className="flex items-center gap-2 text-stone-300">
                <FlaskConical className="w-4 h-4 text-emerald-400" />
                <span>Poções: {party.potions}</span>
              </div>
              <button
                onClick={stageBrewPotion}
                className="mt-2 text-[10px] bg-stone-800 hover:bg-stone-700 p-1 rounded border border-stone-600 text-stone-200"
              >
                + Destilar Poção
              </button>
            </div>

            {/* Artifacts */}
            <div className="p-3 rounded-lg bg-dungeon-surface border border-dungeon-border flex flex-col justify-between">
              <div className="flex items-center gap-2 text-stone-300">
                <Sparkles className="w-4 h-4 text-dungeon-gold" />
                <span>Artefatos: {party.magicItems}</span>
              </div>
              <button
                onClick={stageCraftItem}
                className="mt-2 text-[10px] bg-stone-800 hover:bg-stone-700 p-1 rounded border border-stone-600 text-stone-200"
              >
                + Forjar Item
              </button>
            </div>
          </div>

          {/* Gems & Minions summary */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-dungeon-surface border border-dungeon-border text-xs font-mono text-stone-300">
            <div className="flex items-center gap-2">
              <Gem className="w-4 h-4 text-cyan-400" />
              <span>Gemas: {party.gems} (+{party.gems * 2} pts)</span>
            </div>
            <span>Monstros: {minionsDefeatedCount} (+{minionsGlory} pts)</span>
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-dungeon-border text-center text-[10px] font-mono text-stone-500">
        Inspirado em Paper Dungeons & Vesperfall
      </div>
    </div>
  );
};
