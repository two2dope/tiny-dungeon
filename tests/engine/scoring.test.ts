import { describe, it, expect } from 'vitest';
import { calculateFinalGloryScore } from '../../src/engine/scoring';
import { craftItem, createInitialParty } from '../../src/engine/heroes';

describe('Scoring System', () => {
  it('should compute final glory tally using track curves and deduct -9 points per resurrection', () => {
    let party = { ...createInitialParty(), resurrections: 1 };
    party = craftItem(party, 'espelho-yata'); // 3 slots + 4 bonus = 7 itemsGlory

    const score = calculateFinalGloryScore({
      party,
      minionsDefeatedCount: 4, // MINION_GLORY_CURVE[4] = 10
      minionsGlory: 10,
      bossGlory: 15,
      gemsCount: 3, // GEM_GLORY_CURVE[3] = 9
      itemsCrafted: party.magicItems,
    });

    // Net glory = minions(10) + boss(15) + gems(9) + items(7) + heroLevels(4) - res(9) = 36
    expect(score.minionsGlory).toBe(10);
    expect(score.bossesGlory).toBe(15);
    expect(score.gemsGlory).toBe(9);
    expect(score.itemsGlory).toBe(7);
    expect(score.heroLevelsGlory).toBe(4);
    expect(score.resurrectionPenalties).toBe(9);
    expect(score.netGlory).toBe(36);
  });
});
