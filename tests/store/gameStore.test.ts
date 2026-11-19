import { describe, it, expect, beforeEach } from 'vitest';
import { migrateSavedParty, useGameStore } from '../../src/store/gameStore';
import { getValidMoves } from '../../src/engine/dungeon';
import { craftItem, levelUpHero } from '../../src/engine/heroes';
import { checkHazardPhase } from '../../src/engine/dice';

describe('Game Store Machine', () => {
  beforeEach(() => {
    useGameStore.getState().resetGame(12345, 1);
  });

  it('should initialize at round 1 with rolled dice pool', () => {
    const state = useGameStore.getState();
    expect(state.currentRound).toBe(1);
    expect(state.dicePool.dice).toHaveLength(6);
    expect(state.consumedDieIds).toHaveLength(0);
    expect(state.missions).toHaveLength(3);
  });

  it('should allow staging a movement action, keeping wall functions intact on undo', () => {
    const store = useGameStore.getState();
    const initialPos = store.dungeon.currentCoord;
    store.stageMove({ x: 1, y: 0 });
    expect(useGameStore.getState().dungeon.currentCoord).toEqual({ x: 1, y: 0 });
    expect(useGameStore.getState().consumedDieIds).toHaveLength(1);

    useGameStore.getState().undo();
    const reverted = useGameStore.getState();
    expect(reverted.dungeon.currentCoord).toEqual(initialPos);
    expect(reverted.consumedDieIds).toHaveLength(0);
    expect(getValidMoves(reverted.dungeon, reverted.dungeon.currentCoord, 2).length).toBeGreaterThan(0);
  });

  it('should enforce maximum of 3 consumed dice per round and allow potion drinking freely', () => {
    const store = useGameStore.getState();
    store.stageLevelUp('warrior');
    store.stageBrewPotion();
    store.stageCraftItem();
    expect(useGameStore.getState().consumedDieIds).toHaveLength(3);

    // 4th tactical action must be blocked
    const prevCrafted = useGameStore.getState().party.magicItems;
    store.stageCraftItem();
    expect(useGameStore.getState().party.magicItems).toBe(prevCrafted);

    // Confirming round resets consumed dice
    store.confirmRound();
    expect(useGameStore.getState().currentRound).toBe(2);
    expect(useGameStore.getState().consumedDieIds).toHaveLength(0);
  });

  it('should switch maps and themes cleanly', () => {
    const store = useGameStore.getState();
    store.setTheme('vesperfall');
    expect(useGameStore.getState().theme).toBe('vesperfall');

    store.selectMap(2, 999);
    const updated = useGameStore.getState();
    expect(updated.mapId).toBe(2);
    expect(updated.dungeon.mapName).toBe('Pátio de Sengoku');
    expect(Object.keys(updated.dungeon.rooms)).toHaveLength(16);
  });

  it('opens interactive boss duel on Round 3 and supports flee and fight outcomes', () => {
    const store = useGameStore.getState();
    // Advance through R1 and R2 into R3
    store.confirmRound({ interactive: true });
    store.confirmRound({ interactive: true });
    expect(useGameStore.getState().currentRound).toBe(3);

    // Interactive confirm on Round 3 must pause and populate pendingBossEncounter
    store.confirmRound({ interactive: true });
    const pendingState = useGameStore.getState();
    expect(pendingState.currentRound).toBe(3);
    expect(pendingState.pendingBossEncounter).not.toBeNull();
    const villain = pendingState.pendingBossEncounter!;
    const hpBeforeFlee = pendingState.party.currentHealth;

    // Flee: takes 1 damage (+ any R4 hazard wounds rolled on transition) and marks villain victorious
    store.resolvePendingBoss('flee');
    const afterFlee = useGameStore.getState();
    const r4Hazard = checkHazardPhase(afterFlee.dicePool);
    const hazardDamage = r4Hazard.hazardTriggered ? r4Hazard.wounds : 0;
    expect(afterFlee.pendingBossEncounter).toBeNull();
    expect(afterFlee.currentRound).toBe(4);
    expect(afterFlee.party.currentHealth).toBe(Math.max(1, hpBeforeFlee - 1 - hazardDamage));
    expect(afterFlee.bossOutcomes[villain.id]).toBe('victorious');

    // Reset and test interactive fight victory on Round 3
    store.resetGame(12345, 1);
    let boostedParty = levelUpHero(useGameStore.getState().party, 'warrior');
    boostedParty = levelUpHero(boostedParty, 'mage');
    useGameStore.setState({ party: boostedParty });
    store.confirmRound({ interactive: true });
    store.confirmRound({ interactive: true });
    store.confirmRound({ interactive: true });
    expect(useGameStore.getState().pendingBossEncounter).not.toBeNull();

    store.resolvePendingBoss('fight');
    const afterFight = useGameStore.getState();
    expect(afterFight.pendingBossEncounter).toBeNull();
    expect(afterFight.bossOutcomes[villain.id]).toBe('defeated');
    expect(afterFight.bossGlory).toBeGreaterThan(0);
  });

  it('reduces trap damage with Amuleto Omamori equipped', () => {
    const state = useGameStore.getState();
    const trapRoom = Object.values(state.dungeon.rooms).find((r) => r.type === 'trap');
    expect(trapRoom).toBeDefined();
    const rawDamage = trapRoom!.trapDamage ?? 1;
    const hpBefore = state.party.currentHealth;

    useGameStore.setState({
      party: craftItem(state.party, 'amuleto-omamori'),
    });
    state.stageMove(trapRoom!.coord);

    const after = useGameStore.getState();
    expect(after.party.currentHealth).toBe(hpBefore - Math.max(0, rawDamage - 1));
  });

  it('cancels pending boss without advancing round, ignores undo while duel open, and migrates legacy saves', () => {
    const store = useGameStore.getState();
    store.stageLevelUp('warrior');
    expect(useGameStore.getState().history.length).toBe(1);

    store.confirmRound({ interactive: true });
    store.confirmRound({ interactive: true });
    store.confirmRound({ interactive: true });
    expect(useGameStore.getState().currentRound).toBe(3);
    expect(useGameStore.getState().pendingBossEncounter).not.toBeNull();

    // Ensure undo cannot mutate state while BossDuelModal is open
    useGameStore.getState().stageLevelUp('mage');
    expect(useGameStore.getState().history.length).toBe(1);
    const mageLevelBeforeUndo = useGameStore.getState().party.heroes.mage.level;
    useGameStore.getState().undo();
    expect(useGameStore.getState().party.heroes.mage.level).toBe(mageLevelBeforeUndo);

    // Cancel pending boss cleanly keeps round at 3
    useGameStore.getState().cancelPendingBoss();
    expect(useGameStore.getState().pendingBossEncounter).toBeNull();
    expect(useGameStore.getState().currentRound).toBe(3);

    // Legacy v1.2 save migration backfills craftedRelics from magicItems
    const legacyParty = { ...useGameStore.getState().party, magicItems: 2 };
    delete legacyParty.craftedRelics;
    const migrated = migrateSavedParty(legacyParty);
    expect(migrated.craftedRelics).toEqual(['katana-masamune', 'amuleto-omamori']);
  });
});
