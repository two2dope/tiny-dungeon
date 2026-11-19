export type StandeeKind =
  | 'goblin'
  | 'skeleton'
  | 'orc'
  | 'troll'
  | 'manticore'
  | 'beholder'
  | 'dragon'
  | 'gem'
  | 'item'
  | 'trap'
  | 'party';

export const STANDEE_KINDS: readonly StandeeKind[] = [
  'goblin',
  'skeleton',
  'orc',
  'troll',
  'manticore',
  'beholder',
  'dragon',
  'gem',
  'item',
  'trap',
  'party',
] as const;

export const STANDEE_ASSET_URLS: Record<StandeeKind, string> = {
  goblin: '/assets/standees/minion-goblin.jpg',
  skeleton: '/assets/standees/minion-skeleton.jpg',
  orc: '/assets/standees/minion-orc.jpg',
  troll: '/assets/standees/minion-troll.jpg',
  manticore: '/assets/standees/boss-manticore.jpg',
  beholder: '/assets/standees/boss-beholder.jpg',
  dragon: '/assets/standees/boss-dragon.jpg',
  party: '/assets/standees/pawn-party.jpg',
  gem: '/assets/ui/token-gem-jade.webp',
  item: '/assets/ui/token-relic-gold.webp',
  trap: '/assets/ui/token-trap-iron.webp',
};

export function resolveVillainStandeeKind(villainId?: string): StandeeKind {
  if (villainId === 'v_manticore') return 'manticore';
  if (villainId === 'v_beholder') return 'beholder';
  return 'dragon';
}
