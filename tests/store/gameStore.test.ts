import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore } from '../../src/store/gameStore';
import { getValidMoves } from '../../src/engine/dungeon';

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
});
