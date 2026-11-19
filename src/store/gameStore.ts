import { create } from 'zustand';
import {
  BossOutcome,
  DicePool,
  Die,
  DieColor,
  DieSymbol,
  DungeonCoord,
  DungeonMap,
  FinalScoreBreakdown,
  HeroClass,
  HeroParty,
  MissionCard,
  PendingReward,
  RelicId,
  ThemeId,
  Villain,
} from '../engine/types';
import {
  findMatchingSlotIndex,
  findNextOpenSlotIndex,
  getNextRelicToCraft,
  getRelicById,
  getRelicCount,
  getRelicSlotProgress,
  hasBarrierCrossingAbility,
  getMovementBonusSteps,
  isRelicCompleted,
  RELIC_CATALOG,
} from '../engine/relics';
import { rollDicePool, checkHazardPhase, draftDie, undraftDie } from '../engine/dice';
import {
  createInitialParty,
  levelUpHero,
  applyPartyDamage,
  brewPotion,
  usePotion,
  collectGem,
  advanceRelicSlot,
  HERO_CLOAK_AFFINITY,
  HERO_DIE_SYMBOL,
} from '../engine/heroes';
import {
  getCanonicalMap,
  executeMove,
  rehydrateWalls,
  formatCoordLabel,
  getValidMoves,
} from '../engine/dungeon';
import { resolveMinionEncounter, resolveVillainBattle } from '../engine/combat';
import {
  calculateFinalGloryScore,
  calculateMissionsGlory,
  createInitialMissions,
  evaluateMissions,
} from '../engine/scoring';
import {
  getMinionTrackGlory,
  getNewlyReachedGemMilestones,
  getNewlyReachedPotionMilestones,
  POTION_MILESTONES,
} from '../engine/tracks';
import { createSeededRng, deriveRoundSeed, parseSeedFromUrl } from '../engine/rng';

export interface EventFeedback {
  id: number;
  text: string;
  tone: 'damage' | 'glory' | 'heal' | 'info';
}

export type RewardChoice =
  | { type: 'hero-level'; classType: HeroClass }
  | { type: 'relic-step'; relicId: RelicId }
  | { type: 'gems'; count: number }
  | { type: 'mastery-fallback' };

export interface GameSnapshot {
  party: HeroParty;
  dungeon: DungeonMap;
  dicePool: DicePool;
  consumedDieIds: string[];
  logs: string[];
  minionsDefeatedCount: number;
  minionsGlory: number;
  bossGlory: number;
  bossesDefeated: string[];
  bossOutcomes: Record<string, BossOutcome>;
  pendingRewards: PendingReward[];
  claimedPotionMilestones: number[];
  claimedGemMilestones: number[];
  masteryGlory: number;
  artisanCount: number;
  missions: MissionCard[];
}

export interface GameState {
  seed: number;
  mapId: number;
  theme: ThemeId;
  currentRound: number;
  isGameOver: boolean;
  party: HeroParty;
  dungeon: DungeonMap;
  dicePool: DicePool;
  selectedDieId: string | null;
  consumedDieIds: string[];
  logs: string[];
  minionsDefeatedCount: number;
  minionsGlory: number;
  bossGlory: number;
  bossesDefeated: string[];
  bossOutcomes: Record<string, BossOutcome>;
  pendingBossEncounter: Villain | null;
  pendingRewards: PendingReward[];
  claimedPotionMilestones: number[];
  claimedGemMilestones: number[];
  masteryGlory: number;
  artisanCount: number;
  missions: MissionCard[];
  finalScore: FinalScoreBreakdown | null;
  lastEventFeedback: EventFeedback | null;

  history: GameSnapshot[];
  future: GameSnapshot[];

  setTheme: (theme: ThemeId) => void;
  selectMap: (mapId: number, customSeed?: number) => void;
  resetGame: (customSeed?: number, customMapId?: number) => void;
  selectDie: (dieId: string | null) => void;
  stageDraft: (dieId: string) => void;
  stageMove: (target: DungeonCoord) => void;
  stageLevelUp: (classType: HeroClass) => void;
  stageBrewPotion: () => void;
  stageUsePotion: () => void;
  stageCraftItem: () => void;
  stageCraftRelic: (relicId: RelicId) => void;
  resolvePendingReward: (choice: RewardChoice) => void;
  undo: () => void;
  redo: () => void;
  confirmRound: (options?: { interactive?: boolean }) => void;
  resolvePendingBoss: (choice: 'fight' | 'flee') => void;
  cancelPendingBoss: () => void;
}

const STORAGE_KEY = 'tiny_dungeon_save_v2';
const THEME_STORAGE_KEY = 'tiny_dungeon_theme_v1';

let feedbackSeq = 1;
let rewardSeq = 1;

function makeFeedback(text: string, tone: EventFeedback['tone']): EventFeedback {
  feedbackSeq += 1;
  return { id: feedbackSeq, text, tone };
}

function makePendingReward(
  source: string,
  title: string,
  kind: PendingReward['kind']
): PendingReward {
  rewardSeq += 1;
  return { id: `rw-${rewardSeq}`, source, title, kind };
}

function isTestEnvironment(): boolean {
  const proc = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process;
  return Boolean(proc?.env?.VITEST);
}

function getInitialTheme(): ThemeId {
  if (typeof window === 'undefined') return 'sengoku';
  const params = new URLSearchParams(window.location.search);
  const urlTheme = params.get('theme');
  if (urlTheme === 'sengoku' || urlTheme === 'vesperfall') return urlTheme;
  try {
    const stored = window.localStorage?.getItem(THEME_STORAGE_KEY);
    if (stored === 'sengoku' || stored === 'vesperfall') return stored;
  } catch {
    // Ignore storage read errors
  }
  return 'sengoku';
}

function saveToLocalStorage(state: Partial<GameState>) {
  if (typeof window === 'undefined' || !window.localStorage || isTestEnvironment()) return;
  try {
    const serialized = JSON.stringify({
      seed: state.seed,
      mapId: state.mapId,
      theme: state.theme,
      currentRound: state.currentRound,
      isGameOver: state.isGameOver,
      party: state.party,
      dungeon: state.dungeon,
      dicePool: state.dicePool,
      consumedDieIds: state.consumedDieIds,
      logs: state.logs,
      minionsDefeatedCount: state.minionsDefeatedCount,
      minionsGlory: state.minionsGlory,
      bossGlory: state.bossGlory,
      bossesDefeated: state.bossesDefeated,
      bossOutcomes: state.bossOutcomes,
      claimedPotionMilestones: state.claimedPotionMilestones,
      claimedGemMilestones: state.claimedGemMilestones,
      pendingRewards: state.pendingRewards,
      masteryGlory: state.masteryGlory,
      artisanCount: state.artisanCount,
      missions: state.missions,
      finalScore: state.finalScore,
    });
    window.localStorage.setItem(STORAGE_KEY, serialized);
  } catch (e) {
    console.error('Falha ao salvar progresso local', e);
  }
}

export function migrateSavedParty(party: HeroParty): HeroParty {
  const backfilledRelics: RelicId[] = Array.isArray(party.craftedRelics)
    ? [...party.craftedRelics]
    : [];
  if (!Array.isArray(party.craftedRelics)) {
    const count = Math.max(0, party.magicItems ?? 0);
    while (backfilledRelics.length < count) {
      backfilledRelics.push(getNextRelicToCraft(backfilledRelics));
    }
  }

  const nextProgress: Partial<Record<RelicId, boolean[]>> = {
    ...(party.relicProgress ?? {}),
  };
  for (const id of backfilledRelics) {
    if (!nextProgress[id]) {
      const def = getRelicById(id);
      nextProgress[id] = def.recipe.map(() => true);
    }
  }

  return {
    ...party,
    potionsBrewed: party.potionsBrewed ?? party.potions ?? 0,
    craftedRelics: backfilledRelics,
    relicProgress: nextProgress,
  };
}

function loadFromLocalStorage(): Partial<GameState> | null {
  if (typeof window === 'undefined' || !window.localStorage || isTestEnvironment()) return null;
  const params = new URLSearchParams(window.location.search);
  if (params.has('demo') || params.has('seed')) return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || !parsed.dungeon || !parsed.party || !parsed.dicePool) return null;
    const migratedParty = migrateSavedParty(parsed.party as HeroParty);
    const brewed = migratedParty.potionsBrewed ?? 0;
    const claimedPotionMilestones: number[] = Array.isArray(parsed.claimedPotionMilestones)
      ? parsed.claimedPotionMilestones
      : POTION_MILESTONES.filter((m) => brewed >= m.threshold).map((m) => m.threshold);
    const canonical = getCanonicalMap(parsed.mapId ?? parsed.dungeon.mapId ?? 1);

    return {
      ...parsed,
      party: migratedParty,
      bossOutcomes: parsed.bossOutcomes ?? {},
      pendingBossEncounter: null,
      pendingRewards: Array.isArray(parsed.pendingRewards) ? parsed.pendingRewards : [],
      claimedPotionMilestones,
      claimedGemMilestones: Array.isArray(parsed.claimedGemMilestones)
        ? parsed.claimedGemMilestones
        : [],
      dungeon: {
        ...parsed.dungeon,
        walls: rehydrateWalls(parsed.dungeon.walls || []),
        portals: parsed.dungeon.portals ?? canonical.portals ?? [],
      },
    };
  } catch {
    return null;
  }
}

function collectTriggeredMilestones(params: {
  prevPotionsBrewed: number;
  prevGems: number;
  party: HeroParty;
  claimedPotionMilestones: number[];
  claimedGemMilestones: number[];
  logs: string[];
}): {
  party: HeroParty;
  claimedPotionMilestones: number[];
  claimedGemMilestones: number[];
  queuedRewards: PendingReward[];
} {
  let party = params.party;
  const claimedPotions = [...params.claimedPotionMilestones];
  const claimedGems = [...params.claimedGemMilestones];
  const queuedRewards: PendingReward[] = [];

  const gemMilestones = getNewlyReachedGemMilestones(params.prevGems, party.gems, claimedGems);
  for (const gm of gemMilestones) {
    claimedGems.push(gm.threshold);
    if (gm.kind === 'choose-relic-step') {
      params.logs.push(`Marco de Gemas (${gm.threshold}): Forja Gratuita (+1 casa) desbloqueada!`);
      queuedRewards.push(
        makePendingReward(
          `gem-${gm.threshold}`,
          `Marco de Gemas (${gm.threshold}): Escolha 1 casa de Forja`,
          'choose-relic-step'
        )
      );
    } else if (gm.kind === 'choose-hero-level') {
      params.logs.push(`Marco de Gemas (${gm.threshold}): Upgrade de Herói desbloqueado!`);
      queuedRewards.push(
        makePendingReward(
          `gem-${gm.threshold}`,
          `Marco de Gemas (${gm.threshold}): Escolha 1 Herói para evoluir`,
          'choose-hero-level'
        )
      );
    } else if (gm.kind === 'instant-potions-and-relic') {
      party = brewPotion(party, 2);
      params.logs.push(
        `Marco de Gemas (${gm.threshold}): +2 Poções destiladas e Forja Gratuita (+1 casa)!`
      );
      queuedRewards.push(
        makePendingReward(
          `gem-${gm.threshold}`,
          `Marco de Gemas (${gm.threshold}): +2 Poções e 1 casa de Forja`,
          'choose-relic-step'
        )
      );
    }
  }

  const potionMilestones = getNewlyReachedPotionMilestones(
    params.prevPotionsBrewed,
    party.potionsBrewed ?? 0,
    claimedPotions
  );
  for (const pm of potionMilestones) {
    claimedPotions.push(pm.threshold);
    params.logs.push(`Marco de Poções (${pm.threshold}/12): ${pm.label}!`);
    queuedRewards.push(
      makePendingReward(
        `potion-${pm.threshold}`,
        `Marco de Poções (${pm.threshold}/12): ${pm.label}`,
        pm.kind
      )
    );
  }

  return {
    party,
    claimedPotionMilestones: claimedPotions,
    claimedGemMilestones: claimedGems,
    queuedRewards,
  };
}

function applyRelicSlotWithEffects(params: {
  party: HeroParty;
  relicId: RelicId;
  slotIndex: number;
  masteryGlory: number;
  claimedPotionMilestones: number[];
  claimedGemMilestones: number[];
  logs: string[];
}): {
  party: HeroParty;
  completedNow: boolean;
  masteryGlory: number;
  claimedPotionMilestones: number[];
  claimedGemMilestones: number[];
  queuedRewards: PendingReward[];
  feedback: EventFeedback;
} {
  const prevPotionsBrewed = params.party.potionsBrewed ?? 0;
  const prevGems = params.party.gems;
  const relic = getRelicById(params.relicId);
  const { party: stampedParty, completedNow } = advanceRelicSlot(
    params.party,
    params.relicId,
    params.slotIndex
  );
  let nextParty = stampedParty;
  const queuedRewards: PendingReward[] = [];

  const filled = getRelicSlotProgress(nextParty, params.relicId).filter(Boolean).length;
  const total = relic.recipe.length;

  let feedback: EventFeedback;
  if (completedNow) {
    params.logs.push(`${relic.name} concluída! (${relic.shortBonus})`);
    feedback = makeFeedback(`${relic.name} forjada!`, 'glory');

    if (params.relicId === 'espelho-yata') {
      params.logs.push('Espelho Yata: escolha 1 Herói para ganhar +1 Nível!');
      queuedRewards.push(
        makePendingReward(
          'relic-espelho-yata',
          'Espelho Yata: Escolha 1 Herói para +1 Nível',
          'choose-hero-level'
        )
      );
    }
  } else {
    params.logs.push(`${relic.name}: casa ${filled}/${total} preenchida.`);
    feedback = makeFeedback(`${relic.name} (${filled}/${total})`, 'glory');
  }

  const milestones = collectTriggeredMilestones({
    prevPotionsBrewed,
    prevGems,
    party: nextParty,
    claimedPotionMilestones: params.claimedPotionMilestones,
    claimedGemMilestones: params.claimedGemMilestones,
    logs: params.logs,
  });
  nextParty = milestones.party;

  return {
    party: nextParty,
    completedNow,
    masteryGlory: params.masteryGlory,
    claimedPotionMilestones: milestones.claimedPotionMilestones,
    claimedGemMilestones: milestones.claimedGemMilestones,
    queuedRewards: [...queuedRewards, ...milestones.queuedRewards],
    feedback,
  };
}

function buildFreshRun(seed: number, mapId: number, theme: ThemeId) {
  const dungeon = getCanonicalMap(mapId);
  const rawParty = createInitialParty();
  const dicePool = rollDicePool(createSeededRng(deriveRoundSeed(seed, 1, mapId)));
  const hazard = checkHazardPhase(dicePool);
  const party = hazard.hazardTriggered ? applyPartyDamage(rawParty, hazard.wounds) : rawParty;
  const logs = [
    `Expedição iniciada em ${dungeon.mapName ?? 'Mapa 1'} (Seed #${seed}). Rodada 1 de 8.`,
  ];
  if (hazard.hazardTriggered) {
    logs.push(`Fase de Perigo: 3+ crânios! A comitiva sofreu ${hazard.wounds} ferimento.`);
  }
  return {
    seed,
    mapId,
    theme,
    currentRound: 1,
    isGameOver: false,
    party,
    dungeon,
    dicePool,
    selectedDieId: null,
    consumedDieIds: [] as string[],
    logs,
    minionsDefeatedCount: 0,
    minionsGlory: 0,
    bossGlory: 0,
    bossesDefeated: [] as string[],
    bossOutcomes: {} as Record<string, BossOutcome>,
    pendingBossEncounter: null as Villain | null,
    pendingRewards: [] as PendingReward[],
    claimedPotionMilestones: [] as number[],
    claimedGemMilestones: [] as number[],
    masteryGlory: 0,
    artisanCount: 0,
    missions: createInitialMissions(),
    finalScore: null,
    lastEventFeedback: null,
    history: [] as GameSnapshot[],
    future: [] as GameSnapshot[],
  };
}

function markDieAsConsumed(state: GameState, dieId: string): DicePool {
  let nextPool: DicePool = state.dicePool;
  if (!nextPool.draftedIds.includes(dieId)) {
    if (nextPool.draftedIds.length < 3) {
      nextPool = draftDie(nextPool, dieId);
    } else {
      const replaceable = nextPool.draftedIds.find((id) => !state.consumedDieIds.includes(id));
      const trimmed = replaceable
        ? nextPool.draftedIds.filter((id) => id !== replaceable)
        : nextPool.draftedIds.slice(0, 2);
      nextPool = { ...nextPool, draftedIds: [...trimmed, dieId] };
    }
  }
  const nextUsedIds = [...(nextPool.usedIds ?? []), dieId];
  return { ...nextPool, usedIds: nextUsedIds };
}

function consumeDieForAction(
  state: GameState,
  preferredSymbol?: DieSymbol,
  preferredColor?: DieColor
): {
  ok: boolean;
  consumedId: string | null;
  updatedPool: DicePool;
  matchedColor: boolean;
  matchedSymbol: boolean;
} {
  if (state.consumedDieIds.length >= 3) {
    return {
      ok: false,
      consumedId: null,
      updatedPool: state.dicePool,
      matchedColor: false,
      matchedSymbol: false,
    };
  }

  const available = state.dicePool.dice.filter((d) => !state.consumedDieIds.includes(d.id));
  if (available.length === 0) {
    return {
      ok: false,
      consumedId: null,
      updatedPool: state.dicePool,
      matchedColor: false,
      matchedSymbol: false,
    };
  }

  let chosen = state.selectedDieId
    ? available.find((d) => d.id === state.selectedDieId)
    : undefined;

  if (!chosen) {
    const draftedAvailable = available.filter((d) => state.dicePool.draftedIds.includes(d.id));
    const poolToPick = draftedAvailable.length > 0 ? draftedAvailable : available;
    chosen =
      (preferredSymbol && preferredColor
        ? poolToPick.find((d) => d.symbol === preferredSymbol && d.color === preferredColor)
        : undefined) ??
      (preferredSymbol ? poolToPick.find((d) => d.symbol === preferredSymbol) : undefined) ??
      (preferredColor
        ? poolToPick.find((d) => d.color === preferredColor && d.symbol !== 'skull')
        : undefined) ??
      poolToPick.find((d) => d.symbol !== 'skull') ??
      poolToPick[0];
  }

  if (!chosen) {
    return {
      ok: false,
      consumedId: null,
      updatedPool: state.dicePool,
      matchedColor: false,
      matchedSymbol: false,
    };
  }

  return {
    ok: true,
    consumedId: chosen.id,
    updatedPool: markDieAsConsumed(state, chosen.id),
    matchedColor: preferredColor ? chosen.color === preferredColor : false,
    matchedSymbol: preferredSymbol ? chosen.symbol === preferredSymbol : false,
  };
}

function pickDieForRelic(
  state: GameState,
  relicId: RelicId
): { die: Die | null; slotIndex: number; reason?: string } {
  if (state.consumedDieIds.length >= 3) {
    return { die: null, slotIndex: -1, reason: 'Limite de 3 ações por rodada atingido.' };
  }
  if (isRelicCompleted(state.party, relicId)) {
    return { die: null, slotIndex: -1, reason: 'Esta relíquia já foi totalmente forjada.' };
  }

  const available = state.dicePool.dice.filter((d) => !state.consumedDieIds.includes(d.id));
  if (available.length === 0) {
    return { die: null, slotIndex: -1, reason: 'Nenhum dado disponível nesta rodada.' };
  }

  if (state.selectedDieId) {
    const selected = available.find((d) => d.id === state.selectedDieId);
    if (selected) {
      const slotIndex = findMatchingSlotIndex(state.party, relicId, selected);
      if (slotIndex < 0) {
        return {
          die: null,
          slotIndex: -1,
          reason: 'O dado selecionado não atende aos requisitos desta receita.',
        };
      }
      return { die: selected, slotIndex };
    }
  }

  const drafted = available.filter((d) => state.dicePool.draftedIds.includes(d.id));
  const undrafted = available.filter((d) => !state.dicePool.draftedIds.includes(d.id));
  const ordered = [
    ...drafted.filter((d) => d.symbol !== 'skull'),
    ...drafted.filter((d) => d.symbol === 'skull'),
    ...undrafted.filter((d) => d.symbol !== 'skull'),
    ...undrafted.filter((d) => d.symbol === 'skull'),
  ];

  for (const candidate of ordered) {
    const slotIndex = findMatchingSlotIndex(state.party, relicId, candidate);
    if (slotIndex >= 0) {
      return { die: candidate, slotIndex };
    }
  }

  return {
    die: null,
    slotIndex: -1,
    reason: 'Nenhum dado disponível compatível com esta receita.',
  };
}

export const useGameStore = create<GameState>((set, get) => {
  const initialTheme = getInitialTheme();
  const saved = loadFromLocalStorage();
  const baseSeed = parseSeedFromUrl();
  const fresh = buildFreshRun(baseSeed, 1, initialTheme);

  const initialState = saved
    ? {
        ...fresh,
        ...saved,
        theme: initialTheme,
        history: [],
        future: [],
      }
    : fresh;

  const takeSnapshot = (state: GameState): GameSnapshot => ({
    party: JSON.parse(JSON.stringify(state.party)),
    dungeon: {
      ...JSON.parse(JSON.stringify(state.dungeon)),
      walls: rehydrateWalls(state.dungeon.walls),
    },
    dicePool: JSON.parse(JSON.stringify(state.dicePool)),
    consumedDieIds: [...state.consumedDieIds],
    logs: [...state.logs],
    minionsDefeatedCount: state.minionsDefeatedCount,
    minionsGlory: state.minionsGlory,
    bossGlory: state.bossGlory,
    bossesDefeated: [...state.bossesDefeated],
    bossOutcomes: { ...state.bossOutcomes },
    pendingRewards: JSON.parse(JSON.stringify(state.pendingRewards)),
    claimedPotionMilestones: [...state.claimedPotionMilestones],
    claimedGemMilestones: [...state.claimedGemMilestones],
    masteryGlory: state.masteryGlory,
    artisanCount: state.artisanCount,
    missions: JSON.parse(JSON.stringify(state.missions)),
  });

  const applyBossCombatOutcome = (params: {
    party: HeroParty;
    villain: Villain;
    bossGlory: number;
    bossesDefeated: string[];
    bossOutcomes: Record<string, BossOutcome>;
    logs: string[];
  }): {
    party: HeroParty;
    bossGlory: number;
    bossesDefeated: string[];
    bossOutcomes: Record<string, BossOutcome>;
    feedback: EventFeedback;
  } => {
    const { party, villain, logs } = params;
    let nextParty = party;
    let nextBossGlory = params.bossGlory;
    const nextBossesDefeated = [...params.bossesDefeated];
    const nextBossOutcomes = { ...params.bossOutcomes };

    const outcome = resolveVillainBattle(nextParty, villain);
    logs.push(`Confronto contra o Chefe ${villain.name}! (Poder do Grupo: ${outcome.partyPower})`);

    let feedback: EventFeedback;
    if (outcome.tier === 1) {
      logs.push(`Vitória Heroica (Nível 1)! +${outcome.gloryEarned} pontos de glória!`);
      nextBossGlory += outcome.gloryEarned;
      nextBossesDefeated.push(villain.name);
      nextBossOutcomes[villain.id] = 'defeated';
      feedback = makeFeedback(`${villain.name} derrotado! +${outcome.gloryEarned} Glória`, 'glory');
    } else if (outcome.tier === 2) {
      logs.push(`Vitória Padrão (Nível 2)! +${outcome.gloryEarned} pontos de glória!`);
      nextBossGlory += outcome.gloryEarned;
      nextBossesDefeated.push(villain.name);
      nextBossOutcomes[villain.id] = 'defeated';
      feedback = makeFeedback(`${villain.name} vencido! +${outcome.gloryEarned} Glória`, 'glory');
    } else {
      logs.push(`Derrota contra ${villain.name}! A comitiva sofreu ${outcome.woundsTaken} de dano!`);
      nextParty = applyPartyDamage(nextParty, outcome.woundsTaken);
      nextBossOutcomes[villain.id] = 'victorious';
      feedback = makeFeedback(`Derrota no Chefe! -${outcome.woundsTaken} Vida`, 'damage');
    }

    return {
      party: nextParty,
      bossGlory: nextBossGlory,
      bossesDefeated: nextBossesDefeated,
      bossOutcomes: nextBossOutcomes,
      feedback,
    };
  };

  const advanceAfterBossResolution = (params: {
    state: GameState;
    party: HeroParty;
    bossGlory: number;
    bossesDefeated: string[];
    bossOutcomes: Record<string, BossOutcome>;
    logs: string[];
    feedback: EventFeedback;
  }) => {
    const { state, bossGlory, bossesDefeated, bossOutcomes, logs } = params;
    let currentParty = params.party;
    let feedback = params.feedback;

    const missions = evaluateMissions({
      missions: state.missions,
      minionsDefeatedCount: state.minionsDefeatedCount,
      potionsAndItemsCount: state.artisanCount,
      visitedCount: state.dungeon.visitedCoords.length,
    });

    if (state.currentRound >= 8) {
      const missionsGlory = calculateMissionsGlory(missions);
      const finalScore = calculateFinalGloryScore({
        party: currentParty,
        minionsDefeatedCount: state.minionsDefeatedCount,
        minionsGlory: state.minionsGlory,
        bossGlory,
        gemsCount: currentParty.gems,
        itemsCrafted: currentParty.magicItems,
        missionsGlory,
        masteryGlory: state.masteryGlory,
      });

      logs.push(`Expedição concluída! Glória Final: ${finalScore.netGlory} pontos.`);

      set({
        isGameOver: true,
        party: currentParty,
        bossGlory,
        bossesDefeated,
        bossOutcomes,
        pendingBossEncounter: null,
        missions,
        finalScore,
        logs,
        history: [],
        future: [],
        lastEventFeedback: makeFeedback(`Expedição concluída: ${finalScore.netGlory} Glória!`, 'glory'),
      });
      saveToLocalStorage(get());
      return;
    }

    const nextRound = state.currentRound + 1;
    const nextDicePool = rollDicePool(
      createSeededRng(deriveRoundSeed(state.seed, nextRound, state.mapId))
    );
    const hazard = checkHazardPhase(nextDicePool);

    logs.push(`Iniciando Rodada ${nextRound}. Novos dados rolados.`);
    if (hazard.hazardTriggered) {
      const sealReduction = getRelicCount(currentParty, 'selo-onmyo');
      const effectiveWounds = Math.max(0, hazard.wounds - sealReduction);
      if (effectiveWounds > 0) {
        currentParty = applyPartyDamage(currentParty, effectiveWounds);
        logs.push(`Fase de Perigo: 3+ crânios! A comitiva sofreu ${effectiveWounds} ferimento.`);
        feedback = makeFeedback(`Fase de Perigo! -${effectiveWounds} Vida`, 'damage');
      } else {
        logs.push('Selo Onmyō bloqueou a Fase de Perigo (0 ferimento)!');
      }
    }

    set({
      currentRound: nextRound,
      party: currentParty,
      bossGlory,
      bossesDefeated,
      bossOutcomes,
      pendingBossEncounter: null,
      missions,
      dicePool: nextDicePool,
      selectedDieId: null,
      consumedDieIds: [],
      logs,
      history: [],
      future: [],
      lastEventFeedback: feedback,
    });

    saveToLocalStorage(get());
  };

  return {
    ...initialState,

    setTheme: (theme: ThemeId) => {
      if (typeof window !== 'undefined' && !isTestEnvironment()) {
        try {
          window.localStorage?.setItem(THEME_STORAGE_KEY, theme);
        } catch {
          // Ignore storage error
        }
      }
      set({
        theme,
        lastEventFeedback: makeFeedback(
          theme === 'sengoku' ? 'Tema: Sengoku & Nanquim' : 'Tema: Vesperfall Obsidian',
          'info'
        ),
      });
      saveToLocalStorage(get());
    },

    selectMap: (mapId: number, customSeed?: number) => {
      const nextSeed = customSeed ?? parseSeedFromUrl();
      const freshRun = buildFreshRun(nextSeed, mapId, get().theme);
      set(freshRun);
      saveToLocalStorage(get());
    },

    resetGame: (customSeed?: number, customMapId?: number) => {
      const state = get();
      const nextSeed = customSeed ?? parseSeedFromUrl();
      const nextMapId = customMapId ?? state.mapId ?? 1;
      const freshRun = buildFreshRun(nextSeed, nextMapId, state.theme);
      set(freshRun);
      saveToLocalStorage(get());
    },

    selectDie: (dieId: string | null) => {
      set({ selectedDieId: dieId });
    },

    stageDraft: (dieId: string) => {
      const state = get();
      if (state.isGameOver) return;
      if (state.consumedDieIds.includes(dieId)) {
        return;
      }

      if (state.dicePool.draftedIds.includes(dieId)) {
        const snapshot = takeSnapshot(state);
        const updatedPool = undraftDie(state.dicePool, dieId);
        set({
          history: [...state.history, snapshot],
          future: [],
          dicePool: updatedPool,
          selectedDieId: state.selectedDieId === dieId ? null : state.selectedDieId,
        });
        return;
      }

      if (state.dicePool.draftedIds.length >= 3) {
        return;
      }

      const snapshot = takeSnapshot(state);
      const updatedPool = draftDie(state.dicePool, dieId);
      set({
        history: [...state.history, snapshot],
        future: [],
        dicePool: updatedPool,
        selectedDieId: dieId,
      });
    },

    stageMove: (target: DungeonCoord) => {
      const state = get();
      if (state.isGameOver) return;

      const maxSteps = 2 + getMovementBonusSteps(state.party);
      const canCrossBarriers = hasBarrierCrossingAbility(state.party);
      const validMoves = getValidMoves(state.dungeon, state.dungeon.currentCoord, maxSteps, {
        canCrossBarriers,
      });
      const isReachable = validMoves.some((m) => m.x === target.x && m.y === target.y);

      if (!isReachable) {
        const targetRoom = state.dungeon.rooms[`${target.x},${target.y}`];
        const blockedMsg =
          targetRoom?.locked && !canCrossBarriers
            ? 'Sala trancada! Forje o Gancho Kaginawa para entrar.'
            : 'Movimento fora do alcance ou bloqueado por parede.';
        set({
          logs: [...state.logs, blockedMsg],
          lastEventFeedback: makeFeedback(
            targetRoom?.locked && !canCrossBarriers ? 'Sala Trancada 🔒' : 'Caminho bloqueado',
            'info'
          ),
        });
        return;
      }

      const consumption = consumeDieForAction(state, 'boot');
      if (!consumption.ok || !consumption.consumedId) {
        set({
          logs: [...state.logs, 'Limite de 3 ações por rodada atingido. Confirme a rodada.'],
          lastEventFeedback: makeFeedback('Sem ações restantes na rodada', 'info'),
        });
        return;
      }

      const snapshot = takeSnapshot(state);
      const { updatedMap, events } = executeMove(state.dungeon, target);

      let currentParty = state.party;
      const prevPotionsBrewed = currentParty.potionsBrewed ?? 0;
      const prevGems = currentParty.gems;
      let minionsDefeatedCount = state.minionsDefeatedCount;
      let minionsGlory = state.minionsGlory;
      let artisanCount = state.artisanCount;
      let masteryGlory = state.masteryGlory + (consumption.matchedSymbol ? 1 : 0);
      const newLogs = [...state.logs];
      const queuedRewards: PendingReward[] = [];
      let feedback: EventFeedback = makeFeedback(
        `Moveu para ${formatCoordLabel(target)}${consumption.matchedSymbol ? ' (+1 Maestria)' : ''}`,
        consumption.matchedSymbol ? 'glory' : 'info'
      );

      events.forEach((ev) => {
        newLogs.push(ev.description);
        if (ev.type === 'minion' && ev.payload) {
          const outcome = resolveMinionEncounter(currentParty, ev.payload);
          minionsDefeatedCount += 1;
          minionsGlory = getMinionTrackGlory(minionsDefeatedCount);
          if (outcome.woundsTaken > 0) {
            currentParty = applyPartyDamage(currentParty, outcome.woundsTaken);
            newLogs.push(
              `Sofreu ${outcome.woundsTaken} ferimento(s) enfrentando ${ev.payload.name}. (Trilha de Lacaios: +${minionsGlory} Glória)`
            );
            feedback = makeFeedback(
              `-${outcome.woundsTaken} Vida • Lacaios +${minionsGlory}`,
              'damage'
            );
          } else {
            newLogs.push(
              `Comitiva superou ${ev.payload.name} sem ferimentos (Trilha de Lacaios: +${minionsGlory} Glória)!`
            );
            feedback = makeFeedback(`Lacaio vencido! (Total +${minionsGlory} pts)`, 'glory');
          }
        } else if (ev.type === 'trap' && typeof ev.payload === 'number') {
          const omamoriReduction = getRelicCount(currentParty, 'amuleto-omamori') * 2;
          const effectiveDamage = Math.max(0, ev.payload - omamoriReduction);
          if (effectiveDamage === 0) {
            newLogs.push('Amuleto Omamori neutralizou a armadilha (0 dano)!');
            feedback = makeFeedback('Armadilha neutralizada! (Omamori)', 'heal');
          } else {
            currentParty = applyPartyDamage(currentParty, effectiveDamage);
            if (omamoriReduction > 0) {
              newLogs.push(
                `Amuleto Omamori reduziu o dano da armadilha para ${effectiveDamage} ferimento(s).`
              );
            }
            feedback = makeFeedback(`Armadilha! -${effectiveDamage} Vida`, 'damage');
          }
        } else if (ev.type === 'gem' && typeof ev.payload === 'number') {
          currentParty = collectGem(currentParty, ev.payload);
          feedback = makeFeedback(`+${ev.payload} Gema(s) coletada(s)!`, 'glory');
        } else if (ev.type === 'potion' && typeof ev.payload === 'number') {
          currentParty = brewPotion(currentParty, ev.payload);
          artisanCount += 1;
          feedback = makeFeedback(`+${ev.payload} Poção(ões) na Fonte!`, 'heal');
        } else if (ev.type === 'item') {
          const hasIncompleteRelic = RELIC_CATALOG.some(
            (r) => !isRelicCompleted(currentParty, r.id)
          );
          if (hasIncompleteRelic) {
            queuedRewards.push(
              makePendingReward(
                `room-item-${formatCoordLabel(target)}`,
                `Oficina em ${formatCoordLabel(target)}: Forja Gratuita (+1 casa)`,
                'choose-relic-step'
              )
            );
            feedback = makeFeedback('Oficina! Escolha 1 casa de Forja', 'glory');
          } else {
            masteryGlory += 3;
            newLogs.push('Todas as 8 relíquias completas! +3 Maestria bônus.');
            feedback = makeFeedback('Todas relíquias completas (+3 Maestria)', 'glory');
          }
        }
      });

      const milestones = collectTriggeredMilestones({
        prevPotionsBrewed,
        prevGems,
        party: currentParty,
        claimedPotionMilestones: state.claimedPotionMilestones,
        claimedGemMilestones: state.claimedGemMilestones,
        logs: newLogs,
      });
      currentParty = milestones.party;
      const combinedRewards = [...state.pendingRewards, ...queuedRewards, ...milestones.queuedRewards];

      const nextMissions = evaluateMissions({
        missions: state.missions,
        minionsDefeatedCount,
        potionsAndItemsCount: artisanCount,
        visitedCount: updatedMap.visitedCoords.length,
      });

      set({
        history: [...state.history, snapshot],
        future: [],
        dungeon: updatedMap,
        party: currentParty,
        dicePool: consumption.updatedPool,
        consumedDieIds: [...state.consumedDieIds, consumption.consumedId],
        selectedDieId: null,
        minionsDefeatedCount,
        minionsGlory,
        masteryGlory,
        artisanCount,
        pendingRewards: combinedRewards,
        claimedPotionMilestones: milestones.claimedPotionMilestones,
        claimedGemMilestones: milestones.claimedGemMilestones,
        missions: nextMissions,
        logs: newLogs,
        lastEventFeedback: feedback,
      });
    },

    stageLevelUp: (classType: HeroClass) => {
      const state = get();
      if (state.isGameOver) return;
      const hero = state.party.heroes[classType];
      if (hero.level >= hero.maxLevel) return;

      const preferredSymbol = HERO_DIE_SYMBOL[classType];
      const preferredColor = HERO_CLOAK_AFFINITY[classType];
      const consumption = consumeDieForAction(state, preferredSymbol, preferredColor);
      if (!consumption.ok || !consumption.consumedId) {
        set({
          logs: [...state.logs, 'Limite de 3 ações por rodada atingido. Confirme a rodada.'],
          lastEventFeedback: makeFeedback('Sem ações restantes na rodada', 'info'),
        });
        return;
      }

      const snapshot = takeSnapshot(state);
      const updatedParty = levelUpHero(state.party, classType);
      const bonusMastery = consumption.matchedSymbol || consumption.matchedColor ? 1 : 0;
      const heroLabels: Record<HeroClass, string> = {
        warrior: 'Guerreiro',
        mage: 'Mago',
        cleric: 'Clérigo',
        rogue: 'Ladino',
      };
      const newLogs = [
        ...state.logs,
        `${heroLabels[classType]} subiu para o Nível ${updatedParty.heroes[classType].level}!${
          bonusMastery > 0 ? ' (+1 Maestria por afinidade de dado)' : ''
        }`,
      ];

      set({
        history: [...state.history, snapshot],
        future: [],
        party: updatedParty,
        dicePool: consumption.updatedPool,
        consumedDieIds: [...state.consumedDieIds, consumption.consumedId],
        selectedDieId: null,
        masteryGlory: state.masteryGlory + bonusMastery,
        logs: newLogs,
        lastEventFeedback: makeFeedback(
          `${heroLabels[classType]} Nv.${updatedParty.heroes[classType].level}${
            bonusMastery ? ' (+1 Maestria)' : ''
          }`,
          'glory'
        ),
      });
    },

    stageBrewPotion: () => {
      const state = get();
      if (state.isGameOver) return;

      const consumption = consumeDieForAction(state);
      if (!consumption.ok || !consumption.consumedId) {
        set({
          logs: [...state.logs, 'Limite de 3 ações por rodada atingido. Confirme a rodada.'],
          lastEventFeedback: makeFeedback('Sem ações restantes na rodada', 'info'),
        });
        return;
      }

      const snapshot = takeSnapshot(state);
      const prevPotionsBrewed = state.party.potionsBrewed ?? 0;
      const updatedParty = brewPotion(state.party, 2);
      const artisanCount = state.artisanCount + 1;
      const newLogs = [
        ...state.logs,
        `Poções destiladas (+2 poções no estoque; Trilha: ${updatedParty.potionsBrewed ?? 0}/12).`,
      ];

      const milestones = collectTriggeredMilestones({
        prevPotionsBrewed,
        prevGems: updatedParty.gems,
        party: updatedParty,
        claimedPotionMilestones: state.claimedPotionMilestones,
        claimedGemMilestones: state.claimedGemMilestones,
        logs: newLogs,
      });

      const nextMissions = evaluateMissions({
        missions: state.missions,
        minionsDefeatedCount: state.minionsDefeatedCount,
        potionsAndItemsCount: artisanCount,
        visitedCount: state.dungeon.visitedCoords.length,
      });

      set({
        history: [...state.history, snapshot],
        future: [],
        party: milestones.party,
        dicePool: consumption.updatedPool,
        consumedDieIds: [...state.consumedDieIds, consumption.consumedId],
        selectedDieId: null,
        artisanCount,
        pendingRewards: [...state.pendingRewards, ...milestones.queuedRewards],
        claimedPotionMilestones: milestones.claimedPotionMilestones,
        claimedGemMilestones: milestones.claimedGemMilestones,
        missions: nextMissions,
        logs: newLogs,
        lastEventFeedback: makeFeedback('+2 Poções Destiladas', 'heal'),
      });
    },

    stageUsePotion: () => {
      const state = get();
      if (state.isGameOver) return;
      if (state.party.potions <= 0 || state.party.currentHealth >= state.party.maxHealth) return;

      const snapshot = takeSnapshot(state);
      const updatedParty = usePotion(state.party);
      const healed = updatedParty.currentHealth - state.party.currentHealth;

      set({
        history: [...state.history, snapshot],
        future: [],
        party: updatedParty,
        logs: [...state.logs, `Poção consumida! Comitiva recuperou +${healed} de vida.`],
        lastEventFeedback: makeFeedback(`+${healed} Vida Restaurada`, 'heal'),
      });
    },

    stageCraftRelic: (relicId: RelicId) => {
      const state = get();
      if (state.isGameOver) return;

      const picked = pickDieForRelic(state, relicId);
      if (!picked.die || picked.slotIndex < 0) {
        if (picked.reason) {
          set({
            logs: [...state.logs, picked.reason],
            lastEventFeedback: makeFeedback(picked.reason, 'info'),
          });
        }
        return;
      }

      const snapshot = takeSnapshot(state);
      const newLogs = [...state.logs];
      const stamped = applyRelicSlotWithEffects({
        party: state.party,
        relicId,
        slotIndex: picked.slotIndex,
        masteryGlory: state.masteryGlory,
        claimedPotionMilestones: state.claimedPotionMilestones,
        claimedGemMilestones: state.claimedGemMilestones,
        logs: newLogs,
      });

      const artisanCount = state.artisanCount + 1;
      const nextMissions = evaluateMissions({
        missions: state.missions,
        minionsDefeatedCount: state.minionsDefeatedCount,
        potionsAndItemsCount: artisanCount,
        visitedCount: state.dungeon.visitedCoords.length,
      });

      set({
        history: [...state.history, snapshot],
        future: [],
        party: stamped.party,
        dicePool: markDieAsConsumed(state, picked.die.id),
        consumedDieIds: [...state.consumedDieIds, picked.die.id],
        selectedDieId: null,
        masteryGlory: stamped.masteryGlory,
        artisanCount,
        pendingRewards: [...state.pendingRewards, ...stamped.queuedRewards],
        claimedPotionMilestones: stamped.claimedPotionMilestones,
        claimedGemMilestones: stamped.claimedGemMilestones,
        missions: nextMissions,
        logs: newLogs,
        lastEventFeedback: stamped.feedback,
      });
    },

    stageCraftItem: () => {
      const state = get();
      if (state.isGameOver) return;

      for (const relic of RELIC_CATALOG) {
        const picked = pickDieForRelic(state, relic.id);
        if (picked.die && picked.slotIndex >= 0) {
          get().stageCraftRelic(relic.id);
          return;
        }
      }

      const msg =
        state.consumedDieIds.length >= 3
          ? 'Limite de 3 ações por rodada atingido. Confirme a rodada.'
          : 'Nenhum dado compatível com as receitas abertas de relíquias.';
      set({
        logs: [...state.logs, msg],
        lastEventFeedback: makeFeedback(msg, 'info'),
      });
    },

    resolvePendingReward: (choice: RewardChoice) => {
      const state = get();
      if (state.isGameOver || state.pendingRewards.length === 0) return;

      const snapshot = takeSnapshot(state);
      const [currentReward, ...restRewards] = state.pendingRewards;
      let party = state.party;
      const prevPotionsBrewed = party.potionsBrewed ?? 0;
      const prevGems = party.gems;
      let masteryGlory = state.masteryGlory;
      const logs = [...state.logs];
      let queuedExtra: PendingReward[] = [];
      let claimedPotions = state.claimedPotionMilestones;
      let claimedGems = state.claimedGemMilestones;
      let feedback: EventFeedback = makeFeedback('Recompensa aplicada!', 'glory');

      if (choice.type === 'hero-level') {
        const hero = party.heroes[choice.classType];
        if (hero.level < hero.maxLevel) {
          party = levelUpHero(party, choice.classType);
          const labels: Record<HeroClass, string> = {
            warrior: 'Guerreiro',
            mage: 'Mago',
            cleric: 'Clérigo',
            rogue: 'Ladino',
          };
          logs.push(
            `${currentReward.title}: ${labels[choice.classType]} evoluiu para Nv.${party.heroes[choice.classType].level}!`
          );
          feedback = makeFeedback(`${labels[choice.classType]} +1 Nível!`, 'glory');
        } else {
          masteryGlory += 2;
          logs.push(`${currentReward.title}: herói no nível máximo — +2 Maestria.`);
          feedback = makeFeedback('+2 Maestria bônus', 'glory');
        }
      } else if (choice.type === 'relic-step') {
        const slotIndex = findNextOpenSlotIndex(party, choice.relicId);
        if (slotIndex >= 0) {
          const stamped = applyRelicSlotWithEffects({
            party,
            relicId: choice.relicId,
            slotIndex,
            masteryGlory,
            claimedPotionMilestones: claimedPotions,
            claimedGemMilestones: claimedGems,
            logs,
          });
          party = stamped.party;
          masteryGlory = stamped.masteryGlory;
          claimedPotions = stamped.claimedPotionMilestones;
          claimedGems = stamped.claimedGemMilestones;
          queuedExtra = stamped.queuedRewards;
          feedback = stamped.feedback;
        } else {
          masteryGlory += 2;
          logs.push(`${currentReward.title}: todas relíquias completas — +2 Maestria.`);
          feedback = makeFeedback('+2 Maestria bônus', 'glory');
        }
      } else if (choice.type === 'gems') {
        party = collectGem(party, choice.count);
        logs.push(`${currentReward.title}: +${choice.count} Gemas coletadas!`);
        const milestones = collectTriggeredMilestones({
          prevPotionsBrewed,
          prevGems,
          party,
          claimedPotionMilestones: claimedPotions,
          claimedGemMilestones: claimedGems,
          logs,
        });
        party = milestones.party;
        claimedPotions = milestones.claimedPotionMilestones;
        claimedGems = milestones.claimedGemMilestones;
        queuedExtra = milestones.queuedRewards;
        feedback = makeFeedback(`+${choice.count} Gemas obtidas!`, 'glory');
      } else {
        masteryGlory += 2;
        logs.push(`${currentReward.title}: +2 Maestria concedida.`);
        feedback = makeFeedback('+2 Maestria bônus', 'glory');
      }

      set({
        history: [...state.history, snapshot],
        future: [],
        party,
        masteryGlory,
        pendingRewards: [...restRewards, ...queuedExtra],
        claimedPotionMilestones: claimedPotions,
        claimedGemMilestones: claimedGems,
        logs,
        lastEventFeedback: feedback,
      });
    },

    undo: () => {
      const state = get();
      if (state.history.length === 0 || state.pendingBossEncounter) return;

      const previous = state.history[state.history.length - 1];
      const newHistory = state.history.slice(0, state.history.length - 1);
      const currentSnapshot = takeSnapshot(state);

      set({
        party: previous.party,
        dungeon: {
          ...previous.dungeon,
          walls: rehydrateWalls(previous.dungeon.walls),
        },
        dicePool: previous.dicePool,
        consumedDieIds: previous.consumedDieIds,
        logs: previous.logs,
        minionsDefeatedCount: previous.minionsDefeatedCount,
        minionsGlory: previous.minionsGlory,
        bossGlory: previous.bossGlory,
        bossesDefeated: previous.bossesDefeated,
        bossOutcomes: previous.bossOutcomes,
        pendingRewards: previous.pendingRewards,
        claimedPotionMilestones: previous.claimedPotionMilestones,
        claimedGemMilestones: previous.claimedGemMilestones,
        masteryGlory: previous.masteryGlory,
        artisanCount: previous.artisanCount,
        missions: previous.missions,
        selectedDieId: null,
        history: newHistory,
        future: [currentSnapshot, ...state.future],
        lastEventFeedback: makeFeedback('Ação desfeita', 'info'),
      });
    },

    redo: () => {
      const state = get();
      if (state.future.length === 0 || state.pendingBossEncounter) return;

      const next = state.future[0];
      const newFuture = state.future.slice(1);
      const currentSnapshot = takeSnapshot(state);

      set({
        party: next.party,
        dungeon: {
          ...next.dungeon,
          walls: rehydrateWalls(next.dungeon.walls),
        },
        dicePool: next.dicePool,
        consumedDieIds: next.consumedDieIds,
        logs: next.logs,
        minionsDefeatedCount: next.minionsDefeatedCount,
        minionsGlory: next.minionsGlory,
        bossGlory: next.bossGlory,
        bossesDefeated: next.bossesDefeated,
        bossOutcomes: next.bossOutcomes,
        pendingRewards: next.pendingRewards,
        claimedPotionMilestones: next.claimedPotionMilestones,
        claimedGemMilestones: next.claimedGemMilestones,
        masteryGlory: next.masteryGlory,
        artisanCount: next.artisanCount,
        missions: next.missions,
        selectedDieId: null,
        history: [...state.history, currentSnapshot],
        future: newFuture,
        lastEventFeedback: makeFeedback('Ação refeita', 'info'),
      });
    },

    confirmRound: (options?: { interactive?: boolean }) => {
      const state = get();
      if (state.isGameOver || state.pendingBossEncounter) return;

      const isBossRound =
        state.currentRound === 3 || state.currentRound === 6 || state.currentRound === 8;
      const bossRoom = isBossRound
        ? Object.values(state.dungeon.rooms).find(
            (r) => r.type === 'boss' && r.villain && r.villain.round === state.currentRound
          )
        : undefined;

      if (options?.interactive && bossRoom?.villain && !state.bossOutcomes[bossRoom.villain.id]) {
        set({
          pendingBossEncounter: bossRoom.villain,
        });
        return;
      }

      let currentParty = state.party;
      let bossGlory = state.bossGlory;
      let bossesDefeated = [...state.bossesDefeated];
      let bossOutcomes = { ...state.bossOutcomes };
      const newLogs = [...state.logs, `Rodada ${state.currentRound} encerrada.`];
      let feedback: EventFeedback = makeFeedback(`Rodada ${state.currentRound} confirmada`, 'info');

      if (bossRoom?.villain) {
        const resolved = applyBossCombatOutcome({
          party: currentParty,
          villain: bossRoom.villain,
          bossGlory,
          bossesDefeated,
          bossOutcomes,
          logs: newLogs,
        });
        currentParty = resolved.party;
        bossGlory = resolved.bossGlory;
        bossesDefeated = resolved.bossesDefeated;
        bossOutcomes = resolved.bossOutcomes;
        feedback = resolved.feedback;
      }

      advanceAfterBossResolution({
        state,
        party: currentParty,
        bossGlory,
        bossesDefeated,
        bossOutcomes,
        logs: newLogs,
        feedback,
      });
    },

    resolvePendingBoss: (choice: 'fight' | 'flee') => {
      const state = get();
      const villain = state.pendingBossEncounter;
      if (!villain || state.isGameOver) return;

      let currentParty = state.party;
      let bossGlory = state.bossGlory;
      let bossesDefeated = [...state.bossesDefeated];
      let bossOutcomes = { ...state.bossOutcomes };
      const newLogs = [...state.logs, `Rodada ${state.currentRound} encerrada.`];
      let feedback: EventFeedback;

      if (choice === 'flee') {
        currentParty = applyPartyDamage(currentParty, 1);
        bossOutcomes[villain.id] = 'victorious';
        newLogs.push(
          `Comitiva recuou diante de ${villain.name} (-1 vida). Chefe saiu vitorioso!`
        );
        feedback = makeFeedback('Recuo tático! -1 Vida', 'damage');
      } else {
        const resolved = applyBossCombatOutcome({
          party: currentParty,
          villain,
          bossGlory,
          bossesDefeated,
          bossOutcomes,
          logs: newLogs,
        });
        currentParty = resolved.party;
        bossGlory = resolved.bossGlory;
        bossesDefeated = resolved.bossesDefeated;
        bossOutcomes = resolved.bossOutcomes;
        feedback = resolved.feedback;
      }

      advanceAfterBossResolution({
        state,
        party: currentParty,
        bossGlory,
        bossesDefeated,
        bossOutcomes,
        logs: newLogs,
        feedback,
      });
    },

    cancelPendingBoss: () => {
      if (get().pendingBossEncounter) {
        set({ pendingBossEncounter: null });
      }
    },
  };
});
