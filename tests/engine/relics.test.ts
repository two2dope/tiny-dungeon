import { describe, it, expect } from 'vitest';
import {
  RELIC_CATALOG,
  calculateRelicsGlory,
  canDieFillRelicSlot,
  findMatchingSlotIndex,
  getMovementBonusSteps,
  hasBarrierCrossingAbility,
  isRelicCompleted,
} from '../../src/engine/relics';
import { advanceRelicSlot, craftItem, createInitialParty } from '../../src/engine/heroes';
import { Die } from '../../src/engine/types';

describe('Relics, Recipes & Abilities', () => {
  it('defines 8 distinct Sengoku relics with valid icon paths and recipes', () => {
    expect(RELIC_CATALOG).toHaveLength(8);
    for (const relic of RELIC_CATALOG) {
      expect(relic.recipe.length).toBeGreaterThanOrEqual(2);
      expect(relic.iconUrl).toMatch(/^\/assets\/ui\/relic-.*\.webp$/);
    }
  });

  it('matches constrained recipe slots before wildcard slots when forging a die', () => {
    const party = createInitialParty();
    const whiteSword: Die = { id: 'd1', color: 'white', symbol: 'sword', value: 1 };
    const whiteBoot: Die = { id: 'd2', color: 'white', symbol: 'boot', value: 2 };
    const blackAny: Die = { id: 'd3', color: 'black', symbol: 'rogue', value: 3 };

    // Katana needs [{ white, sword }, { white }]
    expect(findMatchingSlotIndex(party, 'katana-masamune', whiteSword)).toBe(0);
    expect(findMatchingSlotIndex(party, 'katana-masamune', whiteBoot)).toBe(1);
    expect(findMatchingSlotIndex(party, 'katana-masamune', blackAny)).toBe(-1);

    expect(canDieFillRelicSlot(blackAny, { color: 'any' })).toBe(true);
    expect(canDieFillRelicSlot(blackAny, { color: 'white' })).toBe(false);
  });

  it('grants partial glory per filled slot and triggers completion effects & abilities', () => {
    let party = createInitialParty();
    // Stamp 1 of 2 slots of Kaginawa -> +1 glory, not completed yet
    const step1 = advanceRelicSlot(party, 'gancho-kaginawa', 0);
    party = step1.party;
    expect(step1.completedNow).toBe(false);
    expect(hasBarrierCrossingAbility(party)).toBe(false);
    expect(calculateRelicsGlory(party)).toBe(1);

    // Stamp 2nd slot -> unlocks barrier crossing!
    const step2 = advanceRelicSlot(party, 'gancho-kaginawa', 1);
    party = step2.party;
    expect(step2.completedNow).toBe(true);
    expect(hasBarrierCrossingAbility(party)).toBe(true);
    expect(isRelicCompleted(party, 'gancho-kaginawa')).toBe(true);

    // Waraji grants +1 movement step
    expect(getMovementBonusSteps(party)).toBe(0);
    party = craftItem(party, 'sandalias-waraji');
    expect(getMovementBonusSteps(party)).toBe(1);

    // Cabaca do Elixir grants +3 potions immediately and advances potionsBrewed
    party = craftItem(party, 'cabaca-elixir');
    expect(party.potions).toBe(3);
    expect(party.potionsBrewed).toBe(3);

    // Espelho Yata has 3 slots + 4 completion glory
    const beforeMirror = calculateRelicsGlory(party);
    party = craftItem(party, 'espelho-yata');
    expect(calculateRelicsGlory(party)).toBe(beforeMirror + 3 + 4);
  });
});
