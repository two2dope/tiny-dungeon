import React from 'react';
import { useGameStore } from '../../store/gameStore';
import { HeroClass } from '../../engine/types';
import { HERO_CLOAK_AFFINITY } from '../../engine/heroes';
import { calculatePartyPower } from '../../engine/combat';
import { soundEngine } from '../../audio/soundEngine';
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
  CheckCircle2,
} from 'lucide-react';

interface EmberLedgerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EmberLedger: React.FC<EmberLedgerProps> = ({ isOpen, onClose }) => {
  const party = useGameStore((state) => state.party);
  const theme = useGameStore((state) => state.theme);
  const consumedDieIds = useGameStore((state) => state.consumedDieIds);
  const masteryGlory = useGameStore((state) => state.masteryGlory);
  const missions = useGameStore((state) => state.missions);
  const stageLevelUp = useGameStore((state) => state.stageLevelUp);
  const stageBrewPotion = useGameStore((state) => state.stageBrewPotion);
  const stageUsePotion = useGameStore((state) => state.stageUsePotion);
  const stageCraftItem = useGameStore((state) => state.stageCraftItem);
  const minionsDefeatedCount = useGameStore((state) => state.minionsDefeatedCount);
  const minionsGlory = useGameStore((state) => state.minionsGlory);

  if (!isOpen) return null;

  const totalPower = calculatePartyPower(party);
  const actionsRemaining = Math.max(0, 3 - consumedDieIds.length);
  const isSengoku = theme === 'sengoku';

  const heroList: {
    classType: HeroClass;
    name: string;
    role: string;
    icon: React.ReactNode;
    accent: string;
  }[] = [
    {
      classType: 'warrior',
      name: 'Guerreiro',
      role: 'Espada • Manto Branco',
      icon: <Sword className="w-4 h-4 text-orange-500" />,
      accent: isSengoku ? 'border-amber-900/40 bg-amber-950/10' : 'border-orange-500/30 bg-orange-950/10',
    },
    {
      classType: 'mage',
      name: 'Mago',
      role: 'Cajado • Manto Preto',
      icon: <Wand2 className="w-4 h-4 text-purple-500" />,
      accent: isSengoku ? 'border-stone-700/40 bg-stone-900/10' : 'border-purple-500/30 bg-purple-950/10',
    },
    {
      classType: 'cleric',
      name: 'Clérigo',
      role: 'Escudo • Manto Branco',
      icon: <Shield className="w-4 h-4 text-sky-500" />,
      accent: isSengoku ? 'border-amber-900/40 bg-amber-950/10' : 'border-sky-500/30 bg-sky-950/10',
    },
    {
      classType: 'rogue',
      name: 'Ladino',
      role: 'Chave • Manto Preto',
      icon: <KeyRound className="w-4 h-4 text-emerald-600" />,
      accent: isSengoku ? 'border-stone-700/40 bg-stone-900/10' : 'border-emerald-500/30 bg-emerald-950/10',
    },
  ];

  const surfaceCls = isSengoku
    ? 'bg-[#e8dac0]/95 text-stone-900 border-amber-950/60'
    : 'bg-dungeon-bg/95 text-stone-200 border-dungeon-border';

  const cardCls = isSengoku
    ? 'bg-[#dcc9a6]/90 border-amber-900/30 text-stone-900'
    : 'bg-dungeon-surface border-dungeon-border text-stone-200';

  const btnCls = isSengoku
    ? 'bg-stone-900 hover:bg-stone-800 text-amber-100 border-amber-900/60'
    : 'bg-stone-800 hover:bg-stone-700 text-stone-200 border-stone-600';

  return (
    <aside
      aria-label="The Ember Measure — Comitiva e Missões"
      className={`fixed inset-y-0 left-0 w-[min(22rem,92vw)] backdrop-blur-xl border-r p-4 sm:p-5 shadow-2xl z-40 flex flex-col justify-between overflow-y-auto ${surfaceCls}`}
    >
      <div className="space-y-4">
        <div className={`flex items-center justify-between pb-3 border-b ${isSengoku ? 'border-amber-900/40' : 'border-dungeon-border'}`}>
          <div>
            <h2 className={`font-serif text-lg tracking-wider uppercase font-bold ${isSengoku ? 'text-stone-900' : 'text-dungeon-gold'}`}>
              The Ember Measure
            </h2>
            <p className={`text-[11px] font-mono ${isSengoku ? 'text-stone-700' : 'text-stone-400'}`}>
              Ações restantes: <strong className="tabular-nums">{actionsRemaining}/3</strong>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar Grimório"
            className="touch-target p-1.5 rounded-lg opacity-80 hover:opacity-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Party Power & Mastery */}
        <div className={`p-3 rounded-lg border flex items-center justify-between tabular-nums ${cardCls}`}>
          <div>
            <span className="text-[11px] font-mono uppercase block opacity-75">Poder Bélico</span>
            <span className="font-serif text-2xl font-bold">{totalPower}</span>
          </div>
          <div className="text-right">
            <span className="text-[11px] font-mono uppercase block opacity-75">Maestria</span>
            <span className="font-serif text-lg font-bold text-amber-600">+{masteryGlory} pts</span>
          </div>
        </div>

        {/* Heroes */}
        <div className="space-y-2.5">
          {heroList.map((hero) => {
            const heroState = party.heroes[hero.classType];
            const isMax = heroState.level >= heroState.maxLevel;
            const cloak = HERO_CLOAK_AFFINITY[hero.classType];

            return (
              <div key={hero.classType} className={`p-3 rounded-xl border ${hero.accent} flex flex-col gap-2`}>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {hero.icon}
                    <div>
                      <h3 className="font-serif text-sm font-bold leading-tight">{hero.name}</h3>
                      <p className="text-[10px] font-mono opacity-80">
                        Nv. {heroState.level}/{heroState.maxLevel} • {cloak === 'white' ? 'Branco' : 'Preto'}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      soundEngine.play('levelup');
                      stageLevelUp(hero.classType);
                    }}
                    disabled={isMax || actionsRemaining === 0}
                    className={`touch-target flex items-center gap-1 px-2 py-1 text-[11px] font-mono rounded border disabled:opacity-35 disabled:pointer-events-none ${btnCls}`}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Nível
                  </button>
                </div>

                <div className="flex items-center gap-1">
                  {Array.from({ length: heroState.maxLevel }).map((_, idx) => (
                    <div
                      key={idx}
                      className={`h-1.5 flex-1 rounded-sm ${
                        idx < heroState.level
                          ? isSengoku
                            ? 'bg-amber-700'
                            : 'bg-dungeon-copper'
                          : isSengoku
                            ? 'bg-stone-400/50'
                            : 'bg-stone-800'
                      }`}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Alchemy & Relics */}
        <div className="space-y-2.5 pt-2 border-t border-stone-500/30">
          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
            <div className={`p-2.5 rounded-lg border flex flex-col justify-between gap-1.5 ${cardCls}`}>
              <div className="flex items-center gap-1.5">
                <FlaskConical className="w-4 h-4 text-emerald-600" />
                <span className="tabular-nums">Poções: {party.potions}</span>
              </div>
              <button
                type="button"
                disabled={actionsRemaining === 0}
                onClick={() => {
                  soundEngine.play('potion');
                  stageBrewPotion();
                }}
                className={`touch-target text-[10px] px-2 py-1 rounded border disabled:opacity-35 ${btnCls}`}
              >
                + Destilar (1 Dado)
              </button>
              {party.potions > 0 && party.currentHealth < party.maxHealth && (
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.play('potion');
                    stageUsePotion();
                  }}
                  className="touch-target text-[10px] px-2 py-1 rounded border bg-emerald-700 text-white border-emerald-500"
                >
                  Beber (+2 Vida)
                </button>
              )}
            </div>

            <div className={`p-2.5 rounded-lg border flex flex-col justify-between gap-1.5 ${cardCls}`}>
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span className="tabular-nums">Itens: {party.magicItems}</span>
              </div>
              <button
                type="button"
                disabled={actionsRemaining === 0}
                onClick={() => {
                  soundEngine.play('sword');
                  stageCraftItem();
                }}
                className={`touch-target text-[10px] px-2 py-1 rounded border disabled:opacity-35 ${btnCls}`}
              >
                + Forjar (1 Dado)
              </button>
            </div>
          </div>

          <div className={`flex items-center justify-between p-2.5 rounded-lg border text-xs font-mono tabular-nums ${cardCls}`}>
            <span className="flex items-center gap-1.5">
              <Gem className="w-4 h-4 text-cyan-600" />
              Gemas: {party.gems} (+{party.gems * 2})
            </span>
            <span>Lacaios: {minionsDefeatedCount} (+{minionsGlory})</span>
          </div>
        </div>

        {/* Tactical Missions */}
        <div className="space-y-2 pt-2 border-t border-stone-500/30">
          <h4 className="text-[11px] font-mono uppercase tracking-wider opacity-80">
            Missões da Expedição
          </h4>
          {missions.map((m) => (
            <div
              key={m.id}
              className={`p-2 rounded-lg border text-[11px] flex items-start justify-between gap-2 ${cardCls} ${
                m.completed ? 'ring-1 ring-emerald-500/70' : ''
              }`}
            >
              <div>
                <div className="font-semibold flex items-center gap-1">
                  {m.completed && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                  <span>{m.title}</span>
                </div>
                <p className="opacity-75 text-[10px]">{m.description}</p>
              </div>
              <span className="font-mono font-bold text-amber-600 shrink-0">+{m.rewardGlory}</span>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
};
