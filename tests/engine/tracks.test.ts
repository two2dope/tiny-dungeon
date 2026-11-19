import { describe, it, expect } from 'vitest';
import {
  GEM_GLORY_CURVE,
  MINION_GLORY_CURVE,
  getGemTrackGlory,
  getMinionTrackGlory,
  getNewlyReachedGemMilestones,
  getNewlyReachedPotionMilestones,
} from '../../src/engine/tracks';

describe('Progression Tracks & Glory Curves', () => {
  it('computes rising non-linear glory curves for minions and gems', () => {
    expect(getMinionTrackGlory(0)).toBe(0);
    expect(getMinionTrackGlory(1)).toBe(2);
    expect(getMinionTrackGlory(4)).toBe(10);
    expect(getMinionTrackGlory(12)).toBe(MINION_GLORY_CURVE[12]);
    expect(getMinionTrackGlory(14)).toBe(MINION_GLORY_CURVE[12] + 6);

    expect(getGemTrackGlory(0)).toBe(0);
    expect(getGemTrackGlory(3)).toBe(9);
    expect(getGemTrackGlory(10)).toBe(GEM_GLORY_CURVE[10]);
    expect(getGemTrackGlory(12)).toBe(GEM_GLORY_CURVE[10] + 10);
  });

  it('triggers potion milestones at 4, 8, 12 without re-triggering claimed ones', () => {
    const first = getNewlyReachedPotionMilestones(2, 4, []);
    expect(first.map((m) => m.threshold)).toEqual([4]);

    const skipClaimed = getNewlyReachedPotionMilestones(4, 10, [4]);
    expect(skipClaimed.map((m) => m.threshold)).toEqual([8]);

    const jumpMultiple = getNewlyReachedPotionMilestones(6, 12, [4]);
    expect(jumpMultiple.map((m) => m.threshold)).toEqual([8, 12]);
  });

  it('triggers gem milestones at 3, 6, 9 without re-triggering claimed ones', () => {
    expect(getNewlyReachedGemMilestones(1, 3, []).map((m) => m.threshold)).toEqual([3]);
    expect(getNewlyReachedGemMilestones(3, 9, [3]).map((m) => m.threshold)).toEqual([6, 9]);
    expect(getNewlyReachedGemMilestones(9, 10, [3, 6, 9])).toEqual([]);
  });
});
