import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore } from '../../src/store/gameStore';

describe('Game Store Machine', () => {
  beforeEach(() => {
    useGameStore.getState().resetGame();
  });

  it('should initialize at round 1 with rolled dice pool', () => {
    const state = useGameStore.getState();
    expect(state.currentRound).toBe(1);
    expect(state.dicePool.dice).toHaveLength(6);
  });

  it('should allow staging a movement action and reverting via undo', () => {
    const store = useGameStore.getState();
    const initialPos = store.dungeon.currentCoord;
    store.stageMove({ x: 1, y: 0 });
    expect(useGameStore.getState().dungeon.currentCoord).toEqual({ x: 1, y: 0 });
    
    useGameStore.getState().undo();
    expect(useGameStore.getState().dungeon.currentCoord).toEqual(initialPos);
  });

  it('should advance round from 1 to 2 upon confirmRound', () => {
    const store = useGameStore.getState();
    store.confirmRound();
    expect(useGameStore.getState().currentRound).toBe(2);
  });
});
