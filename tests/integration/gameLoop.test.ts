import { describe, it, expect } from 'vitest';
import { useGameStore } from '../../src/store/gameStore';

describe('End-to-End Game Loop', () => {
  it('simulates 8 rounds from start to final score tally', () => {
    const store = useGameStore.getState();
    store.resetGame();

    for (let r = 1; r <= 8; r++) {
      expect(useGameStore.getState().currentRound).toBe(r);
      // Draft 3 dice and confirm round
      const pool = useGameStore.getState().dicePool;
      store.stageDraft(pool.dice[0].id);
      store.stageDraft(pool.dice[1].id);
      store.stageDraft(pool.dice[2].id);
      store.confirmRound();
    }

    expect(useGameStore.getState().isGameOver).toBe(true);
    expect(useGameStore.getState().finalScore).toBeDefined();
    expect(typeof useGameStore.getState().finalScore!.netGlory).toBe('number');
    expect(useGameStore.getState().logs.length).toBeGreaterThan(8);
  });
});
