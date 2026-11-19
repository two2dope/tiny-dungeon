import { HeroParty, RelicId } from './types';

export interface RelicDefinition {
  id: RelicId;
  name: string;
  shortBonus: string;
  description: string;
  iconUrl: string;
}

export const RELIC_CATALOG: readonly RelicDefinition[] = [
  {
    id: 'katana-masamune',
    name: 'Katana Masamune',
    shortBonus: '+1 Poder',
    description: 'Soma +1 ao Poder Bélico da comitiva e +2 Glória ao final.',
    iconUrl: '/assets/ui/relic-katana.webp',
  },
  {
    id: 'amuleto-omamori',
    name: 'Amuleto Omamori',
    shortBonus: '-1 Dano Armadilha',
    description: 'Reduz em 1 o dano sofrido por armadilhas (mín. 0) e +2 Glória ao final.',
    iconUrl: '/assets/ui/relic-omamori.webp',
  },
  {
    id: 'espelho-yata',
    name: 'Espelho Yata',
    shortBonus: '+1 Maestria',
    description: 'Concede +1 ponto de Maestria imediatamente ao forjar e +2 Glória ao final.',
    iconUrl: '/assets/ui/relic-mirror.webp',
  },
  {
    id: 'armadura-yoroi',
    name: 'Armadura Yoroi',
    shortBonus: '+1 Vida Máx.',
    description: 'Aumenta em +1 a Vida Máxima e cura +1 Vida ao forjar (+2 Glória ao final).',
    iconUrl: '/assets/ui/relic-armor.webp',
  },
  {
    id: 'selo-onmyo',
    name: 'Selo Onmyō',
    shortBonus: '+1 vs Chefes',
    description: 'Concede +1 de Poder contra Chefes, -1 dano na Fase de Perigo e +2 Glória ao final.',
    iconUrl: '/assets/ui/relic-seal.webp',
  },
] as const;

export function getRelicById(id: RelicId): RelicDefinition {
  return RELIC_CATALOG.find((r) => r.id === id) ?? RELIC_CATALOG[0];
}

export function getRelicCount(party: HeroParty, id: RelicId): number {
  const list = party.craftedRelics ?? [];
  return list.reduce((acc, item) => (item === id ? acc + 1 : acc), 0);
}

export function getNextRelicToCraft(crafted: RelicId[] = []): RelicId {
  const unowned = RELIC_CATALOG.find((r) => !crafted.includes(r.id));
  if (unowned) return unowned.id;
  return RELIC_CATALOG[crafted.length % RELIC_CATALOG.length].id;
}
