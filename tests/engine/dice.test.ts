import { describe, it, expect } from 'vitest';
import { rollDicePool, checkHazardPhase, draftDie } from '../../src/engine/dice';

describe('Dice System', () => {
  it('should generate 3 white and 3 black dice', () => {
    const pool = rollDicePool(() => 0.5);
    expect(pool.dice).toHaveLength(6);
    expect(pool.dice.filter(d => d.color === 'white')).toHaveLength(3);
    expect(pool.dice.filter(d => d.color === 'black')).toHaveLength(3);
  });

  it('should trigger hazard wound when 3 or more skulls appear', () => {
    const pool = {
      dice: [
        { id: '1', color: 'black' as const, symbol: 'skull' as const, value: 1 },
        { id: '2', color: 'black' as const, symbol: 'skull' as const, value: 1 },
        { id: '3', color: 'black' as const, symbol: 'skull' as const, value: 1 },
        { id: '4', color: 'white' as const, symbol: 'boot' as const, value: 2 },
        { id: '5', color: 'white' as const, symbol: 'sword' as const, value: 1 },
        { id: '6', color: 'white' as const, symbol: 'magic' as const, value: 1 },
      ],
      draftedIds: []
    };
    expect(checkHazardPhase(pool)).toEqual({ hazardTriggered: true, wounds: 1 });
  });

  it('should allow drafting up to 3 dice', () => {
    let pool = rollDicePool();
    pool = draftDie(pool, pool.dice[0].id);
    pool = draftDie(pool, pool.dice[1].id);
    pool = draftDie(pool, pool.dice[2].id);
    expect(pool.draftedIds).toHaveLength(3);
    expect(() => draftDie(pool, pool.dice[3].id)).toThrow('Cannot draft more than 3 dice per round');
  });
});
