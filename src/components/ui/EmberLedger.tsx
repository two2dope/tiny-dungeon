import React, { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { HeroClass, RelicId, RelicRecipeSlot } from '../../engine/types';
import { HERO_CLOAK_AFFINITY } from '../../engine/heroes';
import { getCombatPowerBreakdown } from '../../engine/combat';
import {
  findMatchingSlotIndex,
  getRelicById,
  getRelicSlotProgress,
  isRelicCompleted,
  RELIC_CATALOG,
} from '../../engine/relics';
import {
  GEM_MILESTONES,
  getGemTrackGlory,
  getMinionTrackGlory,
  POTION_MILESTONES,
  POTION_TRACK_MAX,
} from '../../engine/tracks';
import { calculateFinalGloryScore, calculateMissionsGlory } from '../../engine/scoring';
import { soundEngine } from '../../audio/soundEngine';
import { DieSymbolSvg, HeroCrestSvg } from './TacticalIcons';
import {
  FlaskConical,
  Sparkles,
  Gem,
  Plus,
  X,
  CheckCircle2,
  Check,
  Award,
  Scroll,
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
  className?: string;
  ariaHidden?: boolean;
}

const RelicThumb: React.FC<RelicThumbProps> = ({
  src,
  alt,
  fallback,
  className = 'w-5 h-5 object-contain shrink-0 drop-shadow-sm',
  ariaHidden = false,
}) => {
  const [failed, setFailed] = useState(false);
  if (failed) return <>{fallback}</>;

  return (
    <img
      src={src}
      alt={ariaHidden ? '' : alt}
      aria-hidden={ariaHidden || undefined}
      loading="lazy"
      onError={() => setFailed(true)}
      className={className}
    />
  );
};

const RecipeSlotBadge: React.FC<{ slot: RelicRecipeSlot; filled: boolean }> = ({
  slot,
  filled,
}) => {
  const colorStyle: React.CSSProperties =
    slot.color === 'white'
      ? { backgroundColor: '#f5f5f4', color: '#1c1917' }
      : slot.color === 'black'
        ? { backgroundColor: '#18181b', color: '#fef3c7' }
        : {
            background: 'linear-gradient(135deg, #f5f5f4 50%, #18181b 50%)',
            color: '#fbbf24',
          };

  return (
    <span
      style={colorStyle}
      title={`Casa: ${slot.color === 'white' ? 'Branco' : slot.color === 'black' ? 'Preto' : 'Branco/Preto'}${
        slot.symbol ? ` (${slot.symbol})` : ''
      }`}
      className={`relative w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 ${
        filled ? 'border-emerald-400 ring-1 ring-emerald-400/70' : 'border-amber-700/70'
      }`}
    >
      {slot.symbol && !filled && (
        <DieSymbolSvg symbol={slot.symbol} className="w-2.5 h-2.5" />
      )}
      {filled && (
        <span className="absolute inset-0 rounded bg-emerald-900/85 flex items-center justify-center">
          <Check className="w-2.5 h-2.5 text-emerald-300 stroke-[3]" />
        </span>
      )}
    </span>
  );
};

const SHORT_RELIC_LABEL: Record<RelicId, string> = {
  'katana-masamune': 'Katana',
  'selo-onmyo': 'Onmyō',
  'amuleto-omamori': 'Omamori',
  'gancho-kaginawa': 'Kaginawa',
  'sandalias-waraji': 'Waraji',
  'armadura-yoroi': 'Yoroi',
  'cabaca-elixir': 'Elixir',
  'espelho-yata': 'Yata',
};

const SHORT_MISSION_TITLE: Record<string, string> = {
  mission_slayer: 'Caçador',
  mission_artisan: 'Alquimista',
  mission_explorer: 'Desbravador',
};

export const EmberLedger: React.FC<EmberLedgerProps> = ({ isOpen, onClose }) => {
  const party = useGameStore((state) => state.party);
  const theme = useGameStore((state) => state.theme);
  const dicePool = useGameStore((state) => state.dicePool);
  const selectedDieId = useGameStore((state) => state.selectedDieId);
  const consumedDieIds = useGameStore((state) => state.consumedDieIds);
  const masteryGlory = useGameStore((state) => state.masteryGlory);
  const bossGlory = useGameStore((state) => state.bossGlory);
  const missions = useGameStore((state) => state.missions);
  const stageLevelUp = useGameStore((state) => state.stageLevelUp);
  const stageBrewPotion = useGameStore((state) => state.stageBrewPotion);
  const stageUsePotion = useGameStore((state) => state.stageUsePotion);
  const stageCraftRelic = useGameStore((state) => state.stageCraftRelic);
  const minionsDefeatedCount = useGameStore((state) => state.minionsDefeatedCount);
  const claimedPotionMilestones = useGameStore((state) => state.claimedPotionMilestones);
  const claimedGemMilestones = useGameStore((state) => state.claimedGemMilestones);
  const [selectedRelicId, setSelectedRelicId] = useState<RelicId | null>(null);
  const [expandedMissionId, setExpandedMissionId] = useState<string | null>(null);
  const [relicErrorIds, setRelicErrorIds] = useState<Record<string, boolean>>({});

  if (!isOpen) return null;

  const powerBreakdown = getCombatPowerBreakdown(party);
  const actionsRemaining = Math.max(0, 3 - consumedDieIds.length);
  const isSengoku = theme === 'sengoku';
  const selectedRelic = selectedRelicId ? getRelicById(selectedRelicId) : null;
  const expandedMission = expandedMissionId
    ? missions.find((m) => m.id === expandedMissionId) ?? null
    : null;
  const potionsBrewed = party.potionsBrewed ?? 0;

  const availableDice = dicePool.dice.filter((d) => !consumedDieIds.includes(d.id));
  const selectedDie = selectedDieId
    ? availableDice.find((d) => d.id === selectedDieId)
    : undefined;

  const canCraftRelicNow = (relicId: RelicId) => {
    if (actionsRemaining === 0 || isRelicCompleted(party, relicId)) return false;
    if (selectedDie) {
      return findMatchingSlotIndex(party, relicId, selectedDie) >= 0;
    }
    return availableDice.some((d) => findMatchingSlotIndex(party, relicId, d) >= 0);
  };

  const completedRelicsCount = RELIC_CATALOG.filter((r) =>
    isRelicCompleted(party, r.id)
  ).length;
  const craftableRelicsCount = RELIC_CATALOG.filter((r) => canCraftRelicNow(r.id)).length;
  const gemTrackGlory = getGemTrackGlory(party.gems);
  const minionTrackGlory = getMinionTrackGlory(minionsDefeatedCount);
  const liveScore = calculateFinalGloryScore({
    party,
    minionsDefeatedCount,
    minionsGlory: minionTrackGlory,
    bossGlory,
    gemsCount: party.gems,
    itemsCrafted: party.magicItems,
    missionsGlory: calculateMissionsGlory(missions),
    masteryGlory,
  });

  const effectBadge = {
    permanent: { symbol: '∞', title: 'Bônus permanente' },
    instant: { symbol: '⚡', title: 'Bônus instantâneo' },
    ability: { symbol: '✦', title: 'Habilidade permanente' },
  };

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

  const renderPotionMilestoneBadge = (threshold: number) => {
    if (threshold === 4) {
      return (
        <>
          <RelicThumb
            src="/assets/ui/icon-bonus-levelup.webp"
            alt="Bônus Upgrade de Herói"
            className="w-4 h-4 object-contain shrink-0"
            fallback={<HeroCrestSvg classType="warrior" className="w-3.5 h-3.5" />}
          />
          <span>+Nv</span>
        </>
      );
    }
    if (threshold === 8) {
      return (
        <>
          <RelicThumb
            src="/assets/ui/icon-bonus-forge.webp"
            alt="Bônus Forja Gratuita"
            className="w-4 h-4 object-contain shrink-0"
            fallback={<Sparkles className="w-3 h-3 text-amber-300" />}
          />
          <span>Forja</span>
        </>
      );
    }
    return (
      <>
        <RelicThumb
          src="/assets/ui/icon-bonus-alchemist.webp"
          alt="Escolha do Alquimista"
          className="w-4 h-4 object-contain shrink-0"
          fallback={<Award className="w-3 h-3 text-amber-300 shrink-0" />}
        />
        <span>Bônus</span>
      </>
    );
  };

  return (
    <aside
      aria-label="The Ember Measure — Comitiva e Missões"
      className={`fixed inset-y-0 left-0 w-[min(23.5rem,94vw)] z-40 flex flex-col justify-between overflow-y-auto overflow-x-hidden no-scrollbar ${
        isSengoku
          ? 'gui-sidebar-panel p-2 text-amber-50'
          : 'bg-dungeon-bg/95 backdrop-blur-xl border-r border-dungeon-border p-3 shadow-2xl text-stone-200'
      }`}
    >
      <div className="space-y-1.5">
        {/* Top Banner + Close Action */}
        <div
          className={`relative flex items-center justify-center rounded-lg px-7 ${
            isSengoku
              ? 'gui-title-banner min-h-[2.25rem] py-1'
              : 'pb-2 border-b border-dungeon-border'
          }`}
        >
          <h2 className="text-center font-serif text-[11px] leading-[1.15] tracking-[0.12em] max-w-[54%] uppercase font-bold text-amber-100 drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)]">
            The Ember Measure
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar Grimório"
            className="touch-target absolute right-1 top-1/2 -translate-y-1/2 p-1 rounded-lg text-amber-200/80 hover:text-amber-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Party Power, Actions & Mastery */}
        <div
          className={`px-2 py-1 rounded-lg border flex items-center justify-between gap-1.5 tabular-nums ${
            isSengoku
              ? 'bg-[#120d0a]/90 border-amber-800/60 text-amber-100'
              : 'bg-dungeon-surface border-dungeon-border text-stone-200'
          }`}
        >
          <div className="flex items-center gap-1.5 min-w-0">
            <RelicThumb
              src="/assets/ui/icon-combat-power.webp"
              alt="Poder Bélico"
              fallback={null}
            />
            <div>
              <span
                className={`text-[8px] font-mono uppercase block leading-none ${
                  isSengoku ? 'text-amber-200/70' : 'text-slate-400'
                }`}
              >
                Poder Bélico
              </span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="font-serif text-lg font-bold leading-none text-amber-100">
                  {powerBreakdown.partyPower}
                </span>
                {powerBreakdown.katanaBonus > 0 && (
                  <span className="text-[8px] font-mono text-emerald-300">
                    +{powerBreakdown.katanaBonus}K
                  </span>
                )}
                {powerBreakdown.sealBonus > 0 && (
                  <span className="text-[8px] font-mono text-amber-300">
                    +{powerBreakdown.sealBonus}Ch
                  </span>
                )}
              </div>
            </div>
          </div>

          <span
            className={`text-[10px] font-mono px-1.5 py-0.5 rounded border shrink-0 ${
              isSengoku
                ? 'bg-amber-950/80 border-amber-700/50 text-amber-300'
                : 'bg-slate-900 border-sky-700/60 text-sky-300'
            }`}
          >
            Ações {actionsRemaining}/3
          </span>

          <div className="text-right shrink-0">
            <span
              className={`text-[8px] font-mono uppercase block leading-none ${
                isSengoku ? 'text-amber-200/70' : 'text-slate-400'
              }`}
            >
              Maestria
            </span>
            <span className="font-serif text-sm font-bold leading-none text-amber-400">
              +{masteryGlory} pts
            </span>
          </div>
        </div>

        {/* Heroes — 2x2 Portrait Showcase Grid */}
        <div className="grid grid-cols-2 gap-1.5">
          {heroList.map((hero) => {
            const heroState = party.heroes[hero.classType];
            const isMax = heroState.level >= heroState.maxLevel;
            const cloak = HERO_CLOAK_AFFINITY[hero.classType];

            return (
              <div
                key={hero.classType}
                className={`gui-hero-card ${hero.cardClass} p-1.5 rounded-lg flex flex-col justify-between gap-1`}
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <HeroPortraitAvatar
                    classType={hero.classType}
                    name={hero.name}
                    portraitUrl={hero.portraitUrl}
                    fallbackUrl={hero.fallbackUrl}
                    isSengoku={isSengoku}
                  />
                  <div className="min-w-0 flex-1">
                    <h3 className="font-serif text-xs font-bold leading-tight text-amber-100 truncate">
                      {hero.name}
                    </h3>
                    <span className="text-[9px] font-mono text-amber-200/85 block leading-tight mt-0.5 tabular-nums">
                      Nv.{heroState.level}/{heroState.maxLevel} • {cloak === 'white' ? 'Br' : 'Pr'}
                    </span>
                    <div className="flex items-center gap-0.5 mt-1 w-full">
                      {Array.from({ length: heroState.maxLevel }).map((_, idx) => (
                        <div
                          key={idx}
                          className={`h-1.5 flex-1 rounded-sm ${
                            idx < heroState.level
                              ? 'bg-gradient-to-r from-amber-400 to-orange-500 shadow-[0_0_4px_rgba(245,158,11,0.45)]'
                              : 'bg-[#120d0a]/85 border border-amber-900/40'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    soundEngine.play('levelup');
                    stageLevelUp(hero.classType);
                  }}
                  disabled={isMax || actionsRemaining === 0}
                  className="touch-target gui-btn-crimson w-full flex items-center justify-center gap-0.5 px-1.5 py-0.5 text-[10px] font-serif font-bold uppercase tracking-wide rounded disabled:opacity-50 disabled:saturate-50 disabled:pointer-events-none"
                >
                  <Plus className="w-3 h-3" />
                  <span>Nível</span>
                </button>
              </div>
            );
          })}
        </div>

        {/* Potion Checkboxes & Bonus Icons */}
        <div
          className={`space-y-1 pt-1 border-t ${
            isSengoku ? 'border-amber-900/40' : 'border-dungeon-border'
          }`}
        >
          <div className="flex items-center justify-between gap-1">
            <h3
              className={`text-[10px] font-serif font-bold tracking-wider uppercase flex items-center gap-1 ${
                isSengoku ? 'text-amber-200' : 'text-slate-200'
              }`}
            >
              <FlaskConical className="w-3 h-3 text-emerald-400" />
              Poções ({party.potions} est. • {Math.min(potionsBrewed, POTION_TRACK_MAX)}/12)
            </h3>
            <div className="flex items-center gap-1">
              {party.potions > 0 && party.currentHealth < party.maxHealth && (
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.play('potion');
                    stageUsePotion();
                  }}
                  className="text-[9px] px-1.5 py-0.5 rounded border bg-emerald-800 hover:bg-emerald-700 text-white border-emerald-500 font-bold"
                >
                  Beber (+2♥)
                </button>
              )}
              <button
                type="button"
                disabled={actionsRemaining === 0}
                onClick={() => {
                  soundEngine.play('potion');
                  stageBrewPotion();
                }}
                className="gui-btn-gold text-[9px] font-bold px-1.5 py-0.5 rounded disabled:opacity-50 disabled:pointer-events-none"
              >
                + Destilar (+2)
              </button>
            </div>
          </div>

          <div
            aria-label="Trilha de Poções (marcos em 4, 8 e 12)"
            className={`px-1.5 py-1 rounded-lg border space-y-1 ${
              isSengoku
                ? 'bg-[#120d0a]/90 border-amber-800/60'
                : 'bg-dungeon-surface border-dungeon-border'
            }`}
          >
            {POTION_MILESTONES.map((milestone, rowIdx) => {
              const startSlot = rowIdx * 4 + 1;
              const isClaimed = claimedPotionMilestones.includes(milestone.threshold);
              return (
                <div key={milestone.threshold} className="flex items-center justify-between gap-1.5">
                  <div className="grid grid-cols-4 gap-1 flex-1">
                    {[0, 1, 2, 3].map((offset) => {
                      const slotNum = startSlot + offset;
                      const filled = potionsBrewed >= slotNum;
                      return (
                        <div
                          key={slotNum}
                          role="checkbox"
                          aria-checked={filled}
                          aria-label={`Poção ${slotNum}`}
                          title={`Poção ${slotNum} (cura +2 Vida)`}
                          className={`h-5 rounded border flex items-center justify-center ${
                            filled
                              ? 'bg-emerald-900/80 border-emerald-400 text-emerald-100'
                              : 'bg-black/45 border-stone-600/80 text-stone-500'
                          }`}
                        >
                          {filled ? (
                            <RelicThumb
                              src="/assets/ui/icon-potion-slot-full.webp"
                              alt=""
                              ariaHidden={true}
                              className="w-4 h-4 object-contain"
                              fallback={<Check className="w-2.5 h-2.5 stroke-[3]" />}
                            />
                          ) : (
                            <RelicThumb
                              src="/assets/ui/icon-potion-slot-empty.webp"
                              alt=""
                              ariaHidden={true}
                              className="w-4 h-4 object-contain opacity-45"
                              fallback={<span className="text-[8px] font-mono leading-none">{slotNum}</span>}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <div
                    title={milestone.label}
                    className={`w-16 h-5 rounded border px-1 flex items-center justify-center gap-1 text-[8px] font-mono font-bold shrink-0 ${
                      isClaimed
                        ? 'bg-amber-700/75 border-amber-300 text-amber-100'
                        : 'bg-amber-950/45 border-amber-800/60 text-amber-200/90'
                    }`}
                  >
                    {renderPotionMilestoneBadge(milestone.threshold)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Forge Workshop — 4-Column Square Image-First Showcase Grid */}
        <div
          className={`space-y-1.5 pt-1 border-t ${
            isSengoku ? 'border-amber-900/40' : 'border-dungeon-border'
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <h3
              className={`text-[10px] font-serif font-bold tracking-wider uppercase flex items-center gap-1 ${
                isSengoku ? 'text-amber-200' : 'text-slate-200'
              }`}
            >
              <Sparkles className="w-3 h-3 text-amber-400" />
              Oficina de Forja ({completedRelicsCount}/8)
            </h3>
            <span className="text-[9px] font-mono text-amber-300/85">
              {selectedDie
                ? `Dado: ${selectedDie.color === 'white' ? 'Branco' : 'Preto'}`
                : craftableRelicsCount > 0
                  ? `${craftableRelicsCount} pronta(s)`
                  : 'Sem dado compatível'}
            </span>
          </div>

          <div
            aria-label="Acervo de Relíquias Forjadas"
            className="grid grid-cols-4 gap-1.5"
          >
            {RELIC_CATALOG.map((relic) => {
              const progress = getRelicSlotProgress(party, relic.id);
              const completed = isRelicCompleted(party, relic.id);
              const isSelected = selectedRelicId === relic.id;
              const imgFailed = Boolean(relicErrorIds[relic.id]);
              const craftable = canCraftRelicNow(relic.id);
              const badge = effectBadge[relic.effectKind];

              return (
                <button
                  key={relic.id}
                  type="button"
                  onClick={() => {
                    soundEngine.play('click');
                    setSelectedRelicId((prev) => (prev === relic.id ? null : relic.id));
                  }}
                  aria-expanded={isSelected}
                  aria-label={`Detalhes de ${relic.name}: ${relic.shortBonus}`}
                  className={`relative min-h-[5.25rem] rounded-lg border p-1 flex flex-col items-center justify-between transition-all hover:scale-[1.03] ${
                    completed
                      ? isSengoku
                        ? 'bg-gradient-to-b from-amber-900/55 to-amber-950/85 border-amber-400/90 shadow-[inset_0_0_10px_rgba(251,191,36,0.2)]'
                        : 'bg-slate-800/90 border-sky-400/85'
                      : craftable
                        ? isSengoku
                          ? 'bg-gradient-to-b from-[#251811] to-[#130d09] border-amber-500/75'
                          : 'bg-slate-900 border-amber-400/70'
                        : isSengoku
                          ? 'bg-[#120d0a]/85 border-amber-900/50'
                          : 'bg-dungeon-surface border-dungeon-border'
                  } ${isSelected ? 'ring-2 ring-amber-300 shadow-[0_0_12px_rgba(251,191,36,0.4)]' : ''}`}
                >
                  {/* Top corners: effect type & completion/craftable badge */}
                  <div className="w-full flex items-center justify-between px-0.5 leading-none">
                    <span title={badge.title} className="text-[9px] text-amber-300/90">
                      {badge.symbol}
                    </span>
                    {completed ? (
                      <span className="text-[9px] font-mono font-bold text-emerald-300">✓</span>
                    ) : craftable ? (
                      <span
                        title="Pronta para forjar com um dado disponível"
                        className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.9)]"
                      />
                    ) : (
                      <span className="w-2 h-2" aria-hidden="true" />
                    )}
                  </div>

                  {/* Heroic centered Relic Art Asset */}
                  <div className="flex items-center justify-center flex-1 py-0.5">
                    {imgFailed ? (
                      <Sparkles
                        className={`w-10 h-10 ${
                          completed ? 'text-amber-400' : 'text-stone-500'
                        }`}
                      />
                    ) : (
                      <img
                        src={relic.iconUrl}
                        alt={relic.name}
                        loading="lazy"
                        onError={() =>
                          setRelicErrorIds((prev) => ({ ...prev, [relic.id]: true }))
                        }
                        className={`w-11 h-11 object-contain drop-shadow-[0_3px_5px_rgba(0,0,0,0.85)] ${
                          completed ? 'opacity-100 scale-105' : 'opacity-95'
                        }`}
                      />
                    )}
                  </div>

                  {/* Crisp 1-word Relic Name + Compact Recipe Pips */}
                  <span className="font-serif text-[10px] font-bold leading-none text-amber-100 truncate max-w-full">
                    {SHORT_RELIC_LABEL[relic.id]}
                  </span>
                  <div className="flex items-center justify-center gap-0.5 mt-0.5">
                    {relic.recipe.map((slot, slotIdx) => (
                      <RecipeSlotBadge
                        key={slotIdx}
                        slot={slot}
                        filled={progress[slotIdx]}
                      />
                    ))}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Unified Forge Inspector & Forge Action Bar */}
          {selectedRelic ? (
            <div
              role="region"
              aria-live="polite"
              className={`px-2 py-1.5 rounded-lg border flex items-center justify-between gap-2 text-[10px] leading-snug ${
                isSengoku
                  ? 'bg-[#19100b] border-amber-600/75 text-amber-100'
                  : 'bg-slate-900 border-sky-700/60 text-slate-200'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0 flex-1">
                {!relicErrorIds[selectedRelic.id] && (
                  <img
                    src={selectedRelic.iconUrl}
                    alt=""
                    aria-hidden="true"
                    className="w-8 h-8 object-contain shrink-0 drop-shadow"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <strong className="font-serif text-[11px] text-amber-200">
                      {selectedRelic.name}
                    </strong>
                    <span className="px-1 py-0.2 rounded bg-amber-950/90 border border-amber-700/60 font-mono text-[8px] text-amber-300">
                      {selectedRelic.shortBonus}
                    </span>
                  </div>
                  <p className="text-[9px] opacity-90 leading-tight mt-0.5">
                    {selectedRelic.description}
                  </p>
                </div>
              </div>

              {isRelicCompleted(party, selectedRelic.id) ? (
                <span className="px-2 py-1 rounded border border-emerald-500/60 bg-emerald-950/80 text-emerald-300 font-mono text-[9px] font-bold shrink-0">
                  Forjada ✓
                </span>
              ) : (
                <button
                  type="button"
                  disabled={!canCraftRelicNow(selectedRelic.id)}
                  onClick={() => {
                    soundEngine.play('forge');
                    stageCraftRelic(selectedRelic.id);
                  }}
                  aria-label={`Forjar ${selectedRelic.name}`}
                  className="touch-target gui-btn-gold px-2.5 py-1.5 rounded text-[10px] font-serif font-bold uppercase tracking-wider shrink-0 disabled:opacity-40 disabled:pointer-events-none"
                >
                  Forjar
                </button>
              )}
            </div>
          ) : (
            <div
              className={`px-2 py-1 rounded-md border text-[9px] font-mono flex items-center justify-between ${
                isSengoku
                  ? 'bg-[#120d0a]/75 border-amber-900/45 text-amber-200/75'
                  : 'bg-dungeon-surface border-dungeon-border text-slate-300'
              }`}
            >
              <span>Toque em uma relíquia acima para inspecionar e forjar</span>
              <span className="text-amber-300 font-bold shrink-0">{craftableRelicsCount} disp.</span>
            </div>
          )}

          {/* Gems, Minions & Live Score Summary — Unclipped 2-Row Card */}
          <div
            className={`px-2 py-1 rounded-lg border space-y-1 text-[10px] font-mono tabular-nums ${
              isSengoku
                ? 'bg-[#120d0a]/90 border-amber-800/60 text-amber-100'
                : 'bg-dungeon-surface border-dungeon-border text-stone-200'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-1 font-bold" title="Trilha de Gemas (marcos 3, 6, 9)">
                <RelicThumb
                  src="/assets/ui/icon-gem-magatama.webp"
                  alt="Gemas de Esmeralda"
                  className="w-4 h-4 object-contain shrink-0"
                  fallback={<Gem className="w-3.5 h-3.5 text-cyan-500" />}
                />
                Gemas: {party.gems} (+{gemTrackGlory})
              </span>
              <span className="flex items-center gap-1">
                {GEM_MILESTONES.map((gm) => {
                  const iconSrc =
                    gm.threshold === 3
                      ? '/assets/ui/icon-bonus-forge.webp'
                      : gm.threshold === 6
                        ? '/assets/ui/icon-bonus-levelup.webp'
                        : '/assets/ui/icon-potion-slot-full.webp';
                  return (
                    <span
                      key={gm.threshold}
                      title={gm.label}
                      className={`px-1.5 py-0.5 rounded text-[9px] border flex items-center gap-1 shrink-0 ${
                        claimedGemMilestones.includes(gm.threshold) || party.gems >= gm.threshold
                          ? 'bg-emerald-800/75 border-emerald-400 text-emerald-100'
                          : 'bg-black/45 border-stone-700 text-stone-300'
                      }`}
                    >
                      <RelicThumb
                        src={iconSrc}
                        alt=""
                        ariaHidden={true}
                        className="w-3 h-3 object-contain shrink-0"
                        fallback={null}
                      />
                      <span>{gm.threshold}</span>
                    </span>
                  );
                })}
              </span>
            </div>

            <div
              className={`flex items-center justify-between gap-2 pt-1 border-t ${
                isSengoku ? 'border-amber-900/40' : 'border-dungeon-border'
              }`}
            >
              <span className="flex items-center gap-1 font-bold" title="Lacaios derrotados">
                <RelicThumb
                  src="/assets/ui/icon-oni-skull.webp"
                  alt="Lacaios derrotados"
                  className="w-4 h-4 object-contain shrink-0"
                  fallback={null}
                />
                Lacaios: {minionsDefeatedCount} (+{minionTrackGlory})
              </span>
              <span className="text-[10px] font-bold text-amber-300">
                Glória: {liveScore.netGlory} pts
              </span>
            </div>
          </div>
        </div>

        {/* Tactical Missions — Compact Click-to-Expand */}
        <div
          className={`space-y-1 pt-1 border-t ${
            isSengoku ? 'border-amber-900/40' : 'border-dungeon-border'
          }`}
        >
          <h3
            className={`text-[10px] font-serif font-bold tracking-wider uppercase flex items-center gap-1 ${
              isSengoku ? 'text-amber-200' : 'text-slate-200'
            }`}
          >
            <Scroll className="w-3 h-3 text-amber-400" />
            Missões da Expedição
          </h3>

          <div className="grid grid-cols-3 gap-1">
            {missions.map((m) => {
              const isExpanded = expandedMissionId === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => {
                    soundEngine.play('click');
                    setExpandedMissionId((prev) => (prev === m.id ? null : m.id));
                  }}
                  aria-expanded={isExpanded}
                  aria-label={`Missão ${m.title}`}
                  className={`px-1.5 py-1 rounded border text-[9px] font-serif font-bold flex items-center justify-between gap-1 transition-all ${
                    isSengoku
                      ? 'bg-[#e6cf9f] text-[#2a180d] border-[#8b5e34] hover:brightness-105'
                      : 'bg-dungeon-surface border-dungeon-border text-stone-200'
                  } ${m.completed ? 'ring-2 ring-emerald-500' : ''} ${
                    isExpanded ? 'ring-2 ring-amber-400' : ''
                  }`}
                >
                  <span className="truncate flex items-center gap-0.5">
                    {m.completed && (
                      <CheckCircle2 className="w-2.5 h-2.5 text-emerald-700 shrink-0" />
                    )}
                    {SHORT_MISSION_TITLE[m.id] ?? m.title}
                  </span>
                  <span
                    className={`font-mono font-extrabold shrink-0 ${
                      isSengoku ? 'text-red-800' : 'text-amber-400'
                    }`}
                  >
                    +{m.rewardGlory}
                  </span>
                </button>
              );
            })}
          </div>

          {expandedMission && (
            <div
              role="region"
              aria-live="polite"
              className={`px-2 py-1 rounded-md border text-[10px] leading-snug ${
                isSengoku
                  ? 'bg-[#e8d2a6] border-[#8b5e34] text-[#2a180d]'
                  : 'bg-dungeon-surface border-sky-700/60 text-stone-200'
              }`}
            >
              <div className="flex items-center justify-between font-serif font-bold">
                <span>{expandedMission.title}</span>
                <span className="font-mono text-red-800">+{expandedMission.rewardGlory} Glória</span>
              </div>
              <p className="opacity-90 mt-0.5">{expandedMission.description}</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
