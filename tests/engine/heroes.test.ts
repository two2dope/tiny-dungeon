import { describe, it, expect } from 'vitest';
import { createInitialParty, levelUpHero, applyPartyDamage, brewPotion, craftItem } from '../../src/engine/heroes';
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

  it('should brew potions and sequentially craft named relics including armadura-yoroi maxHealth bonus', () => {
    let party = createInitialParty();
    party = brewPotion(party);
    expect(party.potions).toBe(1);

    // Craft first 4 relics in RELIC_CATALOG sequentially; 4th is armadura-yoroi
    for (let i = 0; i < 4; i++) {
      party = craftItem(party);
    }
    expect(party.magicItems).toBe(4);
    expect(party.craftedRelics).toEqual(RELIC_CATALOG.slice(0, 4).map((r) => r.id));
    expect(party.maxHealth).toBe(7);
    expect(party.currentHealth).toBe(7);

    // 5th relic completes the catalog
    party = craftItem(party);
    expect(party.craftedRelics).toEqual(RELIC_CATALOG.map((r) => r.id));
  });
});
