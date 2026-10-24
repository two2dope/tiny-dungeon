import { HeroClass, HeroParty, HeroState } from './types';

export const MAX_HERO_LEVEL = 6;
export const DEFAULT_MAX_HEALTH = 6;
export const RESURRECTION_RECOVERY_HEALTH = 3;

export function createInitialParty(): HeroParty {
  const createHero = (classType: HeroClass): HeroState => ({
    classType,
    level: 1,
    maxLevel: MAX_HERO_LEVEL,
  });

  return {
    heroes: {
      warrior: createHero('warrior'),
      mage: createHero('mage'),
      cleric: createHero('cleric'),
      rogue: createHero('rogue'),
    },
    currentHealth: DEFAULT_MAX_HEALTH,
    maxHealth: DEFAULT_MAX_HEALTH,
    resurrections: 0,
    potions: 0,
    magicItems: 0,
    gems: 0,
  };
}

export function levelUpHero(party: HeroParty, classType: HeroClass): HeroParty {
  const hero = party.heroes[classType];
  if (!hero || hero.level >= hero.maxLevel) {
    return party;
  }

  return {
    ...party,
    heroes: {
      ...party.heroes,
      [classType]: {
        ...hero,
        level: hero.level + 1,
      },
    },
  };
}

export function applyPartyDamage(party: HeroParty, amount: number): HeroParty {
  if (amount <= 0) return party;

  let health = party.currentHealth - amount;
  let resurrections = party.resurrections;

  while (health <= 0) {
    resurrections += 1;
    // Restore recovery health when resurrected so the adventure continues
    health = Math.max(1, RESURRECTION_RECOVERY_HEALTH + health);
  }

  return {
    ...party,
    currentHealth: Math.min(party.maxHealth, health),
    resurrections,
  };
}

export function healParty(party: HeroParty, amount: number): HeroParty {
  if (amount <= 0) return party;
  return {
    ...party,
    currentHealth: Math.min(party.maxHealth, party.currentHealth + amount),
  };
}

export function brewPotion(party: HeroParty): HeroParty {
  return {
    ...party,
    potions: party.potions + 1,
  };
}

export function usePotion(party: HeroParty): HeroParty {
  if (party.potions <= 0 || party.currentHealth >= party.maxHealth) {
    return party;
  }
  return {
    ...party,
    potions: party.potions - 1,
    currentHealth: Math.min(party.maxHealth, party.currentHealth + 2),
  };
}

export function craftItem(party: HeroParty): HeroParty {
  return {
    ...party,
    magicItems: party.magicItems + 1,
  };
}

export function collectGem(party: HeroParty, count: number = 1): HeroParty {
  return {
    ...party,
    gems: party.gems + count,
  };
}
