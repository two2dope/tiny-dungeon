import { FinalScoreBreakdown, HeroParty } from './types';

export interface ScoreInput {
  party: HeroParty;
  minionsDefeatedCount?: number;
  minionsGlory: number;
  bossGlory: number;
  gemsCount: number;
  itemsCrafted: number;
}

export function calculateFinalGloryScore(input: ScoreInput): FinalScoreBreakdown {
  const { party, minionsGlory, bossGlory, gemsCount, itemsCrafted } = input;

  const heroLevelsGlory =
    party.heroes.warrior.level +
    party.heroes.mage.level +
    party.heroes.cleric.level +
    party.heroes.rogue.level;

  const gemsGlory = gemsCount * 2;
  const itemsGlory = itemsCrafted * 2;
  const resurrectionPenalties = party.resurrections * 9;

  const netGlory =
    minionsGlory +
    bossGlory +
    gemsGlory +
    itemsGlory +
    heroLevelsGlory -
    resurrectionPenalties;

  return {
    minionsGlory,
    bossesGlory: bossGlory,
    gemsGlory,
    itemsGlory,
    heroLevelsGlory,
    resurrectionPenalties,
    netGlory,
  };
}
