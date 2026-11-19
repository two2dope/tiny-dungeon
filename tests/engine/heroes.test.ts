import { describe, it, expect } from 'vitest';
import {
  createInitialParty,
  levelUpHero,
  applyPartyDamage,
  brewPotion,
  craftItem,
} from '../../src/engine/heroes';
import { RELIC_CATALOG } from '../../src/engine/relics';

describe('Hero Party System', () => {
  it('should initialize with 4 heroes at level 1 and 0 damage', () => {
    const party = createInitialParty();
    expect(party.heroes.warrior.level).toBe(1);
    expect(party.heroes.mage.level).toBe(1);
    expect(party.heroes.cleric.level).toBe(1);
    expect(party.heroes.rogue.level).toBe(1);
    expect(party.currentHealth).toBe(party.maxHealth);
    expect(party.resurrections).toBe(0);
    expect(party.potions).toBe(0);
    expect(party.potionsBrewed).toBe(0);
    expect(party.magicItems).toBe(0);
  });

  it('should advance hero level up to max level', () => {
    let party = createInitialParty();
    party = levelUpHero(party, 'warrior');
    expect(party.heroes.warrior.level).toBe(2);
  });

  it('should apply resurrection penalty on fatal damage instead of permadeath', () => {
    let party = createInitialParty();
    party = applyPartyDamage(party, party.maxHealth + 2);
    expect(party.resurrections).toBe(1);
    expect(party.currentHealth).toBeGreaterThan(0);
  });

  it('should brew 2 potions per action and apply Yoroi +2 maxHealth bonus on craft', () => {
    let party = createInitialParty();
    party = brewPotion(party);
    expect(party.potions).toBe(2);
    expect(party.potionsBrewed).toBe(2);

    party = craftItem(party, 'armadura-yoroi');
    expect(party.magicItems).toBe(1);
    expect(party.maxHealth).toBe(8);
    expect(party.currentHealth).toBe(8);

    // Craft remaining relics sequentially
    for (const relic of RELIC_CATALOG) {
      if (relic.id !== 'armadura-yoroi') {
        party = craftItem(party, relic.id);
      }
    }
    expect(party.craftedRelics).toHaveLength(RELIC_CATALOG.length);
  });
});
