import { describe, it, expect } from 'vitest';
import { resolveMinionEncounter, resolveVillainBattle } from '../../src/engine/combat';
import { createInitialParty, levelUpHero } from '../../src/engine/heroes';
import { Minion, Villain } from '../../src/engine/types';

describe('Combat System', () => {
  it('should award glory or apply damage on minion fight depending on hero level', () => {
    const party = createInitialParty();
    const minion: Minion = { id: 'goblin', name: 'Goblin', reqLevel: 2, glory: 2, damage: 1 };
    const outcome = resolveMinionEncounter(party, minion);
    expect(outcome.woundsTaken).toBe(1);
    expect(outcome.gloryEarned).toBe(2);
  });

  it('should resolve minion fight with 0 wounds if hero meets or exceeds level', () => {
    let party = createInitialParty();
    party = levelUpHero(party, 'warrior'); // level 2
    const minion: Minion = { id: 'goblin', name: 'Goblin', reqLevel: 2, glory: 2, damage: 1, classAffinity: 'warrior' };
    const outcome = resolveMinionEncounter(party, minion);
    expect(outcome.woundsTaken).toBe(0);
    expect(outcome.gloryEarned).toBe(2);
  });

  it('should resolve villain battle with tier 1 victory when party power meets high threshold', () => {
    let party = createInitialParty();
    // 4 heroes at level 1 = power 4. Level up warrior to 3 and mage to 2 = power 7
    party = levelUpHero(party, 'warrior');
    party = levelUpHero(party, 'warrior');
    party = levelUpHero(party, 'mage');

    const manticore: Villain = {
      id: 'manticore',
      name: 'Manticore',
      round: 3,
      tier1Power: 6,
      tier1Glory: 8,
      tier2Power: 4,
      tier2Glory: 4,
      defeatDamage: 2,
    };

    const outcome = resolveVillainBattle(party, manticore);
    expect(outcome.tier).toBe(1);
    expect(outcome.gloryEarned).toBe(8);
    expect(outcome.woundsTaken).toBe(0);
  });

  it('should resolve villain battle with defeat wounds when power is below tier 2', () => {
    const party = createInitialParty(); // power 4
    const dragon: Villain = {
      id: 'dragon',
      name: 'Dragon',
      round: 8,
      tier1Power: 14,
      tier1Glory: 16,
      tier2Power: 10,
      tier2Glory: 8,
      defeatDamage: 4,
    };

    const outcome = resolveVillainBattle(party, dragon);
    expect(outcome.tier).toBe('defeat');
    expect(outcome.gloryEarned).toBe(0);
    expect(outcome.woundsTaken).toBe(4);
  });
});
