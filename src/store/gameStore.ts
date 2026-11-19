import { create } from 'zustand';
import {
  BossOutcome,
  DicePool,
  DieColor,
  DieSymbol,
  DungeonCoord,
  DungeonMap,
  FinalScoreBreakdown,
  HeroClass,
  HeroParty,
  MissionCard,
  RelicId,
  ThemeId,
  Villain,
} from '../engine/types';
import { getNextRelicToCraft, getRelicById, getRelicCount } from '../engine/relics';
import { rollDicePool, checkHazardPhase, draftDie, undraftDie } from '../engine/dice';
import {
  createInitialParty,
  levelUpHero,
  applyPartyDamage,
  brewPotion,
  usePotion,
  craftItem,
  collectGem,
  HERO_CLOAK_AFFINITY,
  HERO_DIE_SYMBOL,
} from '../engine/heroes';
import {
  getCanonicalMap,
  executeMove,
  rehydrateWalls,
  formatCoordLabel,
} from '../engine/dungeon';
import { resolveMinionEncounter, resolveVillainBattle } from '../engine/combat';
import {
  calculateFinalGloryScore,
  calculateMissionsGlory,
  createInitialMissions,
  evaluateMissions,
} from '../engine/scoring';
import { createSeededRng, deriveRoundSeed, parseSeedFromUrl } from '../engine/rng';

export interface EventFeedback {
  id: number;
  text: string;
  tone: 'damage' | 'glory' | 'heal' | 'info';
}

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
  undo: () => void;
  redo: () => void;
  confirmRound: (options?: { interactive?: boolean }) => void;
  resolvePendingBoss: (choice: 'fight' | 'flee') => void;
  cancelPendingBoss: () => void;
}

const STORAGE_KEY = 'tiny_dungeon_save_v2';
const THEME_STORAGE_KEY = 'tiny_dungeon_theme_v1';

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
  if (Array.isArray(party.craftedRelics)) {
    return party;
  }
  const backfilled: RelicId[] = [];
  const count = Math.max(0, party.magicItems ?? 0);
  while (backfilled.length < count) {
    backfilled.push(getNextRelicToCraft(backfilled));
  }
  return {
    ...party,
    craftedRelics: backfilled,
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
    return {
      ...parsed,
      party: migrateSavedParty(parsed.party as HeroParty),
      bossOutcomes: parsed.bossOutcomes ?? {},
      pendingBossEncounter: null,
      dungeon: {
        ...parsed.dungeon,
        walls: rehydrateWalls(parsed.dungeon.walls || []),
      },
    };
  } catch {
    return null;
  }
}

function forgeNextRelic(party: HeroParty, masteryGlory: number) {
  const relicId = getNextRelicToCraft(party.craftedRelics ?? []);
  const nextParty = craftItem(party, relicId);
  const relic = getRelicById(relicId);
  const nextMasteryGlory = masteryGlory + (relicId === 'espelho-yata' ? 1 : 0);
  return { nextParty, relic, nextMasteryGlory };
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
    masteryGlory: 0,
    artisanCount: 0,
    missions: createInitialMissions(),
    finalScore: null,
    lastEventFeedback: null,
    history: [] as GameSnapshot[],
    future: [] as GameSnapshot[],
  };
}

let feedbackSeq = 1;
function makeFeedback(text: string, tone: EventFeedback['tone']): EventFeedback {
  feedbackSeq += 1;
  return { id: feedbackSeq, text, tone };
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

  let chosen =
    state.selectedDieId ? available.find((d) => d.id === state.selectedDieId) : undefined;

  if (!chosen) {
    const draftedAvailable = available.filter((d) => state.dicePool.draftedIds.includes(d.id));
    const poolToPick = draftedAvailable.length > 0 ? draftedAvailable : available;
    chosen =
      (preferredSymbol && preferredColor
        ? poolToPick.find((d) => d.symbol === preferredSymbol && d.color === preferredColor)
        : undefined) ??
      (preferredSymbol ? poolToPick.find((d) => d.symbol === preferredSymbol) : undefined) ??
      (preferredColor ? poolToPick.find((d) => d.color === preferredColor && d.symbol !== 'skull') : undefined) ??
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

  let nextPool: DicePool = state.dicePool;
  if (!nextPool.draftedIds.includes(chosen.id)) {
    if (nextPool.draftedIds.length < 3) {
      nextPool = draftDie(nextPool, chosen.id);
    } else {
      // Replace an unconsumed drafted die so draftedIds stays <= 3
      const replaceable = nextPool.draftedIds.find((id) => !state.consumedDieIds.includes(id));
      const trimmed = replaceable
        ? nextPool.draftedIds.filter((id) => id !== replaceable)
        : nextPool.draftedIds.slice(0, 2);
      nextPool = { ...nextPool, draftedIds: [...trimmed, chosen.id] };
    }
  }

  const nextUsedIds = [...(nextPool.usedIds ?? []), chosen.id];
  nextPool = { ...nextPool, usedIds: nextUsedIds };

  return {
    ok: true,
    consumedId: chosen.id,
    updatedPool: nextPool,
    matchedColor: preferredColor ? chosen.color === preferredColor : false,
    matchedSymbol: preferredSymbol ? chosen.symbol === preferredSymbol : false,
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
      let minionsDefeatedCount = state.minionsDefeatedCount;
      let minionsGlory = state.minionsGlory;
      let artisanCount = state.artisanCount;
      let masteryGlory = state.masteryGlory;
      const newLogs = [...state.logs];
      let feedback: EventFeedback = makeFeedback(
        `Moveu para ${formatCoordLabel(target)}`,
        'info'
      );

      events.forEach((ev) => {
        newLogs.push(ev.description);
        if (ev.type === 'minion' && ev.payload) {
          const outcome = resolveMinionEncounter(currentParty, ev.payload);
          minionsDefeatedCount += 1;
          minionsGlory += outcome.gloryEarned;
          if (outcome.woundsTaken > 0) {
            currentParty = applyPartyDamage(currentParty, outcome.woundsTaken);
            newLogs.push(
              `Sofreu ${outcome.woundsTaken} ferimento(s) enfrentando ${ev.payload.name}.`
            );
            feedback = makeFeedback(
              `-${outcome.woundsTaken} Vida • +${outcome.gloryEarned} Glória`,
              'damage'
            );
          } else {
            newLogs.push(`Comitiva superou ${ev.payload.name} sem ferimentos (+${outcome.gloryEarned} glória)!`);
            feedback = makeFeedback(`+${outcome.gloryEarned} Glória!`, 'glory');
          }
        } else if (ev.type === 'trap' && typeof ev.payload === 'number') {
          const omamoriReduction = getRelicCount(currentParty, 'amuleto-omamori');
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
          feedback = makeFeedback(`+${ev.payload} Gema(s) (+${ev.payload * 2} Glória)`, 'glory');
        } else if (ev.type === 'item') {
          const forged = forgeNextRelic(currentParty, masteryGlory);
          currentParty = forged.nextParty;
          masteryGlory = forged.nextMasteryGlory;
          artisanCount += 1;
          newLogs.push(
            `${forged.relic.name} encontrada! (${forged.relic.shortBonus}, +2 Glória ao final).`
          );
          feedback = makeFeedback(
            `${forged.relic.name} (${forged.relic.shortBonus})`,
            'glory'
          );
        }
      });

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

      const consumption = consumeDieForAction(state, 'shield');
      if (!consumption.ok || !consumption.consumedId) {
        set({
          logs: [...state.logs, 'Limite de 3 ações por rodada atingido. Confirme a rodada.'],
          lastEventFeedback: makeFeedback('Sem ações restantes na rodada', 'info'),
        });
        return;
      }

      const snapshot = takeSnapshot(state);
      const updatedParty = brewPotion(state.party);
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
        party: updatedParty,
        dicePool: consumption.updatedPool,
        consumedDieIds: [...state.consumedDieIds, consumption.consumedId],
        selectedDieId: null,
        artisanCount,
        missions: nextMissions,
        logs: [...state.logs, 'Poção de cura destilada (+1 poção no estoque).'],
        lastEventFeedback: makeFeedback('+1 Poção Destilada', 'heal'),
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

    stageCraftItem: () => {
      const state = get();
      if (state.isGameOver) return;

      const consumption = consumeDieForAction(state, 'magic');
      if (!consumption.ok || !consumption.consumedId) {
        set({
          logs: [...state.logs, 'Limite de 3 ações por rodada atingido. Confirme a rodada.'],
          lastEventFeedback: makeFeedback('Sem ações restantes na rodada', 'info'),
        });
        return;
      }

      const snapshot = takeSnapshot(state);
      const forged = forgeNextRelic(state.party, state.masteryGlory);
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
        party: forged.nextParty,
        dicePool: consumption.updatedPool,
        consumedDieIds: [...state.consumedDieIds, consumption.consumedId],
        selectedDieId: null,
        masteryGlory: forged.nextMasteryGlory,
        artisanCount,
        missions: nextMissions,
        logs: [
          ...state.logs,
          `${forged.relic.name} forjada! (${forged.relic.shortBonus}, +2 Glória ao final).`,
        ],
        lastEventFeedback: makeFeedback(
          `${forged.relic.name} (${forged.relic.shortBonus})`,
          'glory'
        ),
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
