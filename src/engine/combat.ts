import { HeroParty, Minion, Villain } from './types';

export interface MinionCombatOutcome {
  woundsTaken: number;
  gloryEarned: number;
  victory: boolean;
}

export interface VillainCombatOutcome {
  tier: 1 | 2 | 'defeat';
  gloryEarned: number;
  woundsTaken: number;
  partyPower: number;
}

export function resolveMinionEncounter(
  party: HeroParty,
  minion: Minion
): MinionCombatOutcome {
  let relevantLevel: number;

  if (minion.classAffinity) {
    relevantLevel = party.heroes[minion.classAffinity].level;
  } else {
    // If no specific class affinity, default to highest hero level
    relevantLevel = Math.max(
      party.heroes.warrior.level,
      party.heroes.mage.level,
      party.heroes.cleric.level,
      party.heroes.rogue.level
    );
  }

  const woundsTaken = relevantLevel < minion.reqLevel ? minion.damage : 0;

  return {
    woundsTaken,
    gloryEarned: minion.glory,
    victory: true,
  };
}

export function calculatePartyPower(party: HeroParty): number {
  const heroLevelsSum =
    party.heroes.warrior.level +
    party.heroes.mage.level +
    party.heroes.cleric.level +
    party.heroes.rogue.level;

  return heroLevelsSum;
}

export function resolveVillainBattle(
  party: HeroParty,
  villain: Villain
): VillainCombatOutcome {
  const partyPower = calculatePartyPower(party);

  if (partyPower >= villain.tier1Power) {
    return {
      tier: 1,
      gloryEarned: villain.tier1Glory,
      woundsTaken: 0,
      partyPower,
    };
  }

  if (partyPower >= villain.tier2Power) {
    return {
      tier: 2,
      gloryEarned: villain.tier2Glory,
      woundsTaken: 0,
      partyPower,
    };
  }

  return {
    tier: 'defeat',
    gloryEarned: 0,
    woundsTaken: villain.defeatDamage,
    partyPower,
  };
}
