import {
  Die,
  HeroParty,
  RelicEffectKind,
  RelicId,
  RelicRecipeSlot,
} from './types';

export interface RelicDefinition {
  id: RelicId;
  name: string;
  effectKind: RelicEffectKind;
  recipe: readonly RelicRecipeSlot[];
  completionGlory: number;
  shortBonus: string;
  description: string;
  iconUrl: string;
}

export const RELIC_CATALOG: readonly RelicDefinition[] = [
  {
    id: 'katana-masamune',
    name: 'Katana Masamune',
    effectKind: 'permanent',
    recipe: [{ color: 'white', symbol: 'sword' }, { color: 'white' }],
    completionGlory: 0,
    shortBonus: '+2 Poder Bélico',
    description:
      'Soma +2 ao Poder Bélico da comitiva em duelos contra Chefes e contribui +1 Glória por casa forjada.',
    iconUrl: '/assets/ui/relic-katana.webp',
  },
  {
    id: 'selo-onmyo',
    name: 'Selo Onmyō',
    effectKind: 'permanent',
    recipe: [{ color: 'black', symbol: 'magic' }, { color: 'black' }],
    completionGlory: 0,
    shortBonus: '+2 vs Chefes / -1 Perigo',
    description:
      'Concede +2 de Poder exclusivo contra Chefes e reduz em 1 o dano na Fase de Perigo (+1 Glória por casa).',
    iconUrl: '/assets/ui/relic-seal.webp',
  },
  {
    id: 'amuleto-omamori',
    name: 'Amuleto Omamori',
    effectKind: 'permanent',
    recipe: [{ color: 'white', symbol: 'shield' }, { color: 'any' }],
    completionGlory: 0,
    shortBonus: '-2 Dano Armadilha',
    description:
      'Reduz em 2 o dano sofrido por armadilhas no tabuleiro (mín. 0) e soma +1 Glória por casa.',
    iconUrl: '/assets/ui/relic-omamori.webp',
  },
  {
    id: 'gancho-kaginawa',
    name: 'Gancho Kaginawa',
    effectKind: 'ability',
    recipe: [{ color: 'black', symbol: 'rogue' }, { color: 'any' }],
    completionGlory: 0,
    shortBonus: 'Atravessa barreiras',
    description:
      'Habilidade permanente: permite atravessar paredes internas e abrir Salas Trancadas (+1 Glória por casa).',
    iconUrl: '/assets/ui/relic-kaginawa.webp',
  },
  {
    id: 'sandalias-waraji',
    name: 'Sandálias Waraji',
    effectKind: 'ability',
    recipe: [{ color: 'any', symbol: 'boot' }, { color: 'white' }],
    completionGlory: 0,
    shortBonus: '+1 passo ao mover',
    description:
      'Habilidade permanente: aumenta o alcance de cada movimento em +1 passo no tabuleiro (+1 Glória por casa).',
    iconUrl: '/assets/ui/relic-waraji.webp',
  },
  {
    id: 'armadura-yoroi',
    name: 'Armadura Yoroi',
    effectKind: 'permanent',
    recipe: [{ color: 'white' }, { color: 'black' }, { color: 'any' }],
    completionGlory: 0,
    shortBonus: '+2 Vida Máx. e -1 Lacaio',
    description:
      'Aumenta +2 de Vida Máxima, cura +2 ao forjar e reduz em 1 o dano de lacaios (+1 Glória por casa).',
    iconUrl: '/assets/ui/relic-armor.webp',
  },
  {
    id: 'cabaca-elixir',
    name: 'Cabaça do Elixir',
    effectKind: 'instant',
    recipe: [{ color: 'white' }, { color: 'black' }],
    completionGlory: 0,
    shortBonus: 'Instantâneo: +3 Poções',
    description:
      'Efeito instantâneo ao forjar: adiciona +3 poções ao estoque e avança a trilha de poções (+1 Glória por casa).',
    iconUrl: '/assets/ui/relic-elixir.webp',
  },
  {
    id: 'espelho-yata',
    name: 'Espelho Yata',
    effectKind: 'instant',
    recipe: [{ color: 'white' }, { color: 'black' }, { color: 'any' }],
    completionGlory: 4,
    shortBonus: '+1 Nível e +4 Glória',
    description:
      'Concede +1 nível imediato ao herói à escolha ao forjar e +4 Glória bônus ao final (+1 Glória por casa).',
    iconUrl: '/assets/ui/relic-mirror.webp',
  },
] as const;

export function getRelicById(id: RelicId): RelicDefinition {
  return RELIC_CATALOG.find((r) => r.id === id) ?? RELIC_CATALOG[0];
}

export function getRelicSlotProgress(party: HeroParty, id: RelicId): boolean[] {
  const def = getRelicById(id);
  const recorded = party.relicProgress?.[id];
  if (Array.isArray(recorded)) {
    return def.recipe.map((_, idx) => Boolean(recorded[idx]));
  }
  if ((party.craftedRelics ?? []).includes(id)) {
    return def.recipe.map(() => true);
  }
  return def.recipe.map(() => false);
}

export function isRelicCompleted(party: HeroParty, id: RelicId): boolean {
  const progress = getRelicSlotProgress(party, id);
  return (progress.length > 0 && progress.every(Boolean)) || (party.craftedRelics ?? []).includes(id);
}

export function getRelicCount(party: HeroParty, id: RelicId): number {
  const list = party.craftedRelics ?? [];
  const counted = list.reduce((acc, item) => (item === id ? acc + 1 : acc), 0);
  if (counted > 0) return counted;
  return isRelicCompleted(party, id) ? 1 : 0;
}

export function hasRelic(party: HeroParty, id: RelicId): boolean {
  return isRelicCompleted(party, id);
}

export function getNextRelicToCraft(crafted: RelicId[] = []): RelicId {
  const unowned = RELIC_CATALOG.find((r) => !crafted.includes(r.id));
  if (unowned) return unowned.id;
  return RELIC_CATALOG[crafted.length % RELIC_CATALOG.length].id;
}

export function canDieFillRelicSlot(die: Die, slot: RelicRecipeSlot): boolean {
  if (slot.color !== 'any' && die.color !== slot.color) return false;
  if (slot.symbol && die.symbol !== slot.symbol) return false;
  return true;
}

export function findMatchingSlotIndex(
  party: HeroParty,
  relicId: RelicId,
  die: Die
): number {
  if (isRelicCompleted(party, relicId)) return -1;
  const def = getRelicById(relicId);
  const progress = getRelicSlotProgress(party, relicId);

  let bestIndex = -1;
  let bestScore = -1;

  for (let i = 0; i < def.recipe.length; i++) {
    if (progress[i]) continue;
    const slot = def.recipe[i];
    if (!canDieFillRelicSlot(die, slot)) continue;
    const score = (slot.symbol ? 2 : 0) + (slot.color !== 'any' ? 1 : 0);
    if (score > bestScore) {
      bestScore = score;
      bestIndex = i;
    }
  }

  return bestIndex;
}

export function findNextOpenSlotIndex(party: HeroParty, relicId: RelicId): number {
  if (isRelicCompleted(party, relicId)) return -1;
  const progress = getRelicSlotProgress(party, relicId);
  return progress.findIndex((filled) => !filled);
}

export function getFilledSlotCount(party: HeroParty, relicId: RelicId): number {
  return getRelicSlotProgress(party, relicId).filter(Boolean).length;
}

export function calculateRelicsGlory(party: HeroParty): number {
  return RELIC_CATALOG.reduce((total, def) => {
    const filled = getFilledSlotCount(party, def.id);
    const bonus = isRelicCompleted(party, def.id) ? def.completionGlory : 0;
    return total + filled + bonus;
  }, 0);
}

export function hasBarrierCrossingAbility(party: HeroParty): boolean {
  return hasRelic(party, 'gancho-kaginawa');
}

export function getMovementBonusSteps(party: HeroParty): number {
  return hasRelic(party, 'sandalias-waraji') ? 1 : 0;
}
