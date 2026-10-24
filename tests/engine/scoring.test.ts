import { describe, it, expect } from 'vitest';
import { calculateFinalGloryScore } from '../../src/engine/scoring';
import { createInitialParty } from '../../src/engine/heroes';

describe('Scoring System', () => {
  it('should compute final glory tally deducting -9 points per resurrection', () => {
    const party = { ...createInitialParty(), resurrections: 1 };
    const score = calculateFinalGloryScore({
      party,
      minionsDefeatedCount: 4,
      minionsGlory: 8,
      bossGlory: 15,
      gemsCount: 3,
      itemsCrafted: 2,
    });

    // Net glory = minions(8) + boss(15) + gems(3 * 2 = 6) + items(2 * 2 = 4) + heroLevels(4 * 1 = 4) - res(1 * 9 = 9)
    // = 8 + 15 + 6 + 4 + 4 - 9 = 28
    expect(score.minionsGlory).toBe(8);
    expect(score.bossesGlory).toBe(15);
    expect(score.gemsGlory).toBe(6);
    expect(score.itemsGlory).toBe(4);
    expect(score.heroLevelsGlory).toBe(4);
    expect(score.resurrectionPenalties).toBe(9);
    expect(score.netGlory).toBe(28);
  });
});
