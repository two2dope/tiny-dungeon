import React, { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { HeroClass, RelicId } from '../../engine/types';
import { HERO_CLOAK_AFFINITY } from '../../engine/heroes';
import { getCombatPowerBreakdown } from '../../engine/combat';
import { getRelicById, getRelicCount, RELIC_CATALOG } from '../../engine/relics';
import { soundEngine } from '../../audio/soundEngine';
import { HeroCrestSvg } from './TacticalIcons';
import {
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

interface HeroPortraitAvatarProps {
  classType: HeroClass;
  name: string;
  portraitUrl: string;
  fallbackUrl: string;
  isSengoku: boolean;
}

const HeroPortraitAvatar: React.FC<HeroPortraitAvatarProps> = ({
  classType,
  name,
  portraitUrl,
  fallbackUrl,
  isSengoku,
}) => {
  const [srcStage, setSrcStage] = useState<'primary' | 'secondary' | 'crest'>('primary');
  const activeSrc = srcStage === 'primary' ? portraitUrl : fallbackUrl;
  const ringBorder = isSengoku ? 'border-amber-500/85' : 'border-sky-400/70';

  if (srcStage === 'crest') {
    return <HeroCrestSvg classType={classType} className="w-12 h-12" />;
  }

  return (
    <div className="relative w-12 h-12 shrink-0">
      <img
        src={activeSrc}
        alt={`Retrato de ${name}`}
        loading="lazy"
        onError={() =>
          setSrcStage((prev) =>
            prev === 'primary' && portraitUrl !== fallbackUrl ? 'secondary' : 'crest'
          )
        }
        className={`w-12 h-12 rounded-md border-2 object-cover shadow-md bg-stone-950 ${ringBorder}`}
      />
      <div className="absolute -bottom-1 -right-1 rounded-full bg-stone-950/95 p-0.5 shadow border border-amber-700/60">
        <HeroCrestSvg classType={classType} className="w-3.5 h-3.5" />
      </div>
    </div>
  );
};

interface RelicThumbProps {
  src: string;
  alt: string;
  fallback: React.ReactNode;
}

const RelicThumb: React.FC<RelicThumbProps> = ({ src, alt, fallback }) => {
  const [failed, setFailed] = useState(false);
  if (failed) return <>{fallback}</>;

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
      className="w-7 h-7 object-contain shrink-0 drop-shadow-sm"
    />
  );
};

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
  const [selectedRelicId, setSelectedRelicId] = useState<RelicId | null>(null);
  const [relicErrorIds, setRelicErrorIds] = useState<Record<string, boolean>>({});

  if (!isOpen) return null;

  const powerBreakdown = getCombatPowerBreakdown(party);
  const actionsRemaining = Math.max(0, 3 - consumedDieIds.length);
  const isSengoku = theme === 'sengoku';
  const selectedRelic = selectedRelicId ? getRelicById(selectedRelicId) : null;
  const selectedRelicCount = selectedRelic ? getRelicCount(party, selectedRelic.id) : 0;

  const heroList: {
    classType: HeroClass;
    name: string;
    portraitUrl: string;
    fallbackUrl: string;
    cardClass: string;
  }[] = [
    {
      classType: 'warrior',
      name: 'Guerreiro',
      portraitUrl: '/assets/ui/portraits/warrior.webp',
      fallbackUrl: '/assets/portraits/hero-warrior.jpg',
      cardClass: isSengoku ? 'gui-hero-warrior' : 'gui-vesperfall-card',
    },
    {
      classType: 'mage',
      name: 'Mago',
      portraitUrl: '/assets/ui/portraits/mage.webp',
      fallbackUrl: '/assets/portraits/hero-mage.jpg',
      cardClass: isSengoku ? 'gui-hero-mage' : 'gui-vesperfall-card',
    },
    {
      classType: 'cleric',
      name: 'Clérigo',
      portraitUrl: '/assets/ui/portraits/cleric.webp',
      fallbackUrl: '/assets/portraits/hero-cleric.jpg',
      cardClass: isSengoku ? 'gui-hero-cleric' : 'gui-vesperfall-card',
    },
    {
      classType: 'rogue',
      name: 'Ladino',
      portraitUrl: '/assets/ui/portraits/rogue.webp',
      fallbackUrl: '/assets/portraits/hero-rogue.jpg',
      cardClass: isSengoku ? 'gui-hero-rogue' : 'gui-vesperfall-card',
    },
  ];

  return (
    <aside
      aria-label="The Ember Measure — Comitiva e Missões"
      className={`fixed inset-y-0 left-0 w-[min(22rem,92vw)] z-40 flex flex-col justify-between overflow-y-auto ${
        isSengoku
          ? 'gui-sidebar-panel p-2.5 sm:p-3 text-amber-50'
          : 'bg-dungeon-bg/95 backdrop-blur-xl border-r border-dungeon-border p-4 sm:p-5 shadow-2xl text-stone-200'
      }`}
    >
      <div className="space-y-2">
        {/* Top Banner + Close Action */}
        <div
          className={`relative flex items-center justify-center rounded-lg px-8 ${
            isSengoku
              ? 'gui-title-banner min-h-[3.25rem] py-1.5'
              : 'pb-3 border-b border-dungeon-border'
          }`}
        >
          <h2 className="text-center font-serif text-[11px] sm:text-xs leading-[1.15] tracking-[0.12em] max-w-[46%] uppercase font-bold text-amber-100 drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)]">
            The Ember Measure
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar Grimório"
            className="touch-target absolute right-1 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-amber-200/80 hover:text-amber-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Party Power, Actions & Mastery */}
        <div
          className={`px-2.5 py-1.5 rounded-lg border flex items-center justify-between gap-2 tabular-nums ${
            isSengoku
              ? 'bg-[#120d0a]/90 border-amber-800/60 text-amber-100'
              : 'bg-dungeon-surface border-dungeon-border text-stone-200'
          }`}
        >
          <div className="flex items-center gap-2 min-w-0">
            <RelicThumb
              src="/assets/ui/icon-combat-power.webp"
              alt="Poder Bélico"
              fallback={null}
            />
            <div>
              <span
                className={`text-[9px] font-mono uppercase block ${
                  isSengoku ? 'text-amber-200/70' : 'text-slate-400'
                }`}
              >
                Poder Bélico
              </span>
              <div className="flex flex-wrap items-baseline gap-1.5">
                <span className="font-serif text-xl font-bold leading-none text-amber-100">
                  {powerBreakdown.partyPower}
                </span>
                {powerBreakdown.katanaBonus > 0 && (
                  <span className="text-[9px] font-mono text-emerald-300">
                    +{powerBreakdown.katanaBonus} Katana
                  </span>
                )}
                {powerBreakdown.sealBonus > 0 && (
                  <span className="text-[9px] font-mono text-amber-300">
                    +{powerBreakdown.sealBonus} vs Chefes
                  </span>
                )}
              </div>
            </div>
          </div>

          <span
            className={`text-[10px] font-mono px-2 py-0.5 rounded border shrink-0 ${
              isSengoku
                ? 'bg-amber-950/80 border-amber-700/50 text-amber-300'
                : 'bg-slate-900 border-sky-700/60 text-sky-300'
            }`}
          >
            Ações {actionsRemaining}/3
          </span>

          <div className="text-right shrink-0">
            <span
              className={`text-[9px] font-mono uppercase block ${
                isSengoku ? 'text-amber-200/70' : 'text-slate-400'
              }`}
            >
              Maestria
            </span>
            <span className="font-serif text-base font-bold leading-none text-amber-400">
              +{masteryGlory} pts
            </span>
          </div>
        </div>

        {/* Heroes */}
        <div className="space-y-1.5">
          {heroList.map((hero) => {
            const heroState = party.heroes[hero.classType];
            const isMax = heroState.level >= heroState.maxLevel;
            const cloak = HERO_CLOAK_AFFINITY[hero.classType];

            return (
              <div
                key={hero.classType}
                className={`gui-hero-card ${hero.cardClass} p-2 rounded-lg flex flex-col gap-1.5`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <HeroPortraitAvatar
                      classType={hero.classType}
                      name={hero.name}
                      portraitUrl={hero.portraitUrl}
                      fallbackUrl={hero.fallbackUrl}
                      isSengoku={isSengoku}
                    />
                    <div className="min-w-0">
                      <h3 className="font-serif text-sm font-bold leading-tight text-amber-100 truncate">
                        {hero.name}
                      </h3>
                      <p className="text-[10px] font-mono text-amber-200/75">
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
                    className="touch-target gui-btn-crimson flex items-center gap-1 px-2.5 py-1 text-[11px] font-serif font-bold uppercase tracking-wide rounded disabled:opacity-60 disabled:saturate-50 disabled:pointer-events-none shrink-0"
                  >
                    <Plus className="w-3 h-3" />
                    Nível
                  </button>
                </div>

                {/* 6-segment level bar */}
                <div className="flex items-center gap-1">
                  {Array.from({ length: heroState.maxLevel }).map((_, idx) => (
                    <div
                      key={idx}
                      className={`h-1.5 flex-1 rounded-sm border ${
                        idx < heroState.level
                          ? 'bg-gradient-to-r from-amber-500 to-orange-500 border-amber-300/70 shadow-[0_0_6px_rgba(245,158,11,0.4)]'
                          : 'bg-[#120d0a]/80 border-amber-900/40'
                      }`}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Alchemy & Relics */}
        <div className={`space-y-1.5 pt-1.5 border-t ${isSengoku ? 'border-amber-900/40' : 'border-dungeon-border'}`}>
          <h3 className={`text-[11px] font-serif font-bold tracking-wider uppercase ${isSengoku ? 'text-amber-200' : 'text-slate-200'}`}>
            Poções &amp; Itens
          </h3>
          <div className="grid grid-cols-2 gap-1.5 text-xs font-mono">
            <div
              className={`p-1.5 rounded-lg flex flex-col justify-between gap-1 ${
                isSengoku
                  ? 'gui-parchment-card'
                  : 'bg-dungeon-surface border border-dungeon-border text-stone-200'
              }`}
            >
              <div className="flex items-center gap-1.5 font-bold">
                <RelicThumb
                  src="/assets/ui/icon-potion-gourd.webp"
                  alt="Poção Alquímica"
                  fallback={<FlaskConical className="w-4 h-4 text-emerald-600" />}
                />
                <span className="tabular-nums">Poções: {party.potions}</span>
              </div>
              <button
                type="button"
                disabled={actionsRemaining === 0}
                onClick={() => {
                  soundEngine.play('potion');
                  stageBrewPotion();
                }}
                className={`touch-target text-[10px] font-bold px-2 py-1 rounded disabled:opacity-65 disabled:saturate-50 ${
                  isSengoku ? 'gui-parchment-btn' : 'gui-btn-gold'
                }`}
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
                  className="touch-target text-[10px] px-2 py-1 rounded border bg-emerald-800 hover:bg-emerald-700 text-white border-emerald-500 font-bold"
                >
                  Beber (+2 Vida)
                </button>
              )}
            </div>

            <div
              className={`p-1.5 rounded-lg flex flex-col justify-between gap-1 ${
                isSengoku
                  ? 'gui-parchment-card'
                  : 'bg-dungeon-surface border border-dungeon-border text-stone-200'
              }`}
            >
              <div className="flex items-center gap-1.5 font-bold">
                <RelicThumb
                  src="/assets/ui/icon-item-scroll.webp"
                  alt="Artefatos Mágicos"
                  fallback={<Sparkles className="w-4 h-4 text-amber-600" />}
                />
                <span className="tabular-nums">Itens: {party.magicItems}</span>
              </div>
              <button
                type="button"
                disabled={actionsRemaining === 0}
                onClick={() => {
                  soundEngine.play('sword');
                  stageCraftItem();
                }}
                className={`touch-target text-[10px] font-bold px-2 py-1 rounded disabled:opacity-65 disabled:saturate-50 ${
                  isSengoku ? 'gui-parchment-btn' : 'gui-btn-gold'
                }`}
              >
                + Forjar (1 Dado)
              </button>
            </div>
          </div>

          {/* 5-Slot Visual Relic Rack (keyboard & touch accessible) */}
          <div
            aria-label="Acervo de Relíquias Forjadas"
            className="grid grid-cols-5 gap-1.5"
          >
            {RELIC_CATALOG.map((relic) => {
              const count = getRelicCount(party, relic.id);
              const owned = count > 0;
              const isSelected = selectedRelicId === relic.id;
              const imgFailed = Boolean(relicErrorIds[relic.id]);
              return (
                <button
                  key={relic.id}
                  type="button"
                  onClick={() =>
                    setSelectedRelicId((prev) => (prev === relic.id ? null : relic.id))
                  }
                  aria-pressed={isSelected}
                  aria-label={`${relic.name}: ${owned ? `${count}x equipada` : 'não forjada'}`}
                  title={`${relic.name} (${relic.shortBonus}) — ${relic.description}`}
                  className={`relative h-10 rounded-md border flex items-center justify-center p-1 transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-300 ${
                    owned
                      ? isSengoku
                        ? 'bg-amber-950/75 border-amber-400/90 shadow-[0_0_8px_rgba(251,191,36,0.4)]'
                        : 'bg-slate-800/90 border-sky-400/80 shadow-[0_0_8px_rgba(56,189,248,0.3)]'
                      : isSengoku
                        ? 'bg-[#120d0a]/80 border-dashed border-amber-900/40'
                        : 'bg-slate-900/80 border-dashed border-slate-700'
                  } ${isSelected ? 'ring-2 ring-amber-300' : ''}`}
                >
                  {imgFailed ? (
                    <Sparkles className={`w-5 h-5 ${owned ? 'text-amber-400' : 'text-stone-500 opacity-50'}`} />
                  ) : (
                    <img
                      src={relic.iconUrl}
                      alt={relic.name}
                      loading="lazy"
                      onError={() =>
                        setRelicErrorIds((prev) => ({ ...prev, [relic.id]: true }))
                      }
                      className={`w-7 h-7 object-contain transition-opacity ${
                        owned ? 'opacity-100 drop-shadow-sm' : 'opacity-30 grayscale'
                      }`}
                    />
                  )}
                  {count > 1 && (
                    <span className="absolute -top-1 -right-1 px-1 rounded-full bg-amber-400 text-stone-950 text-[9px] font-mono font-extrabold leading-tight shadow">
                      ×{count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {selectedRelic && (
            <div
              role="region"
              aria-live="polite"
              className={`px-2 py-1.5 rounded-md border text-[10px] ${
                isSengoku
                  ? 'bg-[#17100c]/95 border-amber-700/60 text-amber-100'
                  : 'bg-slate-900/95 border-sky-700/50 text-slate-200'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <strong className="font-serif text-[11px]">{selectedRelic.name}</strong>
                <span className="font-mono text-[9px] opacity-85">
                  {selectedRelicCount > 0 ? `Equipada ×${selectedRelicCount}` : 'Não forjada'}
                </span>
              </div>
              <p className="leading-snug mt-0.5 opacity-90">{selectedRelic.description}</p>
            </div>
          )}

          <div
            className={`flex items-center justify-between px-2 py-1.5 rounded-lg border text-xs font-mono font-bold tabular-nums ${
              isSengoku
                ? 'bg-[#120d0a]/90 border-amber-800/60 text-amber-100'
                : 'bg-dungeon-surface border-dungeon-border text-stone-200'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <RelicThumb
                src="/assets/ui/icon-gem-magatama.webp"
                alt="Gemas de Esmeralda"
                fallback={<Gem className="w-4 h-4 text-cyan-500" />}
              />
              Gemas: {party.gems} (+{party.gems * 2})
            </span>
            <span className="flex items-center gap-1.5">
              <RelicThumb
                src="/assets/ui/icon-oni-skull.webp"
                alt="Lacaios derrotados"
                fallback={null}
              />
              Lacaios: {minionsDefeatedCount} (+{minionsGlory})
            </span>
          </div>
        </div>

        {/* Tactical Missions */}
        <div className={`space-y-1 pt-1.5 border-t ${isSengoku ? 'border-amber-900/40' : 'border-dungeon-border'}`}>
          <h3 className={`text-[11px] font-serif font-bold tracking-wider uppercase ${isSengoku ? 'text-amber-200' : 'text-slate-200'}`}>
            Missões da Expedição
          </h3>
          {missions.map((m) => (
            <div
              key={m.id}
              className={`text-[11px] flex items-start justify-between gap-2 rounded ${
                isSengoku
                  ? 'gui-mission-banner px-7 py-1.5'
                  : 'p-2 border bg-dungeon-surface border-dungeon-border text-stone-200'
              } ${m.completed ? 'ring-2 ring-emerald-500' : ''}`}
            >
              <div>
                <div className="font-serif font-bold leading-tight flex items-center gap-1">
                  {m.completed && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0" />}
                  <span>{m.title}</span>
                </div>
                <p className={`text-[10px] leading-tight ${isSengoku ? 'text-[#3c2718]' : 'opacity-75'}`}>
                  {m.description}
                </p>
              </div>
              <span
                className={`font-mono font-extrabold shrink-0 ${
                  isSengoku ? 'text-red-800' : 'text-amber-500'
                }`}
              >
                +{m.rewardGlory}
              </span>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
};
