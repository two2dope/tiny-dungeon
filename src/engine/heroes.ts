import { DieColor, DieSymbol, HeroClass, HeroParty, HeroState, RelicId } from './types';
import {
  getNextRelicToCraft,
  getRelicById,
  getRelicSlotProgress,
  isRelicCompleted,
} from './relics';

export const MAX_HERO_LEVEL = 6;
export const DEFAULT_MAX_HEALTH = 6;
export const RESURRECTION_RECOVERY_HEALTH = 3;

export const HERO_CLOAK_AFFINITY: Record<HeroClass, DieColor> = {
  warrior: 'white',
  cleric: 'white',
  mage: 'black',
  rogue: 'black',
};

export const HERO_DIE_SYMBOL: Record<HeroClass, DieSymbol> = {
  warrior: 'sword',
  mage: 'magic',
  cleric: 'shield',
  rogue: 'rogue',
};

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
    potionsBrewed: 0,
    magicItems: 0,
    gems: 0,
    craftedRelics: [],
    relicProgress: {},
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

export function brewPotion(party: HeroParty, count: number = 2): HeroParty {
  const safeCount = Math.max(0, Math.floor(count));
  return {
    ...party,
    potions: party.potions + safeCount,
    potionsBrewed: (party.potionsBrewed ?? 0) + safeCount,
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

export function advanceRelicSlot(
  party: HeroParty,
  relicId: RelicId,
  slotIndex: number
): { party: HeroParty; completedNow: boolean } {
  const def = getRelicById(relicId);
  const currentProgress = getRelicSlotProgress(party, relicId);
  if (slotIndex < 0 || slotIndex >= def.recipe.length || currentProgress[slotIndex]) {
    return { party, completedNow: false };
  }

  const nextSlots = [...currentProgress];
  nextSlots[slotIndex] = true;
  const nextProgressMap: Partial<Record<RelicId, boolean[]>> = {
    ...(party.relicProgress ?? {}),
    [relicId]: nextSlots,
  };

  const wasCompleted = isRelicCompleted(party, relicId);
  const nowCompleted = !wasCompleted && nextSlots.every(Boolean);
  const existingRelics = party.craftedRelics ?? [];

  let updatedParty: HeroParty = {
    ...party,
    relicProgress: nextProgressMap,
  };

  if (nowCompleted) {
    updatedParty = {
      ...updatedParty,
      magicItems: updatedParty.magicItems + 1,
      craftedRelics: existingRelics.includes(relicId)
        ? existingRelics
        : [...existingRelics, relicId],
    };

    if (relicId === 'armadura-yoroi') {
      const nextMaxHealth = updatedParty.maxHealth + 2;
      updatedParty = {
        ...updatedParty,
        maxHealth: nextMaxHealth,
        currentHealth: Math.min(nextMaxHealth, updatedParty.currentHealth + 2),
      };
    } else if (relicId === 'cabaca-elixir') {
      updatedParty = brewPotion(updatedParty, 3);
    }
  }

  return { party: updatedParty, completedNow: nowCompleted };
}

export function craftItem(party: HeroParty, relicId?: RelicId): HeroParty {
  const existingRelics = party.craftedRelics ?? [];
  const chosenId = relicId ?? getNextRelicToCraft(existingRelics);
  const def = getRelicById(chosenId);

  if (isRelicCompleted(party, chosenId)) {
    // Fallback if caller explicitly asks for an already-completed relic
    return {
      ...party,
      magicItems: party.magicItems + 1,
      craftedRelics: [...existingRelics, chosenId],
    };
  }

  let current = party;
  for (let i = 0; i < def.recipe.length; i++) {
    const progress = getRelicSlotProgress(current, chosenId);
    if (!progress[i]) {
      current = advanceRelicSlot(current, chosenId, i).party;
    }
  }

  return current;
}

export function collectGem(party: HeroParty, count: number = 1): HeroParty {
  return {
    ...party,
    gems: party.gems + count,
  };
}
