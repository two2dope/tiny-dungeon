import { HeroParty, Minion, Villain } from './types';
import { getRelicCount } from './relics';

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

export interface CombatPowerBreakdown {
  heroLevels: number;
  katanaBonus: number;
  sealBonus: number;
  partyPower: number;
  bossPower: number;
}

export function getRelevantHeroLevel(party: HeroParty, minion: Minion): number {
  if (minion.classAffinity) {
    return party.heroes[minion.classAffinity].level;
  }
  return Math.max(
    party.heroes.warrior.level,
    party.heroes.mage.level,
    party.heroes.cleric.level,
    party.heroes.rogue.level
  );
}

export function resolveMinionEncounter(
  party: HeroParty,
  minion: Minion
): MinionCombatOutcome {
  const relevantLevel = getRelevantHeroLevel(party, minion);
  const woundsTaken = relevantLevel < minion.reqLevel ? minion.damage : 0;

  return {
    woundsTaken,
    gloryEarned: minion.glory,
    victory: true,
  };
}

export function getCombatPowerBreakdown(party: HeroParty): CombatPowerBreakdown {
  const heroLevels =
    party.heroes.warrior.level +
    party.heroes.mage.level +
    party.heroes.cleric.level +
    party.heroes.rogue.level;
  const katanaBonus = getRelicCount(party, 'katana-masamune');
  const sealBonus = getRelicCount(party, 'selo-onmyo');
  const partyPower = heroLevels + katanaBonus;
  const bossPower = partyPower + sealBonus;

  return {
    heroLevels,
    katanaBonus,
    sealBonus,
    partyPower,
    bossPower,
  };
}

export function calculatePartyPower(party: HeroParty): number {
  return getCombatPowerBreakdown(party).partyPower;
}

export function calculateBossPower(party: HeroParty): number {
  return getCombatPowerBreakdown(party).bossPower;
}

export function resolveVillainBattle(
  party: HeroParty,
  villain: Villain
): VillainCombatOutcome {
  const partyPower = calculateBossPower(party);

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
