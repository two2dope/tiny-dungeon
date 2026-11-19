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

  it('should brew 2 potions per die and trigger + resolve Milestone 4 hero reward', () => {
    const store = useGameStore.getState();
    store.stageBrewPotion();
    expect(useGameStore.getState().party.potions).toBe(2);
    expect(useGameStore.getState().party.potionsBrewed).toBe(2);
    expect(useGameStore.getState().pendingRewards).toHaveLength(0);

    store.stageBrewPotion();
    const afterFour = useGameStore.getState();
    expect(afterFour.party.potions).toBe(4);
    expect(afterFour.party.potionsBrewed).toBe(4);
    expect(afterFour.pendingRewards).toHaveLength(1);
    expect(afterFour.pendingRewards[0].kind).toBe('choose-hero-level');

    afterFour.resolvePendingReward({ type: 'hero-level', classType: 'cleric' });
    expect(useGameStore.getState().pendingRewards).toHaveLength(0);
    expect(useGameStore.getState().party.heroes.cleric.level).toBe(2);
  });

  it('blocks locked vaults until Gancho Kaginawa is forged, then unlocks passage', () => {
    // Place party at (2,0) adjacent to locked vault (3,0) on Map 1
    useGameStore.setState((s) => ({
      dungeon: { ...s.dungeon, currentCoord: { x: 2, y: 0 } },
    }));

    // Attempt move into locked (3,0) without Kaginawa -> blocked!
    useGameStore.getState().stageMove({ x: 3, y: 0 });
    expect(useGameStore.getState().dungeon.currentCoord).toEqual({ x: 2, y: 0 });
    expect(useGameStore.getState().consumedDieIds).toHaveLength(0);

    // Forge Gancho Kaginawa -> now (3,0) is enterable!
    useGameStore.setState((s) => ({
      party: craftItem(s.party, 'gancho-kaginawa'),
    }));
    useGameStore.getState().stageMove({ x: 3, y: 0 });
    const after = useGameStore.getState();
    expect(after.dungeon.currentCoord).toEqual({ x: 3, y: 0 });
    expect(after.party.gems).toBe(2);
    // Locked vault (3,0) has gem(2) + item -> item queues a free forge reward!
    expect(after.pendingRewards.some((r) => r.kind === 'choose-relic-step')).toBe(true);
  });

  it('enforces maximum of 3 consumed dice per round and confirms round cleanly', () => {
    const store = useGameStore.getState();
    store.stageLevelUp('warrior');
    store.stageBrewPotion();
    store.stageBrewPotion();
    expect(useGameStore.getState().consumedDieIds).toHaveLength(3);

    // 4th tactical action must be blocked
    const prevPotions = useGameStore.getState().party.potions;
    store.stageBrewPotion();
    expect(useGameStore.getState().party.potions).toBe(prevPotions);

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
    store.confirmRound({ interactive: true });
    store.confirmRound({ interactive: true });
    expect(useGameStore.getState().currentRound).toBe(3);

    store.confirmRound({ interactive: true });
    const pendingState = useGameStore.getState();
    expect(pendingState.currentRound).toBe(3);
    expect(pendingState.pendingBossEncounter).not.toBeNull();
    const villain = pendingState.pendingBossEncounter!;
    const hpBeforeFlee = pendingState.party.currentHealth;

    store.resolvePendingBoss('flee');
    const afterFlee = useGameStore.getState();
    const r4Hazard = checkHazardPhase(afterFlee.dicePool);
    const hazardDamage = r4Hazard.hazardTriggered ? r4Hazard.wounds : 0;
    expect(afterFlee.pendingBossEncounter).toBeNull();
    expect(afterFlee.currentRound).toBe(4);
    expect(afterFlee.party.currentHealth).toBe(Math.max(1, hpBeforeFlee - 1 - hazardDamage));
    expect(afterFlee.bossOutcomes[villain.id]).toBe('victorious');

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

  it('reduces trap damage by 2 with Amuleto Omamori equipped', () => {
    // Move to reachable trap at (2,1) from (1,1) in 1 step
    useGameStore.setState((s) => ({
      party: craftItem(s.party, 'amuleto-omamori'),
      dungeon: { ...s.dungeon, currentCoord: { x: 1, y: 1 } },
    }));
    const hpBefore = useGameStore.getState().party.currentHealth;
    useGameStore.getState().stageMove({ x: 2, y: 1 });

    // Trap at (2,1) deals 1 base damage -> neutralized to 0 by Amuleto Omamori
    expect(useGameStore.getState().party.currentHealth).toBe(hpBefore);
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

    useGameStore.getState().stageLevelUp('mage');
    expect(useGameStore.getState().history.length).toBe(1);
    const mageLevelBeforeUndo = useGameStore.getState().party.heroes.mage.level;
    useGameStore.getState().undo();
    expect(useGameStore.getState().party.heroes.mage.level).toBe(mageLevelBeforeUndo);

    useGameStore.getState().cancelPendingBoss();
    expect(useGameStore.getState().pendingBossEncounter).toBeNull();
    expect(useGameStore.getState().currentRound).toBe(3);

    const legacyParty = { ...useGameStore.getState().party, magicItems: 2, potions: 3 };
    delete legacyParty.craftedRelics;
    delete legacyParty.potionsBrewed;
    delete legacyParty.relicProgress;
    const migrated = migrateSavedParty(legacyParty);
    expect(migrated.craftedRelics).toEqual(['katana-masamune', 'selo-onmyo']);
    expect(migrated.potionsBrewed).toBe(3);
    expect(migrated.relicProgress?.['katana-masamune']).toEqual([true, true]);
  });
});
