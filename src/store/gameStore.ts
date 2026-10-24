import { create } from 'zustand';
import {
  DicePool,
  DungeonCoord,
  DungeonMap,
  FinalScoreBreakdown,
  HeroClass,
  HeroParty,
} from '../engine/types';
import { rollDicePool, checkHazardPhase, draftDie, undraftDie } from '../engine/dice';
import {
  createInitialParty,
  levelUpHero,
  applyPartyDamage,
  brewPotion,
  craftItem,
  collectGem,
} from '../engine/heroes';
import { getCanonicalMap1, executeMove } from '../engine/dungeon';
import { resolveMinionEncounter, resolveVillainBattle } from '../engine/combat';
import { calculateFinalGloryScore } from '../engine/scoring';

export interface GameSnapshot {
  party: HeroParty;
  dungeon: DungeonMap;
  dicePool: DicePool;
  logs: string[];
  minionsDefeatedCount: number;
  minionsGlory: number;
  bossGlory: number;
  bossesDefeated: string[];
}

export interface GameState {
  currentRound: number;
  isGameOver: boolean;
  party: HeroParty;
  dungeon: DungeonMap;
  dicePool: DicePool;
  selectedDieId: string | null;
  logs: string[];
  minionsDefeatedCount: number;
  minionsGlory: number;
  bossGlory: number;
  bossesDefeated: string[];
  finalScore: FinalScoreBreakdown | null;

  // History for intra-round Undo / Redo
  history: GameSnapshot[];
  future: GameSnapshot[];

  // Actions
  resetGame: () => void;
  selectDie: (dieId: string | null) => void;
  stageDraft: (dieId: string) => void;
  stageMove: (target: DungeonCoord) => void;
  stageLevelUp: (classType: HeroClass) => void;
  stageBrewPotion: () => void;
  stageCraftItem: () => void;
  undo: () => void;
  redo: () => void;
  confirmRound: () => void;
}

const STORAGE_KEY = 'tiny_dungeon_save_v1';

function saveToLocalStorage(state: Partial<GameState>) {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    const serialized = JSON.stringify({
      currentRound: state.currentRound,
      isGameOver: state.isGameOver,
      party: state.party,
      dungeon: state.dungeon,
      dicePool: state.dicePool,
      logs: state.logs,
      minionsDefeatedCount: state.minionsDefeatedCount,
      minionsGlory: state.minionsGlory,
      bossGlory: state.bossGlory,
      bossesDefeated: state.bossesDefeated,
      finalScore: state.finalScore,
    });
    localStorage.setItem(STORAGE_KEY, serialized);
  } catch (e) {
    console.error('Failed to autosave game state', e);
  }
}

export const useGameStore = create<GameState>((set, get) => {
  const initialDungeon = getCanonicalMap1();
  const initialParty = createInitialParty();
  const initialDicePool = rollDicePool();

  const takeSnapshot = (state: GameState): GameSnapshot => ({
    party: JSON.parse(JSON.stringify(state.party)),
    dungeon: JSON.parse(JSON.stringify(state.dungeon)),
    dicePool: JSON.parse(JSON.stringify(state.dicePool)),
    logs: [...state.logs],
    minionsDefeatedCount: state.minionsDefeatedCount,
    minionsGlory: state.minionsGlory,
    bossGlory: state.bossGlory,
    bossesDefeated: [...state.bossesDefeated],
  });

  return {
    currentRound: 1,
    isGameOver: false,
    party: initialParty,
    dungeon: initialDungeon,
    dicePool: initialDicePool,
    selectedDieId: null,
    logs: ['Welcome to Tiny Dungeon. The torch embers cast long shadows.'],
    minionsDefeatedCount: 0,
    minionsGlory: 0,
    bossGlory: 0,
    bossesDefeated: [],
    finalScore: null,
    history: [],
    future: [],

    resetGame: () => {
      const dungeon = getCanonicalMap1();
      const party = createInitialParty();
      const dicePool = rollDicePool();
      const hazard = checkHazardPhase(dicePool);

      let adjustedParty = party;
      const initialLogs = ['The adventure begins anew. Round 1.'];
      if (hazard.hazardTriggered) {
        adjustedParty = applyPartyDamage(party, hazard.wounds);
        initialLogs.push(`Hazard Phase: Skulls struck! Party takes ${hazard.wounds} wound.`);
      }

      set({
        currentRound: 1,
        isGameOver: false,
        party: adjustedParty,
        dungeon,
        dicePool,
        selectedDieId: null,
        logs: initialLogs,
        minionsDefeatedCount: 0,
        minionsGlory: 0,
        bossGlory: 0,
        bossesDefeated: [],
        finalScore: null,
        history: [],
        future: [],
      });
      saveToLocalStorage(get());
    },

    selectDie: (dieId: string | null) => {
      set({ selectedDieId: dieId });
    },

    stageDraft: (dieId: string) => {
      const state = get();
      if (state.dicePool.draftedIds.includes(dieId)) {
        // Toggle off draft
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
      const snapshot = takeSnapshot(state);
      const { updatedMap, events } = executeMove(state.dungeon, target);

      let currentParty = state.party;
      let minionsDefeatedCount = state.minionsDefeatedCount;
      let minionsGlory = state.minionsGlory;
      const newLogs = [...state.logs];

      events.forEach((ev) => {
        newLogs.push(ev.description);
        if (ev.type === 'minion' && ev.payload) {
          const outcome = resolveMinionEncounter(currentParty, ev.payload);
          minionsDefeatedCount += 1;
          minionsGlory += outcome.gloryEarned;
          if (outcome.woundsTaken > 0) {
            currentParty = applyPartyDamage(currentParty, outcome.woundsTaken);
            newLogs.push(`Suffered ${outcome.woundsTaken} wound(s) fighting ${ev.payload.name}.`);
          } else {
            newLogs.push(`Hero level overpowered ${ev.payload.name} with 0 wounds!`);
          }
        } else if (ev.type === 'trap' && typeof ev.payload === 'number') {
          currentParty = applyPartyDamage(currentParty, ev.payload);
        } else if (ev.type === 'gem' && typeof ev.payload === 'number') {
          currentParty = collectGem(currentParty, ev.payload);
        } else if (ev.type === 'item') {
          currentParty = craftItem(currentParty);
        }
      });

      set({
        history: [...state.history, snapshot],
        future: [],
        dungeon: updatedMap,
        party: currentParty,
        minionsDefeatedCount,
        minionsGlory,
        logs: newLogs,
      });
    },

    stageLevelUp: (classType: HeroClass) => {
      const state = get();
      const hero = state.party.heroes[classType];
      if (hero.level >= hero.maxLevel) return;

      const snapshot = takeSnapshot(state);
      const updatedParty = levelUpHero(state.party, classType);
      const newLogs = [
        ...state.logs,
        `${classType.toUpperCase()} advanced to Level ${updatedParty.heroes[classType].level}!`,
      ];

      set({
        history: [...state.history, snapshot],
        future: [],
        party: updatedParty,
        logs: newLogs,
      });
    },

    stageBrewPotion: () => {
      const state = get();
      const snapshot = takeSnapshot(state);
      const updatedParty = brewPotion(state.party);
      const newLogs = [...state.logs, 'Brewed an invigorating healing potion.'];

      set({
        history: [...state.history, snapshot],
        future: [],
        party: updatedParty,
        logs: newLogs,
      });
    },

    stageCraftItem: () => {
      const state = get();
      const snapshot = takeSnapshot(state);
      const updatedParty = craftItem(state.party);
      const newLogs = [...state.logs, 'Forged a magical artifact (+2 glory).'];

      set({
        history: [...state.history, snapshot],
        future: [],
        party: updatedParty,
        logs: newLogs,
      });
    },

    undo: () => {
      const state = get();
      if (state.history.length === 0) return;

      const previous = state.history[state.history.length - 1];
      const newHistory = state.history.slice(0, state.history.length - 1);
      const currentSnapshot = takeSnapshot(state);

      set({
        party: previous.party,
        dungeon: previous.dungeon,
        dicePool: previous.dicePool,
        logs: previous.logs,
        minionsDefeatedCount: previous.minionsDefeatedCount,
        minionsGlory: previous.minionsGlory,
        bossGlory: previous.bossGlory,
        bossesDefeated: previous.bossesDefeated,
        history: newHistory,
        future: [currentSnapshot, ...state.future],
      });
    },

    redo: () => {
      const state = get();
      if (state.future.length === 0) return;

      const next = state.future[0];
      const newFuture = state.future.slice(1);
      const currentSnapshot = takeSnapshot(state);

      set({
        party: next.party,
        dungeon: next.dungeon,
        dicePool: next.dicePool,
        logs: next.logs,
        minionsDefeatedCount: next.minionsDefeatedCount,
        minionsGlory: next.minionsGlory,
        bossGlory: next.bossGlory,
        bossesDefeated: next.bossesDefeated,
        history: [...state.history, currentSnapshot],
        future: newFuture,
      });
    },

    confirmRound: () => {
      const state = get();
      let currentParty = state.party;
      let bossGlory = state.bossGlory;
      const bossesDefeated = [...state.bossesDefeated];
      const newLogs = [...state.logs, `Confirmed actions for Round ${state.currentRound}.`];

      // Boss encounters at rounds 3, 6, and 8
      if (state.currentRound === 3 || state.currentRound === 6 || state.currentRound === 8) {
        // Find boss associated with round
        const bossRoom = Object.values(state.dungeon.rooms).find(
          (r) => r.type === 'boss' && r.villain && r.villain.round === state.currentRound
        );

        if (bossRoom && bossRoom.villain) {
          const villain = bossRoom.villain;
          const outcome = resolveVillainBattle(currentParty, villain);
          newLogs.push(
            `⚔️ Confronted Boss ${villain.name}! (Party Power: ${outcome.partyPower})`
          );

          if (outcome.tier === 1) {
            newLogs.push(`Heroic Victory (Tier 1)! +${outcome.gloryEarned} glory points!`);
            bossGlory += outcome.gloryEarned;
            bossesDefeated.push(villain.name);
          } else if (outcome.tier === 2) {
            newLogs.push(`Standard Victory (Tier 2)! +${outcome.gloryEarned} glory points!`);
            bossGlory += outcome.gloryEarned;
            bossesDefeated.push(villain.name);
          } else {
            newLogs.push(
              `Defeat against ${villain.name}! Took ${outcome.woundsTaken} penalty damage!`
            );
            currentParty = applyPartyDamage(currentParty, outcome.woundsTaken);
          }
        }
      }

      if (state.currentRound >= 8) {
        // Final Round complete!
        const finalScore = calculateFinalGloryScore({
          party: currentParty,
          minionsDefeatedCount: state.minionsDefeatedCount,
          minionsGlory: state.minionsGlory,
          bossGlory,
          gemsCount: currentParty.gems,
          itemsCrafted: currentParty.magicItems,
        });

        newLogs.push(`The expedition reaches its climax! Final Glory: ${finalScore.netGlory}`);

        set({
          isGameOver: true,
          party: currentParty,
          bossGlory,
          bossesDefeated,
          finalScore,
          logs: newLogs,
          history: [],
          future: [],
        });
        saveToLocalStorage(get());
        return;
      }

      // Roll new dice pool for next round
      const nextRound = state.currentRound + 1;
      const nextDicePool = rollDicePool();
      const hazard = checkHazardPhase(nextDicePool);

      newLogs.push(`Entering Round ${nextRound}. New dice rolled.`);
      if (hazard.hazardTriggered) {
        currentParty = applyPartyDamage(currentParty, hazard.wounds);
        newLogs.push(`Hazard Phase: Skulls struck! Party takes ${hazard.wounds} wound.`);
      }

      set({
        currentRound: nextRound,
        party: currentParty,
        bossGlory,
        bossesDefeated,
        dicePool: nextDicePool,
        selectedDieId: null,
        logs: newLogs,
        history: [],
        future: [],
      });

      saveToLocalStorage(get());
    },
  };
});
