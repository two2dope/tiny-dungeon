import { Die, DieColor, DieSymbol, DicePool, HazardResult } from './types';

const DIE_FACES: DieSymbol[] = ['boot', 'sword', 'magic', 'rogue', 'shield', 'skull'];

export function rollDicePool(rng: () => number = Math.random): DicePool {
  const dice: Die[] = [];

  // 3 White Dice
  for (let i = 0; i < 3; i++) {
    const faceIndex = Math.floor(rng() * DIE_FACES.length);
    const symbol = DIE_FACES[faceIndex];
    dice.push({
      id: `white-${i + 1}`,
      color: 'white',
      symbol,
      value: symbol === 'boot' ? 2 : 1,
    });
  }

  // 3 Black Dice
  for (let i = 0; i < 3; i++) {
    const faceIndex = Math.floor(rng() * DIE_FACES.length);
    const symbol = DIE_FACES[faceIndex];
    dice.push({
      id: `black-${i + 1}`,
      color: 'black',
      symbol,
      value: symbol === 'boot' ? 2 : 1,
    });
  }

  return {
    dice,
    draftedIds: [],
  };
}

export function checkHazardPhase(pool: DicePool): HazardResult {
  const skullCount = pool.dice.filter(d => d.symbol === 'skull').length;
  if (skullCount >= 3) {
    return {
      hazardTriggered: true,
      wounds: 1,
    };
  }
  return {
    hazardTriggered: false,
    wounds: 0,
  };
}

export function draftDie(pool: DicePool, dieId: string): DicePool {
  const die = pool.dice.find(d => d.id === dieId);
  if (!die) {
    throw new Error(`Die with id ${dieId} not found in pool`);
  }
  if (pool.draftedIds.includes(dieId)) {
    return pool;
  }
  if (pool.draftedIds.length >= 3) {
    throw new Error('Cannot draft more than 3 dice per round');
  }

  return {
    ...pool,
    draftedIds: [...pool.draftedIds, dieId],
  };
}

export function undraftDie(pool: DicePool, dieId: string): DicePool {
  return {
    ...pool,
    draftedIds: pool.draftedIds.filter(id => id !== dieId),
  };
}
